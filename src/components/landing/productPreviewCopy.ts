// Texts for the animated app mock on the homepage, per language.
type Mail = { from: string; subj: string; snippet: string; time: string };
export interface PreviewCopy {
  nav: { invoices: string; documents: string; analytics: string };
  search: string; synced: string; unread: string;
  mails: Mail[];
  previewGreeting: string; previewBody: string; previewSign: string; aiAvailable: string;
  reply: string; original: string; originalBody: string; aiTitle: string; generated: string;
  send: string; adjust: string; regenerate: string;
  stats: [string, string, string, string]; statDelta4: string;
  finTitle: string; month: string; sample: string; revenueWeek: string;
  payments: string; matched: string;
  upload: string; file: string; reading: string; recognized: string; sure: string;
  fields: [string, string, string, string, string, string, string, string];
  category: string; book: string; edit: string; linked: string;
  fv: { tags: [string, string, string, string]; sorted: string; margin: string; best: string; reading: string; recognized: string; invNo: string; profReply: string; aiReply: string; shortReply: string };
}

const nl: PreviewCopy = {
  nav: { invoices: 'Facturen', documents: 'Documenten', analytics: 'Statistieken' },
  search: 'Zoeken in Servio...', synced: 'Gesynchroniseerd', unread: '12 ongelezen',
  mails: [
    { from: 'Anna Bakker', subj: 'Vraag over offerte 2026-104', snippet: 'Hoi, kunnen we de levertijd nog bespreken?', time: '09:42' },
    { from: 'Drukkerij De Vries', subj: 'Betaling ontvangen — €1.250,00', snippet: 'Factuur INV-0421 is voldaan door Bakker BV.', time: '09:21' },
    { from: 'Telecom Noord B.V.', subj: 'Factuur november beschikbaar', snippet: 'Uw maandfactuur staat klaar in het portaal.', time: '08:55' },
    { from: 'Tom Janssen', subj: 'Re: Projectplanning Q2', snippet: 'Top, dan plannen we de kickoff voor dinsdag.', time: 'Gisteren' },
    { from: 'Belastingdienst', subj: 'Bevestiging btw-aangifte', snippet: 'Uw aangifte over Q3 is succesvol verwerkt.', time: 'Gisteren' },
  ],
  previewGreeting: 'Hoi,', previewBody: 'Bedankt voor de offerte. We willen graag akkoord, maar kunnen we de levertijd nog bespreken? Eind januari zou ideaal zijn.', previewSign: 'Groet,', aiAvailable: 'AI-suggestie beschikbaar',
  reply: 'Hoi Anna,\n\nBedankt voor je bericht. Eind januari is haalbaar — we kunnen leveren in week 4. Ik stuur de aangepaste offerte vandaag nog door.\n\nMet vriendelijke groet,\nMark',
  original: 'Origineel bericht', originalBody: 'Hoi, bedankt voor de offerte. We willen graag akkoord, maar kunnen we de levertijd nog bespreken? Eind januari zou ideaal zijn.',
  aiTitle: 'AI-antwoord — professioneel', generated: 'Gegenereerd in 1,2 s',
  send: 'Verstuur', adjust: 'Aanpassen', regenerate: 'Opnieuw genereren',
  stats: ['Omzet (mnd)', 'Openstaand', 'Auto-antwoorden', 'Tijd bespaard'], statDelta4: 'deze maand',
  finTitle: 'Financieel overzicht', month: 'November 2026', sample: 'Voorbeelddata', revenueWeek: 'Omzet per week',
  payments: '3 nieuwe betalingen ontvangen', matched: 'Automatisch gekoppeld aan facturen',
  upload: 'Factuur uploaden', file: 'factuur-kpn-nov.pdf', reading: 'AI leest factuur uit...', recognized: 'Herkende gegevens', sure: '99% zeker',
  fields: ['Leverancier', 'Factuurnummer', 'Datum', 'Vervaldatum', 'Bedrag excl.', 'Btw (21%)', 'Totaal', 'Categorie'],
  category: 'Telecom & internet', book: 'Boeken', edit: 'Bewerken', linked: 'Gekoppeld',
  fv: { tags: ['Klant', 'Financieel', 'Leverancier', 'Intern'], sorted: 'AI sorteerde 12 mails • bespaarde 18 min', margin: 'Marge', best: 'Beste maand van het jaar — automatisch gekoppeld', reading: 'AI leest uit...', recognized: 'Herkend', invNo: 'Factuurnr.', profReply: 'Professioneel antwoord', aiReply: 'AI-antwoord', shortReply: 'Hoi Anna,\n\nEind januari is haalbaar — we leveren in week 4. Ik stuur de aangepaste offerte vandaag door.\n\nGroet,\nMark' },
};

const en: PreviewCopy = {
  nav: { invoices: 'Invoices', documents: 'Documents', analytics: 'Analytics' },
  search: 'Search Servio...', synced: 'Synced', unread: '12 unread',
  mails: [
    { from: 'Anna Baker', subj: 'Question about quote 2026-104', snippet: 'Hi, could we discuss the delivery time?', time: '09:42' },
    { from: 'Drukkerij De Vries', subj: 'Payment received — €1,250.00', snippet: 'Invoice INV-0421 was paid by Baker Ltd.', time: '09:21' },
    { from: 'Telecom Noord B.V.', subj: 'November invoice available', snippet: 'Your monthly invoice is ready in the portal.', time: '08:55' },
    { from: 'Tom Jansen', subj: 'Re: Project planning Q2', snippet: 'Great, let’s schedule the kickoff for Tuesday.', time: 'Yesterday' },
    { from: 'Tax office', subj: 'VAT return confirmation', snippet: 'Your Q3 return was processed successfully.', time: 'Yesterday' },
  ],
  previewGreeting: 'Hi,', previewBody: 'Thanks for the quote. We’d like to accept, but could we discuss the delivery time? End of January would be ideal.', previewSign: 'Best,', aiAvailable: 'AI suggestion available',
  reply: 'Hi Anna,\n\nThanks for your message. End of January works — we can deliver in week 4. I’ll send the updated quote today.\n\nKind regards,\nMark',
  original: 'Original message', originalBody: 'Hi, thanks for the quote. We’d like to accept, but could we discuss the delivery time? End of January would be ideal.',
  aiTitle: 'AI reply — professional', generated: 'Generated in 1.2 s',
  send: 'Send', adjust: 'Edit', regenerate: 'Regenerate',
  stats: ['Revenue (mo)', 'Outstanding', 'Auto-replies', 'Time saved'], statDelta4: 'this month',
  finTitle: 'Financial overview', month: 'November 2026', sample: 'Sample data', revenueWeek: 'Revenue per week',
  payments: '3 new payments received', matched: 'Automatically matched to invoices',
  upload: 'Upload invoice', file: 'invoice-kpn-nov.pdf', reading: 'AI is reading the invoice...', recognized: 'Recognised details', sure: '99% confident',
  fields: ['Supplier', 'Invoice number', 'Date', 'Due date', 'Amount excl.', 'VAT (21%)', 'Total', 'Category'],
  category: 'Telecom & internet', book: 'Book', edit: 'Edit', linked: 'Linked',
  fv: { tags: ['Customer', 'Finance', 'Supplier', 'Internal'], sorted: 'AI sorted 12 emails • saved 18 min', margin: 'Margin', best: 'Best month of the year — matched automatically', reading: 'AI is reading...', recognized: 'Recognised', invNo: 'Invoice no.', profReply: 'Professional reply', aiReply: 'AI reply', shortReply: 'Hi Anna,\n\nEnd of January works — we deliver in week 4. I’ll send the updated quote today.\n\nBest,\nMark' },
};

const de: PreviewCopy = {
  nav: { invoices: 'Rechnungen', documents: 'Dokumente', analytics: 'Statistiken' },
  search: 'In Servio suchen...', synced: 'Synchronisiert', unread: '12 ungelesen',
  mails: [
    { from: 'Anna Becker', subj: 'Frage zum Angebot 2026-104', snippet: 'Hallo, können wir die Lieferzeit noch besprechen?', time: '09:42' },
    { from: 'Drukkerij De Vries', subj: 'Zahlung erhalten — 1.250,00 €', snippet: 'Rechnung INV-0421 wurde von Becker GmbH bezahlt.', time: '09:21' },
    { from: 'Telecom Noord B.V.', subj: 'Rechnung November verfügbar', snippet: 'Ihre Monatsrechnung liegt im Portal bereit.', time: '08:55' },
    { from: 'Tom Jansen', subj: 'Re: Projektplanung Q2', snippet: 'Super, dann planen wir den Kickoff für Dienstag.', time: 'Gestern' },
    { from: 'Finanzamt', subj: 'Bestätigung USt-Voranmeldung', snippet: 'Ihre Meldung für Q3 wurde erfolgreich verarbeitet.', time: 'Gestern' },
  ],
  previewGreeting: 'Hallo,', previewBody: 'Danke für das Angebot. Wir möchten gerne zusagen, aber können wir die Lieferzeit noch besprechen? Ende Januar wäre ideal.', previewSign: 'Grüße,', aiAvailable: 'KI-Vorschlag verfügbar',
  reply: 'Hallo Anna,\n\ndanke für deine Nachricht. Ende Januar ist machbar — wir können in KW 4 liefern. Ich schicke das angepasste Angebot noch heute.\n\nViele Grüße\nMark',
  original: 'Ursprüngliche Nachricht', originalBody: 'Hallo, danke für das Angebot. Wir möchten gerne zusagen, aber können wir die Lieferzeit noch besprechen? Ende Januar wäre ideal.',
  aiTitle: 'KI-Antwort — professionell', generated: 'Erstellt in 1,2 s',
  send: 'Senden', adjust: 'Anpassen', regenerate: 'Neu erstellen',
  stats: ['Umsatz (Mon.)', 'Offen', 'Auto-Antworten', 'Zeit gespart'], statDelta4: 'diesen Monat',
  finTitle: 'Finanzübersicht', month: 'November 2026', sample: 'Beispieldaten', revenueWeek: 'Umsatz pro Woche',
  payments: '3 neue Zahlungen erhalten', matched: 'Automatisch Rechnungen zugeordnet',
  upload: 'Rechnung hochladen', file: 'rechnung-kpn-nov.pdf', reading: 'KI liest Rechnung aus...', recognized: 'Erkannte Daten', sure: '99% sicher',
  fields: ['Lieferant', 'Rechnungsnummer', 'Datum', 'Fälligkeit', 'Betrag netto', 'MwSt. (21%)', 'Gesamt', 'Kategorie'],
  category: 'Telekom & Internet', book: 'Buchen', edit: 'Bearbeiten', linked: 'Verknüpft',
  fv: { tags: ['Kunde', 'Finanzen', 'Lieferant', 'Intern'], sorted: 'KI sortierte 12 Mails • 18 Min. gespart', margin: 'Marge', best: 'Bester Monat des Jahres — automatisch zugeordnet', reading: 'KI liest aus...', recognized: 'Erkannt', invNo: 'Rechnungsnr.', profReply: 'Professionelle Antwort', aiReply: 'KI-Antwort', shortReply: 'Hallo Anna,\n\nEnde Januar ist machbar — wir liefern in KW 4. Ich schicke das angepasste Angebot heute.\n\nGrüße\nMark' },
};

const fr: PreviewCopy = {
  nav: { invoices: 'Factures', documents: 'Documents', analytics: 'Statistiques' },
  search: 'Rechercher dans Servio...', synced: 'Synchronisé', unread: '12 non lus',
  mails: [
    { from: 'Anne Boulanger', subj: 'Question sur le devis 2026-104', snippet: 'Bonjour, pouvons-nous discuter du délai de livraison ?', time: '09:42' },
    { from: 'Drukkerij De Vries', subj: 'Paiement reçu — 1 250,00 €', snippet: 'La facture INV-0421 a été réglée par Boulanger SARL.', time: '09:21' },
    { from: 'Telecom Noord B.V.', subj: 'Facture de novembre disponible', snippet: 'Votre facture mensuelle est prête sur le portail.', time: '08:55' },
    { from: 'Tom Jansen', subj: 'Re : Planning projet T2', snippet: 'Parfait, on planifie le lancement mardi.', time: 'Hier' },
    { from: 'Impôts', subj: 'Confirmation de déclaration de TVA', snippet: 'Votre déclaration du T3 a bien été traitée.', time: 'Hier' },
  ],
  previewGreeting: 'Bonjour,', previewBody: 'Merci pour le devis. Nous souhaitons l’accepter, mais pouvons-nous discuter du délai de livraison ? Fin janvier serait idéal.', previewSign: 'Cordialement,', aiAvailable: 'Suggestion IA disponible',
  reply: 'Bonjour Anne,\n\nMerci pour votre message. Fin janvier est possible — nous pouvons livrer en semaine 4. Je vous envoie le devis modifié aujourd’hui.\n\nCordialement,\nMark',
  original: 'Message d’origine', originalBody: 'Bonjour, merci pour le devis. Nous souhaitons l’accepter, mais pouvons-nous discuter du délai de livraison ? Fin janvier serait idéal.',
  aiTitle: 'Réponse IA — professionnelle', generated: 'Générée en 1,2 s',
  send: 'Envoyer', adjust: 'Modifier', regenerate: 'Régénérer',
  stats: ['CA (mois)', 'En attente', 'Réponses auto', 'Temps gagné'], statDelta4: 'ce mois-ci',
  finTitle: 'Aperçu financier', month: 'Novembre 2026', sample: 'Données d’exemple', revenueWeek: 'CA par semaine',
  payments: '3 nouveaux paiements reçus', matched: 'Rapprochés automatiquement des factures',
  upload: 'Importer une facture', file: 'facture-kpn-nov.pdf', reading: 'L’IA lit la facture...', recognized: 'Données reconnues', sure: '99 % sûr',
  fields: ['Fournisseur', 'N° de facture', 'Date', 'Échéance', 'Montant HT', 'TVA (21 %)', 'Total', 'Catégorie'],
  category: 'Télécom & internet', book: 'Comptabiliser', edit: 'Modifier', linked: 'Lié',
  fv: { tags: ['Client', 'Finance', 'Fournisseur', 'Interne'], sorted: 'L’IA a trié 12 e-mails • 18 min gagnées', margin: 'Marge', best: 'Meilleur mois de l’année — rapproché automatiquement', reading: 'L’IA lit...', recognized: 'Reconnu', invNo: 'N° facture', profReply: 'Réponse professionnelle', aiReply: 'Réponse IA', shortReply: 'Bonjour Anne,\n\nFin janvier est possible — nous livrons en semaine 4. Je vous envoie le devis modifié aujourd’hui.\n\nCordialement,\nMark' },
};

const es: PreviewCopy = {
  nav: { invoices: 'Facturas', documents: 'Documentos', analytics: 'Estadísticas' },
  search: 'Buscar en Servio...', synced: 'Sincronizado', unread: '12 sin leer',
  mails: [
    { from: 'Ana Panadero', subj: 'Pregunta sobre el presupuesto 2026-104', snippet: 'Hola, ¿podemos hablar del plazo de entrega?', time: '09:42' },
    { from: 'Drukkerij De Vries', subj: 'Pago recibido — 1.250,00 €', snippet: 'La factura INV-0421 fue pagada por Panadero SL.', time: '09:21' },
    { from: 'Telecom Noord B.V.', subj: 'Factura de noviembre disponible', snippet: 'Tu factura mensual está lista en el portal.', time: '08:55' },
    { from: 'Tom Jansen', subj: 'Re: Planificación proyecto T2', snippet: 'Genial, planificamos el arranque para el martes.', time: 'Ayer' },
    { from: 'Hacienda', subj: 'Confirmación declaración de IVA', snippet: 'Tu declaración del T3 se ha procesado correctamente.', time: 'Ayer' },
  ],
  previewGreeting: 'Hola,', previewBody: 'Gracias por el presupuesto. Queremos aceptarlo, pero ¿podemos hablar del plazo de entrega? Finales de enero sería ideal.', previewSign: 'Saludos,', aiAvailable: 'Sugerencia de IA disponible',
  reply: 'Hola Ana,\n\nGracias por tu mensaje. Finales de enero es posible: podemos entregar en la semana 4. Hoy mismo te envío el presupuesto actualizado.\n\nUn saludo,\nMark',
  original: 'Mensaje original', originalBody: 'Hola, gracias por el presupuesto. Queremos aceptarlo, pero ¿podemos hablar del plazo de entrega? Finales de enero sería ideal.',
  aiTitle: 'Respuesta IA — profesional', generated: 'Generada en 1,2 s',
  send: 'Enviar', adjust: 'Ajustar', regenerate: 'Regenerar',
  stats: ['Ingresos (mes)', 'Pendiente', 'Respuestas auto', 'Tiempo ahorrado'], statDelta4: 'este mes',
  finTitle: 'Resumen financiero', month: 'Noviembre 2026', sample: 'Datos de ejemplo', revenueWeek: 'Ingresos por semana',
  payments: '3 nuevos pagos recibidos', matched: 'Vinculados automáticamente a facturas',
  upload: 'Subir factura', file: 'factura-kpn-nov.pdf', reading: 'La IA está leyendo la factura...', recognized: 'Datos reconocidos', sure: '99 % seguro',
  fields: ['Proveedor', 'N.º de factura', 'Fecha', 'Vencimiento', 'Importe sin IVA', 'IVA (21 %)', 'Total', 'Categoría'],
  category: 'Telecom e internet', book: 'Contabilizar', edit: 'Editar', linked: 'Vinculado',
  fv: { tags: ['Cliente', 'Finanzas', 'Proveedor', 'Interno'], sorted: 'La IA ordenó 12 correos • 18 min ahorrados', margin: 'Margen', best: 'Mejor mes del año — vinculado automáticamente', reading: 'La IA está leyendo...', recognized: 'Reconocido', invNo: 'N.º factura', profReply: 'Respuesta profesional', aiReply: 'Respuesta IA', shortReply: 'Hola Ana,\n\nFinales de enero es posible: entregamos en la semana 4. Hoy te envío el presupuesto actualizado.\n\nUn saludo,\nMark' },
};

const all: Record<string, PreviewCopy> = { nl, en, de, fr, es };
export const getPreviewCopy = (lng?: string) => all[(lng || 'nl').slice(0, 2)] ?? nl;
