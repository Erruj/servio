// Mock AI Analysis and Reply Generation
// TODO: Replace with actual LLM API calls in production

import { MailItem, AnalysisResult, ReplyGenerationParams, TemplateItem, Category, Urgency, Sentiment } from '@/types';
import { dummyTemplates } from './dummy';

/**
 * Mock function to analyze email content and generate insights
 * TODO: Replace with actual AI analysis using OpenAI/Claude/etc
 */
export async function analyzeEmail(mail: MailItem): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // Simple heuristic-based analysis for demo purposes
  const body = mail.body.toLowerCase();
  const subject = mail.subject.toLowerCase();
  
  let category: Category = 'Overig';
  let urgency: Urgency = 'Normaal';
  let sentiment: Sentiment = 'Neutraal';
  
  // Category detection based on keywords
  if (body.includes('retour') || body.includes('return') || subject.includes('retour')) {
    category = 'Retour';
  } else if (body.includes('klacht') || body.includes('beschadigd') || body.includes('boos') || body.includes('onacceptabel')) {
    category = 'Klacht';
  } else if (body.includes('factuur') || body.includes('invoice') || subject.includes('factuur')) {
    category = 'Factuur';
  } else if (body.includes('wachtwoord') || body.includes('password') || body.includes('inloggen') || body.includes('login')) {
    category = 'Vraag';
  } else if (body.includes('error') || body.includes('bug') || body.includes('website') || body.includes('technisch')) {
    category = 'Technisch';
  }
  
  // Urgency detection
  if (body.includes('urgent') || body.includes('direct') || body.includes('onmiddellijk') || subject.includes('urgent')) {
    urgency = 'Hoog';
  } else if (body.includes('snel') || body.includes('spoedig') || mail.labels.includes('urgent')) {
    urgency = 'Normaal';
  } else {
    urgency = 'Laag';
  }
  
  // Sentiment analysis
  if (body.includes('boos') || body.includes('teleurstellend') || body.includes('onacceptabel') || body.includes('klacht')) {
    sentiment = 'Negatief';
  } else if (body.includes('bedankt') || body.includes('geweldig') || body.includes('tevreden') || body.includes('dank')) {
    sentiment = 'Positief';
  }
  
  // Find suggested template
  const suggestedTemplate = dummyTemplates.find(t => t.category === category);
  
  // Generate summary and bullets
  const summary = generateSummary(mail, category);
  const bullets = generateBullets(mail, category);
  
  // Policy flags
  const policyFlags = checkPolicyFlags(mail, category);
  
  return {
    summary,
    bullets,
    category,
    urgency,
    sentiment,
    suggestedTemplateId: suggestedTemplate?.id,
    policyFlags
  };
}

/**
 * Generate AI-powered reply suggestion
 * TODO: Replace with actual AI generation
 */
export async function generateReply(params: ReplyGenerationParams): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
  
  const { mail, analysis, tone, language, template } = params;
  
  let baseTemplate = template?.body || getDefaultTemplate(analysis?.category || 'Overig', language);
  
  // Replace placeholders
  baseTemplate = baseTemplate
    .replace('{{naam}}', extractName(mail.from))
    .replace('{{order_id}}', extractOrderId(mail.body) || 'ORD123456')
    .replace('{{bedrag}}', extractAmount(mail.body) || '50,00')
    .replace('{{reset_link}}', 'https://example.com/reset?token=abc123')
    .replace('{{invoice_number}}', extractInvoiceNumber(mail.body) || 'INV-2024-001');
  
  // Adjust tone
  let reply = adjustToneOfVoice(baseTemplate, tone, language);
  
  return reply;
}

/**
 * Regenerate reply with variation
 */
export async function regenerateReply(params: ReplyGenerationParams): Promise<string> {
  // Add some variation to the reply
  const baseReply = await generateReply(params);
  
  // Simple variation - in real implementation, this would be more sophisticated
  const variations = [
    baseReply,
    baseReply.replace('Dank je', 'Bedankt'),
    baseReply.replace('Met vriendelijke groet', 'Hartelijke groet'),
  ];
  
  return variations[Math.floor(Math.random() * variations.length)];
}

/**
 * Detect if email matches common FAQ patterns
 */
export function detectFaq(mail: MailItem): string | null {
  const body = mail.body.toLowerCase();
  const subject = mail.subject.toLowerCase();
  
  if (body.includes('wachtwoord') || subject.includes('wachtwoord')) {
    return 'PASSWORD_RESET';
  }
  
  if (body.includes('verzending') || body.includes('wanneer') || subject.includes('verzending')) {
    return 'SHIPPING_STATUS';
  }
  
  if (body.includes('retour') || subject.includes('retour')) {
    return 'RETURN_POLICY';
  }
  
  return null;
}

// Helper functions

function generateSummary(mail: MailItem, category: Category): string {
  const summaries: Record<Category, string> = {
    'Retour': `Klant wil ${extractOrderId(mail.body) || 'een artikel'} retourneren`,
    'Klacht': 'Klant uit onvrede over service/product',
    'Factuur': `Verzoek om ${extractInvoiceNumber(mail.body) || 'factuur'} opnieuw te versturen`,
    'Vraag': 'Klant heeft een vraag over account/service',
    'Technisch': 'Technisch probleem gemeld door klant',
    'Overig': 'Algemene klantenservice vraag'
  };
  
  return summaries[category];
}

function generateBullets(mail: MailItem, category: Category): string[] {
  // Simple bullet generation based on content
  const bullets = [];
  
  if (mail.body.includes('bestelling') || mail.body.includes('order')) {
    bullets.push('Betreft een bestelling');
  }
  
  if (mail.body.includes('€') || mail.body.includes('geld') || mail.body.includes('betaling')) {
    bullets.push('Financiële component aanwezig');
  }
  
  if (mail.attachments && mail.attachments.length > 0) {
    bullets.push(`${mail.attachments.length} bijlage(n) toegevoegd`);
  }
  
  if (mail.body.length > 200) {
    bullets.push('Uitgebreide beschrijving gegeven');
  }
  
  return bullets.length > 0 ? bullets : ['Standaard klantenservice verzoek'];
}

function checkPolicyFlags(mail: MailItem, category: Category) {
  const flags = [];
  
  // Check for high-value refunds
  const amount = extractAmount(mail.body);
  if (amount && parseFloat(amount.replace(',', '.')) > 100) {
    flags.push({
      code: 'REFUND_OVER_100',
      message: 'Refund > €100 vereist supervisor goedkeuring'
    });
  }
  
  // Check for repeated contact
  if (mail.subject.includes('3e keer') || mail.body.includes('al eerder')) {
    flags.push({
      code: 'REPEATED_CONTACT',
      message: 'Klant heeft al eerder contact opgenomen'
    });
  }
  
  return flags;
}

function extractName(email: string): string {
  // Simple name extraction from email
  const name = email.split('@')[0];
  return name.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function extractOrderId(text: string): string | null {
  const orderMatch = text.match(/#?(\d{4,6})/);
  return orderMatch ? orderMatch[1] : null;
}

function extractAmount(text: string): string | null {
  const amountMatch = text.match(/€(\d+[,.]?\d*)/);
  return amountMatch ? amountMatch[1] : null;
}

function extractInvoiceNumber(text: string): string | null {
  const invoiceMatch = text.match(/#(\d+)/);
  return invoiceMatch ? `INV-${invoiceMatch[1]}` : null;
}

function getDefaultTemplate(category: Category, language: string): string {
  // Return a basic template based on category and language
  const templates = {
    'NL': {
      'Retour': 'Beste {{naam}},\n\nDank je voor je bericht. We helpen je graag met je retour.\n\nMet vriendelijke groet,\nKlantenservice',
      'default': 'Beste {{naam}},\n\nDank je voor je bericht. We nemen contact met je op.\n\nMet vriendelijke groet,\nKlantenservice'
    },
    'EN': {
      'default': 'Dear {{naam}},\n\nThank you for your message. We will get back to you soon.\n\nBest regards,\nCustomer Service'
    }
  };
  
  return templates[language as keyof typeof templates]?.[category] || 
         templates[language as keyof typeof templates]?.['default'] || 
         templates['NL']['default'];
}

function adjustToneOfVoice(text: string, tone: string, language: string): string {
  // Simple tone adjustments - in production this would be more sophisticated
  switch (tone) {
    case 'Empathisch':
      return text.replace('Dank je', 'Ik begrijp je situatie en dank je');
    case 'Formeel':
      return text.replace('je', 'u').replace('Dank je', 'Dank u');
    case 'Vrolijk':
      return text.replace('Met vriendelijke groet', 'Met vriendelijke groet en een glimlach');
    default:
      return text;
  }
}