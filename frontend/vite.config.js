import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  build: {
    outDir: "../backend/public",
    emptyOutDir: true,
    minify: "esbuild",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          editor: ["@monaco-editor/react"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  plugins: [react()],
});
