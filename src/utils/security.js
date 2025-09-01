// Security utilities for XSS protection

/**
 * Basic HTML sanitization function
 * Removes potentially dangerous HTML tags and attributes
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs (except for images)
  sanitized = sanitized.replace(/data:(?!image\/)/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove object and embed tags
  sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/(object|embed)>)<[^<]*)*<\/(object|embed)>/gi, '');
  
  // Remove form tags
  sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '');
  
  // Remove input tags
  sanitized = sanitized.replace(/<input\b[^>]*>/gi, '');
  
  // Remove button tags
  sanitized = sanitized.replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '');
  
  // Remove select and textarea tags
  sanitized = sanitized.replace(/<(select|textarea)\b[^<]*(?:(?!<\/(select|textarea)>)<[^<]*)*<\/(select|textarea)>/gi, '');
  
  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove link tags
  sanitized = sanitized.replace(/<link\b[^>]*>/gi, '');
  
  // Remove meta tags
  sanitized = sanitized.replace(/<meta\b[^>]*>/gi, '');
  
  // Remove title tags
  sanitized = sanitized.replace(/<title\b[^<]*(?:(?!<\/title>)<[^<]*)*<\/title>/gi, '');
  
  // Remove head and body tags (keep content)
  sanitized = sanitized.replace(/<\/?(head|body)\b[^>]*>/gi, '');
  
  // Remove html tags (keep content)
  sanitized = sanitized.replace(/<\/?html\b[^>]*>/gi, '');
  
  return sanitized;
};

/**
 * Validate and sanitize user input
 * @param {string} input - User input to validate
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};
