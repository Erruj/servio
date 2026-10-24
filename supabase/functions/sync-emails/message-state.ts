// Keep the Graph selection and parser together so flags are actually fetched.
export const OUTLOOK_MESSAGE_FIELDS = "id,conversationId,from,toRecipients,ccRecipients,subject,bodyPreview,body,isRead,flag,hasAttachments,receivedDateTime,internetMessageId,internetMessageHeaders";

export function parseOutlookMessage(msg: any) {
  return {
    external_id: msg.id,
    message_id: msg.internetMessageId || null,
    reference_ids: (msg.internetMessageHeaders?.find((h: any) => h.name.toLowerCase() === "references")?.value || "").match(/<[^>]+>/g) || [],
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
    is_starred: msg.flag?.flagStatus === "flagged",
    has_attachments: msg.hasAttachments || false,
    received_at: msg.receivedDateTime,
  };
}

// Omit Servio-owned fields entirely: reading and merging them would race with edits.
export function mailboxUpdate(record: Record<string, unknown>) {
  const { folder: _folder, labels: _labels, ...update } = record;
  return update;
}