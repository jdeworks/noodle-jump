import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "./",
  build: {
    outDir: "docs",
  },
  server: {
    open: true,
    allowedHosts: true,
  },
});
