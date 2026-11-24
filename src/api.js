export const API_BASE = import.meta.env.VITE_API_BASE_URL // set in vite.config.js

export function getToken() {
  return localStorage.getItem('auth_token')
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const type = response.headers.get('content-type') || ''
  const body = type.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) {
    const message = typeof body === 'object' ? body.error || body.message : body
    if (response.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('username')
      localStorage.removeItem('role')
    }
    throw new Error(message || `요청에 실패했습니다 (${response.status})`)
  }
  return body
}

export function safeHtml(input = '') {
  const allowed = new Set(['P', 'DIV', 'BR', 'HR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'IMG', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SPAN', 'PRE', 'CODE'])
  const doc = new DOMParser().parseFromString(String(input), 'text/html')
  const clean = (node) => {
    const fragment = document.createDocumentFragment()
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        fragment.append(document.createTextNode(child.textContent || ''))
        continue
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue
      const tag = child.tagName
      if (!allowed.has(tag)) {
        if (!['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'MATH', 'TEMPLATE'].includes(tag)) fragment.append(clean(child))
        continue
      }
      const el = document.createElement(tag.toLowerCase())
      if (tag === 'A') {
        const href = child.getAttribute('href') || ''
        if (/^(https?:|mailto:|tel:)/i.test(href)) {
          el.setAttribute('href', href)
          el.setAttribute('target', '_blank')
          el.setAttribute('rel', 'noopener noreferrer')
        }
      }
      if (tag === 'IMG') {
        const src = child.getAttribute('src') || ''
        if (/^https?:\/\//i.test(src)) el.setAttribute('src', src)
        else continue
        el.setAttribute('alt', child.getAttribute('alt') || '')
        el.setAttribute('loading', 'lazy')
      }
      if (['TH', 'TD'].includes(tag)) {
        const span = child.getAttribute('colspan')
        if (span && /^\d{1,2}$/.test(span)) el.setAttribute('colspan', span)
      }
      el.append(clean(child))
      fragment.append(el)
    }
    return fragment
  }
  const wrapper = document.createElement('div')
  wrapper.append(clean(doc.body))
  return wrapper.innerHTML
}

export const categories = ['음식/카페', '생활/편의', '교육/건강', '기타']
export const themeOptions = ['spring', 'summer', 'autumn', 'winter', 'dark']
