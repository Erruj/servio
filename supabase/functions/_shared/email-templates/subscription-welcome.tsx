/// <reference types="npm:@types/react@18.3.1" />

// ── ABONNEMENT AFGESLOTEN: bedank-/welkomstmail ────────────────────────────
// Tekst aanpassen? Zie texts.ts → emailTexts.subscriptionWelcome
// De mail is dynamisch: pakketnaam, mailboxlimiet, prijs en factuurdatum
// komen uit het Stripe-abonnement.

import * as React from 'npm:react@18.3.1'
import { EmailLayout } from './EmailLayout.tsx'
import { emailTexts, fill } from './texts.ts'

export type SubscriptionTier = 'starter' | 'pro' | 'business'

/** Weergavenamen per pakket */
export const TIER_LABELS: Record<SubscriptionTier, string> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
}

/** Mailboxlimiet per pakket — gelijk aan _shared/mailbox-limit.ts */
export const TIER_MAILBOX_TEXT: Record<SubscriptionTier, string> = {
  starter: 'tot 2 mailboxen',
  pro: 'tot 5 mailboxen',
  business: 'onbeperkt mailboxen',
}

export interface SubscriptionWelcomeEmailProps {
  tier: SubscriptionTier
  /** Bijv. "€ 29,99 /maand" */
  priceLabel: string
  /** Bijv. "5 oktober 2026" */
  nextInvoiceDate: string
  dashboardUrl: string
}

export const SubscriptionWelcomeEmail = ({
  tier,
  priceLabel,
  nextInvoiceDate,
  dashboardUrl,
}: SubscriptionWelcomeEmailProps) => {
  const t = emailTexts.subscriptionWelcome
  const values = {
    pakket: TIER_LABELS[tier],
    mailboxen: TIER_MAILBOX_TEXT[tier],
    prijs: priceLabel,
    datum: nextInvoiceDate,
  }

  const details = [
    { label: t.labels.pakket, value: TIER_LABELS[tier] },
    { label: t.labels.prijs, value: priceLabel },
    ...(nextInvoiceDate
      ? [{ label: t.labels.volgendeFactuur, value: nextInvoiceDate }]
      : []),
  ]

  return (
    <EmailLayout
      preview={fill(t.preview, values)}
      heading={fill(t.heading, values)}
      paragraphs={t.paragraphs.map((p) => fill(p, values))}
      details={details}
      buttonLabel={t.button}
      buttonUrl={dashboardUrl}
      icon={t.icon}
      note={t.note}
      signature={t.signature}
    />
  )
}

export default SubscriptionWelcomeEmail
