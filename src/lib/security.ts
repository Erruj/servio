import DOMPurify from 'dompurify';
import { z } from 'zod';

// Input sanitization
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: []
  });
};

export const sanitizeText = (text: string): string => {
  return text.replace(/[<>"/&']/g, (char) => {
    switch (char) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case '/': return '&#x2F;';
      case '&': return '&amp;';
      case "'": return '&#x27;';
      default: return char;
    }
  });
};

// Validation schemas
export const emailSchema = z.string().email().max(254);

export const searchQuerySchema = z.string().max(100).regex(/^[a-zA-Z0-9\s\-_.@]+$/);

export const templateSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_]+$/),
  category: z.enum(['Retour', 'Klacht', 'Factuur', 'Vraag']),
  language: z.enum(['NL', 'EN', 'FR', 'DE']),
  body: z.string().min(1).max(5000)
});

export const aiInputSchema = z.object({
  content: z.string().max(10000),
  tone: z.enum(['professional', 'friendly', 'formal']),
  language: z.enum(['NL', 'EN', 'FR', 'DE'])
});

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (identifier: string, maxRequests = 50, windowMs = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Error handling
export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export const handleSecurityError = (error: unknown): string => {
  if (error instanceof SecurityError) {
    return error.message;
  }
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return 'Een beveiligingsfout is opgetreden. Probeer het opnieuw.';
  }
  
  return error instanceof Error ? error.message : 'Onbekende fout';
};