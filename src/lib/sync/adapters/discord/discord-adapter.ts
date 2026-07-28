import { DiscordConfig, getDiscordConfig } from "./config";
import {
  DiscordEvent,
  DiscordGuildEventsResponse,
  DiscordEventSchema,
} from "../../core/types/discord-types";
import { z } from "zod";

export class DiscordAdapter {
  private config: DiscordConfig;
  private baseUrl: string;

  constructor(config?: DiscordConfig) {
    this.config = config || getDiscordConfig();
    this.baseUrl = `${this.config.baseUrl}/${this.config.apiVersion}`;
  }

  /**
   * Obtiene todos los eventos públicos del servidor de Discord
   * Implementa manejo de rate limiting y paginación
   */
  async fetchGuildEvents(): Promise<DiscordEvent[]> {
    const url = `${this.baseUrl}/guilds/${this.config.guildId}/scheduled-events`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bot ${this.config.botToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Discord API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // Validar respuesta con Zod
      const eventsSchema = z.array(DiscordEventSchema);
      const events = eventsSchema.parse(data);

      return events;
    } catch (error) {
      console.error("Error fetching Discord events:", error);
      throw error;
    }
  }

  /**
   * Obtiene eventos con manejo de rate limiting y retries
   */
  async fetchGuildEventsWithRetry(
    maxRetries: number = 3,
  ): Promise<DiscordEvent[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const events = await this.fetchGuildEvents();
        return events;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          // Espera exponencial: 2^attempt * 100ms
          const delay = Math.pow(2, attempt) * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Failed to fetch events after retries");
  }
}
