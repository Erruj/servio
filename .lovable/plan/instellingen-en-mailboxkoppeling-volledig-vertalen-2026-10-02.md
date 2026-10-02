# Instellingen en mailboxkoppeling volledig vertalen

## Resultaat
- Alle zichtbare hoofdtekst op `/settings` en `/mailbox-setup` gebruikt vertalingen in plaats van vaste Nederlandse tekst.
- De teksten zijn beschikbaar in Nederlands, Engels, Duits, Frans en Spaans.
- Bij Engels als taal bevatten beide pagina’s geen Nederlandse hoofdtekst meer.

## Uitvoering
1. Breid de bestaande vertaalwoordenlijst uit met de ontbrekende instellingen-, AI-stijl- en mailboxteksten voor alle vijf talen.
2. Vervang de vaste teksten op beide pagina’s door die vertalingen, inclusief meldingen en dynamische mailboxstatussen die in de hoofdinhoud verschijnen.
3. Controleer de Engelse paginaweergave en herstel eventuele overgebleven Nederlandse tekst binnen deze twee pagina’s.

## Technische details
- Bestaande `react-i18next`-sleutels worden hergebruikt waar ze al bestaan.
- Nieuwe sleutels blijven in dezelfde platte `translation`-structuur als de huidige pagina-vertalingen.
- Opgeslagen interne waarden voor instellingen en providers blijven ongewijzigd; alleen zichtbare labels en meldingen worden vertaald.
