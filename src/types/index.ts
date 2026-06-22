export type Sentiment = 'Negatief' | 'Neutraal' | 'Positief';
export type Urgency = 'Hoog' | 'Normaal' | 'Laag';
export type Category = 'Retour' | 'Klacht' | 'Factuur' | 'Vraag' | 'Technisch' | 'Overig';
export type Language = 'NL' | 'EN' | 'DE' | 'FR';
export type ToneOfVoice = 'Neutraal' | 'Empathisch' | 'Formeel' | 'Vrolijk';

export interface MailItem {
  id: string;
  from: string;
  fromEmail?: string;
  to: string[];
  subject: string;
  snippet: string;
  body: string;
  bodyHtml?: string;
  bodyText?: string;
  receivedAt: string; // ISO
  unread: boolean;
  labels: string[];
  attachments?: { name: string; url?: string; sizeKB?: number }[];
  aiCategory?: string;
  aiUrgency?: string;
  customerSentiment?: string;
  threadId?: string | null;
}

export interface AnalysisResult {
  summary: string;
  bullets: string[];
  category: Category;
  urgency: Urgency;
  sentiment: Sentiment;
  suggestedTemplateId?: string;
  policyFlags?: { code: string; message: string }[];
  fromCorrection?: boolean;
}

export interface TemplateItem {
  id: string;
  name: string;
  category: Category | 'Algemeen';
  language: Language;
  body: string; // mag placeholders bevatten
  updatedAt: string; // ISO
}

export interface StatsSnapshot {
  date: string;
  totalMails: number;
  avgResponseMins: number;
  autoReplyPct: number; // 0-100
  byCategory: Record<Category, number>;
  sentimentShare: Record<Sentiment, number>;
}

export interface ReplyGenerationParams {
  mail: MailItem;
  analysis?: AnalysisResult;
  tone: ToneOfVoice;
  language: Language;
  template?: TemplateItem;
}

export interface PolicyFlag {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}