import { defineConfig } from "vite";

import { aliases } from "./vite.aliases";

export default defineConfig(({ mode }) => ({
  root: "apps/game",
  ...(mode === "vt" ? { cacheDir: "../../node_modules/.vite-vt/game" } : {}),
  resolve: { alias: aliases },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "../../dist/game",
    emptyOutDir: true,
  },
}));
