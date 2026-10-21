import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": process.env.DEVOPSX_BACKEND_URL || "http://127.0.0.1:8091",
    },
  },
});
