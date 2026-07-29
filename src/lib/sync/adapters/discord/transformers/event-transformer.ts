import { type DiscordEvent } from "../../../core/types/discord-types";
import { type DomainEvent } from "../../../core/types/domain-events";

const DISCORD_STATUS_MAP: Record<number, string> = {
  1: "SCHEDULED",
  2: "ACTIVE",
  3: "COMPLETED",
  4: "CANCELED",
};

function normalizeDate(d: string | null | undefined): string | undefined {
  if (!d) return undefined;
  return d.replace(/\.\d+/, "").replace(/\+00:00$/, "Z").replace(/-00:00$/, "Z");
}

function buildImageUrl(eventId: string, hash: string | null | undefined): string | undefined {
  if (!hash) return undefined;
  return `https://cdn.discordapp.com/guild-events/${eventId}/${hash}.png`;
}

export class EventTransformer {
  transform(discordEvent: DiscordEvent): Partial<DomainEvent> {
    const now = new Date().toISOString();
    const startDate = normalizeDate(discordEvent.scheduled_start_time) || new Date().toISOString();

    const statusCode = discordEvent.status;
    const discordStatus = DISCORD_STATUS_MAP[statusCode] || "SCHEDULED";

    let status: DomainEvent["status"] = "upcoming";
    const start = new Date(startDate);
    const nowDate = new Date();

    if (discordStatus === "CANCELED") {
      status = "cancelled";
    } else if (discordStatus === "COMPLETED" || start < nowDate) {
      status = "ended";
    } else if (discordStatus === "ACTIVE") {
      status = "ongoing";
    }

    return {
      id: discordEvent.id,
      title: discordEvent.name,
      description: discordEvent.description || undefined,
      image: buildImageUrl(discordEvent.id, discordEvent.image),
      startDate,
      endDate: normalizeDate(discordEvent.scheduled_end_time),
      location: discordEvent.location || undefined,
      creator: discordEvent.creator_id,
      interestedCount: discordEvent.user_count ?? 0,
      status,
      source: {
        type: "discord",
        id: discordEvent.id,
        url: `https://discord.com/events/${discordEvent.guild_id}/${discordEvent.id}`,
      },
      metadata: {
        privacyLevel: discordEvent.privacy_level,
        entityType: discordEvent.entity_type,
        entityId: discordEvent.entity_id,
        discordStatus,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Transforma múltiples eventos
   */
  transformMany(discordEvents: DiscordEvent[]): Partial<DomainEvent>[] {
    return discordEvents.map((event) => this.transform(event));
  }
}
