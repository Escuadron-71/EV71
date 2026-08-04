// src/lib/services/event-service.ts
import fs from "fs/promises";
import path from "path";
import type { DomainEvent } from "../core/types/domain-events";

export class EventService {
  private dataPath: string;

  constructor(dataDir: string = "data/events") {
    this.dataPath = path.join(process.cwd(), "public", dataDir, "latest.json");
  }

  async getUpcomingEvents(): Promise<DomainEvent[]> {
    try {
      const data = await fs.readFile(this.dataPath, "utf-8");
      const result = JSON.parse(data);
      return result.events || [];
    } catch (error) {
      console.error("Error reading events:", error);
      return [];
    }
  }

  async getEventById(id: string): Promise<DomainEvent | null> {
    const events = await this.getUpcomingEvents();
    return events.find((event) => event.id === id) || null;
  }
}
