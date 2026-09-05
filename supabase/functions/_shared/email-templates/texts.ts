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
    subject: 'Bevestig je e-mailadres voor Servio',
    preview: 'Nog één klik en je account is actief',
    heading: 'Welkom bij Servio',
    paragraphs: [
      'Leuk dat je erbij bent. Servio neemt je mailbox en administratie uit handen, zodat jij je op je werk kunt richten.',
      'Bevestig hieronder je e-mailadres ({email}) om je account te activeren.',
    ],
    button: 'E-mailadres bevestigen',
    note: 'Deze link is 24 uur geldig.',
    footnote: 'Heb je geen account aangemaakt? Dan kun je deze e-mail negeren.',
  },

  // ── 2. Wachtwoord vergeten ──────────────────────────────────────────────
  recovery: {
    subject: 'Wachtwoord opnieuw instellen – Servio',
    preview: 'Stel binnen 24 uur een nieuw wachtwoord in',
    heading: 'Wachtwoord opnieuw instellen',
    paragraphs: [
      'Je hebt gevraagd om je wachtwoord te resetten. Klik op de knop hieronder om een nieuw wachtwoord in te stellen.',
    ],
    button: 'Nieuw wachtwoord instellen',
    note: 'Deze link is 24 uur geldig en kan één keer worden gebruikt.',
    footnote:
      'Heb je dit niet zelf aangevraagd? Dan kun je deze e-mail negeren; je wachtwoord blijft ongewijzigd.',
  },

  // ── 3. E-mailadres wijzigen ─────────────────────────────────────────────
  emailChange: {
    subject: 'Bevestig je nieuwe e-mailadres – Servio',
    preview: 'Bevestig de wijziging van je e-mailadres',
    heading: 'Nieuw e-mailadres bevestigen',
    paragraphs: [
      'Je hebt gevraagd om het e-mailadres van je Servio-account te wijzigen van {email} naar {nieuwEmail}.',
      'Bevestig de wijziging hieronder. Daarna log je in met je nieuwe e-mailadres.',
    ],
    button: 'Wijziging bevestigen',
    note: 'Deze link is 24 uur geldig.',
    footnote:
      'Heb je dit niet zelf aangevraagd? Neem dan contact met ons op via info@getservio.co.',
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
