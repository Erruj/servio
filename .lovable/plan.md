# Servio uitbreiding — 3 onderdelen

Dit is een groot pakket (≈20 sub-features verdeeld over onboarding, AI en rapportages). Ik stel voor het in **3 oplever-fases** te doen zodat je tussendoor kunt testen, in plaats van alles in één enorme batch waarbij regressies moeilijk te traceren zijn.

---

## Fase 1 — Onboarding & Gebruikerservaring

**Database:**
- Kolommen toevoegen aan `profiles`: `vat_number`, `phone`, `onboarding_completed` (bool)
- Kolom `email_first_replied`, `first_invoice_uploaded` afleiden uit bestaande tabellen (geen schema nodig)

**Componenten:**
- `OnboardingWizard.tsx` — 3-staps modal (Mailbox → Bedrijfsprofiel → Eerste actie), met progress bar. Detecteert bestaande mailbox-koppeling en slaat stap 1 dan over.
- `HelpTooltip.tsx` — herbruikbaar `?` icoon met Popover. Eerste keer auto-open, daarna alleen op hover. State in `localStorage` per tooltip-key.
- `TimeSavedWidget.tsx` op dashboard — formule: `emails×3 + facturen×10 + ai_replies×5` minuten. Toont trend t.o.v. vorige maand en milestone-toast bij ronde grenzen.
- `OnboardingChecklist.tsx` onderaan sidebar — 5 items, verdwijnt bij voltooiing.

**Tooltips toevoegen aan:** AI suggestie knop, Sync knop, FeatureGate, BTW veld facturen.

---

## Fase 2 — AI Verbeteringen

**Database:**
- Nieuwe tabel `email_category_corrections` (user_id, email_id, original_category, corrected_category)
- Kolom `thread_summary` + `thread_summary_updated_at` op `emails`
- Kolom `customer_sentiment` op `emails` (enum: neutral/positive/negative/unhappy)

**Logica:**
- Bij handmatige categorie-wijziging in `MailDetail`: insert in corrections-tabel. Toast bij 5+ correcties.
- `analyze-email` edge function uitbreiden: laatste 10 user-correcties meesturen als few-shot context; aparte sentiment-detectie met "unhappy customer" classificatie; verbeterde urgentie-keywords (deadline, dringend, vandaag, betalingstermijn, juridisch).
- Nieuwe edge function `summarize-thread`: pakt alle emails met zelfde thread_id, genereert 3-zinnen samenvatting, cached in DB.
- `MailDetail`: thread-samenvatting blok bovenaan + refresh knop. Banner "Ontevreden klant" bovenaan inbox bij detectie.
- "Prioriteit inbox" sectie bovenaan `Inbox.tsx` met top 3 urgente ongelezen mails. Default sortering op urgentie+datum.
- `Statistics.tsx`: nieuwe grafiek "Klanttevredenheid trend" (positief vs negatief per week).

---

## Fase 3 — Rapportage & Exports

**Libraries:** `jspdf` + `jspdf-autotable` (al PDF-vriendelijk in browser, geen extra backend nodig), `xlsx` voor Excel.

**Features:**
- **Jaaroverzicht PDF** op Exports pagina: jaarpicker → PDF met voorpagina, samenvatting, maandtabel, factuuroverzicht, bonnetjes per categorie, lijngrafiek omzet/kosten, footer met paginanr.
- **BTW-aangifte sectie** op `FinancialOverview`: per kwartaal omzet excl., BTW ontvangen, BTW betaald, te betalen/terug. "Exporteer BTW rapport" PDF knop. Reminder banner indien aangifte-deadline binnen 14 dagen.
- **Urenrapport** op `TimeTracking`: filter periode + klant/project → PDF met tabel, subtotalen per project, totaal. "Maak factuur van deze uren" knop die naar Invoices navigeert met pre-filled lines.
- **Export verbeteringen**: Excel export naast CSV. "Exporteer alles" → ZIP met facturen.csv/xlsx, bonnetjes, transacties, uren. Maandelijkse auto-export (toggle in Settings) — vereist nieuwe edge function + pg_cron.

---

## Aanpak

Ik stel voor **te starten met Fase 1** (kleinste scope, snelste win), daarna jouw feedback verwerken voordat we Fase 2 en 3 inplannen. Anders wordt dit één enorme commit (~25 nieuwe/aangepaste files) die moeilijk te reviewen en debuggen is.

**Vraag aan jou:** Begin ik direct met Fase 1, of wil je dat ik alle 3 in één keer doe (langere doorlooptijd, hogere kans op regressies, lastiger om bugs te isoleren)?
