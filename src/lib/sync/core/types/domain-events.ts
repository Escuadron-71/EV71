// # Tipos de dominio
import { z } from "zod";

// Esquema de validación para eventos de dominio
export const DomainEventSchema = z.object({
  id: z.string().uuid().or(z.string()),
  title: z.string().min(1),
  description: z.string().optional(),
  image: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  location: z.string().optional(),
  url: z.string().url().optional(),
  creator: z.string().optional(),
  interestedCount: z.number().optional(),
  status: z.enum(["upcoming", "ongoing", "ended", "cancelled"]),
  source: z.object({
    type: z.enum(["discord", "google_drive", "youtube", "twitch"]),
    id: z.string(),
    url: z.string().url().optional(),
  }),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DomainEvent = z.infer<typeof DomainEventSchema>;

// DTO para resultados de sincronización
export interface SyncResult {
  success: boolean;
  timestamp: string;
  source: string;
  events: DomainEvent[];
  stats: {
    total: number;
    new: number;
    updated: number;
    expired: number;
    errors: number;
  };
  errors?: Array<{
    type: string;
    message: string;
    raw?: unknown;
  }>;
}
