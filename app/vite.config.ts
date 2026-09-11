import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/landing"),
      "@app": path.resolve(__dirname, "./src"),
      "next/link": path.resolve(__dirname, "./src/landing/components/Link.tsx"),
      "next/image": path.resolve(__dirname, "./src/landing/components/Image.tsx"),
      "next/navigation": path.resolve(__dirname, "./src/landing/components/Navigation.ts"),
      "@data": path.resolve(__dirname, "../data"),
      "@schema": path.resolve(__dirname, "../schema"),
    },
  },
});
