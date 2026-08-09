export type DonationBadge = "Recurrente" | "Única" | "Local";

export interface DonationPlatform {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  icono: string;
  badge: DonationBadge;
  disponible: boolean;
}

export interface DonationsData {
  timestamp: string;
  note: string;
  platforms: DonationPlatform[];
}
