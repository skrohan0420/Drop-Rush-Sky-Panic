import { defineConfig } from "vite";

export default defineConfig({
  // Capacitor loads the bundle from app-relative URLs; absolute "/assets/..." can break on some WebViews.
  base: "./",
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["cristine-nonsubordinate-stevie.ngrok-free.dev"],
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
