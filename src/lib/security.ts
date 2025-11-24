import DOMPurify from 'dompurify';
import { z } from 'zod';

// File upload security
const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
  'msi', 'app', 'deb', 'rpm', 'dmg', 'pkg', 'sh', 'bash', 'ps1'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: 'Geen bestand geselecteerd' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'Bestand is te groot (max 20MB)' };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) {
    return { isValid: false, error: 'Ongeldig bestandstype' };
  }

  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return { isValid: false, error: 'Dit bestandstype is niet toegestaan om veiligheidsredenen' };
  }

  return { isValid: true };
};

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

export const sanitizeFilename = (filename: string): string => {
  // Remove path traversal attempts
  return filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[<>:"|?*]/g, '_')
    .substring(0, 255);
};

// Input validation helper
export const validateInput = (input: string, type: 'text' | 'email' | 'name' | 'password'): { isValid: boolean; sanitized: string } => {
  if (!input || typeof input !== 'string') {
    return { isValid: false, sanitized: '' };
  }

  const sanitized = input.trim().slice(0, 1000);
  
  switch (type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return { 
        isValid: emailRegex.test(sanitized) && sanitized.length <= 254, 
        sanitized 
      };
    
    case 'name':
      return { 
        isValid: sanitized.length >= 2 && sanitized.length <= 50, 
        sanitized 
      };
    
    case 'password':
      return { 
        isValid: sanitized.length >= 8 && sanitized.length <= 128, 
        sanitized 
      };
    
    case 'text':
    default:
      return { 
        isValid: sanitized.length > 0 && sanitized.length <= 1000, 
        sanitized 
      };
  }
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
const rateLimitMap = new Map<string, { count: number; resetTime: number; blocked: boolean; blockUntil?: number }>();

export const checkRateLimit = (
  identifier: string, 
  maxRequests = 50, 
  windowMs = 60000,
  blockDuration = 300000 // 5 minutes block
): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  // Check if blocked
  if (record?.blocked && record.blockUntil) {
    if (now < record.blockUntil) {
      return false; // Still blocked
    }
    // Block expired, reset
    rateLimitMap.delete(identifier);
  }
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { 
      count: 1, 
      resetTime: now + windowMs,
      blocked: false
    });
    return true;
  }
  
  if (record.count >= maxRequests) {
    // Block the identifier
    record.blocked = true;
    record.blockUntil = now + blockDuration;
    return false;
  }
  
  record.count++;
  return true;
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime && (!value.blocked || (value.blockUntil && now > value.blockUntil))) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Cleanup every minute

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