import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "localhost"
  },
  worker: {
    format: "es"
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
