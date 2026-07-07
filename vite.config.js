import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Muss dem GitHub-Repo-Namen entsprechen, sonst lädt GitHub Pages die Assets nicht
  base: '/immo-rechner/',
  plugins: [react(), tailwindcss()],
})
