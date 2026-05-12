import { defineConfig } from "vite";

export default defineConfig({
  // Capacitor loads the bundle from app-relative URLs; absolute "/assets/..." can break on some WebViews.
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Capacitor live reload hits Vite via your LAN IP; allow non-localhost Host headers.
    allowedHosts: true,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
