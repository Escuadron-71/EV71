// # Tipos especificos de Discord
import { z } from "zod";

// Esquema de respuesta de la API de Discord para eventos de guild
export const DiscordEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  location: z.string().optional(),
  scheduled_start_time: z.string(),
  scheduled_end_time: z.string().optional(),
  privacy_level: z.number(),
  status: z.enum(["SCHEDULED", "ACTIVE", "COMPLETED", "CANCELED"]),
  entity_type: z.number(),
  entity_id: z.string().optional(),
  creator_id: z.string(),
  guild_id: z.string(),
});

export type DiscordEvent = z.infer<typeof DiscordEventSchema>;

export interface DiscordGuildEventsResponse {
  events: DiscordEvent[];
}
