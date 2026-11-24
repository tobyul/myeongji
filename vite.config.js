import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: https://tobyul.github.io/myeongji2/
export default defineConfig(({ mode }) => {
  // Single source for the API origin: VITE_API_BASE_URL overrides the v2 default in JS and index.html.
  const apiBase = (loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL || 'https://reib.duckdns.org:3002').replace(/\/$/, '')
  return {
    base: '/myeongji2/',
    define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBase) },
    plugins: [react(), { name: 'api-base-html', transformIndexHtml: (html) => html.replaceAll('__API_BASE__', apiBase) }],
  }
})
