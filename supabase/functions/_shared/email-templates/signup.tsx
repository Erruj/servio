/// <reference types="npm:@types/react@18.3.1" />

// ── REGISTRATIE: welkomst-/bevestigingsmail ────────────────────────────────
// Tekst aanpassen? Zie texts.ts → emailTexts.signup

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from './EmailLayout.tsx'
import { emailTexts, fill } from './texts.ts'

interface SignupEmailProps {
  siteName?: string
  siteUrl?: string
  recipient?: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, recipient, confirmationUrl }: SignupEmailProps) => {
  const t = emailTexts.signup
  const values = { naamSite: siteName || 'Servio', email: recipient || '' }

  return (
    <EmailLayout
      preview={t.preview}
      heading={t.heading}
      paragraphs={t.paragraphs.map((p) => fill(p, values))}
      buttonLabel={t.button}
      buttonUrl={confirmationUrl}
      icon={t.icon}
      note={t.note}
      subNote={t.subNote}
      signature={t.signature}
      footnote={t.footnote}
    />
  )
}

export default SignupEmail
