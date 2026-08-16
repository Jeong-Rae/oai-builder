import { defineConfig } from 'vite';

export default defineConfig({
  root: 'apps/editor',
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
  },
  build: {
    outDir: '../../dist/editor',
    emptyOutDir: true,
  },
});
