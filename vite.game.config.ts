import { defineConfig } from 'vite';

export default defineConfig({
  root: 'apps/game',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: '../../dist/game',
    emptyOutDir: true,
  },
});
