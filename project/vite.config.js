import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html',
        catalog: 'catalog.html',
        player: 'player.html',
        cabinet: 'cabinet.html',
        subscriptions: 'subscriptions.html',
        registr: 'registr.html',
        admin: 'admin2.html'
      }
    }
  },
  define: {
    'process.env': {}
  }
})