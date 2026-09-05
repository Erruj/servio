import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// ─── Configuratie ────────────────────────────────────────────────────────────
const SITE_NAME = 'Servio'
const ROOT_DOMAIN = 'getservio.co'
const FROM_ADDRESS = `Servio <noreply@${ROOT_DOMAIN}>`
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend'

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Bevestig je e-mailadres voor Servio',
  invite: 'Je bent uitgenodigd voor Servio',
  magiclink: 'Je inloglink voor Servio',
  recovery: 'Wachtwoord opnieuw instellen – Servio',
  email_change: 'Bevestig je nieuwe e-mailadres – Servio',
  email_change_new: 'Bevestig je nieuwe e-mailadres – Servio',
  reauthentication: 'Je verificatiecode – Servio',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  email_change_new: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

// ─── Signature-verificatie (Standard Webhooks, zoals Supabase Auth verstuurt) ─
function decodeBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function verifySignature(req: Request, rawBody: string, secret: string): Promise<boolean> {
  const id = req.headers.get('webhook-id')
  const timestamp = req.headers.get('webhook-timestamp')
  const signatureHeader = req.headers.get('webhook-signature')
  if (!id || !timestamp || !signatureHeader) return false

  // Verwerp verzoeken buiten een tijdvenster van 5 minuten (replay-bescherming)
  const sentAt = Number(timestamp)
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > 300) return false

  const rawSecret = secret.startsWith('v1,whsec_')
    ? secret.slice('v1,whsec_'.length)
    : secret.startsWith('whsec_')
      ? secret.slice('whsec_'.length)
      : secret

  const key = await crypto.subtle.importKey(
    'raw',
    decodeBase64(rawSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`),
  )
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))

  // De header kan meerdere ruimte-gescheiden versies bevatten: "v1,<sig> v1,<sig>"
  return signatureHeader
    .split(' ')
    .map((part) => part.split(',')[1] ?? '')
    .some((sig) => sig.length > 0 && timingSafeEqual(sig, expected))
}

// ─── Versturen via Resend (Lovable connector gateway) ────────────────────────
async function sendViaResend(to: string, subject: string, html: string, text: string) {
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is niet geconfigureerd')
  if (!resendApiKey) throw new Error('RESEND_API_KEY is niet geconfigureerd')

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lovableApiKey}`,
      'X-Connection-Api-Key': resendApiKey,
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html, text }),
  })

  const body = await response.text()
  if (!response.ok) {
    console.error(`[auth-email-hook] Resend gaf een fout [${response.status}]: ${body}`)
    throw new Error(`Resend weigerde de e-mail (status ${response.status}): ${body}`)
  }
  return body
}

// ─── Webhook-handler ─────────────────────────────────────────────────────────
async function handleWebhook(req: Request): Promise<Response> {
  const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')
  if (!hookSecret) {
    console.error('[auth-email-hook] SEND_EMAIL_HOOK_SECRET ontbreekt')
    return json({ error: 'Serverconfiguratie onvolledig: hook secret ontbreekt' }, 500)
  }

  const rawBody = await req.text()

  if (!(await verifySignature(req, rawBody, hookSecret))) {
    console.error('[auth-email-hook] Ongeldige webhook-signature')
    return json({ error: 'Ongeldige signature' }, 401)
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return json({ error: 'Ongeldige JSON in verzoek' }, 400)
  }

  const emailData = payload?.email_data
  const user = payload?.user
  if (!emailData || !user) {
    return json({ error: 'Onverwachte payload van Supabase Auth' }, 400)
  }

  const actionType: string = emailData.email_action_type
  const EmailTemplate = EMAIL_TEMPLATES[actionType]
  if (!EmailTemplate) {
    console.error('[auth-email-hook] Onbekend e-mailtype', actionType)
    return json({ error: `Onbekend e-mailtype: ${actionType}` }, 400)
  }

  // Bij een e-mailadreswijziging gaat de bevestiging naar het nieuwe adres
  const recipient: string =
    actionType === 'email_change_new' ? (user.new_email || user.email) : user.email
  if (!recipient) {
    return json({ error: 'Geen ontvanger in payload' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const redirectTo: string = emailData.redirect_to || `https://${ROOT_DOMAIN}/`
  const verifyType = actionType === 'email_change_new' ? 'email_change' : actionType
  const confirmationUrl =
    `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(emailData.token_hash)}` +
    `&type=${encodeURIComponent(verifyType)}&redirect_to=${encodeURIComponent(redirectTo)}`

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient,
    confirmationUrl,
    token: emailData.token,
    email: user.email,
    newEmail: user.new_email,
  }

  const html = await renderAsync(React.createElement(EmailTemplate, templateProps))
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), {
    plainText: true,
  })

  await sendViaResend(
    recipient,
    EMAIL_SUBJECTS[actionType] || 'Bericht van Servio',
    html,
    text,
  )

  console.log('[auth-email-hook] verstuurd', { actionType })
  return json({ success: true })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    return await handleWebhook(req)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onbekende fout'
    console.error('[auth-email-hook] Fout tijdens verwerken:', message)
    return json({ error: message }, 500)
  }
})
