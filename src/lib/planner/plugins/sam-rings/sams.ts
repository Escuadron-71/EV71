export type SamId = "sa2" | "sa6" | "sa10";

export interface SamSystem {
  id: SamId;
  nombre: string;
  nombreLargo: string;
  radar: string;
  detectionNm: number;
  engagementNm: number;
}

/**
 * Valores DCS (SEAD Reference Guide). Alcances máximos; en 2D se dibujan como
 * círculos concéntricos de detección (warn) y disparo (danger).
 */
export const SAM_SYSTEMS: SamSystem[] = [
  {
    id: "sa2",
    nombre: "SA-2",
    nombreLargo: "SA-2 Guideline (S-75)",
    radar: "Fan Song",
    detectionNm: 54,
    engagementNm: 23,
  },
  {
    id: "sa6",
    nombre: "SA-6",
    nombreLargo: "SA-6 Gainful (2K12)",
    radar: "Straight Flush",
    detectionNm: 38,
    engagementNm: 13,
  },
  {
    id: "sa10",
    nombre: "SA-10",
    nombreLargo: "SA-10 Grumble (S-300PS)",
    radar: "Flap Lid",
    detectionNm: 86,
    engagementNm: 65,
  },
];

export function getSam(id: SamId): SamSystem {
  return SAM_SYSTEMS.find((s) => s.id === id) ?? SAM_SYSTEMS[0];
}

export function isSamId(value: unknown): value is SamId {
  return SAM_SYSTEMS.some((s) => s.id === value);
}
