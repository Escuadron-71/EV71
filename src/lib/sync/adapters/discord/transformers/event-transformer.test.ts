import { describe, expect, it } from "vitest";
import { EventTransformer } from "./event-transformer";
import type { DiscordEvent } from "../../../core/types/discord-types";

const discordEvent: DiscordEvent = {
  id: "123",
  name: "Operacion Odisea",
  description: "Mision especial",
  image: "abc123",
  location: "Caucaso",
  scheduled_start_time: "2026-09-01T23:00:00.000000+00:00",
  scheduled_end_time: "2026-09-02T02:00:00.000000+00:00",
  privacy_level: 2,
  status: 1,
  entity_type: 2,
  entity_id: null,
  creator_id: "creator-1",
  guild_id: "guild-1",
  user_count: 5,
};

describe("EventTransformer", () => {
  const transformer = new EventTransformer();

  it("maps a discord event to a domain event", () => {
    const result = transformer.transform(discordEvent);

    expect(result).toMatchObject({
      id: "123",
      title: "Operacion Odisea",
      description: "Mision especial",
      location: "Caucaso",
      creator: "creator-1",
      interestedCount: 5,
      status: "upcoming",
      source: {
        type: "discord",
        id: "123",
        url: "https://discord.com/events/guild-1/123",
      },
    });
    expect(result.image).toContain(
      "https://cdn.discordapp.com/guild-events/123/abc123.png?size=4096",
    );
  });

  it("normalizes ISO dates to UTC Z format", () => {
    const result = transformer.transform(discordEvent);

    expect(result.startDate).toBe("2026-09-01T23:00:00Z");
    expect(result.endDate).toBe("2026-09-02T02:00:00Z");
  });

  it("maps ACTIVE discord status to ongoing", () => {
    const result = transformer.transform({ ...discordEvent, status: 2 });

    expect(result.status).toBe("ongoing");
  });

  it("maps COMPLETED discord status to ended", () => {
    const result = transformer.transform({ ...discordEvent, status: 3 });

    expect(result.status).toBe("ended");
  });

  it("maps CANCELED discord status to cancelled", () => {
    const result = transformer.transform({ ...discordEvent, status: 4 });

    expect(result.status).toBe("cancelled");
  });

  it("treats past events as ended regardless of status", () => {
    const result = transformer.transform({
      ...discordEvent,
      scheduled_start_time: "2020-01-01T00:00:00.000000+00:00",
    });

    expect(result.status).toBe("ended");
  });

  it("omits image when hash is absent", () => {
    const result = transformer.transform({ ...discordEvent, image: null });

    expect(result.image).toBeUndefined();
  });

  it("transforms multiple events", () => {
    const results = transformer.transformMany([discordEvent, discordEvent]);

    expect(results).toHaveLength(2);
  });
});
