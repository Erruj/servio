/// <reference types="npm:@types/react@18.3.1" />

// ── INLOGLINK (magic link) ─────────────────────────────────────────────────
// Tekst aanpassen? Zie texts.ts → emailTexts.magicLink

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from './EmailLayout.tsx'
import { emailTexts, fill } from './texts.ts'

interface MagicLinkEmailProps {
  siteName?: string
  email?: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, email, confirmationUrl }: MagicLinkEmailProps) => {
  const t = emailTexts.magicLink
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

export default MagicLinkEmail
