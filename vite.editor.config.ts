import { defineConfig } from 'vite';

import { aliases } from './vite.aliases';

export default defineConfig({
  root: 'apps/editor',
  resolve: { alias: aliases },
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
