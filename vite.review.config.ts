import { defineConfig } from "vite";

import { aliases } from "./vite.aliases";

export default defineConfig(({ mode }) => ({
  root: "apps/review",
  ...(mode === "vt" ? { cacheDir: "../../node_modules/.vite-vt/review" } : {}),
  resolve: { alias: aliases },
  server: {
    host: "0.0.0.0",
    port: 5175,
    strictPort: true,
  },
  build: {
    outDir: "../../dist/review",
    emptyOutDir: true,
  },
}));
