import { DiscordEvent } from "../../../core/types/discord-types";
import { DomainEvent } from "../../../core/types/domain-events";

export class EventTransformer {
  /**
   * Transforma un evento de Discord a un evento de dominio
   */
  transform(discordEvent: DiscordEvent): Partial<DomainEvent> {
    const now = new Date().toISOString();
    const startDate = discordEvent.scheduled_start_time;

    // Determinar estado del evento
    let status: DomainEvent["status"] = "upcoming";
    const start = new Date(startDate);
    const nowDate = new Date();

    if (discordEvent.status === "CANCELED") {
      status = "cancelled";
    } else if (discordEvent.status === "COMPLETED" || start < nowDate) {
      status = "ended";
    } else if (discordEvent.status === "ACTIVE") {
      status = "ongoing";
    }

    return {
      id: discordEvent.id,
      title: discordEvent.name,
      description: discordEvent.description || undefined,
      image: discordEvent.image || undefined,
      startDate: startDate,
      endDate: discordEvent.scheduled_end_time || undefined,
      location: discordEvent.location || undefined,
      creator: discordEvent.creator_id,
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
        discordStatus: discordEvent.status,
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
