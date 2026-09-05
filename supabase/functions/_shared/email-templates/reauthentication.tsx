/// <reference types="npm:@types/react@18.3.1" />

// ── VERIFICATIECODE ────────────────────────────────────────────────────────
// Tekst aanpassen? Zie texts.ts → emailTexts.reauthentication

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from './EmailLayout.tsx'
import { emailTexts, fill } from './texts.ts'

interface ReauthenticationEmailProps {
  siteName?: string
  email?: string
  token?: string
}

export const ReauthenticationEmail = ({ siteName, email, token }: ReauthenticationEmailProps) => {
  const t = emailTexts.reauthentication
  const values = { naamSite: siteName || 'Servio', email: email || '' }

  return (
    <EmailLayout
      preview={t.preview}
      heading={t.heading}
      paragraphs={t.paragraphs.map((p) => fill(p, values))}
      code={token || ''}
      note={t.note}
      footnote={t.footnote}
    />
  )
}

export default ReauthenticationEmail
