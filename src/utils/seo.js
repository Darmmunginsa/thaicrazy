import { SITE_CONFIG } from '../config.js'

export function slugify(input = '') {
  return String(input)
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

export function setPageMeta({
  title = SITE_CONFIG.name,
  description = SITE_CONFIG.description,
  image = '/og-image.svg',
  url = window.location.href,
  jsonLd,
}) {
  document.title = title === SITE_CONFIG.name ? title : `${title} | ${SITE_CONFIG.name}`
  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:image', image)
  upsertMeta('property', 'og:url', url)

  const oldJson = document.querySelector('#json-ld')
  oldJson?.remove()
  if (jsonLd) {
    const script = document.createElement('script')
    script.id = 'json-ld'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)
  }
}

function upsertMeta(attr, key, content) {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}
