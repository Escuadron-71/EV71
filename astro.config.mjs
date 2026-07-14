import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://escuadron-71.github.io",
  base: "/EV71",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
