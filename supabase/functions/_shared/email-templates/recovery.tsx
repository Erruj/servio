/// <reference types="npm:@types/react@18.3.1" />

// ── WACHTWOORD VERGETEN: reset-mail ────────────────────────────────────────
// Tekst aanpassen? Zie texts.ts → emailTexts.recovery

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from './EmailLayout.tsx'
import { emailTexts, fill } from './texts.ts'

interface RecoveryEmailProps {
  siteName?: string
  email?: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, email, confirmationUrl }: RecoveryEmailProps) => {
  const t = emailTexts.recovery
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

export default RecoveryEmail
