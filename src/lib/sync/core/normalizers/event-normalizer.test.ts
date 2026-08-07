import { describe, expect, it } from "vitest";
import { EventNormalizer } from "./event-normalizer";
import type { DomainEvent } from "../types/domain-events";

const baseEvent: Partial<DomainEvent> = {
  id: "123",
  title: "Operacion Odisea",
  startDate: "2026-09-01T23:00:00Z",
  status: "upcoming",
  source: { type: "discord", id: "123" },
  createdAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
};

describe("EventNormalizer", () => {
  const normalizer = new EventNormalizer();

  it("enriches events with normalized metadata", () => {
    const result = normalizer.normalize(baseEvent);

    expect(result.metadata).toMatchObject({
      version: "1.0.0",
    });
    expect(result.metadata?.normalizedAt).toBeTruthy();
    expect(result.title).toBe("Operacion Odisea");
  });

  it("throws when required fields are missing", () => {
    expect(() => normalizer.normalize({ title: "Sin id" })).toThrow(
      "Missing required fields",
    );
  });

  it("rejects events with invalid fields via zod", () => {
    expect(() =>
      normalizer.normalize({
        ...baseEvent,
        status: "invalid",
      } as unknown as Partial<DomainEvent>),
    ).toThrow();
  });

  it("normalizeMany skips invalid events", () => {
    const result = normalizer.normalizeMany([
      baseEvent,
      { title: "Incompleto" },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("123");
  });

  it("filterExpired keeps events without end date", () => {
    const ongoing = normalizer.normalize(baseEvent);
    const expired = normalizer.normalize({
      ...baseEvent,
      id: "2",
      title: "Vieja",
      endDate: "2020-01-01T00:00:00Z",
    });

    expect(normalizer.filterExpired([ongoing, expired])).toHaveLength(1);
  });

  it("sortByDate orders events chronologically", () => {
    const first = normalizer.normalize({
      ...baseEvent,
      id: "1",
      title: "A",
      startDate: "2026-10-01T00:00:00Z",
    });
    const second = normalizer.normalize({
      ...baseEvent,
      id: "2",
      title: "B",
      startDate: "2026-08-01T00:00:00Z",
    });
    const third = normalizer.normalize({
      ...baseEvent,
      id: "3",
      title: "C",
      startDate: "2026-09-01T00:00:00Z",
    });

    const sorted = normalizer.sortByDate([first, second, third]);

    expect(sorted.map((e) => e.id)).toEqual(["2", "3", "1"]);
  });
});
