import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  base: "./",
  build: {
    outDir: "docs",
  },
  server: {
    port: 3333,
    open: true,
    allowedHosts: true,
  },
});
