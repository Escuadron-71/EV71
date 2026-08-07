import { describe, expect, it, vi, type Mock } from "vitest";
import { EventSyncService } from "./event-sync-service";
import { DiscordAdapter } from "../adapters/discord/discord-adapter";
import { JsonStorage } from "../core/storage/json-storage";
import type { DomainEvent } from "../core/types/domain-events";

const discordEvent = {
  id: "123",
  name: "Operacion Odisea",
  description: "Mision especial",
  image: "hash",
  location: "Caucaso",
  scheduled_start_time: "2026-09-01T23:00:00.000000+00:00",
  scheduled_end_time: null,
  privacy_level: 2,
  status: 1,
  entity_type: 2,
  entity_id: null,
  creator_id: "creator-1",
  guild_id: "guild-1",
  user_count: 3,
};

function makeMocks() {
  const adapter = {
    fetchGuildEventsWithRetry: vi.fn(async () => [discordEvent]),
  } as unknown as DiscordAdapter;

  const storage = {
    saveEvents: vi.fn(async () => "latest.json"),
    readLatestEvents: vi.fn(async () => null),
  } as unknown as JsonStorage;

  return { adapter, storage };
}

describe("EventSyncService", () => {
  it("runs a full sync and persists the result", async () => {
    const { adapter, storage } = makeMocks();
    const service = new EventSyncService({ adapter, storage });

    const result = await service.sync();

    expect(result.success).toBe(true);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe("123");
    expect(result.events[0].title).toBe("Operacion Odisea");
    expect(result.stats.total).toBe(1);
    expect(storage.saveEvents).toHaveBeenCalledTimes(1);
  });

  it("marks expired events in stats", async () => {
    const { adapter, storage } = makeMocks();
    (adapter.fetchGuildEventsWithRetry as unknown as Mock).mockResolvedValue([
      discordEvent,
      {
        ...discordEvent,
        id: "456",
        scheduled_start_time: "2020-01-01T00:00:00.000000+00:00",
        scheduled_end_time: "2020-01-01T01:00:00.000000+00:00",
      },
    ]);
    const service = new EventSyncService({ adapter, storage });

    const result = await service.sync();

    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe("123");
    expect(result.stats.expired).toBe(1);
  });

  it("returns a failure result when the adapter throws", async () => {
    const { adapter, storage } = makeMocks();
    (adapter.fetchGuildEventsWithRetry as unknown as Mock).mockRejectedValue(
      new Error("boom"),
    );
    const service = new EventSyncService({ adapter, storage });

    const result = await service.sync();

    expect(result.success).toBe(false);
    expect(result.events).toEqual([]);
    expect(result.errors).toEqual([
      expect.objectContaining({ type: "sync_error", message: "boom" }),
    ]);
    expect(storage.saveEvents).not.toHaveBeenCalled();
  });

  it("returns synced events from storage", async () => {
    const { adapter, storage } = makeMocks();
    const stored: DomainEvent[] = [];
    (storage.readLatestEvents as unknown as Mock).mockResolvedValue({
      success: true,
      timestamp: "t",
      source: "discord",
      events: stored,
      stats: { total: 0, new: 0, updated: 0, expired: 0, errors: 0 },
    });
    const service = new EventSyncService({ adapter, storage });

    await expect(service.getSyncedEvents()).resolves.toEqual([]);
  });
});
