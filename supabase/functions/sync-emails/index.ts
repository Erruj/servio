import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GMAIL_PAGE_SIZE = 100;
const INITIAL_SYNC_LIMIT = 500;
const INCREMENTAL_SYNC_LIMIT = 200;
const IMAP_INITIAL_SYNC_LIMIT = 20;
const IMAP_CONNECTION_TIMEOUT_MS = 25000;

// ─── Token Refresh ───────────────────────────────────────────────────────

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    console.error("[sync-emails] Failed to refresh Google token:", await response.text());
    return null;
  }
  return response.json();
}

async function refreshMicrosoftToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get("MICROSOFT_CLIENT_ID")!,
      client_secret: Deno.env.get("MICROSOFT_CLIENT_SECRET")!,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    console.error("[sync-emails] Failed to refresh Microsoft token:", await response.text());
    return null;
  }
  return response.json();
}

// ─── Gmail Fetch ─────────────────────────────────────────────────────────

interface GmailFetchOptions {
  maxResults: number;
  query?: string;
  includeSpamTrash?: boolean;
}

async function fetchGmailMessages(accessToken: string, options: GmailFetchOptions) {
  const messageRefs: Array<{ id: string }> = [];
  let nextPageToken: string | undefined;

  while (messageRefs.length < options.maxResults) {
    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("maxResults", String(Math.min(GMAIL_PAGE_SIZE, options.maxResults - messageRefs.length)));
    if (options.query) listUrl.searchParams.set("q", options.query);
    if (options.includeSpamTrash) listUrl.searchParams.set("includeSpamTrash", "true");
    if (nextPageToken) listUrl.searchParams.set("pageToken", nextPageToken);

    const listResponse = await fetch(listUrl.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!listResponse.ok) throw new Error(`Gmail list API error [${listResponse.status}]: ${await listResponse.text()}`);

    const listData = await listResponse.json();
    const pageMessages = (listData.messages || []) as Array<{ id: string }>;
    if (pageMessages.length === 0) break;
    messageRefs.push(...pageMessages);
    nextPageToken = listData.nextPageToken;
    if (!nextPageToken) break;
  }

  const trimmedMessageRefs = messageRefs.slice(0, options.maxResults);
  const detailedMessages: any[] = [];

  for (let i = 0; i < trimmedMessageRefs.length; i += 10) {
    const batch = trimmedMessageRefs.slice(i, i + 10);
    const details = await Promise.all(
      batch.map(async (msg) => {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!msgResponse.ok) {
          console.error(`[sync-emails] Failed to fetch Gmail message ${msg.id}:`, await msgResponse.text());
          return null;
        }
        return msgResponse.json();
      })
    );
    detailedMessages.push(...details.filter(Boolean));
  }

  return detailedMessages;
}

// ─── Outlook Fetch ───────────────────────────────────────────────────────

async function fetchOutlookMessages(accessToken: string, maxResults = 50) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${maxResults}&$orderby=receivedDateTime desc&$select=id,conversationId,from,toRecipients,ccRecipients,subject,bodyPreview,body,isRead,hasAttachments,receivedDateTime`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error(`Outlook API error [${response.status}]: ${await response.text()}`);
  const data = await response.json();
  return data.value || [];
}

// ─── Gmail/Outlook Parsers ───────────────────────────────────────────────

function parseGmailMessage(msg: any) {
  const headers = msg.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;
  const fromHeader = getHeader("From") || "";
  const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || [null, fromHeader, fromHeader];

  let bodyText = "";
  let bodyHtml = "";
  function extractBody(part: any) {
    if (part.mimeType === "text/plain" && part.body?.data) bodyText = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    if (part.mimeType === "text/html" && part.body?.data) bodyHtml = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    if (part.parts) part.parts.forEach(extractBody);
  }
  if (msg.payload) extractBody(msg.payload);

  return {
    external_id: msg.id,
    thread_id: msg.threadId,
    from_email: fromMatch[2] || fromHeader,
    from_name: fromMatch[1] || null,
    to_emails: (getHeader("To") || "").split(",").map((e: string) => e.trim()).filter(Boolean),
    cc_emails: (getHeader("Cc") || "").split(",").map((e: string) => e.trim()).filter(Boolean),
    subject: getHeader("Subject") || "(No subject)",
    snippet: msg.snippet || "",
    body_text: bodyText,
    body_html: bodyHtml,
    labels: msg.labelIds || [],
    is_read: !msg.labelIds?.includes("UNREAD"),
    is_starred: msg.labelIds?.includes("STARRED") || false,
    has_attachments: msg.payload?.parts?.some((p: any) => p.filename) || false,
    received_at: new Date(parseInt(msg.internalDate)).toISOString(),
  };
}

function parseOutlookMessage(msg: any) {
  return {
    external_id: msg.id,
    thread_id: msg.conversationId,
    from_email: msg.from?.emailAddress?.address || "",
    from_name: msg.from?.emailAddress?.name || null,
    to_emails: (msg.toRecipients || []).map((r: any) => r.emailAddress?.address).filter(Boolean),
    cc_emails: (msg.ccRecipients || []).map((r: any) => r.emailAddress?.address).filter(Boolean),
    subject: msg.subject || "(No subject)",
    snippet: msg.bodyPreview || "",
    body_text: msg.body?.contentType === "text" ? msg.body?.content : "",
    body_html: msg.body?.contentType === "html" ? msg.body?.content : "",
    labels: [],
    is_read: msg.isRead || false,
    is_starred: false,
    has_attachments: msg.hasAttachments || false,
    received_at: msg.receivedDateTime,
  };
}

// ─── IMAP Support ────────────────────────────────────────────────────────

async function deriveKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode("servio-imap-v1"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decryptPassword(encryptedB64: string): Promise<string> {
  const key = await deriveKey();
  const data = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

class ImapReader {
  private buffer = new Uint8Array(0);
  private decoder = new TextDecoder();

  constructor(private conn: Deno.Conn) {}

  private async fill() {
    const chunk = new Uint8Array(16384);
    const n = await this.conn.read(chunk);
    if (n === null) throw new Error("IMAP connection closed");
    const newBuf = new Uint8Array(this.buffer.length + n);
    newBuf.set(this.buffer);
    newBuf.set(chunk.subarray(0, n), this.buffer.length);
    this.buffer = newBuf;
  }

  async readLine(): Promise<string> {
    while (true) {
      for (let i = 0; i < this.buffer.length - 1; i++) {
        if (this.buffer[i] === 13 && this.buffer[i + 1] === 10) {
          const line = this.decoder.decode(this.buffer.subarray(0, i));
          this.buffer = this.buffer.subarray(i + 2);
          return line;
        }
      }
      await this.fill();
    }
  }

  async readBytes(n: number): Promise<Uint8Array> {
    while (this.buffer.length < n) await this.fill();
    const data = this.buffer.slice(0, n);
    this.buffer = this.buffer.subarray(n);
    return data;
  }
}

async function fetchImapEmails(
  host: string,
  port: number,
  email: string,
  password: string,
  useSsl: boolean,
  maxResults: number,
  lastSyncAt: string | null
): Promise<any[]> {
  // Add connection timeout
  const connectWithTimeout = async () => {
    const connectPromise = (useSsl || port === 993)
      ? Deno.connectTls({ hostname: host, port })
      : Deno.connect({ hostname: host, port });
    
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("IMAP verbinding timeout na 25 seconden. Probeer het later opnieuw.")), IMAP_CONNECTION_TIMEOUT_MS)
    );
    
    return Promise.race([connectPromise, timeoutPromise]);
  };

  const conn = await connectWithTimeout();

  const reader = new ImapReader(conn);
  const enc = new TextEncoder();
  let tagNum = 0;
  const nextTag = () => `T${++tagNum}`;

  const sendCmd = async (cmd: string): Promise<{ tag: string; lines: string[]; literals: Map<number, Uint8Array> }> => {
    const tag = nextTag();
    await conn.write(enc.encode(`${tag} ${cmd}\r\n`));

    const lines: string[] = [];
    const literals = new Map<number, Uint8Array>();

    while (true) {
      const line = await reader.readLine();
      const litMatch = line.match(/\{(\d+)\}$/);
      if (litMatch) {
        const size = parseInt(litMatch[1]);
        const data = await reader.readBytes(size);
        literals.set(lines.length, data);
      }
      lines.push(line);
      if (line.startsWith(`${tag} OK`)) break;
      if (line.startsWith(`${tag} NO`) || line.startsWith(`${tag} BAD`)) {
        throw new Error(`IMAP: ${line.substring(tag.length + 1)}`);
      }
    }

    return { tag, lines, literals };
  };

  try {
    // Read greeting
    const greeting = await reader.readLine();
    if (!greeting.includes("OK")) throw new Error("IMAP server niet bereikbaar");

    // Login
    const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    await sendCmd(`LOGIN "${esc(email)}" "${esc(password)}"`);

    // Select INBOX
    await sendCmd("SELECT INBOX");

    // Search for messages
    let searchCriteria = "ALL";
    if (lastSyncAt) {
      const sinceDate = new Date(new Date(lastSyncAt).getTime() - 24 * 60 * 60 * 1000);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      searchCriteria = `SINCE ${sinceDate.getDate()}-${months[sinceDate.getMonth()]}-${sinceDate.getFullYear()}`;
    }

    const searchResult = await sendCmd(`UID SEARCH ${searchCriteria}`);
    const searchLine = searchResult.lines.find((l) => l.startsWith("* SEARCH"));
    const uids = searchLine
      ? searchLine.substring(9).trim().split(/\s+/).filter(Boolean).map(Number).filter((n) => !isNaN(n))
      : [];

    if (uids.length === 0) {
      await sendCmd("LOGOUT").catch(() => {});
      conn.close();
      return [];
    }

    // Take most recent UIDs (highest UIDs = newest)
    const targetUids = uids.sort((a, b) => b - a).slice(0, maxResults);

    // Fetch messages in batches
    const messages: any[] = [];

    for (let i = 0; i < targetUids.length; i += 10) {
      const batch = targetUids.slice(i, i + 10);
      const uidRange = batch.join(",");

      const fetchResult = await sendCmd(`UID FETCH ${uidRange} (UID FLAGS INTERNALDATE BODY.PEEK[])`);

      // Parse FETCH responses
      let currentMeta = "";
      let currentLiteral: Uint8Array | null = null;

      for (let li = 0; li < fetchResult.lines.length; li++) {
        const line = fetchResult.lines[li];
        if (line.startsWith(`T${tagNum} `)) break;

        const fetchMatch = line.match(/^\* \d+ FETCH \(/);
        if (fetchMatch) {
          // Process previous message if exists
          if (currentLiteral) {
            const parsed = processImapMessage(currentMeta, currentLiteral);
            if (parsed) messages.push(parsed);
          }
          currentMeta = line;
          currentLiteral = null;
        } else if (currentMeta) {
          currentMeta += " " + line;
        }

        // Check for literal data
        if (fetchResult.literals.has(li)) {
          currentLiteral = fetchResult.literals.get(li)!;
        }
      }

      // Process last message
      if (currentLiteral) {
        const parsed = processImapMessage(currentMeta, currentLiteral);
        if (parsed) messages.push(parsed);
      }
    }

    // Logout
    await sendCmd("LOGOUT").catch(() => {});
    conn.close();

    return messages;
  } catch (error) {
    try { conn.close(); } catch { /* ignore */ }
    throw error;
  }
}

function processImapMessage(metaLine: string, rawBytes: Uint8Array): any | null {
  try {
    const rawEmail = new TextDecoder("utf-8", { fatal: false }).decode(rawBytes);

    // Extract UID from metadata
    const uidMatch = metaLine.match(/UID (\d+)/);
    const uid = uidMatch ? uidMatch[1] : `${Date.now()}`;

    // Extract FLAGS
    const flagsMatch = metaLine.match(/FLAGS \(([^)]*)\)/);
    const flags = flagsMatch ? flagsMatch[1].split(/\s+/).filter(Boolean) : [];

    // Extract INTERNALDATE
    const dateMatch = metaLine.match(/INTERNALDATE "([^"]+)"/);
    const internalDate = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

    // Parse the raw RFC 2822 email
    const parsed = parseRawEmail(rawEmail);

    return {
      external_id: parsed.messageId || `uid-${uid}`,
      thread_id: null,
      from_email: parsed.fromEmail,
      from_name: parsed.fromName,
      to_emails: parsed.toEmails,
      cc_emails: parsed.ccEmails,
      subject: parsed.subject,
      snippet: (parsed.bodyText || "").substring(0, 200),
      body_text: parsed.bodyText,
      body_html: parsed.bodyHtml,
      labels: flags.map((f) => f.replace(/\\/g, "")),
      is_read: flags.some((f) => f.toLowerCase().includes("seen")),
      is_starred: flags.some((f) => f.toLowerCase().includes("flagged")),
      has_attachments: parsed.hasAttachments,
      received_at: internalDate,
    };
  } catch (e) {
    console.error("[sync-emails] Failed to parse IMAP message:", e);
    return null;
  }
}

function parseRawEmail(raw: string) {
  const headerEnd = raw.indexOf("\r\n\r\n");
  const headerStr = headerEnd >= 0 ? raw.substring(0, headerEnd) : raw;
  const bodyStr = headerEnd >= 0 ? raw.substring(headerEnd + 4) : "";

  // Parse headers (unfold continuation lines)
  const headers: Record<string, string> = {};
  const headerLines = headerStr.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/);
  for (const line of headerLines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const name = line.substring(0, colonIdx).trim().toLowerCase();
    const value = line.substring(colonIdx + 1).trim();
    headers[name] = value;
  }

  // Parse From
  const fromHeader = headers["from"] || "";
  const fromMatch = fromHeader.match(/(?:"?([^"<]*)"?\s+)?<?([^\s>]+@[^\s>]+)>?/);
  const fromName = fromMatch?.[1]?.trim() || null;
  const fromEmail = fromMatch?.[2] || fromHeader;

  // Parse To
  const toEmails = parseAddressList(headers["to"] || "");
  const ccEmails = parseAddressList(headers["cc"] || "");

  // Parse body
  const contentType = headers["content-type"] || "text/plain";
  const transferEncoding = headers["content-transfer-encoding"] || "7bit";

  let bodyText = "";
  let bodyHtml = "";
  let hasAttachments = false;

  if (contentType.toLowerCase().includes("multipart/")) {
    const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/i);
    if (boundaryMatch) {
      const result = parseMultipart(bodyStr, boundaryMatch[1]);
      bodyText = result.text;
      bodyHtml = result.html;
      hasAttachments = result.hasAttachments;
    }
  } else if (contentType.toLowerCase().includes("text/html")) {
    bodyHtml = decodeContent(bodyStr, transferEncoding, contentType);
  } else {
    bodyText = decodeContent(bodyStr, transferEncoding, contentType);
  }

  const messageId = headers["message-id"]?.replace(/[<>]/g, "") || null;

  return {
    messageId,
    fromEmail,
    fromName: fromName ? decodeRFC2047(fromName) : null,
    toEmails,
    ccEmails,
    subject: decodeRFC2047(headers["subject"] || "(Geen onderwerp)"),
    bodyText,
    bodyHtml,
    hasAttachments: hasAttachments || contentType.toLowerCase().includes("multipart/mixed"),
  };
}

function parseAddressList(str: string): string[] {
  return str
    .split(",")
    .map((e) => {
      const match = e.match(/<([^>]+)>/);
      return match ? match[1].trim() : e.trim();
    })
    .filter((e) => e.includes("@"));
}

function parseMultipart(body: string, boundary: string): { text: string; html: string; hasAttachments: boolean } {
  const parts = body.split("--" + boundary);
  let text = "";
  let html = "";
  let hasAttachments = false;

  for (const part of parts) {
    if (part.trim() === "" || part.trim() === "--" || part.startsWith("--")) continue;

    const headerEnd = part.indexOf("\r\n\r\n");
    const altEnd = part.indexOf("\n\n");
    const splitIdx = headerEnd >= 0 ? headerEnd : altEnd;
    if (splitIdx === -1) continue;

    const partHeaderStr = part.substring(0, splitIdx);
    const partBody = part.substring(splitIdx + (headerEnd >= 0 ? 4 : 2));

    const partHeaders: Record<string, string> = {};
    const lines = partHeaderStr.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/);
    for (const line of lines) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      partHeaders[line.substring(0, colonIdx).trim().toLowerCase()] = line.substring(colonIdx + 1).trim();
    }

    const partCt = (partHeaders["content-type"] || "").toLowerCase();
    const partCte = (partHeaders["content-transfer-encoding"] || "7bit").toLowerCase();
    const partDisp = (partHeaders["content-disposition"] || "").toLowerCase();

    if (partDisp.includes("attachment")) {
      hasAttachments = true;
      continue;
    }

    if (partCt.includes("multipart/")) {
      const nestedBoundary = partCt.match(/boundary="?([^";\s]+)"?/i);
      if (nestedBoundary) {
        const nested = parseMultipart(partBody, nestedBoundary[1]);
        if (!text && nested.text) text = nested.text;
        if (!html && nested.html) html = nested.html;
        if (nested.hasAttachments) hasAttachments = true;
      }
    } else if (partCt.includes("text/plain") && !text) {
      text = decodeContent(partBody.trim(), partCte, partCt);
    } else if (partCt.includes("text/html") && !html) {
      html = decodeContent(partBody.trim(), partCte, partCt);
    }
  }

  return { text, html, hasAttachments };
}

function decodeContent(content: string, encoding: string, contentType?: string): string {
  encoding = encoding.toLowerCase().trim();

  let decoded = content;
  if (encoding === "base64") {
    try {
      const binary = atob(content.replace(/\s/g, ""));
      // Check for UTF-8 BOM or assume UTF-8
      decoded = binary;
    } catch {
      decoded = content;
    }
  } else if (encoding === "quoted-printable") {
    decoded = content
      .replace(/=\r?\n/g, "")
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  return decoded;
}

function decodeRFC2047(str: string): string {
  return str.replace(/=\?([^?]+)\?([BbQq])\?([^?]+)\?=/g, (_, _charset, encoding, text) => {
    if (encoding.toUpperCase() === "B") {
      try { return atob(text); } catch { return text; }
    }
    if (encoding.toUpperCase() === "Q") {
      return text
        .replace(/_/g, " ")
        .replace(/=([0-9A-Fa-f]{2})/g, (_m: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
    }
    return text;
  });
}

// ─── Persist Messages ────────────────────────────────────────────────────

async function persistMessages(
  supabase: ReturnType<typeof createClient>,
  connection: { id: string; user_id: string },
  messages: any[]
): Promise<{ insertedCount: number; updatedCount: number; insertedExternalIds: string[] }> {
  if (messages.length === 0) return { insertedCount: 0, updatedCount: 0, insertedExternalIds: [] };

  const externalIds = [...new Set(messages.map((m) => m.external_id).filter(Boolean))];

  const { data: existingRows, error: existingError } = await supabase
    .from("emails")
    .select("id, external_id")
    .eq("connection_id", connection.id)
    .in("external_id", externalIds);

  if (existingError) throw new Error(`Failed to lookup existing emails: ${existingError.message}`);

  const existingByExternalId = new Map((existingRows || []).map((row: any) => [row.external_id, row.id]));

  const inserts: any[] = [];
  const updates: any[] = [];

  for (const message of messages) {
    const baseRecord = { ...message, user_id: connection.user_id, connection_id: connection.id };
    const existingId = existingByExternalId.get(message.external_id);
    if (existingId) {
      updates.push({ ...baseRecord, id: existingId });
    } else {
      inserts.push(baseRecord);
    }
  }

  const chunkSize = 100;
  for (let i = 0; i < inserts.length; i += chunkSize) {
    const chunk = inserts.slice(i, i + chunkSize);
    const { error } = await supabase.from("emails").insert(chunk as any);
    if (error) throw new Error(`Failed to insert emails: ${error.message}`);
  }
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const { error } = await supabase.from("emails").upsert(chunk as any, { onConflict: "id" });
    if (error) throw new Error(`Failed to update emails: ${error.message}`);
  }

  return {
    insertedCount: inserts.length,
    updatedCount: updates.length,
    insertedExternalIds: inserts.map((m) => m.external_id).filter(Boolean),
  };
}

// ─── Auto-process invoice/receipt attachments (Gmail only) ──────────────

const AUTO_ATTACHMENT_EXTS = ["pdf", "png", "jpg", "jpeg", "webp"];
const INVOICE_KEYWORDS = /(factuur|invoice|rekening)/i;

function collectGmailAttachmentParts(payload: any): Array<{ filename: string; mimeType: string; attachmentId: string }> {
  const result: Array<{ filename: string; mimeType: string; attachmentId: string }> = [];
  function walk(part: any) {
    if (!part) return;
    if (part.filename && part.body?.attachmentId) {
      result.push({ filename: part.filename, mimeType: part.mimeType || "application/octet-stream", attachmentId: part.body.attachmentId });
    }
    if (part.parts) part.parts.forEach(walk);
  }
  walk(payload);
  return result;
}

async function callAiExtract(dataUrl: string, mime: string, docType: "invoice" | "receipt", filename: string): Promise<Record<string, any> | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const promptText = docType === "invoice"
    ? 'Extraheer de volgende data uit deze factuur en geef ALLEEN raw JSON terug zonder markdown: { "vendor_name": string, "date": "YYYY-MM-DD" of null, "due_date": "YYYY-MM-DD" of null, "invoice_number": string of null, "total_amount": number, "vat_amount": number, "description": string, "currency": "EUR"|"USD"|... }. Gebruik null als een veld niet leesbaar is.'
    : 'Extraheer de volgende data uit dit bonnetje en geef ALLEEN raw JSON terug zonder markdown: { "vendor_name": string, "date": "YYYY-MM-DD" of null, "total_amount": number, "vat_amount": number, "description": string, "currency": "EUR"|"USD"|... }. Gebruik null als een veld niet leesbaar is.';

  const userContent: any[] = [{ type: "text", text: promptText }];
  if (mime === "application/pdf") {
    userContent.push({ type: "file", file: { filename, file_data: dataUrl } });
  } else {
    userContent.push({ type: "image_url", image_url: { url: dataUrl } });
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Je bent een OCR/data-extractie assistent. Antwoord uitsluitend met geldige JSON." },
        { role: "user", content: userContent },
      ],
    }),
  });
  if (!resp.ok) {
    console.error("[sync-emails] AI extract failed:", resp.status, await resp.text());
    return null;
  }
  const aiData = await resp.json();
  const content = aiData.choices?.[0]?.message?.content || "";
  try {
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : cleaned);
  } catch {
    return null;
  }
}

async function processGmailAttachmentsForEmail(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  emailId: string,
  emailSubject: string,
  accessToken: string,
  gmailMessageId: string,
  payload: any,
): Promise<number> {
  const parts = collectGmailAttachmentParts(payload);
  if (parts.length === 0) return 0;

  let processed = 0;
  for (const part of parts) {
    const ext = (part.filename.split(".").pop() || "").toLowerCase();
    if (!AUTO_ATTACHMENT_EXTS.includes(ext)) continue;

    try {
      // Download attachment
      const attResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailMessageId}/attachments/${part.attachmentId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!attResp.ok) {
        console.error(`[sync-emails] attachment download failed for ${part.filename}:`, attResp.status);
        continue;
      }
      const attData = await attResp.json();
      const rawB64 = (attData.data || "").replace(/-/g, "+").replace(/_/g, "/");
      const binary = atob(rawB64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      // Upload to storage
      const safeName = part.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${userId}/auto/${crypto.randomUUID()}_${safeName}`;
      const mime = part.mimeType || (ext === "pdf" ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`);
      const { error: uploadErr } = await supabase.storage
        .from("financial-documents")
        .upload(storagePath, bytes, { contentType: mime, upsert: false });
      if (uploadErr) {
        console.error(`[sync-emails] storage upload failed:`, uploadErr.message);
        continue;
      }

      // Decide invoice vs receipt from filename/subject
      const isInvoice = INVOICE_KEYWORDS.test(part.filename) || INVOICE_KEYWORDS.test(emailSubject || "");
      const docType: "invoice" | "receipt" = isInvoice ? "invoice" : "receipt";

      // Insert row FIRST so extract-document-data ownership check would pass
      const nowIso = new Date().toISOString();
      let recordId: string | null = null;
      if (docType === "invoice") {
        const { data, error } = await supabase.from("invoices").insert({
          user_id: userId,
          file_path: storagePath,
          supplier: emailSubject?.slice(0, 100) || "Onbekend",
          amount: 0,
          vat_amount: 0,
          invoice_date: nowIso.slice(0, 10),
          status: "review",
        } as any).select("id").single();
        if (error) { console.error("[sync-emails] invoice insert:", error.message); continue; }
        recordId = (data as any).id;
      } else {
        const { data, error } = await supabase.from("receipts").insert({
          user_id: userId,
          file_path: storagePath,
          merchant: emailSubject?.slice(0, 100) || "Onbekend",
          amount: 0,
          receipt_date: nowIso.slice(0, 10),
          status: "review",
        } as any).select("id").single();
        if (error) { console.error("[sync-emails] receipt insert:", error.message); continue; }
        recordId = (data as any).id;
      }

      // Run OCR/AI extraction
      let bin = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
      const dataUrl = `data:${mime};base64,${btoa(bin)}`;
      const extracted = await callAiExtract(dataUrl, mime, docType, part.filename);

      if (extracted && recordId) {
        const patch: any = { ai_summary: extracted.description || null };
        if (docType === "invoice") {
          if (extracted.vendor_name) patch.supplier = String(extracted.vendor_name).slice(0, 200);
          if (extracted.date) patch.invoice_date = extracted.date;
          if (extracted.due_date) patch.due_date = extracted.due_date;
          if (extracted.invoice_number) patch.invoice_number = String(extracted.invoice_number).slice(0, 100);
          if (typeof extracted.total_amount === "number") patch.amount = extracted.total_amount;
          if (typeof extracted.vat_amount === "number") patch.vat_amount = extracted.vat_amount;
          await supabase.from("invoices").update(patch).eq("id", recordId);
        } else {
          if (extracted.vendor_name) patch.merchant = String(extracted.vendor_name).slice(0, 200);
          if (extracted.date) patch.receipt_date = extracted.date;
          if (typeof extracted.total_amount === "number") patch.amount = extracted.total_amount;
          await supabase.from("receipts").update(patch).eq("id", recordId);
        }
      }

      processed++;
    } catch (e) {
      console.error(`[sync-emails] auto-process attachment error:`, e instanceof Error ? e.message : String(e));
    }
  }
  return processed;

// ─── Main Handler ────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL!, Deno.env.get("SUPABASE_ANON_KEY") || SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error: authError } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestBody = await req.json().catch(() => ({}));
    const forceFullSync = Boolean(requestBody?.force_full_sync);
    const connectionId = typeof requestBody?.connection_id === "string" ? requestBody.connection_id : null;

    const userId = user.id;
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let connectionQuery = supabase.from("email_connections").select("*").eq("user_id", userId);
    if (connectionId) connectionQuery = connectionQuery.eq("id", connectionId);

    const { data: connections, error: connError } = await connectionQuery;
    if (connError) throw new Error(`Failed to fetch connections: ${connError.message}`);
    if (!connections?.length) {
      return new Response(JSON.stringify({ error: "Geen mailboxverbinding gevonden." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[sync-emails] Start sync for user ${userId}. Connections: ${connections.length}`);
    const results: Array<Record<string, unknown>> = [];

    // Load user setting for auto-processing attachments
    const { data: settingsRow } = await supabase
      .from("user_settings")
      .select("auto_process_invoice_attachments")
      .eq("user_id", userId)
      .maybeSingle();
    const autoProcessAttachments = Boolean((settingsRow as any)?.auto_process_invoice_attachments);

    for (const connection of connections) {
      try {
        let messages: any[] = [];
        let gmailRawByExternalId: Map<string, any> | null = null;
        let gmailAccessToken: string | null = null;

        if (connection.provider === "gmail" || connection.provider === "outlook") {
          // OAuth-based providers: refresh token if needed
          let accessToken = connection.access_token;
          const tokenExpiry = connection.token_expires_at ? new Date(connection.token_expires_at) : new Date(0);
          const shouldRefreshToken = !connection.is_active || tokenExpiry.getTime() <= Date.now() + 5 * 60 * 1000;

          if (shouldRefreshToken && connection.refresh_token) {
            console.log(`[sync-emails] Refreshing token for ${connection.email_address} (${connection.provider})`);
            let newTokens: { access_token: string; expires_in: number } | null = null;
            if (connection.provider === "gmail") newTokens = await refreshGoogleToken(connection.refresh_token);
            else newTokens = await refreshMicrosoftToken(connection.refresh_token);

            if (!newTokens) throw new Error("Token refresh failed. Koppel je mailbox opnieuw.");

            accessToken = newTokens.access_token;
            const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
            await supabase
              .from("email_connections")
              .update({ access_token: accessToken, token_expires_at: newExpiry, is_active: true, sync_error: null })
              .eq("id", connection.id);
          }

          if (connection.provider === "gmail") {
            const hasPreviousSync = Boolean(connection.last_sync_at) && !forceFullSync;
            const maxResults = hasPreviousSync ? INCREMENTAL_SYNC_LIMIT : INITIAL_SYNC_LIMIT;
            const bufferedAfterTimestamp = connection.last_sync_at
              ? Math.max(0, new Date(connection.last_sync_at).getTime() - 5 * 60 * 1000)
              : null;
            const query = hasPreviousSync && bufferedAfterTimestamp
              ? `after:${Math.floor(bufferedAfterTimestamp / 1000)}`
              : undefined;

            console.log(`[sync-emails] Gmail fetch | mode=${hasPreviousSync ? "incremental" : "full"} | max=${maxResults}`);
            const rawMessages = await fetchGmailMessages(accessToken, { maxResults, query, includeSpamTrash: true });
            messages = rawMessages.map(parseGmailMessage);
            if (autoProcessAttachments) {
              gmailAccessToken = accessToken;
              gmailRawByExternalId = new Map(rawMessages.map((m: any) => [m.id, m]));
            }
          } else {
            const maxResults = connection.last_sync_at && !forceFullSync ? INCREMENTAL_SYNC_LIMIT : INITIAL_SYNC_LIMIT;
            console.log(`[sync-emails] Outlook fetch | max=${maxResults}`);
            const rawMessages = await fetchOutlookMessages(accessToken, maxResults);
            messages = rawMessages.map(parseOutlookMessage);
          }
        } else if (connection.provider === "imap") {
          // IMAP-based provider
          if (!connection.encrypted_password || !connection.imap_host) {
            throw new Error("IMAP configuratie onvolledig. Koppel je mailbox opnieuw.");
          }

          const password = await decryptPassword(connection.encrypted_password);
          const hasPreviousSync = Boolean(connection.last_sync_at) && !forceFullSync;
          const maxResults = hasPreviousSync ? INCREMENTAL_SYNC_LIMIT : IMAP_INITIAL_SYNC_LIMIT;

          console.log(`[sync-emails] IMAP fetch for ${connection.email_address} | mode=${hasPreviousSync ? "incremental" : "full"} | max=${maxResults}`);

          messages = await fetchImapEmails(
            connection.imap_host,
            connection.imap_port || 993,
            connection.email_address,
            password,
            connection.use_ssl !== false,
            maxResults,
            hasPreviousSync ? connection.last_sync_at : null
          );
        } else {
          throw new Error(`Unsupported provider: ${connection.provider}`);
        }

        const { insertedCount, updatedCount, insertedExternalIds } = await persistMessages(supabase as any, connection, messages);

        // Auto-process invoice/receipt attachments for newly inserted Gmail messages
        let autoProcessedDocs = 0;
        if (autoProcessAttachments && gmailRawByExternalId && gmailAccessToken && insertedExternalIds.length > 0) {
          const parsedByExternalId = new Map(messages.map((m: any) => [m.external_id, m]));
          for (const extId of insertedExternalIds) {
            const raw = gmailRawByExternalId.get(extId);
            const parsed = parsedByExternalId.get(extId);
            if (!raw?.payload || !parsed) continue;
            try {
              autoProcessedDocs += await processGmailAttachmentsForEmail(
                supabase as any,
                connection.user_id,
                extId,
                parsed.subject || "",
                gmailAccessToken,
                extId,
                raw.payload,
              );
            } catch (e) {
              console.error(`[sync-emails] auto-process error for ${extId}:`, e instanceof Error ? e.message : String(e));
            }
          }
          if (autoProcessedDocs > 0) console.log(`[sync-emails] Auto-processed ${autoProcessedDocs} attachment(s) for ${connection.email_address}`);
        }

        await supabase
          .from("email_connections")
          .update({ last_sync_at: new Date().toISOString(), sync_error: null, is_active: true })
          .eq("id", connection.id);

        console.log(`[sync-emails] Success for ${connection.email_address}: fetched=${messages.length}, inserted=${insertedCount}, updated=${updatedCount}`);
        results.push({
          connection_id: connection.id,
          status: "success",
          fetched_count: messages.length,
          inserted_count: insertedCount,
          updated_count: updatedCount,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
        const shouldDeactivate = /refresh|invalid_grant|unauthorized|reconnect|token|LOGIN|authentication|credentials/i.test(errorMessage);

        console.error(`[sync-emails] Sync error for ${connection.email_address}:`, errorMessage);
        await supabase
          .from("email_connections")
          .update({ sync_error: errorMessage, is_active: shouldDeactivate ? false : connection.is_active })
          .eq("id", connection.id);

        results.push({ connection_id: connection.id, status: "error", error: errorMessage });
      }
    }

    const successfulSyncs = results.filter((r) => r.status === "success");
    if (successfulSyncs.length === 0) {
      return new Response(JSON.stringify({ error: "Synchronisatie mislukt voor alle mailboxen.", results }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An error occurred during email sync";
    console.error("[sync-emails] Fatal error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
