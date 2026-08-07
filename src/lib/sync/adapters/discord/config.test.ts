import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDiscordConfig } from "./config";

describe("getDiscordConfig", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when credentials are missing", () => {
    vi.stubEnv("DISCORD_BOT_TOKEN", "");
    vi.stubEnv("DISCORD_GUILD_ID", "");

    expect(() => getDiscordConfig()).toThrow(
      "Missing Discord credentials",
    );
  });

  it("returns the API config from environment", () => {
    vi.stubEnv("DISCORD_BOT_TOKEN", "secret-token");
    vi.stubEnv("DISCORD_GUILD_ID", "guild-1");

    const config = getDiscordConfig();

    expect(config).toEqual({
      botToken: "secret-token",
      guildId: "guild-1",
      apiVersion: "v10",
      baseUrl: "https://discord.com/api",
    });
  });
});
