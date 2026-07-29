import { DiscordAdapter } from "../adapters/discord/discord-adapter";
import { EventTransformer } from "../adapters/discord/transformers/event-transformer";
import { EventNormalizer } from "../core/normalizers/event-normalizer";
import { JsonStorage } from "../core/storage/json-storage";
import { type DomainEvent, type SyncResult } from "../core/types/domain-events";

export interface EventSyncOptions {
  adapter?: DiscordAdapter;
  storage?: JsonStorage;
  normalize?: boolean;
}

export class EventSyncService {
  private adapter: DiscordAdapter;
  private storage: JsonStorage;
  private transformer: EventTransformer;
  private normalizer: EventNormalizer;

  constructor(options?: EventSyncOptions) {
    this.adapter = options?.adapter || new DiscordAdapter();
    this.storage = options?.storage || new JsonStorage();
    this.transformer = new EventTransformer();
    this.normalizer = new EventNormalizer();
  }

  /**
   * Ejecuta la sincronización completa
   */
  async sync(): Promise<SyncResult> {
    const startTime = Date.now();
    const stats = {
      total: 0,
      new: 0,
      updated: 0,
      expired: 0,
      errors: 0,
    };

    try {
      // 1. Obtener eventos de Discord
      console.log("🔄 Fetching events from Discord...");
      const discordEvents = await this.adapter.fetchGuildEventsWithRetry();
      console.log(`✅ Found ${discordEvents.length} events from Discord`);

      // 2. Transformar a formato de dominio
      const transformedEvents = this.transformer.transformMany(discordEvents);

      // 3. Normalizar eventos
      let normalizedEvents = this.normalizer.normalizeMany(transformedEvents);

      // 4. Filtrar eventos expirados
      const currentEvents = this.normalizer.filterExpired(normalizedEvents);
      stats.expired = normalizedEvents.length - currentEvents.length;
      console.log(`⏰ Filtered ${stats.expired} expired events`);

      // 5. Ordenar por fecha
      const sortedEvents = this.normalizer.sortByDate(currentEvents);
      stats.total = sortedEvents.length;

      // 6. Guardar en almacenamiento
      const syncResult: SyncResult = {
        success: true,
        timestamp: new Date().toISOString(),
        source: "discord",
        events: sortedEvents,
        stats: {
          ...stats,
          new: stats.total, // Simplificado para primera versión
          updated: 0,
        },
      };

      const savedPath = await this.storage.saveEvents(sortedEvents, syncResult);
      console.log(`💾 Events saved to: ${savedPath}`);

      const duration = Date.now() - startTime;
      console.log(`✨ Sync completed in ${duration}ms`);

      return syncResult;
    } catch (error) {
      console.error("❌ Sync failed:", error);

      return {
        success: false,
        timestamp: new Date().toISOString(),
        source: "discord",
        events: [],
        stats,
        errors: [
          {
            type: "sync_error",
            message: error instanceof Error ? error.message : String(error),
            raw: error,
          },
        ],
      };
    }
  }

  /**
   * Obtiene eventos sincronizados (para uso del frontend)
   */
  async getSyncedEvents(): Promise<DomainEvent[]> {
    const result = await this.storage.readLatestEvents();
    return result?.events || [];
  }
}
