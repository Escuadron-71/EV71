import dotenv from "dotenv";
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

dotenv.config();

export default defineConfig({
  site: process.env.SITE_URL || "https://escuadron-71.github.io",
  base: process.env.BASE_PATH || "/",
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
});
