import { defineConfig } from 'vite';

export default defineConfig({
  root: 'apps/game',
  build: {
    outDir: '../../dist/game',
    emptyOutDir: true,
  },
});
