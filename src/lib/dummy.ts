import { MailItem, TemplateItem, StatsSnapshot, Category, Sentiment, Urgency } from '@/types';

export const dummyMails: MailItem[] = [
  {
    id: 'mail_001',
    from: 'jan.bakker@email.com',
    to: ['support@bedrijf.nl'],
    subject: 'Bestelling 12345 beschadigd aangekomen',
    snippet: 'Mijn bestelling kwam beschadigd aan en ik wil graag mijn geld terug...',
    body: `Beste support,

Mijn bestelling #12345 kwam gisteren beschadigd aan. De verpakking was zwaar beschadigd en het product binnenin is gebroken. 

Ik wil graag een volledige terugbetaling van €89,95. Dit is zeer teleurstellend aangezien ik klant ben sinds 2020.

Met vriendelijke groet,
Jan Bakker`,
    receivedAt: '2024-01-15T09:30:00Z',
    unread: true,
    labels: ['klant-support'],
    attachments: [{ name: 'foto-schade.jpg', sizeKB: 245 }]
  },
  {
    id: 'mail_002',
    from: 'maria.jansen@gmail.com',
    to: ['support@bedrijf.nl'],
    subject: 'Hoe wijzig ik mijn wachtwoord?',
    snippet: 'Ik ben mijn wachtwoord vergeten en kan niet meer inloggen...',
    body: `Hallo,

Ik ben mijn wachtwoord vergeten en kan niet meer inloggen op mijn account. Kunnen jullie me helpen?

Mijn emailadres is maria.jansen@gmail.com.

Bedankt!
Maria`,
    receivedAt: '2024-01-15T08:45:00Z',
    unread: true,
    labels: ['account']
  },
  {
    id: 'mail_003',
    from: 'peter.vries@hotmail.com',
    to: ['support@bedrijf.nl'],
    subject: 'Factuur #884 opnieuw sturen',
    snippet: 'Kunnen jullie factuur #884 opnieuw naar me sturen?',
    body: `Dag,

Kunnen jullie factuur #884 van vorige maand opnieuw naar me sturen? Ik kan hem niet meer vinden.

Groet,
Peter de Vries`,
    receivedAt: '2024-01-15T07:20:00Z',
    unread: false,
    labels: ['facturering']
  },
  {
    id: 'mail_004',
    from: 'lisa.wong@company.com',
    to: ['support@bedrijf.nl'],
    subject: 'Return procedure for item XYZ123',
    snippet: 'What is the procedure to return item XYZ123?',
    body: `Hello,

I would like to return item XYZ123 that I ordered last week. The size doesn't fit properly.

What is the return procedure and who pays for shipping?

Best regards,
Lisa Wong`,
    receivedAt: '2024-01-15T06:15:00Z',
    unread: true,
    labels: ['returns']
  },
  {
    id: 'mail_005',
    from: 'techsupport@urgent.com',
    to: ['support@bedrijf.nl'],
    subject: 'Website geeft 500 error bij afrekenen',
    snippet: 'Jullie website geeft een 500 server error wanneer ik probeer af te rekenen...',
    body: `Urgent!

Jullie website geeft een 500 server error wanneer ik probeer af te rekenen. Dit gebeurt al de hele ochtend.

Ik probeer een bestelling van €250 te plaatsen maar het lukt niet. Dit kost jullie omzet!

Fix dit alsjeblieft zo snel mogelijk.

Support Team TechCorp`,
    receivedAt: '2024-01-15T10:00:00Z',
    unread: true,
    labels: ['technisch', 'urgent']
  },
  {
    id: 'mail_006',
    from: 'happy.customer@email.nl',
    to: ['support@bedrijf.nl'],
    subject: 'Bedankt voor de snelle service!',
    snippet: 'Ik wilde jullie bedanken voor de uitstekende service...',
    body: `Beste team,

Ik wilde jullie bedanken voor de uitstekende service gisteren. Mijn probleem werd binnen een uur opgelost!

Jullie zijn echt geweldig. Blijf zo doorgaan!

Met dank,
Sandra Peters`,
    receivedAt: '2024-01-14T16:30:00Z',
    unread: false,
    labels: ['positief']
  },
  // Voeg nog 14 mails toe voor diversiteit
  {
    id: 'mail_007',
    from: 'angry.customer@email.com',
    to: ['support@bedrijf.nl'],
    subject: 'Dit is de 3e keer dat ik contact opneem!',
    snippet: 'Ik heb al 3 keer gemaild en nog steeds geen antwoord...',
    body: `Dit is onacceptabel!

Ik heb al 3 keer gemaild over mijn probleem en nog steeds geen behoorlijk antwoord gekregen. 

Mijn bestelling #98765 is nog steeds niet aangekomen na 2 weken. Waar blijft mijn pakket?

Ik eis nu direct actie, anders ga ik naar de geschillencommissie!

Boos,
Robert Smit`,
    receivedAt: '2024-01-15T11:15:00Z',
    unread: true,
    labels: ['escalatie', 'verzending']
  },
  {
    id: 'mail_008',
    from: 'info@groothandel.nl',
    to: ['support@bedrijf.nl'],
    subject: 'B2B Partnership mogelijkheden',
    snippet: 'We zijn geïnteresseerd in een zakelijke samenwerking...',
    body: `Geachte heer/mevrouw,

Wij zijn Groothandel Nederland en zijn geïnteresseerd in een mogelijke B2B samenwerking.

Kunnen we een afspraak maken om de mogelijkheden te bespreken?

Met vriendelijke groet,
Directie Groothandel Nederland`,
    receivedAt: '2024-01-15T05:45:00Z',
    unread: true,
    labels: ['zakelijk']
  }
];

export const dummyTemplates: TemplateItem[] = [
  {
    id: 'tpl_001',
    name: 'Retour instructies',
    category: 'Retour',
    language: 'NL',
    body: `Beste {{naam}},

Dank je voor je bericht. Jammer om te horen dat je wilt retourneren.

Je kunt binnen 30 dagen kosteloos retourneren. Gebruik dit RMA-nummer: {{order_id}}.

Stappen:
1) Verpak het artikel zorgvuldig
2) Plak het retourlabel op de verpakking  
3) Lever het pakket in bij een PostNL punt

Je ontvangt je terugbetaling binnen 3-5 werkdagen na ontvangst.

Met vriendelijke groet,
Klantenservice Team`,
    updatedAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'tpl_002',
    name: 'Excuses & Refund',
    category: 'Klacht',
    language: 'NL',
    body: `Beste {{naam}},

Dank je voor je bericht en excuses voor het ongemak dat je hebt ondervonden.

We begrijpen je frustratie volkomen en nemen dit zeer serieus. We hebben een terugbetaling van €{{bedrag}} in gang gezet die je binnen 3-5 werkdagen op je rekening ziet verschijnen.

Als extra gebaar van goodwill ontvang je ook een kortingscode voor je volgende bestelling.

Nogmaals onze excuses en we hopen je snel weer te mogen verwelkomen.

Met vriendelijke groet,
Klantenservice Team`,
    updatedAt: '2024-01-08T14:30:00Z'
  },
  {
    id: 'tpl_003',
    name: 'Wachtwoord reset',
    category: 'Vraag',
    language: 'NL',
    body: `Hallo {{naam}},

Je kunt je wachtwoord eenvoudig resetten via deze link: {{reset_link}}

Deze link is 60 minuten geldig. Als de link niet meer werkt, kun je opnieuw een reset aanvragen via onze website.

Heb je nog vragen? Neem gerust contact met ons op.

Vriendelijke groet,
Support Team`,
    updatedAt: '2024-01-12T09:15:00Z'
  },
  {
    id: 'tpl_004',
    name: 'Invoice Resend',
    category: 'Factuur',
    language: 'EN',
    body: `Dear {{naam}},

Thank you for your message. I've attached invoice #{{invoice_number}} to this email.

For future reference, you can always download your invoices from your account dashboard under "Order History".

If you need any other invoices or have questions, please don't hesitate to contact us.

Best regards,
Customer Service Team`,
    updatedAt: '2024-01-09T11:20:00Z'
  },
  {
    id: 'tpl_005',
    name: 'Shipping Delay Apology',
    category: 'Overig',
    language: 'EN',
    body: `Dear {{naam}},

We sincerely apologize for the delay with your order #{{order_id}}.

Due to unexpected high demand, your shipment has been delayed by {{delay_days}} days. Your order is now expected to arrive on {{new_delivery_date}}.

As an apology, we've applied a 15% discount to your next order with code: SORRY15

Thank you for your patience and understanding.

Best regards,
Customer Service Team`,
    updatedAt: '2024-01-11T16:10:00Z'
  },
  {
    id: 'tpl_006',
    name: 'General Follow-up',
    category: 'Algemeen',
    language: 'NL',
    body: `Beste {{naam}},

Bedankt voor je bericht. We hebben je vraag ontvangen en zullen hier zo spoedig mogelijk op reageren.

Verwacht een reactie binnen 24 uur tijdens werkdagen.

Je kunt altijd de status van je aanvraag volgen via je account dashboard.

Met vriendelijke groet,
Klantenservice Team`,
    updatedAt: '2024-01-13T13:45:00Z'
  }
];

export const dummyStats: StatsSnapshot[] = [
  {
    date: '2024-01-15',
    totalMails: 47,
    avgResponseMins: 123,
    autoReplyPct: 23,
    byCategory: {
      'Retour': 8,
      'Klacht': 12,
      'Factuur': 5,
      'Vraag': 15,
      'Technisch': 4,
      'Overig': 3
    },
    sentimentShare: {
      'Negatief': 35,
      'Neutraal': 50,
      'Positief': 15
    }
  },
  {
    date: '2024-01-14',
    totalMails: 52,
    avgResponseMins: 98,
    autoReplyPct: 31,
    byCategory: {
      'Retour': 9,
      'Klacht': 8,
      'Factuur': 7,
      'Vraag': 18,
      'Technisch': 6,
      'Overig': 4
    },
    sentimentShare: {
      'Negatief': 28,
      'Neutraal': 58,
      'Positief': 14
    }
  }
  // Meer dagen kunnen worden toegevoegd...
];

// Utility functions voor dummy data
export const getCategoryColor = (category: Category): string => {
  const colors = {
    'Retour': 'bg-blue-100 text-blue-800',
    'Klacht': 'bg-red-100 text-red-800',
    'Factuur': 'bg-green-100 text-green-800',
    'Vraag': 'bg-purple-100 text-purple-800',
    'Technisch': 'bg-orange-100 text-orange-800',
    'Overig': 'bg-gray-100 text-gray-800'
  };
  return colors[category];
};

export const getUrgencyColor = (urgency: Urgency): string => {
  const colors = {
    'Hoog': 'bg-destructive text-destructive-foreground',
    'Normaal': 'bg-warning text-warning-foreground',
    'Laag': 'bg-muted text-muted-foreground'
  };
  return colors[urgency];
};

export const getSentimentColor = (sentiment: Sentiment): string => {
  const colors = {
    'Negatief': 'bg-destructive text-destructive-foreground',
    'Neutraal': 'bg-muted text-muted-foreground',
    'Positief': 'bg-success text-success-foreground'
  };
  return colors[sentiment];
};