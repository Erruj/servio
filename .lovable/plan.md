# Deel 2 — Functionaliteit & UX audit

Doel: elke pagina onder `/administration/*`, `/statistics`, `/analytics`, `/templates`, `/dashboard` in dezelfde staat brengen op vijf assen. Puur frontend + edge-function-messaging; geen schema-wijzigingen, geen nieuwe features.

## Scope (14 pagina's)

`Invoices`, `Quotes`, `Receipts`, `Customers`, `Documents`, `TimeTracking`, `Exports`, `FinancialOverview`, `TeamManagement`, `AuditLog`, `AIAssistant`, `Statistics`, `Analytics`, `Dashboard`, `Templates` (net gedaan — dient als referentie).

## Bevindingen uit verkenning

- **Dummy-data**: alleen `AnalysisPanel.tsx` importeert nog uit `src/lib/dummy.ts` en gebruikt uitsluitend kleur-helpers (geen data). `dummyMails/Stats/Templates` worden nergens meer als echte data ingelezen. Geen extra schoonmaak nodig — `src/lib/dummy.ts` blijft als voorbeeldsjablonen bestaan.
- Alle andere admin-pagina's lezen al uit Supabase. Focus verschuift dus naar de andere vier assen.

## Aanpak per as

### 1. Empty states
Uniforme component `<EmptyState icon title description action>` (nieuw bestand `src/components/EmptyState.tsx`, gebaseerd op patroon uit nieuwe Templates-pagina). Toepassen op elke lijst/tabel-pagina met een primaire CTA-knop die de "aanmaken"-flow start:

- Facturen → "Nog geen facturen" + `Nieuwe factuur`
- Offertes → `Nieuwe offerte`
- Bonnetjes → `Bonnetje uploaden`
- Klanten → `Nieuwe klant`
- Documenten → `Document uploaden`
- Urenregistratie → `Uren registreren`
- Templates (al klaar)
- AuditLog, Exports, TeamManagement → informatieve empty state zonder CTA (geen "aanmaken"-actie)

### 2. Foutafhandeling
Elke `try/catch` rond opslaan/verwijderen/versturen/uploaden/synchroniseren geeft nu vaak een generieke toast. Vervangen door mensleesbare NL-melding met de `error.message` als beschrijving:

```ts
toast({
  title: 'Factuur opslaan mislukt',
  description: error.message || 'Probeer het opnieuw of ververs de pagina.',
  variant: 'destructive',
});
```

Toegepast op mutaties in: `Invoices`, `Quotes`, `Receipts`, `Customers`, `Documents`, `TimeTracking`, `Exports` (auto-export toggle), `TeamManagement` (invite/remove), `Dashboard` (widget refresh acties).

### 3. AI-laadstatus
Overal waar een edge function met AI wordt aangeroepen, een geruststellende inline-statuscomponent tonen i.p.v. kale spinner. Nieuw hergebruikbaar `<AiLoadingState label />` (spinner + tekstlabel + subtiel pulse), plaatsen in:

- `AIAssistant.tsx` — "Servio denkt na over je vraag…"
- `MailDetail.tsx` (analyse + reply) — "E-mail wordt geanalyseerd…" / "Antwoord wordt geschreven…"
- `Receipts.tsx` / `Invoices.tsx` upload-flow — "Document wordt uitgelezen…"
- `Documents.tsx` analyse — "Document wordt geanalyseerd…"
- `Dashboard` proactive insights fetch — "Inzichten worden geladen…"

### 4. Consistentie knoppen/iconen
Vaste conventies afdwingen op alle audit-pagina's:

- Primaire actie (Nieuwe / Opslaan / Aanmaken) → rechts, `variant="default"`, altijd voorafgegaan door `Plus` (nieuw) of `Save` (opslaan)
- Bewerken → `Edit` icon, `variant="ghost"`, size `sm`
- Verwijderen → `Trash2` icon, `variant="ghost"` met `text-destructive` klasse, altijd na bevestigings-`AlertDialog`
- Dupliceren → `Copy` icon
- Uploaden → `Upload` icon
- Downloaden/Exporteren → `Download` icon
- Dialog-footer: `Annuleren` links (`variant="outline"`), primaire actie rechts

Waar pagina's hiervan afwijken (bijv. Delete zonder confirm, primaire knop links, verkeerd icoon) → aanpassen.

### 5. Dummy-data check
Al gedaan tijdens verkenning; geen aanpassingen nodig behalve waakzaam blijven bij review.

## Fasering (opgesplitst zoals gevraagd door workspace-regels)

Splits in vijf reviewbare blokken zodat we niet alles in één klap overhoop halen:

1. **Fundering** — `EmptyState.tsx`, `AiLoadingState.tsx`, `ConfirmDialog.tsx` (delete-bevestiging) toevoegen. Geen page-wijzigingen.
2. **Facturatie-cluster** — `Invoices`, `Quotes`, `Receipts` toepassen.
3. **CRM & operations** — `Customers`, `TimeTracking`, `Documents`.
4. **Beheer & inzicht** — `Exports`, `TeamManagement`, `AuditLog`, `FinancialOverview`.
5. **AI & dashboards** — `AIAssistant`, `Statistics`, `Analytics`, `Dashboard`, `MailDetail` (AI-laadstatussen).

Elk blok afgerond met een korte visuele/functionele sanity-check voordat we door gaan.

## Niet in scope

- Nieuwe features of extra kolommen
- Database-migraties
- Landing/marketing/legal-pagina's
- Design-token wijzigingen (Deel 3)

## Vraag

Zullen we starten met **Blok 1 (fundering)** zodat de volgende blokken direct de gedeelde componenten kunnen gebruiken?
