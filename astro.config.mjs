import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://escuadron-71.github.io",
  base: "/",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
