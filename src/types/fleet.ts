export type AircraftRole = "caza" | "ataque" | "transporte" | "helo";

export interface Aircraft {
  slug: string;
  nombre: string;
  codigo: string;
  rol: AircraftRole;
  pais: string;
  tareas: string[];
  velocidadMax: string;
  radio: string;
  tripulacion: string;
  armamento: string[];
  imagen: string;
  moduloOficialUrl: string;
  pilotos: string[];
}

export interface FleetData {
  note: string;
  aircraft: Aircraft[];
}

export const ROLE_LABELS: Record<AircraftRole, string> = {
  caza: "Caza",
  ataque: "Ataque",
  transporte: "Transporte",
  helo: "Helicóptero",
};
