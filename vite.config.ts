import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const _dirname = process.cwd();

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    proxy: {
      "/ffmpeg": {
        target: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ffmpeg/, ""),
      },
    },
  },
  resolve: {
    alias: {
      app: "/src/app/",
      features: "/src/features/",
      pages: "/src/pages/",
      shared: "/src/shared/",
      "@shared": path.resolve(_dirname, "./shared"),
    },
  },
});
