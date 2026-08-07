import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/assets/docs" }),
});

const courses = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/assets/courses" }),
  schema: z.object({
    title: z.string(),
    code: z.enum(["FR1", "CR1", "CR2", "CR3"]),
    level: z.enum(["Basico", "Avanzado"]),
    duration: z.string(),
    summary: z.string(),
    status: z.enum(["activo", "proximamente"]),
    order: z.number(),
    prerequisites: z.array(z.string()),
    modules: z.array(
      z.object({
        name: z.string(),
        aircraft: z.string().optional(),
      }),
    ),
  }),
});

export const collections = { docs, courses };
