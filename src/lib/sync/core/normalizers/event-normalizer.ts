import { DomainEvent, DomainEventSchema } from "../types/domain-events";

export class EventNormalizer {
  /**
   * Normaliza y valida un evento de dominio
   */
  normalize(event: Partial<DomainEvent>): DomainEvent {
    // Validar que todos los campos requeridos estén presentes
    if (!event.id || !event.title || !event.startDate) {
      throw new Error("Missing required fields for event normalization");
    }

    // Usar Zod para validación final
    const normalizedEvent = DomainEventSchema.parse(event);

    // Enriquecer con metadata adicional
    return {
      ...normalizedEvent,
      metadata: {
        ...normalizedEvent.metadata,
        normalizedAt: new Date().toISOString(),
        version: "1.0.0",
      },
    };
  }

  /**
   * Normaliza múltiples eventos
   */
  normalizeMany(events: Partial<DomainEvent>[]): DomainEvent[] {
    return events
      .map((event) => {
        try {
          return this.normalize(event);
        } catch (error) {
          console.warn(`Failed to normalize event: ${event.id}`, error);
          return null;
        }
      })
      .filter((event): event is DomainEvent => event !== null);
  }

  /**
   * Filtra eventos expirados
   */
  filterExpired(events: DomainEvent[]): DomainEvent[] {
    const now = new Date();
    return events.filter((event) => {
      // Mantener eventos sin fecha de fin
      if (!event.endDate) return true;

      const end = new Date(event.endDate);
      return end > now;
    });
  }

  /**
   * Ordena eventos por fecha de inicio
   */
  sortByDate(events: DomainEvent[]): DomainEvent[] {
    return [...events].sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }
}
