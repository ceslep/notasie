import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'url'

export default defineConfig({
  base:'/est/',
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      '$lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
