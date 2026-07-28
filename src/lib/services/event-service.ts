import fs from "fs/promises";
import path from "path";

export type EventStatus = "upcoming" | "ongoing" | "ended" | "cancelled";

export interface ServiceEvent {
  id: string;
  title: string;
  description?: string;
  image?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  status: EventStatus;
  eventUrl?: string;
  interestedCount?: number;
}

interface SyncResult {
  success: boolean;
  timestamp: string;
  events: ServiceEvent[];
}

export class EventService {
  async getUpcomingEvents(): Promise<ServiceEvent[]> {
    try {
      const filePath = path.join(
        process.cwd(),
        "src",
        "data",
        "events",
        "latest.json",
      );
      const data = await fs.readFile(filePath, "utf-8");
      const parsed: SyncResult = JSON.parse(data);
      return parsed.events || [];
    } catch {
      return [];
    }
  }

  async getNextEvent(): Promise<ServiceEvent | null> {
    const events = await this.getUpcomingEvents();
    const now = new Date();
    return events.find((e) => new Date(e.startDate) > now) || events[0] || null;
  }
}
