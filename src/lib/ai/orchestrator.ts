// AI Orchestrator - Smart Provider Selection & Fallback Logic
// Handles OpenAI → Fallback → Mock progression

import { OpenAIProvider, FallbackProvider, MockProvider, GenerateRepliesParams, GenerateRepliesResult, AIProvider } from './providers';
import { sanitizeText, validateInput, checkRateLimit } from '@/lib/security';
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

  // Input validation
  if (!params.mail.subject?.trim() || !params.mail.body?.trim()) {
    const error = new AiError('BAD_INPUT', 'E-mail onderwerp en inhoud zijn vereist');
    logError(logData, error, startTime);
    throw error;
  }

  // Rate limiting check (50 requests per minute)
  const rateLimitKey = `ai_generation_${params.mail.id || Date.now()}`;
  if (!checkRateLimit(rateLimitKey, 50, 60000)) {
    const error = new AiError(
      'RATE_LIMIT',
      'Te veel AI verzoeken. Wacht even en probeer opnieuw.',
      null
    );
    logError(logData, error, startTime);
    throw error;
  }

  // Initialize providers in order of preference
  const providers = [
    new OpenAIProvider(),
    new FallbackProvider(), 
    new MockProvider()
  ];

  let lastError: Error | null = null;

  // Try each provider in sequence
  for (const provider of providers) {
    if (!provider.isAvailable()) {
      console.log(`Provider ${provider.name} not available, skipping...`);
      continue;
    }

    try {
      console.log(`Attempting generation with ${provider.name}...`);
      
      const result = await withRetry(
        () => provider.generateReplies(params),
        { timeoutMs: 12000, retries: 2, backoffMs: 500 }
      );

      // Success! Log and return
      logData.durationMs = Date.now() - startTime;
      logData.ok = true;
      logData.model = result.model;
      addAiLog(logData as AiLog);

      return {
        ...result,
        success: true
      };

    } catch (error) {
      console.warn(`Provider ${provider.name} failed:`, error);
      lastError = error as Error;
      
      // Continue to next provider unless this is MockProvider (last resort)
      if (provider instanceof MockProvider) {
        break;
      }
    }
  }

  // All providers failed
  const aiError = lastError instanceof AiError ? lastError : 
    new AiError('UNKNOWN', 'Alle AI-providers faalden', lastError);
  
  logError(logData, aiError, startTime);
  throw aiError;
}

// ============= RETRY LOGIC WITH TIMEOUT =============
async function withRetry<T>(
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
      
      // Check if we should retry this error
      if (!shouldRetry(error)) throw error;
      
      // Exponential backoff
      const delay = backoffMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new AiError('UNKNOWN', 'All retry attempts failed');
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof AiError) {
    return error.code === 'TIMEOUT' || error.code === 'RATE_LIMIT' || error.code === 'NETWORK_ERROR';
  }
  
  // Retry on network errors
  if (error instanceof Error) {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('timeout');
  }
  
  return false;
}

// ============= LOGGING HELPERS =============
function logError(logData: Partial<AiLog>, error: AiError, startTime: number) {
  logData.durationMs = Date.now() - startTime;
  logData.ok = false;
  logData.errorCode = error.code;
  logData.errorMessage = error.message;
  addAiLog(logData as AiLog);
}

// ============= ERROR MESSAGE LOCALIZATION =============
export function getLocalizedErrorMessage(code: AiErrorCode, language?: string): string {
  const messages = {
    NL: {
      TIMEOUT: 'De AI deed er te lang over. Probeer opnieuw of gebruik demo-antwoord.',
      RATE_LIMIT: 'Te veel verzoeken. Even wachten en nogmaals proberen.',
      BAD_INPUT: 'Onvolledige e-mail. Voeg onderwerp/tekst toe en probeer opnieuw.',
      NO_API_KEY: 'Geen AI-sleutel geconfigureerd → demo-antwoorden geactiveerd.',
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

// ============= DEMO ERROR SIMULATION =============
export function simulateError(type: AiErrorCode): void {
  // Only available in development
  if (process.env.NODE_ENV !== 'development') return;
  
  const errors = {
    TIMEOUT: () => new AiError('TIMEOUT', 'Simulated timeout error'),
    RATE_LIMIT: () => new AiError('RATE_LIMIT', 'Simulated rate limit error'),
    NO_API_KEY: () => new AiError('NO_API_KEY', 'Simulated missing API key'),
    NETWORK_ERROR: () => new AiError('NETWORK_ERROR', 'Simulated network error'),
    BAD_INPUT: () => new AiError('BAD_INPUT', 'Simulated bad input error'),
    UNKNOWN: () => new AiError('UNKNOWN', 'Simulated unknown error')
  };
  
  throw errors[type]();
}