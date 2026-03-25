// AI Analysis and Reply Generation
// Uses Lovable AI via edge functions for contextual replies

import { MailItem, AnalysisResult, ReplyGenerationParams, TemplateItem, Category, Urgency, Sentiment } from '@/types';
import { dummyTemplates } from './dummy';
import { sanitizeText, aiInputSchema, checkRateLimit, SecurityError, handleSecurityError } from '@/lib/security';

// ============= STRUCTURED LOGGING =============
export interface AiLog {
  ts: string;
  action: 'analyze' | 'generate' | 'regenerate';
  payloadSize: number;
  lang?: string;
  model?: string;
  durationMs?: number;
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
  mailId?: string;
}

// In-memory log storage
const aiLogs: AiLog[] = [];
const MAX_LOGS = 50;

export const addAiLog = (log: AiLog) => {
  aiLogs.unshift(log);
  if (aiLogs.length > MAX_LOGS) {
    aiLogs.pop();
  }
};

export const getAiLogs = (): AiLog[] => [...aiLogs];

// ============= ERROR TYPES =============
export const AI_ERROR_CODES = {
  TIMEOUT: 'TIMEOUT',
  RATE_LIMIT: 'RATE_LIMIT', 
  BAD_INPUT: 'BAD_INPUT',
  NO_API_KEY: 'NO_API_KEY',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN'
} as const;

export type AiErrorCode = keyof typeof AI_ERROR_CODES;

export class AiError extends Error {
  constructor(
    public code: AiErrorCode,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AiError';
  }
}

// ============= ROBUST REPLY GENERATION =============
export async function safeGenerateReply(params: ReplyGenerationParams): Promise<{
  success: boolean;
  content?: string;
  error?: { code: AiErrorCode; message: string };
  suggestions?: string[];
}> {
  const startTime = Date.now();
  const logData: Partial<AiLog> = {
    ts: new Date().toISOString(),
    action: 'generate',
    payloadSize: (params.mail.body || '').length,
    lang: params.language,
    mailId: params.mail.id,
    model: 'mock-v1'
  };

  try {
    // 1. Input validation
    if (!params.mail.subject?.trim() || !params.mail.body?.trim()) {
      throw new AiError('BAD_INPUT', 'E-mail onderwerp en inhoud zijn vereist');
    }

    // Trim oversized input
    const maxLength = 8000;
    if (params.mail.body.length > maxLength) {
      params.mail.body = params.mail.body.substring(0, maxLength) + '...';
    }

    // 2. Rate limiting
    if (!checkRateLimit(`safe_reply_${params.mail.id}`, 3, 60000)) {
      throw new AiError('RATE_LIMIT', 'Te veel verzoeken. Probeer het over een minuut opnieuw.');
    }

    // 3. Generate reply with timeout and retries
    const result = await retryWithTimeout(
      () => generateReplyInternal(params),
      { timeoutMs: 12000, retries: 2, backoffMs: 500 }
    );

    // 4. Generate 3 variations
    const suggestions = await generateVariations(result, params);

    logData.durationMs = Date.now() - startTime;
    logData.ok = true;
    addAiLog(logData as AiLog);

    return {
      success: true,
      content: result,
      suggestions
    };

  } catch (error) {
    logData.durationMs = Date.now() - startTime;
    logData.ok = false;
    
    let aiError: AiError;
    if (error instanceof AiError) {
      aiError = error;
    } else if (error instanceof SecurityError) {
      aiError = new AiError('RATE_LIMIT', error.message, error);
    } else {
      aiError = new AiError('UNKNOWN', 'Er is een onverwachte fout opgetreden', error);
    }

    logData.errorCode = aiError.code;
    logData.errorMessage = aiError.message;
    addAiLog(logData as AiLog);

    // Generate deterministic mock fallback
    const mockSuggestions = generateDeterministicMockReplies(params);

    return {
      success: false,
      error: {
        code: aiError.code,
        message: getLocalizedErrorMessage(aiError.code, params.language)
      },
      suggestions: mockSuggestions
    };
  }
}

// ============= RETRY WITH TIMEOUT =============
async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  options: { timeoutMs: number; retries: number; backoffMs: number }
): Promise<T> {
  const { timeoutMs, retries, backoffMs } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new AiError('TIMEOUT', 'AI request timeout')), timeoutMs)
        )
      ]);
    } catch (error) {
      if (attempt === retries) throw error;
      
      // Exponential backoff for retries
      const delay = backoffMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new AiError('UNKNOWN', 'All retry attempts failed');
}

// ============= INTERNAL GENERATION =============
async function generateReplyInternal(params: ReplyGenerationParams): Promise<string> {
  // Validate input with Zod
  const validatedInput = aiInputSchema.parse({
    content: params.mail.body,
    tone: mapToneToSchema(params.tone),
    language: params.language || 'NL'
  });

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

  const { mail, analysis, tone, language, template } = params;
  
  let baseTemplate = template?.body || getDefaultTemplate(analysis?.category || 'Overig', language);
  
  // Replace placeholders
  baseTemplate = baseTemplate
    .replace('{{naam}}', extractName(mail.from))
    .replace('{{order_id}}', extractOrderId(mail.body) || 'ORD123456')
    .replace('{{bedrag}}', extractAmount(mail.body) || '50,00')
    .replace('{{reset_link}}', 'https://servio.app/reset?token=abc123')
    .replace('{{invoice_number}}', extractInvoiceNumber(mail.body) || 'INV-2024-001');
  
  // Adjust tone
  const reply = adjustToneOfVoice(baseTemplate, tone, language);
  
  return sanitizeText(reply);
}

// ============= VARIATION GENERATION =============
async function generateVariations(baseReply: string, params: ReplyGenerationParams): Promise<string[]> {
  const variations = [baseReply];
  
  try {
    // Generate empathetic variation
    const empathetic = adjustToneOfVoice(baseReply, 'Empathisch', params.language);
    variations.push(empathetic);
    
    // Generate formal variation
    const formal = adjustToneOfVoice(baseReply, 'Formeel', params.language);
    variations.push(formal);
    
    return variations;
  } catch {
    // Fallback to deterministic variations
    return generateDeterministicMockReplies(params);
  }
}

// ============= DETERMINISTIC MOCK FALLBACK =============
function generateDeterministicMockReplies(params: ReplyGenerationParams): string[] {
  const { mail, analysis, language } = params;
  const customerName = extractName(mail.from);
  
  const templates = getLocalizedTemplates(language);
  const category = analysis?.category || 'Overig';
  
  return [
    templates.business
      .replace('{{naam}}', customerName)
      .replace('{{category}}', getCategoryTranslation(category, language)),
    templates.empathetic
      .replace('{{naam}}', customerName)
      .replace('{{category}}', getCategoryTranslation(category, language)),
    templates.formal
      .replace('{{naam}}', customerName)
      .replace('{{category}}', getCategoryTranslation(category, language))
  ];
}

// ============= LOCALIZATION HELPERS =============
function getLocalizedErrorMessage(code: AiErrorCode, language?: string): string {
  const messages = {
    NL: {
      TIMEOUT: 'De AI deed er te lang over. Probeer opnieuw.',
      RATE_LIMIT: 'Te veel verzoeken. Even wachten en nogmaals proberen.',
      BAD_INPUT: 'Onvolledige e-mail. Voeg onderwerp/tekst toe en probeer opnieuw.',
      NO_API_KEY: 'AI niet beschikbaar. Controleer je configuratie.',
      NETWORK_ERROR: 'Netwerkfout. Controleer je verbinding en probeer opnieuw.',
      UNKNOWN: 'Onverwachte fout. Probeer opnieuw. (Details gelogd)'
    },
    EN: {
      TIMEOUT: 'AI took too long. Try again or use demo response.',
      RATE_LIMIT: 'Too many requests. Please wait and try again.',
      BAD_INPUT: 'Incomplete email. Add subject/content and try again.',
      NO_API_KEY: 'No AI key configured → demo responses activated.',
      NETWORK_ERROR: 'Network error. Check your connection and try again.',
      UNKNOWN: 'Unexpected error. Please try again. (Details logged)'
    }
  };
  
  return messages[language as keyof typeof messages]?.[code] || messages.NL[code];
}

function getLocalizedTemplates(language?: string) {
  const templates = {
    NL: {
      business: 'Beste {{naam}},\n\nDank je voor je bericht betreffende {{category}}. We pakken dit direct voor je op.\n\nMet vriendelijke groet,\nServio Klantenservice',
      empathetic: 'Beste {{naam}},\n\nIk begrijp je situatie en dank je voor je geduld. We helpen je graag verder met {{category}}.\n\nHartelijke groet,\nServio Klantenservice',
      formal: 'Geachte {{naam}},\n\nWij hebben uw verzoek betreffende {{category}} in goede orde ontvangen en zullen dit met de grootst mogelijke zorg behandelen.\n\nHoogachtend,\nServio Klantenservice'
    },
    EN: {
      business: 'Dear {{naam}},\n\nThank you for your message regarding {{category}}. We will handle this immediately.\n\nBest regards,\nServio Customer Service',
      empathetic: 'Dear {{naam}},\n\nI understand your situation and appreciate your patience. We are happy to help you with {{category}}.\n\nKind regards,\nServio Customer Service',
      formal: 'Dear {{naam}},\n\nWe have received your request regarding {{category}} and will handle it with the utmost care.\n\nSincerely,\nServio Customer Service'
    }
  };
  
  return templates[language as keyof typeof templates] || templates.NL;
}

function getCategoryTranslation(category: Category, language?: string): string {
  const translations = {
    NL: {
      'Retour': 'retour',
      'Klacht': 'klacht', 
      'Factuur': 'factuur',
      'Vraag': 'vraag',
      'Technisch': 'technisch probleem',
      'Overig': 'algemene vraag'
    },
    EN: {
      'Retour': 'return',
      'Klacht': 'complaint',
      'Factuur': 'invoice', 
      'Vraag': 'question',
      'Technisch': 'technical issue',
      'Overig': 'general inquiry'
    }
  };
  
  return translations[language as keyof typeof translations]?.[category] || 
         translations.NL[category];
}

function mapToneToSchema(tone?: string): 'professional' | 'friendly' | 'formal' {
  switch (tone) {
    case 'Empathisch': return 'friendly';
    case 'Formeel': return 'formal';
    default: return 'professional';
  }
}

/**
 * Mock function to analyze email content and generate insights
 * TODO: Replace with actual AI analysis using OpenAI/Claude/etc
 */
export async function analyzeEmail(mail: MailItem): Promise<AnalysisResult> {
  try {
    // Rate limiting check
    if (!checkRateLimit(`analyze_${mail.id}`, 5, 60000)) {
      throw new SecurityError('Te veel analyseverzoeken. Probeer het later opnieuw.');
    }

    // Sanitize input
    const sanitizedSubject = sanitizeText(mail.subject);
    const sanitizedBody = sanitizeText(mail.body);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
    // Simple heuristic-based analysis for demo purposes
    const body = sanitizedBody.toLowerCase();
    const subject = sanitizedSubject.toLowerCase();
  
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
  } catch (error) {
    throw new SecurityError(handleSecurityError(error));
  }
}

/**
 * Generate AI-powered reply suggestion
 * TODO: Replace with actual AI generation
 */
export async function generateReply(params: ReplyGenerationParams): Promise<string> {
  try {
    // Validate and sanitize input
    const validatedInput = aiInputSchema.parse({
      content: params.mail.body,
      tone: params.tone || 'professional',
      language: params.language || 'NL'
    });

    // Rate limiting check
    if (!checkRateLimit(`reply_${params.mail.id}`, 3, 60000)) {
      throw new SecurityError('Te veel antwoordverzoeken. Probeer het later opnieuw.');
    }

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
    
    return sanitizeText(reply);
  } catch (error) {
    throw new SecurityError(handleSecurityError(error));
  }
}

/**
 * Regenerate reply with variation
 */
export async function regenerateReply(params: ReplyGenerationParams): Promise<string> {
  try {
    // Add some variation to the reply
    const baseReply = await generateReply(params);
    
    // Simple variation - in real implementation, this would be more sophisticated
    const variations = [
      baseReply,
      baseReply.replace('Dank je', 'Bedankt'),
      baseReply.replace('Met vriendelijke groet', 'Hartelijke groet'),
    ];
    
    return variations[Math.floor(Math.random() * variations.length)];
  } catch (error) {
    throw new SecurityError(handleSecurityError(error));
  }
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