export interface SourceConfig {
  id: string;
  type: "discord" | "google_drive" | "youtube" | "twitch";
  enabled: boolean;
  syncInterval?: number; // en segundos
  options: Record<string, unknown>;
}

export const sourcesConfig: SourceConfig[] = [
  {
    id: "discord-events",
    type: "discord",
    enabled: true,
    syncInterval: 3600, // 1 hora
    options: {
      guildId: process.env.DISCORD_GUILD_ID,
    },
  },
  // Futuras fuentes se agregarán aquí
];

/**
 * Obtiene la configuración de una fuente específica
 */
export function getSourceConfig(type: string): SourceConfig | undefined {
  return sourcesConfig.find((source) => source.type === type && source.enabled);
}
