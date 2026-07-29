import { z } from "zod";

export const DiscordEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  scheduled_start_time: z.string(),
  scheduled_end_time: z.string().nullable().optional(),
  privacy_level: z.number(),
  status: z.number(),
  entity_type: z.number(),
  entity_id: z.string().nullable().optional(),
  creator_id: z.string(),
  guild_id: z.string(),
  user_count: z.number().optional().nullable(),
});

export type DiscordEvent = z.infer<typeof DiscordEventSchema>;

export interface DiscordGuildEventsResponse {
  events: DiscordEvent[];
}
