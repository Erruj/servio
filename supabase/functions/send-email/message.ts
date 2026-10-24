import { z } from "npm:zod@3";
export const MAX_BYTES = 20 * 1024 * 1024;
const address = z.string().email().max(254).refine(v => !/[\r\n]/.test(v));
const recipients = z.union([z.string(), z.array(address)]).transform(v => typeof v === "string" ? v.split(/[,;]/).map(x => x.trim()).filter(Boolean) : v).pipe(z.array(address).max(100));
export const SendSchema = z.object({
  to: recipients, cc: recipients.optional().default([]), bcc: recipients.optional().default([]),
  subject: z.string().trim().min(1).max(998).refine(v => !/[\r\n]/.test(v)),
  body: z.string().min(1).max(2000000), html: z.string().max(2000000).optional(),
  mode: z.enum(["new", "reply", "replyAll", "forward"]).default("new"),
  connection_id: z.string().uuid().optional(), draftId: z.string().uuid().optional(),
  originalId: z.string().uuid().optional(), replyToEmailId: z.string().uuid().optional(),
  originalAttachments: z.array(z.string().max(2048)).max(100).default([]),
  attachments: z.array(z.object({ filename: z.string().min(1).max(255).refine(v => !/[\r\n]/.test(v)), mimeType: z.string().regex(/^[\w.+-]+\/[\w.+-]+$/), content: z.string().max(28000000).regex(/^[A-Za-z0-9+/]*={0,2}$/) })).max(100).default([]),
}).refine(v => v.to.length + v.cc.length + v.bcc.length > 0);
export function messageId(value: string | null | undefined) {
  const bare = value?.trim().replace(/^</, "").replace(/>$/, "");
  return bare && /^[^\s<>@]+@[^\s<>@]+$/.test(bare) ? `<${bare}>` : undefined;
}
export function replyHeaders(original: {message_id?: string | null; reference_ids?: string[] | null}, mode: string) {
  const parent = messageId(original.message_id);
  if (!parent || !["reply", "replyAll"].includes(mode)) return {};
  return { inReplyTo: parent, references: [...new Set([...(original.reference_ids || []).map(messageId).filter(Boolean), parent])] as string[] };
}
export function assertAttachments(attachments: {content: string}[]) {
  const total = attachments.reduce((sum, a) => sum + atob(a.content).length, 0);
  if (total > MAX_BYTES) throw new Error("attachment_size");
  return total;
}
export function selectOriginals<T extends {id: string}>(attachments: T[], selected: string[]) {
  if (!selected.length) return [];
  if (selected.includes("*")) return attachments;
  const matches = attachments.filter(a => selected.includes(a.id));
  if (matches.length !== new Set(selected).size) throw new Error("attachment_missing");
  return matches;
}
