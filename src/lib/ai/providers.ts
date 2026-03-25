// AI Provider Architecture for Servio
// Uses Lovable AI via edge function for contextual replies

import { MailItem, AnalysisResult } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeText } from '@/lib/security';

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

// ============= LOVABLE AI PROVIDER (via Edge Function) =============
export class LovableAIProvider implements AIProvider {
  name = 'Lovable AI';

  isAvailable(): boolean {
    return true; // Always available via edge function
  }

  async generateReplies(params: GenerateRepliesParams): Promise<GenerateRepliesResult> {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('generate-reply', {
      body: {
        emailId: params.mail.id,
        tone: params.tone,
        language: params.language,
      },
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return {
      variants: data.variants || [],
      provider: data.provider || 'Lovable AI',
      model: data.model || 'gemini-3-flash',
      success: true,
    };
  }
}

// ============= OPENAI PROVIDER (DEPRECATED) =============
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  isAvailable(): boolean { return false; }
  async generateReplies(): Promise<GenerateRepliesResult> {
    throw new Error('Deprecated. Use LovableAIProvider.');
  }
}

// ============= FALLBACK PROVIDER =============
export class FallbackProvider implements AIProvider {
  name = 'Fallback';
  isAvailable(): boolean { return false; }
  async generateReplies(): Promise<GenerateRepliesResult> {
    throw new Error('Not implemented');
  }
}

// ============= MOCK PROVIDER (FALLBACK) =============
export class MockProvider implements AIProvider {
  name = 'Mock';

  isAvailable(): boolean {
    return true;
  }

  async generateReplies(params: GenerateRepliesParams): Promise<GenerateRepliesResult> {
    await new Promise(resolve => setTimeout(resolve, 800));

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
          .replace('{{category}}', category.toLowerCase()),
        icon: '💼'
      },
      {
        type: 'Empathisch',
        label: 'Empathisch',
        content: templates.empathetic
          .replace('{{naam}}', customerName)
          .replace('{{category}}', category.toLowerCase()),
        icon: '💝'
      },
      {
        type: 'Uitgebreid',
        label: 'Uitgebreid',
        content: templates.detailed
          .replace('{{naam}}', customerName)
          .replace('{{category}}', category.toLowerCase()),
        icon: '📋'
      }
    ];

    return { variants, provider: 'Mock', model: 'fallback-v1', success: true };
  }

  private extractName(from: string): string {
    const match = from.match(/^([^<]+)/);
    return match ? match[1].trim() : 'klant';
  }

  private getLocalizedTemplates(language: string) {
    if (language === 'EN') {
      return {
        business: 'Dear {{naam}},\n\nThank you for your message regarding {{category}}. We will handle this immediately.\n\nBest regards',
        empathetic: 'Dear {{naam}},\n\nI understand your situation. We are happy to help you with {{category}}.\n\nKind regards',
        detailed: 'Dear {{naam}},\n\nWe have received your request regarding {{category}} and will handle it with care.\n\nSincerely'
      };
    }
    return {
      business: 'Beste {{naam}},\n\nBedankt voor je bericht over {{category}}. We pakken dit direct op.\n\nMet vriendelijke groet',
      empathetic: 'Beste {{naam}},\n\nIk begrijp je situatie. We helpen je graag verder met {{category}}.\n\nHartelijke groet',
      detailed: 'Geachte {{naam}},\n\nWij hebben uw verzoek over {{category}} ontvangen en behandelen dit zorgvuldig.\n\nHoogachtend'
    };
  }
}
