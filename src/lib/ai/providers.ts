// AI Provider Architecture for Servio
// Robust multi-provider system with OpenAI primary + fallbacks

import { MailItem, AnalysisResult } from '@/types';
import { sanitizeText, validateInput } from '@/lib/security';

// ============= PROVIDER INTERFACES =============
export interface ReplyVariant {
  type: 'Zakelijk' | 'Empathisch' | 'Uitgebreid';
  label: string;
  content: string;
  icon: string;
}

export interface GenerateRepliesParams {
  mail: MailItem;
  tone?: string;
  language?: string;
  analysis?: AnalysisResult | null;
}

export interface GenerateRepliesResult {
  variants: ReplyVariant[];
  provider: string;
  model: string;
  success: boolean;
  error?: string;
}

export interface AIProvider {
  name: string;
  generateReplies(params: GenerateRepliesParams): Promise<GenerateRepliesResult>;
  isAvailable(): boolean;
}

// ============= OPENAI PROVIDER (DEPRECATED - USE EDGE FUNCTIONS) =============
// SECURITY NOTE: Direct OpenAI API calls from the client are deprecated.
// All AI functionality should go through Supabase Edge Functions (ai-assistant)
// which securely stores the API key as a secret.
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';

  constructor() {
    // No longer accepts or stores API keys client-side for security
    console.warn('OpenAIProvider: Direct API calls are deprecated. Use edge functions instead.');
  }

  isAvailable(): boolean {
    // Always return false - AI calls should go through edge functions
    return false;
  }

  async generateReplies(params: GenerateRepliesParams): Promise<GenerateRepliesResult> {
    // This provider is deprecated - throw error directing to edge functions
    throw new Error('Direct OpenAI API calls are deprecated. Use the ai-assistant edge function instead.');
  }

  private parseOpenAIResponse(response: string, mail: MailItem): ReplyVariant[] {
    try {
      const parsed = JSON.parse(response);
      
      return [
        {
          type: 'Zakelijk',
          label: 'Zakelijk',
          content: sanitizeText(parsed.zakelijk || parsed.business || ''),
          icon: '💼'
        },
        {
          type: 'Empathisch', 
          label: 'Empathisch',
          content: sanitizeText(parsed.empathisch || parsed.empathetic || ''),
          icon: '💝'
        },
        {
          type: 'Uitgebreid',
          label: 'Uitgebreid', 
          content: sanitizeText(parsed.uitgebreid || parsed.detailed || ''),
          icon: '📋'
        }
      ];
    } catch {
      // Fallback if JSON parsing fails
      return this.createFallbackVariants(response, mail);
    }
  }

  private createFallbackVariants(content: string, mail: MailItem): ReplyVariant[] {
    const baseContent = sanitizeText(content);
    const customerName = this.extractName(mail.from);

    return [
      {
        type: 'Zakelijk',
        label: 'Zakelijk',
        content: `Beste ${customerName},\n\n${baseContent}\n\nMet vriendelijke groet,\nServio Klantenservice`,
        icon: '💼'
      },
      {
        type: 'Empathisch',
        label: 'Empathisch', 
        content: `Beste ${customerName},\n\nIk begrijp je situatie. ${baseContent}\n\nHartelijke groet,\nServio Klantenservice`,
        icon: '💝'
      },
      {
        type: 'Uitgebreid',
        label: 'Uitgebreid',
        content: `Geachte ${customerName},\n\n${baseContent}\n\nMocht je nog vragen hebben, neem dan gerust contact met ons op.\n\nHoogachtend,\nServio Klantenservice`,
        icon: '📋'
      }
    ];
  }

  private extractName(from: string): string {
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim() : 'klant';
  }
}

// ============= FALLBACK PROVIDER =============
export class FallbackProvider implements AIProvider {
  name = 'Fallback';

  isAvailable(): boolean {
    // TODO(prod): Check for Claude/Gemini/Mistral API keys
    return false; // For now, always unavailable
  }

  async generateReplies(params: GenerateRepliesParams): Promise<GenerateRepliesResult> {
    // TODO(prod): Implement Claude/Gemini/Mistral calls
    throw new Error('Fallback provider not yet implemented');
  }
}

// ============= MOCK PROVIDER (ALWAYS AVAILABLE) =============
export class MockProvider implements AIProvider {
  name = 'Mock';

  isAvailable(): boolean {
    return true;
  }

  async generateReplies(params: GenerateRepliesParams): Promise<GenerateRepliesResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    const { mail, language = 'NL', analysis } = params;
    const customerName = this.extractName(mail.from);
    const category = analysis?.category || 'Algemeen';

    const templates = this.getLocalizedTemplates(language);
    
    const variants: ReplyVariant[] = [
      {
        type: 'Zakelijk',
        label: 'Zakelijk',
        content: templates.business
          .replace('{{naam}}', customerName)
          .replace('{{category}}', this.getCategoryTranslation(category, language)),
        icon: '💼'
      },
      {
        type: 'Empathisch',
        label: 'Empathisch',
        content: templates.empathetic
          .replace('{{naam}}', customerName)
          .replace('{{category}}', this.getCategoryTranslation(category, language)),
        icon: '💝'
      },
      {
        type: 'Uitgebreid', 
        label: 'Uitgebreid',
        content: templates.detailed
          .replace('{{naam}}', customerName)
          .replace('{{category}}', this.getCategoryTranslation(category, language)),
        icon: '📋'
      }
    ];

    return {
      variants,
      provider: 'Mock',
      model: 'demo-v1',
      success: true
    };
  }

  private extractName(from: string): string {
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim() : 'klant';
  }

  private getLocalizedTemplates(language: string) {
    const templates = {
      NL: {
        business: 'Beste {{naam}},\n\nDank je voor je bericht betreffende {{category}}. We pakken dit direct voor je op.\n\nMet vriendelijke groet,\nServio Klantenservice',
        empathetic: 'Beste {{naam}},\n\nIk begrijp je situatie en dank je voor je geduld. We helpen je graag verder met {{category}}.\n\nHartelijke groet,\nServio Klantenservice',
        detailed: 'Geachte {{naam}},\n\nWij hebben uw verzoek betreffende {{category}} in goede orde ontvangen en zullen dit met de grootst mogelijke zorg behandelen.\n\nWe streven ernaar binnen 24 uur te reageren. Mocht u dringende vragen hebben, dan kunt u contact opnemen via telefoon.\n\nHoogachtend,\nServio Klantenservice'
      },
      EN: {
        business: 'Dear {{naam}},\n\nThank you for your message regarding {{category}}. We will handle this immediately.\n\nBest regards,\nServio Customer Service',
        empathetic: 'Dear {{naam}},\n\nI understand your situation and appreciate your patience. We are happy to help you with {{category}}.\n\nKind regards,\nServio Customer Service',
        detailed: 'Dear {{naam}},\n\nWe have received your request regarding {{category}} and will handle it with the utmost care.\n\nWe aim to respond within 24 hours. If you have urgent questions, please contact us by phone.\n\nSincerely,\nServio Customer Service'
      }
    };
    
    return templates[language as keyof typeof templates] || templates.NL;
  }

  private getCategoryTranslation(category: string, language: string): string {
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
           translations.NL[category] || category.toLowerCase();
  }
}