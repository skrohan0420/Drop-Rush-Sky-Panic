import { defineConfig } from "vite";

export default defineConfig({
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
