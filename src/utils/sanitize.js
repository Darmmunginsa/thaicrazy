import DOMPurify from 'dompurify'

const SPAM_PATTERNS = [/free money/i, /casino bonus/i, /bit\.ly/i, /(.)\1{12,}/]

export function sanitizeText(value = '') {
  return DOMPurify.sanitize(String(value), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
}

export function looksLikeSpam(value = '') {
  return SPAM_PATTERNS.some((pattern) => pattern.test(value))
}
