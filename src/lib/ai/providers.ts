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

// ============= OPENAI PROVIDER (PRIMARY) =============
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private apiKey: string | null = null;

  constructor() {
    // TODO(prod): Read from env/secrets
    this.apiKey = this.getApiKey();
  }

  private getApiKey(): string | null {
    // TODO(prod): Replace with actual env variable
    return process.env.OPENAI_API_KEY || null;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateReplies(params: GenerateRepliesParams): Promise<GenerateRepliesResult> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const { mail, language = 'NL', analysis } = params;

      // Build context-aware prompt
      const prompt = this.buildPrompt(mail, language, analysis);
      
      // Call OpenAI API
      const response = await this.callOpenAI(prompt, language);
      
      // Parse and structure the response into 3 variants
      const variants = this.parseOpenAIResponse(response, mail);

      return {
        variants,
        provider: 'OpenAI',
        model: 'gpt-4',
        success: true
      };

    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw error;
    }
  }

  private buildPrompt(mail: MailItem, language: string, analysis?: AnalysisResult | null): string {
    const customerName = this.extractName(mail.from);
    const category = analysis?.category || 'Algemeen';
    
    const promptTemplates = {
      NL: `Je bent een professionele klantenservice medewerker van Servio. 
Schrijf 3 verschillende antwoorden op deze e-mail:

Van: ${mail.from}
Onderwerp: ${mail.subject}
Inhoud: ${mail.body}

Categorie: ${category}
Klant: ${customerName}

Geef 3 varianten:
1. ZAKELIJK: Kort, direct, professioneel
2. EMPATHISCH: Begrip tonen, menselijk, warm
3. UITGEBREID: Volledige uitleg, stappen, voorwaarden

Format als JSON:
{
  "zakelijk": "...",
  "empathisch": "...", 
  "uitgebreid": "..."
}

Regels:
- Altijd in het ${language}
- Begin met "Beste ${customerName},"
- Eindigen met "Met vriendelijke groet, Servio Klantenservice"
- Concrete acties waar mogelijk
- Geen placeholders zoals {{...}}`,

      EN: `You are a professional customer service representative for Servio.
Write 3 different responses to this email:

From: ${mail.from}
Subject: ${mail.subject}
Content: ${mail.body}

Category: ${category}
Customer: ${customerName}

Provide 3 variants:
1. BUSINESS: Short, direct, professional
2. EMPATHETIC: Show understanding, human, warm
3. DETAILED: Full explanation, steps, conditions

Format as JSON:
{
  "zakelijk": "...",
  "empathetic": "...",
  "detailed": "..."
}

Rules:
- Always in ${language}
- Start with "Dear ${customerName},"
- End with "Best regards, Servio Customer Service"
- Concrete actions where possible
- No placeholders like {{...}}`
    };

    return promptTemplates[language as keyof typeof promptTemplates] || promptTemplates.NL;
  }

  private async callOpenAI(prompt: string, language: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful customer service AI that always responds in valid JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content;

    } finally {
      clearTimeout(timeoutId);
    }
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