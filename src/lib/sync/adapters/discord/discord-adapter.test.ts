import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiscordAdapter } from "./discord-adapter";
import type { DiscordConfig } from "./config";

const config: DiscordConfig = {
  botToken: "token",
  guildId: "guild-1",
  apiVersion: "v10",
  baseUrl: "https://discord.com/api",
};

const eventPayload = [
  {
    id: "123",
    name: "Operacion Odisea",
    description: null,
    image: null,
    location: null,
    scheduled_start_time: "2026-09-01T23:00:00Z",
    scheduled_end_time: null,
    privacy_level: 2,
    status: 1,
    entity_type: 2,
    entity_id: null,
    creator_id: "creator-1",
    guild_id: "guild-1",
    user_count: 3,
  },
];

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

describe("DiscordAdapter", () => {
  let adapter: DiscordAdapter;

  beforeEach(() => {
    adapter = new DiscordAdapter(config);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("fetches and validates guild events", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(eventPayload));
    vi.stubGlobal("fetch", fetchMock);

    const events = await adapter.fetchGuildEvents();

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe("123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://discord.com/api/v10/guilds/guild-1/scheduled-events?with_user_count=true",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bot token",
        }),
      }),
    );
  });

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })),
    );

    await expect(adapter.fetchGuildEvents()).rejects.toThrow(
      "Discord API error: 401",
    );
  });

  it("throws when the payload does not match the schema", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse([{ bad: true }])));

    await expect(adapter.fetchGuildEvents()).rejects.toThrow();
  });

  it("retries with backoff and succeeds on transient failures", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("rate limited"))
      .mockRejectedValueOnce(new Error("rate limited"))
      .mockResolvedValue(okResponse(eventPayload));
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();

    const promise = adapter.fetchGuildEventsWithRetry(3);
    const assertion = expect(promise).resolves.toHaveLength(1);
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting retries", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("rate limited"));
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();

    const promise = adapter.fetchGuildEventsWithRetry(2);
    const assertion = expect(promise).rejects.toThrow("rate limited");
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
