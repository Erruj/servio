/// <reference types="npm:@types/react@18.3.1" />

// ── TEAMUITNODIGING ────────────────────────────────────────────────────────
// Tekst aanpassen? Zie texts.ts → emailTexts.invite

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from './EmailLayout.tsx'
import { emailTexts, fill } from './texts.ts'

interface InviteEmailProps {
  siteName?: string
  siteUrl?: string
  email?: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, email, confirmationUrl }: InviteEmailProps) => {
  const t = emailTexts.invite
  const values = { naamSite: siteName || 'Servio', email: email || '' }

  return (
    <EmailLayout
      preview={t.preview}
      heading={t.heading}
      paragraphs={t.paragraphs.map((p) => fill(p, values))}
      buttonLabel={t.button}
      buttonUrl={confirmationUrl}
      note={t.note}
      footnote={t.footnote}
    />
  )
}

export default InviteEmail
