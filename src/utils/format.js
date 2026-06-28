export function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function compactNumber(value = 0) {
  return new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value)
}

export function splitList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
