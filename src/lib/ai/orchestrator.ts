// AI Orchestrator - Smart Provider Selection & Fallback Logic

import { LovableAIProvider, FallbackProvider, GenerateRepliesParams, GenerateRepliesResult, AIProvider } from './providers';
import { checkRateLimit } from '@/lib/security';
import { addAiLog, AiLog } from '../ai';

// ============= ERROR CODES =============
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

// ============= ORCHESTRATION FUNCTION =============
export async function generateSmartReplies(params: GenerateRepliesParams): Promise<GenerateRepliesResult> {
  const startTime = Date.now();
  const logData: Partial<AiLog> = {
    ts: new Date().toISOString(),
    action: 'generate',
    payloadSize: (params.mail.body || '').length,
    lang: params.language,
    mailId: params.mail.id
  };

  // Rate limiting check
  const rateLimitKey = `ai_generation_${params.mail.id || Date.now()}`;
  if (!checkRateLimit(rateLimitKey, 10, 60000)) {
    const error = new AiError('RATE_LIMIT', 'Te veel AI verzoeken. Wacht even en probeer opnieuw.');
    logError(logData, error, startTime);
    throw error;
  }

  // Use Lovable AI only — no mock fallback
  const providers: AIProvider[] = [
    new LovableAIProvider(),
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    if (!provider.isAvailable()) continue;

    try {
      console.log(`Attempting generation with ${provider.name}...`);
      
      const result = await withTimeout(
        () => provider.generateReplies(params),
        15000
      );

      logData.durationMs = Date.now() - startTime;
      logData.ok = true;
      logData.model = result.model;
      addAiLog(logData as AiLog);

      return { ...result, success: true };
    } catch (error) {
      console.warn(`Provider ${provider.name} failed:`, error);
      lastError = error as Error;
      
      // No more providers to try
    }
  }

  const aiError = lastError instanceof AiError ? lastError : 
    new AiError('UNKNOWN', 'Alle AI-providers faalden', lastError);
  
  logError(logData, aiError, startTime);
  throw aiError;
}

// ============= TIMEOUT =============
async function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new AiError('TIMEOUT', 'AI request timeout')), ms)
    )
  ]);
}

// ============= LOGGING =============
function logError(logData: Partial<AiLog>, error: AiError, startTime: number) {
  logData.durationMs = Date.now() - startTime;
  logData.ok = false;
  logData.errorCode = error.code;
  logData.errorMessage = error.message;
  addAiLog(logData as AiLog);
}

// ============= ERROR MESSAGE LOCALIZATION =============
export function getLocalizedErrorMessage(code: AiErrorCode, language?: string): string {
  const messages: Record<string, Record<string, string>> = {
    NL: {
      TIMEOUT: 'De AI deed er te lang over. Probeer opnieuw.',
      RATE_LIMIT: 'Te veel verzoeken. Even wachten en opnieuw proberen.',
      BAD_INPUT: 'Onvolledige e-mail data.',
      NO_API_KEY: 'AI niet beschikbaar.',
      NETWORK_ERROR: 'Netwerkfout. Controleer je verbinding.',
      UNKNOWN: 'Onverwachte fout. Probeer opnieuw.'
    },
    EN: {
      TIMEOUT: 'AI took too long. Try again.',
      RATE_LIMIT: 'Too many requests. Please wait.',
      BAD_INPUT: 'Incomplete email data.',
      NO_API_KEY: 'AI not available.',
      NETWORK_ERROR: 'Network error. Check connection.',
      UNKNOWN: 'Unexpected error. Please try again.'
    }
  };
  
  return messages[language as string]?.[code] || messages.NL[code];
}
