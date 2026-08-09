import { describe, expect, it } from "vitest";
import { getSourceConfig, sourcesConfig } from "./sources";

describe("sources config", () => {
  it("includes the discord source enabled", () => {
    const discord = sourcesConfig.find((s) => s.type === "discord");

    expect(discord).toBeDefined();
    expect(discord?.enabled).toBe(true);
    expect(discord?.syncInterval).toBe(3600);
  });

  it("resolves an enabled source by type", () => {
    expect(getSourceConfig("discord")).toBeDefined();
  });

  it("returns undefined for unknown or disabled sources", () => {
    expect(getSourceConfig("twitch")).toBeUndefined();
    expect(getSourceConfig("unknown")).toBeUndefined();
  });
});
