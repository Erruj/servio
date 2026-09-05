/// <reference types="npm:@types/react@18.3.1" />

// ── E-MAILADRES WIJZIGEN: bevestigingsmail ─────────────────────────────────
// Tekst aanpassen? Zie texts.ts → emailTexts.emailChange

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from './EmailLayout.tsx'
import { emailTexts, fill } from './texts.ts'

interface EmailChangeEmailProps {
  siteName?: string
  email?: string
  newEmail?: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => {
  const t = emailTexts.emailChange
  const values = {
    naamSite: siteName || 'Servio',
    email: email || '',
    nieuwEmail: newEmail || '',
  }

  return (
    <EmailLayout
      preview={t.preview}
      heading={t.heading}
      paragraphs={t.paragraphs.map((p) => fill(p, values))}
      buttonLabel={t.button}
      buttonUrl={confirmationUrl}
      note={t.note}
      warning={t.warning}
      signature={t.signature}
    />
  )
}

export default EmailChangeEmail
