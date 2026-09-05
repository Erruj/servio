// Tijdelijke functie: verstuurt de welkomst- en e-mailwijziging-mail als test.
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { emailTexts } from '../_shared/email-templates/texts.ts'

Deno.serve(async () => {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return new Response(JSON.stringify({ error: 'RESEND_API_KEY ontbreekt' }), { status: 500 })

  const to = 'info@getservio.co'
  const props = {
    siteName: 'Servio',
    siteUrl: 'https://getservio.co',
    recipient: to,
    email: 'oud@getservio.co',
    newEmail: to,
    confirmationUrl: 'https://getservio.co/',
  }
  const results: unknown[] = []
  for (const [C, subject] of [
    [SignupEmail, emailTexts.signup.subject],
    [EmailChangeEmail, emailTexts.emailChange.subject],
  ] as const) {
    const html = await renderAsync(React.createElement(C as never, props))
    const text = await renderAsync(React.createElement(C as never, props), { plainText: true })
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        from: 'Servio <noreply@notify.getservio.co>',
        to: [to],
        reply_to: 'info@getservio.co',
        subject: `[TEST] ${subject}`,
        html,
        text,
      }),
    })
    results.push({ subject, status: res.status, body: await res.text() })
  }
  return new Response(JSON.stringify(results, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
