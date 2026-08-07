import { mkdtemp, readFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonStorage } from "./json-storage";
import type { DomainEvent, SyncResult } from "../types/domain-events";

const event: DomainEvent = {
  id: "123",
  title: "Operacion Odisea",
  startDate: "2026-09-01T23:00:00Z",
  status: "upcoming",
  source: { type: "discord", id: "123" },
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

const syncResult: SyncResult = {
  success: true,
  timestamp: "2026-08-01T00:00:00Z",
  source: "discord",
  events: [event],
  stats: { total: 1, new: 1, updated: 0, expired: 0, errors: 0 },
};

describe("JsonStorage", () => {
  let dataDir: string;

  beforeEach(async () => {
    dataDir = await mkdtemp(path.join(tmpdir(), "ev71-storage-"));
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it("writes latest.json and a timestamped backup", async () => {
    const storage = new JsonStorage({ dataDir, backupEnabled: true });

    const latestPath = await storage.saveEvents([event], syncResult);

    expect(path.basename(latestPath)).toBe("latest.json");
    const files = await readdir(path.join(dataDir, "history"));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/\.json$/);
  });

  it("writes a valid JSON snapshot", async () => {
    const storage = new JsonStorage({ dataDir });

    await storage.saveEvents([event], syncResult);

    const raw = await readFile(path.join(dataDir, "latest.json"), "utf-8");
    const parsed = JSON.parse(raw) as SyncResult;
    expect(parsed.events).toHaveLength(1);
    expect(parsed.events[0].title).toBe("Operacion Odisea");
  });

  it("skips backup when disabled", async () => {
    const storage = new JsonStorage({ dataDir, backupEnabled: false });

    await storage.saveEvents([event], syncResult);

    await expect(readdir(path.join(dataDir, "history"))).rejects.toThrow();
  });

  it("reads back the latest events", async () => {
    const storage = new JsonStorage({ dataDir });

    await storage.saveEvents([event], syncResult);
    const result = await storage.readLatestEvents();

    expect(result?.success).toBe(true);
    expect(result?.events).toHaveLength(1);
  });

  it("returns null when no snapshot exists", async () => {
    const storage = new JsonStorage({ dataDir });

    await expect(storage.readLatestEvents()).resolves.toBeNull();
  });
});
