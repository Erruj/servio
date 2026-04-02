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
      
      // Administration
      administration: 'Administration',
      financialOverview: 'Financial Overview',
      financialOverviewDescription: 'View your financial situation at a glance',
      aiAssistant: 'AI Accounting Assistant',
      aiAssistantDescription: 'Ask questions about your finances',
      aiAssistantWelcome: 'Welcome! Ask me a question about your finances.',
      aiAssistantError: 'Error processing your question',
      invoices: 'Invoices',
      invoicesDescription: 'Manage all your invoices in one place',
      receipts: 'Receipts',
      receiptsDescription: 'Upload and manage your receipts',
      documents: 'Documents',
      documentsDescription: 'Contracts, offers and other documents',
      exports: 'Exports',
      exportsDescription: 'Export your financial data',
      customers: 'Customers',
      customersDescription: 'Manage your customers and contacts',
      quotes: 'Quotes',
      quotesDescription: 'Create and manage quotes',
      timeTracking: 'Time Tracking',
      timeTrackingDescription: 'Track and manage your working hours',
      
      // Financial terms
      totalIncome: 'Total Income',
      totalExpenses: 'Total Expenses',
      profit: 'Profit',
      income: 'Income',
      expenses: 'Expenses',
      thisMonth: 'This Month',
      thisQuarter: 'This Quarter',
      thisYear: 'This Year',
      profitMargin: 'Profit Margin',
      vatToReserve: 'VAT to Reserve',
      excellent: 'Excellent',
      healthy: 'Healthy',
      attention: 'Attention',
      vsLastPeriod: 'vs last period',
      benchmark: 'Benchmark',
      aiInsights: 'AI Insights',
      quarterlyTrends: 'Quarterly Trends',
      monthlyProfit: 'Monthly Profit',
      netResult: 'Net Result',
      expenseDistribution: 'Expense Distribution',
      allTime: 'All Time',
      last6Months: 'Last 6 Months',
      monthlyTrend: 'Monthly Trend',
      topExpenseCategories: 'Top Expense Categories',
      aiFinancialInsight: 'AI Financial Insight',
      aiFinancialSummary: 'You have a healthy profit margin of 43% this month. Expenses are stable, with the largest costs in software and marketing.',
      
      // AI Assistant
      conversation: 'Conversation',
      askQuestion: 'Ask a question...',
      thinking: 'Thinking...',
      aiSuggestion1: 'How much did I spend on software this month?',
      aiSuggestion2: 'What was my revenue for the past quarter?',
      aiSuggestion3: 'Which suppliers cost me the most?',
      aiSuggestion4: 'How much VAT should I set aside?',
      
      // Exports
      period: 'Period',
      selectPeriod: 'Select a period',
      format: 'Format',
      selectFormat: 'Select a format',
      exportData: 'Export Data',
      selectDataToExport: 'Select which data to export',
      transactions: 'Transactions',
      exportSuccess: 'Export created successfully',
      exportError: 'Error exporting data',
      
      // Automations
      automations: 'Automations',
      automationsDescription: 'Configure automatic functions',
      autoCategorize: 'Automatic Categorization',
      autoCategorizeDesc: 'Automatically categorize new transactions',
      autoVatCalculation: 'Automatic VAT Calculation',
      autoVatCalculationDesc: 'Calculate VAT automatically in reports',
      monthlySummary: 'Monthly Summary',
      monthlySummaryDesc: 'Receive a financial summary every month',
      tagSuggestions: 'Tag Suggestions',
      tagSuggestionsDesc: 'AI suggests tags for transactions',
      
      // Invoice management
      allInvoices: 'All Invoices',
      manageYourInvoices: 'Manage and analyze your invoices',
      uploadInvoice: 'Upload Invoice',
      uploading: 'Uploading...',
      searchInvoices: 'Search invoices...',
      noInvoices: 'No invoices yet',
      invoiceNumber: 'Invoice Number',
      supplier: 'Supplier',
      date: 'Date',
      amount: 'Amount',
      category: 'Category',
      status: 'Status',
      actions: 'Actions',
      unknown: 'Unknown',
      
      // Receipt management
      allReceipts: 'All Receipts',
      manageYourReceipts: 'Manage and categorize your receipts',
      uploadReceipt: 'Upload Receipt',
      noReceipts: 'No receipts yet',
      uploadReceiptsToStart: 'Upload receipts to get started',
      unknownMerchant: 'Unknown merchant',
      
      // Document management
      allDocuments: 'All Documents',
      manageYourDocuments: 'Manage and analyze your documents',
      uploadDocument: 'Upload Document',
      searchDocuments: 'Search documents...',
      noDocuments: 'No documents yet',
      contracts: 'Contracts',
      offers: 'Offers',
      other: 'Other',
      all: 'All',
      analysisInProgress: 'Analysis in progress',
      onlyPdfAllowed: 'Only PDF files are allowed',
      
      // Team Management
      teamManagement: 'Team Management',
      teamManagementDescription: 'Manage team members and their roles',
      inviteTeamMember: 'Invite Team Member',
      inviteTeamMemberDescription: 'Send an invitation to a new team member',
      sendInvitation: 'Send Invitation',
      invitationSent: 'Invitation sent',
      teamMembers: 'Team Members',
      manageExistingTeamMembers: 'Manage existing team members and their roles',
      noTeamMembers: 'No team members yet',
      roleUpdated: 'Role updated',
      memberRemoved: 'Team member removed',
      removeTeamMember: 'Remove Team Member',
      removeTeamMemberConfirm: 'Are you sure you want to remove this team member? This action cannot be undone.',
      pleaseEnterEmail: 'Please enter an email address',
      owner: 'Owner',
      admin: 'Admin',
      agent: 'Support Agent',
      finance: 'Finance',
      viewer: 'Viewer',
      role: 'Role',
      
      // Header
      tagline: 'AI customer service that automatically handles up to 80% of your emails',
      logout: 'Logout',
      
      // Welcome
      welcome: 'Welcome to Servio — your AI customer service assistant',
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
      usingFallbackReplies: 'Using Fallback Replies',
      fallbackRepliesActivated: 'Fallback responses have been activated',
      unexpectedError: 'An unexpected error occurred',
      tryAgain: 'Try Again',
      useFallbackReply: 'Use Fallback Reply',
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
      
      // Common
      loading: 'Loading...',
      noEmails: 'No new emails.',
      selectEmail: 'Select an email to reply',
      success: 'Success',
      invalidFileType: 'Invalid file type',
      fileTooLarge: 'File is too large',
      invoiceUploaded: 'Invoice uploaded successfully',
      receiptUploaded: 'Receipt uploaded successfully',
      documentUploaded: 'Document uploaded successfully',
      errorLoadingInvoices: 'Error loading invoices',
      errorLoadingReceipts: 'Error loading receipts',
      errorLoadingDocuments: 'Error loading documents',
      errorUploadingInvoice: 'Error uploading invoice',
      errorUploadingReceipt: 'Error uploading receipt',
      errorUploadingDocument: 'Error uploading document',
      
      // Footer
      footerText: '© Servio. All rights reserved.',
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
      pricing: 'Prijzen',
      settings: 'Instellingen',
      
      // Administration
      administration: 'Administratie',
      financialOverview: 'Financieel Overzicht',
      financialOverviewDescription: 'Bekijk je financiële situatie in één oogopslag',
      aiAssistant: 'AI Boekhoudassistent',
      aiAssistantDescription: 'Stel vragen over je financiën',
      aiAssistantWelcome: 'Welkom! Stel me een vraag over je financiën.',
      aiAssistantError: 'Fout bij het verwerken van je vraag',
      invoices: 'Facturen',
      invoicesDescription: 'Beheer al je facturen op één plek',
      receipts: 'Bonnetjes',
      receiptsDescription: 'Upload en beheer je bonnetjes',
      documents: 'Documenten',
      documentsDescription: 'Contracten, offertes en andere documenten',
      exports: 'Exports',
      exportsDescription: 'Exporteer je financiële gegevens',
      customers: 'Klanten',
      customersDescription: 'Beheer je klanten en relaties',
      quotes: 'Offertes',
      quotesDescription: 'Maak en beheer je offertes',
      timeTracking: 'Urenregistratie',
      timeTrackingDescription: 'Registreer en beheer je werkuren',
      
      // Financial terms
      totalIncome: 'Totale Inkomsten',
      totalExpenses: 'Totale Uitgaven',
      profit: 'Winst',
      income: 'Inkomsten',
      expenses: 'Uitgaven',
      thisMonth: 'Deze maand',
      thisQuarter: 'Dit kwartaal',
      thisYear: 'Dit jaar',
      profitMargin: 'Winstmarge',
      vatToReserve: 'BTW te reserveren',
      excellent: 'Uitstekend',
      healthy: 'Gezond',
      attention: 'Let op',
      vsLastPeriod: 'vs vorige periode',
      benchmark: 'Benchmark',
      aiInsights: 'AI Inzichten',
      quarterlyTrends: 'Kwartaaltrends',
      monthlyProfit: 'Maandelijkse Winst',
      netResult: 'Netto Resultaat',
      expenseDistribution: 'Kostenverdeling',
      allTime: 'Alle tijd',
      last6Months: 'Laatste 6 maanden',
      monthlyTrend: 'Maandelijkse Trend',
      topExpenseCategories: 'Top Uitgavencategorieën',
      aiFinancialInsight: 'AI Financieel Inzicht',
      aiFinancialSummary: 'Je hebt deze maand een gezonde winstmarge van 43%. Uitgaven zijn stabiel, met de grootste kosten in software en marketing.',
      
      // AI Assistant
      conversation: 'Gesprek',
      askQuestion: 'Stel een vraag...',
      thinking: 'Aan het denken...',
      aiSuggestion1: 'Hoeveel heb ik deze maand uitgegeven aan software?',
      aiSuggestion2: 'Wat is mijn omzet van het afgelopen kwartaal?',
      aiSuggestion3: 'Welke leveranciers kosten mij het meest?',
      aiSuggestion4: 'Hoeveel btw moet ik ongeveer reserveren?',
      
      // Exports
      period: 'Periode',
      selectPeriod: 'Selecteer een periode',
      format: 'Formaat',
      selectFormat: 'Selecteer een formaat',
      exportData: 'Exporteer Gegevens',
      selectDataToExport: 'Selecteer welke gegevens je wilt exporteren',
      transactions: 'Transacties',
      exportSuccess: 'Export succesvol gemaakt',
      exportError: 'Fout bij exporteren',
      
      // Automations
      automations: 'Automatiseringen',
      automationsDescription: 'Configureer automatische functies',
      autoCategorize: 'Automatische Categorisatie',
      autoCategorizeDesc: 'Categoriseer nieuwe transacties automatisch',
      autoVatCalculation: 'Automatische BTW Berekening',
      autoVatCalculationDesc: 'Bereken BTW automatisch bij overzichten',
      monthlySummary: 'Maandelijkse Samenvatting',
      monthlySummaryDesc: 'Ontvang elke maand een financiële samenvatting',
      tagSuggestions: 'Tag Suggesties',
      tagSuggestionsDesc: 'AI stelt tags voor bij transacties',
      
      // Invoice management
      allInvoices: 'Alle Facturen',
      manageYourInvoices: 'Beheer en analyseer je facturen',
      uploadInvoice: 'Factuur Uploaden',
      uploading: 'Uploaden...',
      searchInvoices: 'Zoek facturen...',
      noInvoices: 'Nog geen facturen',
      invoiceNumber: 'Factuurnummer',
      supplier: 'Leverancier',
      date: 'Datum',
      amount: 'Bedrag',
      category: 'Categorie',
      status: 'Status',
      actions: 'Acties',
      unknown: 'Onbekend',
      
      // Receipt management
      allReceipts: 'Alle Bonnetjes',
      manageYourReceipts: 'Beheer en categoriseer je bonnetjes',
      uploadReceipt: 'Bonnetje Uploaden',
      noReceipts: 'Nog geen bonnetjes',
      uploadReceiptsToStart: 'Upload bonnetjes om te beginnen',
      unknownMerchant: 'Onbekende winkel',
      
      // Document management
      allDocuments: 'Alle Documenten',
      manageYourDocuments: 'Beheer en analyseer je documenten',
      uploadDocument: 'Document Uploaden',
      searchDocuments: 'Zoek documenten...',
      noDocuments: 'Nog geen documenten',
      contracts: 'Contracten',
      offers: 'Offertes',
      other: 'Overig',
      all: 'Alles',
      analysisInProgress: 'Analyse in behandeling',
      onlyPdfAllowed: 'Alleen PDF bestanden zijn toegestaan',
      
      // Team Management
      teamManagement: 'Teambeheer',
      teamManagementDescription: 'Beheer teamleden en hun rollen',
      inviteTeamMember: 'Teamlid Uitnodigen',
      inviteTeamMemberDescription: 'Verstuur een uitnodiging naar een nieuw teamlid',
      sendInvitation: 'Uitnodiging Versturen',
      invitationSent: 'Uitnodiging verstuurd',
      teamMembers: 'Teamleden',
      manageExistingTeamMembers: 'Beheer bestaande teamleden en hun rollen',
      noTeamMembers: 'Nog geen teamleden',
      roleUpdated: 'Rol bijgewerkt',
      memberRemoved: 'Teamlid verwijderd',
      removeTeamMember: 'Teamlid Verwijderen',
      removeTeamMemberConfirm: 'Weet je zeker dat je dit teamlid wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
      pleaseEnterEmail: 'Voer een e-mailadres in',
      owner: 'Eigenaar',
      admin: 'Beheerder',
      agent: 'Support Agent',
      finance: 'Financieel',
      viewer: 'Kijker',
      role: 'Rol',
      
      // Header
      tagline: 'AI-klantenservice die tot 80% van je mails automatisch afhandelt',
      logout: 'Uitloggen',
      
      // Welcome
      welcome: 'Welkom bij Servio — jouw AI-klantenservice-assistent',
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
      usingFallbackReplies: 'Fallback Antwoorden',
      fallbackRepliesActivated: 'Fallback antwoorden zijn geactiveerd',
      unexpectedError: 'Er is een onverwachte fout opgetreden',
      tryAgain: 'Opnieuw Proberen',
      useFallbackReply: 'Fallback Antwoord Gebruiken',
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
      
      // Common
      loading: 'Laden...',
      noEmails: 'Geen nieuwe mails.',
      selectEmail: 'Selecteer een email om te antwoorden',
      success: 'Succes',
      invalidFileType: 'Ongeldig bestandstype',
      fileTooLarge: 'Bestand is te groot',
      invoiceUploaded: 'Factuur succesvol geüpload',
      receiptUploaded: 'Bonnetje succesvol geüpload',
      documentUploaded: 'Document succesvol geüpload',
      errorLoadingInvoices: 'Fout bij laden van facturen',
      errorLoadingReceipts: 'Fout bij laden van bonnetjes',
      errorLoadingDocuments: 'Fout bij laden van documenten',
      errorUploadingInvoice: 'Fout bij uploaden van factuur',
      errorUploadingReceipt: 'Fout bij uploaden van bonnetje',
      errorUploadingDocument: 'Fout bij uploaden van document',
      
      // Footer
      footerText: '© Servio. Alle rechten voorbehouden.',
      version: 'Versie'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'nl',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
