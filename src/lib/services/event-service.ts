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

interface PipelineSyncResult {
  success: boolean;
  timestamp: string;
  source: string;
  events: PipelineEvent[];
  stats?: {
    total: number;
    new: number;
    updated: number;
    expired: number;
    errors: number;
  };
}

interface PipelineEvent {
  id: string;
  title: string;
  description?: string;
  image?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  url?: string;
  interestedCount?: number;
  status: EventStatus;
  source: {
    type: string;
    id: string;
    url?: string;
  };
}

function toServiceEvent(e: PipelineEvent): ServiceEvent {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    image: e.image,
    startDate: e.startDate,
    endDate: e.endDate,
    location: e.location,
    status: e.status,
    eventUrl: e.url || e.source?.url,
    interestedCount: e.interestedCount ?? 0,
  };
}

function isPipelineResult(data: unknown): data is PipelineSyncResult {
  const r = data as PipelineSyncResult;
  return Array.isArray(r?.events) && r.events.length > 0 && "source" in r.events[0];
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
      const parsed: SyncResult & { source?: string } = JSON.parse(data);

      if (isPipelineResult(parsed)) {
        return parsed.events.map(toServiceEvent);
      }

      return (parsed as SyncResult).events || [];
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