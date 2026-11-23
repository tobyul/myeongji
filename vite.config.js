import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: https://tobyul.github.io/myeongji2/
export default defineConfig({
  base: '/myeongji2/',
  plugins: [react()],
})
