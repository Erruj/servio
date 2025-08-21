import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      inbox: 'Inbox',
      dashboard: 'Dashboard',
      statistics: 'Statistics',
      templates: 'Templates',
      pricing: 'Pricing',
      settings: 'Settings',
      
      // Header
      tagline: 'AI customer service that automatically handles up to 80% of your emails',
      logout: 'Logout',
      demo: 'Demo',
      
      // Welcome
      welcome: 'Welcome to Servio — your AI customer service assistant',
      loadDemoData: 'Load demo data',
      connectMailbox: 'Connect mailbox',
      
      // Mail interface
      reply: 'Reply',
      send: 'Send',
      draft: 'Draft',
      markAsResolved: 'Mark as resolved',
      later: 'Later',
      archive: 'Archive',
      regenerate: 'Regenerate',
      generating: 'Generating...',
      error: 'Error',
      aiGenerationFailed: 'AI Generation Failed',
      usingDemoReplies: 'Using Demo Replies',
      demoRepliesActivated: 'Demo responses have been activated',
      unexpectedError: 'An unexpected error occurred',
      tryAgain: 'Try Again',
      useDemoReply: 'Use Demo Reply',
      generatingReplies: 'Generating AI responses...',
      aiSuggestionsPlaceholder: 'AI will generate response suggestions here...',
      
      // AI Response types
      business: 'Business',
      empathetic: 'Empathetic',
      formal: 'Formal',
      detailed: 'Detailed',
      
      // Languages
      dutch: 'Dutch',
      english: 'English',
      german: 'German',
      french: 'French',
      spanish: 'Spanish',
      
      // Categories
      return: 'Return',
      complaint: 'Complaint',
      invoice: 'Invoice',
      question: 'Question',
      technical: 'Technical',
      other: 'Other',
      
      // Common
      loading: 'Loading...',
      noEmails: 'No new emails.',
      selectEmail: 'Select an email to reply',
      
      // Footer
      footerText: 'Demo version of Servio. Not for production use.',
      version: 'Version'
    }
  },
  nl: {
    translation: {
      // Navigation
      inbox: 'Inbox',
      dashboard: 'Dashboard',
      statistics: 'Statistieken',
      templates: 'Templates',
      pricing: 'Pricing',
      settings: 'Instellingen',
      
      // Header
      tagline: 'AI-klantenservice die tot 80% van je mails automatisch afhandelt',
      logout: 'Uitloggen',
      demo: 'Demo',
      
      // Welcome
      welcome: 'Welkom bij Servio — jouw AI-klantenservice-assistent',
      loadDemoData: 'Laad demo-data',
      connectMailbox: 'Mailbox koppelen',
      
      // Mail interface
      reply: 'Antwoord',
      send: 'Verstuur',
      draft: 'Concept',
      markAsResolved: 'Markeer als afgehandeld',
      later: 'Later',
      archive: 'Archiveer',
      regenerate: 'Regenereer',
      generating: 'Genereren...',
      error: 'Fout',
      aiGenerationFailed: 'AI Genereren Mislukt',
      usingDemoReplies: 'Demo Antwoorden Gebruiken',
      demoRepliesActivated: 'Demo antwoorden zijn geactiveerd',
      unexpectedError: 'Er is een onverwachte fout opgetreden',
      tryAgain: 'Opnieuw Proberen',
      useDemoReply: 'Demo Antwoord Gebruiken',
      generatingReplies: 'AI antwoorden genereren...',
      aiSuggestionsPlaceholder: 'AI zal hier antwoordsuggesties genereren...',
      
      // AI Response types
      business: 'Zakelijk',
      empathetic: 'Empathisch',
      formal: 'Formeel',
      detailed: 'Uitgebreid',
      
      // Languages
      dutch: 'Nederlands',
      english: 'Engels',
      german: 'Duits',
      french: 'Frans',
      spanish: 'Spaans',
      
      // Categories
      return: 'Retour',
      complaint: 'Klacht',
      invoice: 'Factuur',
      question: 'Vraag',
      technical: 'Technisch',
      other: 'Overig',
      
      // Common
      loading: 'Laden...',
      noEmails: 'Geen nieuwe mails.',
      selectEmail: 'Selecteer een email om te antwoorden',
      
      // Footer
      footerText: 'Demo-versie van Servio. Niet voor productie.',
      version: 'Versie'
    }
  },
  de: {
    translation: {
      // Navigation
      inbox: 'Posteingang',
      dashboard: 'Dashboard',
      statistics: 'Statistiken',
      templates: 'Vorlagen',
      pricing: 'Preise',
      settings: 'Einstellungen',
      
      // Header
      tagline: 'KI-Kundenservice, der bis zu 80% Ihrer E-Mails automatisch bearbeitet',
      logout: 'Abmelden',
      demo: 'Demo',
      
      // Welcome
      welcome: 'Willkommen bei Servio — Ihr KI-Kundenservice-Assistent',
      loadDemoData: 'Demo-Daten laden',
      connectMailbox: 'Postfach verbinden',
      
      // Mail interface
      reply: 'Antworten',
      send: 'Senden',
      draft: 'Entwurf',
      markAsResolved: 'Als erledigt markieren',
      later: 'Später',
      archive: 'Archivieren',
      regenerate: 'Regenerieren',
      
      // AI Response types
      business: 'Geschäftlich',
      empathetic: 'Empathisch',
      formal: 'Förmlich',
      detailed: 'Detailliert',
      
      // Languages
      dutch: 'Niederländisch',
      english: 'Englisch',
      german: 'Deutsch',
      french: 'Französisch',
      spanish: 'Spanisch',
      
      // Categories
      return: 'Rücksendung',
      complaint: 'Beschwerde',
      invoice: 'Rechnung',
      question: 'Frage',
      technical: 'Technisch',
      other: 'Sonstiges',
      
      // Common
      loading: 'Laden...',
      noEmails: 'Keine neuen E-Mails.',
      selectEmail: 'Wählen Sie eine E-Mail zum Antworten aus',
      
      // Footer
      footerText: 'Demo-Version von Servio. Nicht für den Produktiveinsatz.',
      version: 'Version'
    }
  },
  fr: {
    translation: {
      // Navigation
      inbox: 'Boîte de réception',
      dashboard: 'Tableau de bord',
      statistics: 'Statistiques',
      templates: 'Modèles',
      pricing: 'Tarifs',
      settings: 'Paramètres',
      
      // Header
      tagline: 'Service client IA qui traite automatiquement jusqu\'à 80% de vos e-mails',
      logout: 'Déconnexion',
      demo: 'Démo',
      
      // Welcome
      welcome: 'Bienvenue chez Servio — votre assistant de service client IA',
      loadDemoData: 'Charger les données de démonstration',
      connectMailbox: 'Connecter la boîte aux lettres',
      
      // Mail interface
      reply: 'Répondre',
      send: 'Envoyer',
      draft: 'Brouillon',
      markAsResolved: 'Marquer comme résolu',
      later: 'Plus tard',
      archive: 'Archiver',
      regenerate: 'Régénérer',
      
      // AI Response types
      business: 'Professionnel',
      empathetic: 'Empathique',
      formal: 'Formel',
      detailed: 'Détaillé',
      
      // Languages
      dutch: 'Néerlandais',
      english: 'Anglais',
      german: 'Allemand',
      french: 'Français',
      spanish: 'Espagnol',
      
      // Categories
      return: 'Retour',
      complaint: 'Plainte',
      invoice: 'Facture',
      question: 'Question',
      technical: 'Technique',
      other: 'Autre',
      
      // Common
      loading: 'Chargement...',
      noEmails: 'Aucun nouvel e-mail.',
      selectEmail: 'Sélectionnez un e-mail pour répondre',
      
      // Footer
      footerText: 'Version de démonstration de Servio. Non destinée à la production.',
      version: 'Version'
    }
  },
  es: {
    translation: {
      // Navigation
      inbox: 'Bandeja de entrada',
      dashboard: 'Panel de control',
      statistics: 'Estadísticas',
      templates: 'Plantillas',
      pricing: 'Precios',
      settings: 'Configuración',
      
      // Header
      tagline: 'Servicio al cliente con IA que maneja automáticamente hasta el 80% de tus correos',
      logout: 'Cerrar sesión',
      demo: 'Demo',
      
      // Welcome
      welcome: 'Bienvenido a Servio — tu asistente de servicio al cliente con IA',
      loadDemoData: 'Cargar datos de demostración',
      connectMailbox: 'Conectar buzón',
      
      // Mail interface
      reply: 'Responder',
      send: 'Enviar',
      draft: 'Borrador',
      markAsResolved: 'Marcar como resuelto',
      later: 'Más tarde',
      archive: 'Archivar',
      regenerate: 'Regenerar',
      
      // AI Response types
      business: 'Profesional',
      empathetic: 'Empático',
      formal: 'Formal',
      detailed: 'Detallado',
      
      // Languages
      dutch: 'Holandés',
      english: 'Inglés',
      german: 'Alemán',
      french: 'Francés',
      spanish: 'Español',
      
      // Categories
      return: 'Devolución',
      complaint: 'Queja',
      invoice: 'Factura',
      question: 'Pregunta',
      technical: 'Técnico',
      other: 'Otro',
      
      // Common
      loading: 'Cargando...',
      noEmails: 'No hay correos nuevos.',
      selectEmail: 'Selecciona un correo para responder',
      
      // Footer
      footerText: 'Versión de demostración de Servio. No para uso en producción.',
      version: 'Versión'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;