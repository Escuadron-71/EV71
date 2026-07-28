#!/usr/bin/env node

import { EventSyncService } from "../services/event-sync-service";
import { DiscordAdapter } from "../adapters/discord/discord-adapter";
import { JsonStorage } from "../core/storage/json-storage";

/**
 * Script CLI para sincronizar eventos de Discord
 *
 * Uso: node sync-events.js
 *
 * Variables de entorno requeridas:
 * - DISCORD_BOT_TOKEN: Token del bot de Discord
 * - DISCORD_GUILD_ID: ID del servidor de Discord
 */

async function main() {
  console.log("🚀 Starting Discord Events Sync...");
  console.log("📋 Environment:", process.env.NODE_ENV || "development");

  try {
    const adapter = new DiscordAdapter();
    const storage = new JsonStorage({
      dataDir: process.env.EVENTS_DATA_DIR || "data/events",
    });

    const service = new EventSyncService({
      adapter,
      storage,
    });

    const result = await service.sync();

    if (result.success) {
      console.log(`✅ Sync successful: ${result.events.length} events synced`);
      console.log(`📊 Stats:`, result.stats);
      process.exit(0);
    } else {
      console.error(`❌ Sync failed:`, result.errors);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}
