// ═══════════════════════════════════════════════════════════════════════════
//  ALLE E-MAILTEKSTEN VAN SERVIO — pas hier de teksten aan
//  ─────────────────────────────────────────────────────────────────────────
//  Dit is het enige bestand dat je hoeft te openen als je de tekst of de
//  onderwerpregel van een e-mail wilt bijschaven. De opmaak staat in brand.ts
//  en EmailLayout.tsx; de losse .tsx-bestanden bepalen alleen de indeling.
//
//  Tussen accolades staan invulvelden die automatisch worden vervangen:
//    {naamSite}   → Servio
//    {email}      → het e-mailadres van de ontvanger
//    {nieuwEmail} → het nieuwe e-mailadres (alleen bij adreswijziging)
// ═══════════════════════════════════════════════════════════════════════════

export const emailTexts = {
  // ── 1. Registratie: welkomst-/bevestigingsmail ──────────────────────────
  signup: {
    subject: 'Welkom bij Servio! Nog één ding...',
    preview: 'Bevestig je e-mailadres en we zijn klaar om te starten.',
    icon: '🎉',
    heading: 'Welkom bij Servio!',
    paragraphs: [
      'Fijn dat je er bent. Nog één stapje voor je aan de slag kan: bevestig je e-mailadres, dan weten we zeker dat we jou (en niemand anders) in je mailbox mogen laten kijken.',
    ],
    button: 'E-mailadres bevestigen',
    note: 'Deze link is 24 uur geldig.',
    subNote: 'Daarna regelt Servio de rest — jij focust weer op waar je goed in bent.',
    signature: 'Veel succes (en plezier),\nHet Servio-team 👋',
    footnote: 'Heb je geen account aangemaakt? Dan kun je deze e-mail negeren.',
  },

  // ── 2. Wachtwoord vergeten ──────────────────────────────────────────────
  recovery: {
    subject: 'Zullen we dat wachtwoord even resetten?',
    preview: 'Één klik en je kunt weer aan de slag.',
    icon: '🔑',
    heading: 'Wachtwoord vergeten? Overkomt de besten.',
    paragraphs: [
      'Geen paniek — het gebeurt de beste ondernemers. Klik op de knop hieronder om een nieuw wachtwoord in te stellen, dan kun je zo weer verder met je zaken.',
    ],
    button: 'Nieuw wachtwoord instellen',
    note: 'Deze link is 24 uur geldig en werkt maar één keer — daarna verloopt-ie vanzelf.',
    signature: 'Tot snel,\nHet Servio-team 👋',
    footnote:
      'Niks aangevraagd? Dan hoef je niks te doen — je wachtwoord blijft gewoon zoals het was. Iemand anders typte waarschijnlijk het verkeerde e-mailadres.',
  },

  // ── 3. E-mailadres wijzigen ─────────────────────────────────────────────
  emailChange: {
    subject: 'Je e-mailadres is gewijzigd',
    preview: 'Je e-mailadres is gewijzigd',
    heading: 'Je e-mailadres is aangepast',
    paragraphs: [
      'We laten het je even weten: het e-mailadres van je Servio-account is zojuist gewijzigd naar dit adres. Was jij dat? Dan hoef je niks te doen.',
      'Bevestig de wijziging hieronder om het adres definitief te activeren.',
    ],
    button: 'Wijziging bevestigen',
    warning:
      'Heb je dit niet zelf gedaan? Neem dan meteen contact met ons op via info@getservio.co, dan kijken we samen wat er aan de hand is.',
    note: 'Deze link is 24 uur geldig.',
    signature: 'Groetjes,\nHet Servio-team 👋',
  },

  // ── 4. Inloglink (magic link) ───────────────────────────────────────────
  magicLink: {
    subject: 'Je inloglink voor Servio',
    preview: 'Log met één klik in bij Servio',
    heading: 'Inloggen bij Servio',
    paragraphs: ['Klik op de knop hieronder om direct in te loggen op je account.'],
    button: 'Inloggen',
    note: 'Deze link is 24 uur geldig en kan één keer worden gebruikt.',
    footnote: 'Heb je dit niet zelf aangevraagd? Dan kun je deze e-mail negeren.',
  },

  // ── 5. Teamuitnodiging ──────────────────────────────────────────────────
  invite: {
    subject: 'Je bent uitgenodigd voor Servio',
    preview: 'Je bent uitgenodigd om samen te werken in Servio',
    heading: 'Je bent uitgenodigd',
    paragraphs: [
      'Je bent uitgenodigd om deel te nemen aan Servio. Accepteer de uitnodiging om je account aan te maken.',
    ],
    button: 'Uitnodiging accepteren',
    note: 'Deze uitnodiging is 24 uur geldig.',
    footnote: 'Ken je de afzender niet? Dan kun je deze e-mail negeren.',
  },

  // ── 6. Verificatiecode ──────────────────────────────────────────────────
  reauthentication: {
    subject: 'Je verificatiecode – Servio',
    preview: 'Je verificatiecode voor Servio',
    heading: 'Bevestig je identiteit',
    paragraphs: ['Gebruik onderstaande code om te bevestigen dat jij het bent.'],
    note: 'Deze code verloopt na 10 minuten.',
    footnote: 'Heb je dit niet zelf aangevraagd? Wijzig dan direct je wachtwoord.',
  },

  // ── 7. Abonnement afgesloten (bedankmail na betaling) ───────────────────
  //  Invulvelden: {pakket} (Starter/Pro/Business), {mailboxen}, {prijs}, {datum}
  subscriptionWelcome: {
    subject: 'Bedankt! Je Servio-abonnement is geregeld 🎉',
    preview: 'Welkom bij {pakket} — hier is wat je nu kan.',
    icon: '🎉',
    heading: 'Welkom bij Servio {pakket}!',
    paragraphs: [
      'Bedankt voor je vertrouwen — je {pakket}-abonnement staat live. Je kunt nu {mailboxen} koppelen en gebruikmaken van alles wat bij dit pakket hoort. Wij gaan door met administratie automatiseren, jij focust weer op ondernemen.',
    ],
    button: 'Naar je dashboard',
    note: 'Wil je je abonnement aanpassen of opzeggen? Dat kan altijd via Instellingen → Abonnement.',
    signature: 'Veel plezier (en succes),\nHet Servio-team 👋',
    labels: {
      pakket: 'Pakket',
      prijs: 'Prijs',
      volgendeFactuur: 'Volgende factuurdatum',
    },
  },

  // ── Voettekst onderaan iedere e-mail ────────────────────────────────────
  footer: 'Servio · getservio.co · Je ontvangt deze e-mail omdat je een account hebt bij Servio.',
}

// Vult de invulvelden zoals {email} in de teksten hierboven.
export function fill(
  template: string,
  values: Record<string, string | undefined | null>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)
}
