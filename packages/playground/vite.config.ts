import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@context-query/react": path.resolve(__dirname, "../react/src/index.ts"),
      "@context-query/core": path.resolve(__dirname, "../core/src/index.ts"),
    },
  },
});
