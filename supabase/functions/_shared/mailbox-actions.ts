import { safeLogBody } from "./security.ts";
export const ACTIONS = ["read", "unread", "star", "unstar", "archive", "trash", "spam", "inbox"] as const;
export type Action = typeof ACTIONS[number];
type Folder = "inbox" | "archive" | "trash" | "spam" | "sent" | "drafts";
const MOVE_TARGET: Partial<Record<Action, Folder>> = { archive: "archive", trash: "trash", spam: "spam", inbox: "inbox" };

class MailboxError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

// ─── Crypto (gelijk aan sync-emails / imap-connect) ──────────────────────
async function decryptPassword(encryptedB64: string): Promise<string> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode("servio-imap-v1"), iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"],
  );
  const data = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: data.slice(0, 12) }, key, data.slice(12));
  return new TextDecoder().decode(plain);
}

// ─── IMAP ────────────────────────────────────────────────────────────────
class Imap {
  private buf = new Uint8Array(0);
  private dec = new TextDecoder();
  private enc = new TextEncoder();
  private tag = 0;
  caps = "";
  constructor(private conn: Deno.Conn) {}

  static async open(host: string, port: number, ssl: boolean): Promise<Imap> {
    const p = (ssl || port === 993) ? Deno.connectTls({ hostname: host, port }) : Deno.connect({ hostname: host, port });
    const conn = await Promise.race([
      p,
      new Promise<never>((_, r) => setTimeout(() => r(new MailboxError("De mailserver reageert niet (timeout).")), 20000)),
    ]);
    const imap = new Imap(conn);
    const greet = await imap.readLine();
    if (!greet.includes("OK")) throw new MailboxError("De mailserver weigert de verbinding.");
    return imap;
  }

  private async fill() {
    const chunk = new Uint8Array(16384);
    const n = await this.conn.read(chunk);
    if (n === null) throw new MailboxError("De verbinding met de mailserver is verbroken.");
    const nb = new Uint8Array(this.buf.length + n);
    nb.set(this.buf); nb.set(chunk.subarray(0, n), this.buf.length);
    this.buf = nb;
  }
  async readLine(): Promise<string> {
    while (true) {
      for (let i = 0; i < this.buf.length - 1; i++) {
        if (this.buf[i] === 13 && this.buf[i + 1] === 10) {
          const line = this.dec.decode(this.buf.subarray(0, i));
          this.buf = this.buf.subarray(i + 2);
          return line;
        }
      }
      await this.fill();
    }
  }
  private async readBytes(n: number) {
    while (this.buf.length < n) await this.fill();
    const d = this.buf.slice(0, n); this.buf = this.buf.subarray(n); return this.dec.decode(d);
  }

  async cmd(command: string): Promise<string[]> {
    const t = `A${++this.tag}`;
    await this.conn.write(this.enc.encode(`${t} ${command}\r\n`));
    const lines: string[] = [];
    while (true) {
      let line = await this.readLine();
      const lit = line.match(/\{(\d+)\}$/);
      if (lit) line += await this.readBytes(parseInt(lit[1])) + await this.readLine();
      lines.push(line);
      if (line.startsWith(`${t} OK`)) return lines;
      if (line.startsWith(`${t} NO`) || line.startsWith(`${t} BAD`)) throw new MailboxError(`Mailserver: ${line.slice(t.length + 1)}`);
    }
  }
  close() { try { this.conn.close(); } catch { /* ignore */ } }
}

const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

interface ImapFolderInfo { name: string; flags: string }
async function listFolders(imap: Imap): Promise<{ folders: ImapFolderInfo[]; delim: string }> {
  const lines = await imap.cmd('LIST "" "*"');
  const folders: ImapFolderInfo[] = [];
  let delim = "/";
  for (const l of lines) {
    const m = l.match(/^\* LIST \(([^)]*)\) (NIL|"(?:[^"\\]|\\.)*") (.+)$/);
    if (!m) continue;
    if (m[2] !== "NIL") delim = m[2].slice(1, -1).replace(/\\(.)/g, "$1");
    let name = m[3].trim();
    if (name.startsWith('"')) name = name.slice(1, -1).replace(/\\(.)/g, "$1");
    folders.push({ name, flags: m[1] });
  }
  return { folders, delim };
}

const SPECIAL: Record<"archive" | "trash" | "spam", { flag: string; names: string[] }> = {
  archive: { flag: "\\Archive", names: ["Archief", "Archive", "Archives", "Gearchiveerd"] },
  trash: { flag: "\\Trash", names: ["Trash", "Prullenbak", "Deleted Items", "Deleted Messages", "Verwijderde items", "Bin"] },
  spam: { flag: "\\Junk", names: ["Junk", "Spam", "Ongewenste e-mail", "Junk E-mail", "Junk Email"] },
};

async function resolveFolder(imap: Imap, target: Folder, cache: { list?: { folders: ImapFolderInfo[]; delim: string } }): Promise<string> {
  if (target === "inbox") return "INBOX";
  if (target !== "archive" && target !== "trash" && target !== "spam") throw new MailboxError("Onbekende map.", 400);
  cache.list ??= await listFolders(imap);
  const { folders, delim } = cache.list;
  const spec = SPECIAL[target];
  const byFlag = folders.find((f) => f.flags.toLowerCase().includes(spec.flag.toLowerCase()));
  if (byFlag) return byFlag.name;
  const lower = (s: string) => s.toLowerCase();
  for (const n of spec.names) {
    const hit = folders.find((f) => lower(f.name) === lower(n) || lower(f.name) === lower(`INBOX${delim}${n}`));
    if (hit) return hit.name;
  }
  if (target !== "archive") throw new MailboxError(target === "trash" ? "Geen prullenbak-map gevonden in je mailbox." : "Geen spam-map gevonden in je mailbox.");
  // Archiefmap bestaat niet: maak "Archief" aan (eventueel onder INBOX als de server dat vereist).
  try { await imap.cmd(`CREATE ${q("Archief")}`); cache.list = undefined; return "Archief"; }
  catch {
    const name = `INBOX${delim}Archief`;
    await imap.cmd(`CREATE ${q(name)}`);
    cache.list = undefined;
    return name;
  }
}

async function findUid(imap: Imap, externalId: string, inInbox: boolean): Promise<number | null> {
  if (externalId.startsWith("uid-")) {
    if (!inInbox) return null;
    const n = Number(externalId.slice(4));
    return Number.isFinite(n) ? n : null;
  }
  const lines = await imap.cmd(`UID SEARCH HEADER Message-ID ${q(externalId)}`);
  const s = lines.find((l) => l.startsWith("* SEARCH"));
  const ids = s ? s.slice(8).trim().split(/\s+/).filter(Boolean).map(Number) : [];
  return ids.length ? ids[ids.length - 1] : null;
}

async function imapAction(conn: any, email: any, action: Action) {
  if (!conn.encrypted_password || !conn.imap_host) throw new MailboxError("IMAP-gegevens ontbreken. Koppel je mailbox opnieuw.", 409);
  const password = await decryptPassword(conn.encrypted_password);
  const imap = await Imap.open(conn.imap_host, conn.imap_port || 993, conn.use_ssl !== false);
  const cache: { list?: { folders: ImapFolderInfo[]; delim: string } } = {};
  try {
    const caps = (await imap.cmd("CAPABILITY")).join(" ").toUpperCase();
    await imap.cmd(`LOGIN ${q(conn.email_address)} ${q(password)}`);
    const current: Folder = (email.folder || "inbox") as Folder;
    const sourceName = await resolveFolder(imap, current === "sent" || current === "drafts" || email.folder === 'snoozed' ? "inbox" : current, cache);
    await imap.cmd(`SELECT ${q(sourceName)}`);
    const uid = await findUid(imap, email.external_id, sourceName === "INBOX");
    if (!uid) throw new MailboxError("Deze mail is niet (meer) gevonden in je mailbox.", 404);

    if (action === "read" || action === "unread") {
      await imap.cmd(`UID STORE ${uid} ${action === "read" ? "+" : "-"}FLAGS.SILENT (\\Seen)`);
    } else if (action === "star" || action === "unstar") {
      await imap.cmd(`UID STORE ${uid} ${action === "star" ? "+" : "-"}FLAGS.SILENT (\\Flagged)`);
    } else {
      const target = await resolveFolder(imap, MOVE_TARGET[action] as Folder, cache);
      if (target === sourceName) return;
      if (caps.includes("MOVE")) {
        await imap.cmd(`UID MOVE ${uid} ${q(target)}`);
      } else {
        await imap.cmd(`UID COPY ${uid} ${q(target)}`);
        await imap.cmd(`UID STORE ${uid} +FLAGS.SILENT (\\Deleted)`);
        await imap.cmd(caps.includes("UIDPLUS") ? `UID EXPUNGE ${uid}` : "EXPUNGE");
      }
    }
    await imap.cmd("LOGOUT").catch(() => {});
  } finally {
    imap.close();
  }
}

// ─── Outlook (Microsoft Graph) ───────────────────────────────────────────
async function outlookToken(supabase: any, conn: any): Promise<string> {
  const expiry = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0;
  if (conn.access_token && expiry > Date.now() + 2 * 60 * 1000) return conn.access_token;
  if (!conn.refresh_token) throw new MailboxError("Outlook-sessie verlopen. Koppel je mailbox opnieuw.", 409);
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: conn.refresh_token,
      client_id: Deno.env.get("MICROSOFT_CLIENT_ID") || "",
      client_secret: Deno.env.get("MICROSOFT_CLIENT_SECRET") || "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    console.error("[mail-action] Outlook token refresh failed:", safeLogBody(await res.text()));
    throw new MailboxError("Outlook-sessie verlopen. Koppel je mailbox opnieuw.", 409);
  }
  const t = await res.json();
  const update: Record<string, unknown> = {
    access_token: t.access_token,
    token_expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
  };
  if (t.refresh_token) update.refresh_token = t.refresh_token;
  await supabase.from("email_connections").update(update).eq("id", conn.id);
  return t.access_token;
}

const GRAPH_FOLDER: Record<Folder, string> = {
  inbox: "inbox", archive: "archive", trash: "deleteditems", spam: "junkemail", sent: "sentitems", drafts: "drafts",
};

/** Geeft het nieuwe Graph-id terug wanneer de mail verplaatst is (Graph wijzigt het id bij een move). */
async function outlookAction(supabase: any, conn: any, email: any, action: Action): Promise<string | null> {
  const token = await outlookToken(supabase, conn);
  const base = `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(email.external_id)}`;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  let res: Response;
  if (action === "read" || action === "unread") {
    res = await fetch(base, { method: "PATCH", headers, body: JSON.stringify({ isRead: action === "read" }) });
  } else if (action === "star" || action === "unstar") {
    res = await fetch(base, { method: "PATCH", headers, body: JSON.stringify({ flag: { flagStatus: action === "star" ? "flagged" : "notFlagged" } }) });
  } else {
    res = await fetch(`${base}/move`, { method: "POST", headers, body: JSON.stringify({ destinationId: GRAPH_FOLDER[MOVE_TARGET[action] as Folder] }) });
  }
  if (!res.ok) {
    const body = await res.text();
    console.error(`[mail-action] Graph ${action} failed [${res.status}]:`, safeLogBody(body));
    if (res.status === 403 || /AccessDenied|ErrorAccessDenied/i.test(body)) {
      throw new MailboxError("Servio heeft nog geen schrijfrechten op je Outlook-mailbox. Koppel Outlook opnieuw via Mailbox-instellingen.", 409);
    }
    if (res.status === 404) throw new MailboxError("Deze mail is niet (meer) gevonden in je Outlook-mailbox.", 404);
    if (res.status === 401) throw new MailboxError("Outlook-sessie verlopen. Koppel je mailbox opnieuw.", 409);
    throw new MailboxError(`Outlook gaf een fout (${res.status}).`);
  }
  if (MOVE_TARGET[action]) {
    const moved = await res.json().catch(() => null);
    return moved?.id ?? null;
  }
  return null;
}


export async function applyMailboxAction(db: any, conn: any, email: any, action: Action): Promise<string | null> {
  if(conn.provider==='imap') {await imapAction(conn,email,action);return null;}
  if(conn.provider==='outlook') return outlookAction(db,conn,email,action);
  if(conn.provider==='gmail' && (action==='spam'||action==='archive')) {
    let token=conn.access_token;
    if(!token || new Date(conn.token_expires_at||0).getTime()<Date.now()+120000) {
      if(!conn.refresh_token) throw new MailboxError('Koppel Gmail opnieuw.',409);
      const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:Deno.env.get('GOOGLE_CLIENT_ID')||'',client_secret:Deno.env.get('GOOGLE_CLIENT_SECRET')||'',refresh_token:conn.refresh_token,grant_type:'refresh_token'})});
      if(!response.ok) throw new MailboxError('Koppel Gmail opnieuw.',409);
      const fresh=await response.json();token=fresh.access_token;
      await db.from('email_connections').update({access_token:token,token_expires_at:new Date(Date.now()+fresh.expires_in*1000).toISOString()}).eq('id',conn.id).eq('user_id',conn.user_id);
    }
    const response=await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(email.external_id)}/modify`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({addLabelIds:action==='spam'?['SPAM']:[],removeLabelIds:action==='archive'?['INBOX','SPAM']:['INBOX']})});
    await response.body?.cancel();
    if(!response.ok) throw new MailboxError('Gmail kon deze mail niet verplaatsen. Controleer de schrijfrechten.',response.status===403?409:502);
    return null;
  }
  throw new MailboxError('Deze mailbox ondersteunt nog geen terug-synchronisatie.',409);
}
export { MailboxError };
