import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EventService, type ServiceEvent } from "./event-service";

function pipelineEvents(): ServiceEvent[] {
  return [
    {
      id: "1",
      title: "Operacion Odisea",
      description: "Mision especial",
      startDate: "2026-09-01T23:00:00Z",
      status: "upcoming",
      eventUrl: "https://discord.com/events/g/1",
      interestedCount: 5,
      source: {
        type: "discord",
        id: "1",
        url: "https://discord.com/events/g/1",
      },
    },
  ] as unknown as ServiceEvent[];
}

function legacyEvents(): ServiceEvent[] {
  return [
    {
      id: "1",
      title: "Operacion Odisea",
      startDate: "2026-09-01T23:00:00Z",
      status: "upcoming",
      eventUrl: "https://discord.com/events/g/1",
      interestedCount: 0,
    },
  ];
}

describe("EventService", () => {
  let dir: string;
  let dataFile: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "ev71-events-"));
    dataFile = path.join(dir, "latest.json");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("maps pipeline events to service events", async () => {
    await writeFile(
      dataFile,
      JSON.stringify({
        success: true,
        timestamp: "t",
        source: "discord",
        events: pipelineEvents(),
      }),
      "utf-8",
    );
    const service = new EventService(dataFile);

    const events = await service.getUpcomingEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "1",
      title: "Operacion Odisea",
      eventUrl: "https://discord.com/events/g/1",
      interestedCount: 5,
    });
  });

  it("reads legacy format events as-is", async () => {
    await writeFile(
      dataFile,
      JSON.stringify({ success: true, timestamp: "t", events: legacyEvents() }),
      "utf-8",
    );
    const service = new EventService(dataFile);

    const events = await service.getUpcomingEvents();

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Operacion Odisea");
    expect(events[0].eventUrl).toBe("https://discord.com/events/g/1");
  });

  it("returns an empty array when the file is missing or malformed", async () => {
    const service = new EventService(path.join(dir, "missing.json"));

    await expect(service.getUpcomingEvents()).resolves.toEqual([]);
  });

  it("returns the next upcoming event after now", async () => {
    const past = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    await writeFile(
      dataFile,
      JSON.stringify({
        success: true,
        timestamp: "t",
        events: [
          { id: "past", title: "Vieja", startDate: past, status: "upcoming" },
          { id: "next", title: "Proxima", startDate: future, status: "upcoming" },
        ],
      }),
      "utf-8",
    );
    const service = new EventService(dataFile);

    const next = await service.getNextEvent();

    expect(next?.id).toBe("next");
  });

  it("falls back to the first event when none is upcoming", async () => {
    await writeFile(
      dataFile,
      JSON.stringify({
        success: true,
        timestamp: "t",
        events: [
          { id: "ended", title: "Terminada", startDate: "2020-01-01T00:00:00Z", status: "ended" },
        ],
      }),
      "utf-8",
    );
    const service = new EventService(dataFile);

    const next = await service.getNextEvent();

    expect(next?.id).toBe("ended");
  });
});
