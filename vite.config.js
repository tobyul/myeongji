import { createHash } from 'node:crypto'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages cannot send headers, so the CSP ships as a <meta> tag built from the final HTML.
function cspMeta(apiBase) {
  return {
    name: 'csp-meta',
    apply: 'build', // dev server injects inline scripts (React refresh) that this policy would block
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
          .map(([, code]) => `'sha256-${createHash('sha256').update(code).digest('base64')}'`)
        // Kakao Maps SDK pulls scripts from t1.kakaocdn.net and geocodes via dapi.kakao.com (JSONP + XHR).
        const kakao = 'https://*.kakao.com https://*.daumcdn.net https://*.kakaocdn.net'
        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')} ${kakao}`,
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          'font-src https://fonts.gstatic.com',
          "img-src 'self' data: blob: https:",
          `connect-src 'self' ${new URL(apiBase).origin} ${kakao}`,
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; ')
        return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`)
      },
    },
  }
}

// GitHub Pages project site: https://tobyul.github.io/myeongji/
export default defineConfig(({ mode }) => {
  // Single source for the API origin: VITE_API_BASE_URL overrides the v2 default in JS and index.html.
  const apiBase = (loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL || 'https://reib.duckdns.org:3002').replace(/\/$/, '')
  return {
    base: '/myeongji/',
    define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBase) },
    plugins: [react(), { name: 'api-base-html', transformIndexHtml: (html) => html.replaceAll('__API_BASE__', apiBase) }, cspMeta(apiBase)],
  }
})
