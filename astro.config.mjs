import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://escuadron71.com",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
