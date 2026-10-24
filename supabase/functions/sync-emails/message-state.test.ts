import { describe, expect, test } from "bun:test";
import { mailboxUpdate, OUTLOOK_MESSAGE_FIELDS, parseOutlookMessage } from "./message-state";

describe("mail sync state", () => {
  test("Outlook requests flags and preserves a mailbox star on sync", () => {
    expect(OUTLOOK_MESSAGE_FIELDS.split(",")).toContain("flag");
    const update = mailboxUpdate(parseOutlookMessage({ flag: { flagStatus: "flagged" }, isRead: true }));
    expect(update.is_starred).toBe(true);
    expect(update.is_read).toBe(true);
  });

  test("unstarred and completed Outlook flags remove the star", () => {
    for (const flagStatus of ["notFlagged", "complete"]) {
      expect(parseOutlookMessage({ flag: { flagStatus } }).is_starred).toBe(false);
    }
  });

  test("custom labels survive repeated syncs from every provider", () => {
    for (const labels of [[], ["Seen", "Flagged"], ["INBOX", "STARRED"]]) {
      const update = mailboxUpdate({ labels, subject: "Nieuwe inhoud", is_starred: true });
      expect(Object.hasOwn(update, "labels")).toBe(false);
      let saved = { labels: ["Klant", "Opvolgen"], subject: "Oud" };
      saved = { ...saved, ...update };
      saved = { ...saved, ...update };
      expect(saved.labels).toEqual(["Klant", "Opvolgen"]);
      expect(saved.subject).toBe("Nieuwe inhoud");
    }
  });

  test("sync never restores archived or trashed mail to the inbox", () => {
    const update = mailboxUpdate({ folder: "inbox", is_read: true });
    expect(Object.hasOwn(update, "folder")).toBe(false);
    for (const folder of ["archive", "trash"]) {
      expect({ folder, ...update }.folder).toBe(folder);
    }
  });
});