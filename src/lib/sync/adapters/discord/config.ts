export interface DiscordConfig {
  botToken: string;
  guildId: string;
  apiVersion: string;
  baseUrl: string;
}

export const getDiscordConfig = (): DiscordConfig => {
  // Las credenciales deben estar en variables de entorno
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!botToken || !guildId) {
    throw new Error(
      "Missing Discord credentials: DISCORD_BOT_TOKEN and DISCORD_GUILD_ID must be set",
    );
  }

  return {
    botToken,
    guildId,
    apiVersion: "v10",
    baseUrl: "https://discord.com/api",
  };
};
