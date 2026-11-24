import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' so the built site works from any path (e.g. GitHub Pages project URL)
export default defineConfig({
  base: './',
  plugins: [react()],
})
