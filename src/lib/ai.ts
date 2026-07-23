// AI Analysis
// The reply-generation flow lives in src/lib/ai/orchestrator.ts (generateSmartReplies),
// which calls the Supabase `generate-reply` edge function (Gemini). This file only
// exposes the email-analysis wrapper and the shared in-memory AI log.

import { MailItem, AnalysisResult, Category, Urgency, Sentiment } from '@/types';
import { sanitizeText, checkRateLimit, SecurityError, handleSecurityError } from '@/lib/security';

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

const aiLogs: AiLog[] = [];
const MAX_LOGS = 50;

export const addAiLog = (log: AiLog) => {
  aiLogs.unshift(log);
  if (aiLogs.length > MAX_LOGS) {
    aiLogs.pop();
  }
};

export const getAiLogs = (): AiLog[] => [...aiLogs];

// ============= EMAIL ANALYSIS =============
export async function analyzeEmail(mail: MailItem): Promise<AnalysisResult> {
  try {
    if (!checkRateLimit(`analyze_${mail.id}`, 5, 60000)) {
      throw new SecurityError('Te veel analyseverzoeken. Probeer het later opnieuw.');
    }

    // Try real AI analysis via edge function
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: session } = await supabase.auth.getSession();

      if (session.session && mail.id) {
        const { data, error } = await supabase.functions.invoke('analyze-email', {
          body: { emailId: mail.id },
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });

        if (!error && data?.success && data?.analysis) {
          const ai = data.analysis;
          let sentiment = ai.sentiment || 'Neutraal';
          if (sentiment === 'Ontevreden') sentiment = 'Negatief';
          return {
            summary: ai.summary || 'Geen samenvatting beschikbaar',
            bullets: ai.bullets || ['E-mail ontvangen'],
            category: ai.category || 'Overig',
            urgency: ai.urgency || 'Normaal',
            sentiment,
            policyFlags: ai.policyFlags || [],
            fromCorrection: !!ai.fromCorrection,
          };
        }
        console.warn('AI analysis failed, falling back to heuristics:', error || data?.error);
      }
    } catch (aiError) {
      console.warn('AI analysis unavailable, using heuristics:', aiError);
    }

    // Fallback: heuristic-based analysis
    const body = sanitizeText(mail.body).toLowerCase();
    const subject = sanitizeText(mail.subject).toLowerCase();

    let category: Category = 'Overig';
    let urgency: Urgency = 'Normaal';
    let sentiment: Sentiment = 'Neutraal';

    if (body.includes('retour') || body.includes('return') || subject.includes('retour')) {
      category = 'Retour';
    } else if (body.includes('klacht') || body.includes('beschadigd') || body.includes('boos') || body.includes('onacceptabel')) {
      category = 'Klacht';
    } else if (body.includes('factuur') || body.includes('invoice') || subject.includes('factuur')) {
      category = 'Factuur';
    } else if (body.includes('?') || body.includes('wat') || body.includes('hoe') || body.includes('wanneer') || body.includes('kosten') || body.includes('prijs') || body.includes('vraag') || body.includes('wachtwoord') || body.includes('informatie')) {
      category = 'Vraag';
    } else if (body.includes('error') || body.includes('bug') || body.includes('technisch')) {
      category = 'Technisch';
    }

    if (body.includes('urgent') || body.includes('direct') || body.includes('onmiddellijk')) {
      urgency = 'Hoog';
    } else if (body.includes('snel') || body.includes('spoedig')) {
      urgency = 'Normaal';
    } else {
      urgency = 'Laag';
    }

    if (body.includes('boos') || body.includes('teleurstellend') || body.includes('onacceptabel')) {
      sentiment = 'Negatief';
    } else if (body.includes('bedankt') || body.includes('geweldig') || body.includes('tevreden')) {
      sentiment = 'Positief';
    }

    return {
      summary: generateSummary(mail, category),
      bullets: generateBullets(mail, category),
      category,
      urgency,
      sentiment,
      policyFlags: checkPolicyFlags(mail),
    };
  } catch (error) {
    throw new SecurityError(handleSecurityError(error));
  }
}

// ============= HEURISTIC HELPERS (fallback path only) =============
function generateSummary(mail: MailItem, category: Category): string {
  const summaries: Record<Category, string> = {
    Retour: `Klant wil ${extractOrderId(mail.body) || 'een artikel'} retourneren`,
    Klacht: 'Klant uit onvrede over service/product',
    Factuur: `Verzoek om ${extractInvoiceNumber(mail.body) || 'factuur'} opnieuw te versturen`,
    Vraag: 'Klant heeft een vraag over account/service',
    Technisch: 'Technisch probleem gemeld door klant',
    Overig: 'Algemene klantenservice vraag',
  };
  return summaries[category];
}

function generateBullets(mail: MailItem, _category: Category): string[] {
  const bullets: string[] = [];
  if (mail.body.includes('bestelling') || mail.body.includes('order')) bullets.push('Betreft een bestelling');
  if (mail.body.includes('€') || mail.body.includes('geld') || mail.body.includes('betaling')) bullets.push('Financiële component aanwezig');
  if (mail.attachments && mail.attachments.length > 0) bullets.push(`${mail.attachments.length} bijlage(n) toegevoegd`);
  if (mail.body.length > 200) bullets.push('Uitgebreide beschrijving gegeven');
  return bullets.length > 0 ? bullets : ['Standaard klantenservice verzoek'];
}

function checkPolicyFlags(mail: MailItem) {
  const flags: { code: string; message: string }[] = [];
  const amount = extractAmount(mail.body);
  if (amount && parseFloat(amount.replace(',', '.')) > 100) {
    flags.push({ code: 'REFUND_OVER_100', message: 'Refund > €100 vereist supervisor goedkeuring' });
  }
  if (mail.subject.includes('3e keer') || mail.body.includes('al eerder')) {
    flags.push({ code: 'REPEATED_CONTACT', message: 'Klant heeft al eerder contact opgenomen' });
  }
  return flags;
}

function extractOrderId(text: string): string | null {
  const m = text.match(/#?(\d{4,6})/);
  return m ? m[1] : null;
}
function extractAmount(text: string): string | null {
  const m = text.match(/€(\d+[,.]?\d*)/);
  return m ? m[1] : null;
}
function extractInvoiceNumber(text: string): string | null {
  const m = text.match(/#(\d+)/);
  return m ? `INV-${m[1]}` : null;
}
