import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://escuadron-71.github.io",
  base: process.env.BASE_PATH || "/",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
