import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/franciscoortuno/',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
})
