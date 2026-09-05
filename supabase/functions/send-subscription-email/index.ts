// ═══════════════════════════════════════════════════════════════════════════
//  BEDANKMAIL NA HET AFSLUITEN VAN EEN BETAALD ABONNEMENT
//  Wordt aangeroepen door de Stripe-webhook. Verstuurt via Resend, dezelfde
//  route als de account-mails. Tekst aanpassen?
//  → supabase/functions/_shared/email-templates/texts.ts (subscriptionWelcome)
// ═══════════════════════════════════════════════════════════════════════════

import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import {
  SubscriptionWelcomeEmail,
  type SubscriptionTier,
} from '../_shared/email-templates/subscription-welcome.tsx'
import { emailTexts } from '../_shared/email-templates/texts.ts'
import { timingSafeEqual } from '../_shared/security.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
}

const ROOT_DOMAIN = 'getservio.co'
const FROM_ADDRESS = 'Servio <noreply@notify.getservio.co>'
const REPLY_TO = `info@${ROOT_DOMAIN}`
const RESEND_API_URL = 'https://api.resend.com/emails'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function formatPrice(amountCents: number, interval: 'month' | 'year'): string {
  const euros = (amountCents / 100).toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `€ ${euros} ${interval === 'year' ? '/jaar' : '/maand'}`
}

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    // Interne functie: alleen aanroepbaar met de service role key.
    const expected = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const provided = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    if (!expected || !timingSafeEqual(provided, expected)) {
      return json({ error: 'Niet geautoriseerd' }, 401)
    }

    const body = await req.json().catch(() => null)
    const to: string | undefined = body?.to
    const tier: SubscriptionTier | undefined = body?.tier
    const amountCents = Number(body?.amount_cents ?? 0)
    const interval = body?.interval === 'year' ? 'year' : 'month'
    const periodEnd: string | null = body?.period_end ?? null

    if (!to || !tier || !['starter', 'pro', 'business'].includes(tier)) {
      return json({ error: 'Ontvanger en geldig pakket zijn verplicht' }, 400)
    }
    if (!amountCents) {
      return json({ error: 'Bedrag van het abonnement ontbreekt' }, 400)
    }

    const props = {
      tier,
      priceLabel: formatPrice(amountCents, interval),
      nextInvoiceDate: formatDate(periodEnd),
      dashboardUrl: `https://${ROOT_DOMAIN}/dashboard`,
    }

    const element = React.createElement(SubscriptionWelcomeEmail, props)
    const html = await renderAsync(element)
    const text = await renderAsync(React.createElement(SubscriptionWelcomeEmail, props), {
      plainText: true,
    })

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) return json({ error: 'RESEND_API_KEY is niet geconfigureerd' }, 500)

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        reply_to: REPLY_TO,
        subject: emailTexts.subscriptionWelcome.subject,
        html,
        text,
      }),
    })

    const resendBody = await response.text()
    if (!response.ok) {
      console.error(`[send-subscription-email] Resend fout [${response.status}]: ${resendBody}`)
      return json(
        { error: 'Resend weigerde de e-mail', status: response.status, details: resendBody },
        response.status,
      )
    }

    console.log('[send-subscription-email] verstuurd', { tier, interval })
    return json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Onbekende fout'
    console.error('[send-subscription-email] Fout:', message)
    return json({ error: message }, 500)
  }
})
