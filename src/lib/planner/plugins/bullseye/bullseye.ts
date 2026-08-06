import { haversineNm, initialBearing } from "@/lib/planner/navigation";

export interface BullseyePoint {
  lat: number;
  lon: number;
}

export interface Braa {
  bearing: number;
  rangeNm: number;
}

/**
 * B9 — Bullseye / BRAA
 * Posicion relativa de un punto respecto al bullseye (referencia tactica
 * estandar de DCS): rumbo desde el bullseye + alcance en NM.
 */
export function braaFromBullseye(
  point: { lat: number; lon: number },
  bullseye: BullseyePoint
): Braa {
  return {
    bearing: initialBearing(bullseye.lat, bullseye.lon, point.lat, point.lon),
    rangeNm: haversineNm(bullseye.lat, bullseye.lon, point.lat, point.lon),
  };
}

/**
 * Formatea el callout de bullseye como "BR 045/25" (rumbo 3 digitos + alcance NM).
 */
export function formatBraa(braa: Braa): string {
  const bearing = String(Math.round(braa.bearing)).padStart(3, "0");
  const range = braa.rangeNm >= 100 ? String(Math.round(braa.rangeNm)) : braa.rangeNm.toFixed(1);
  return `BR ${bearing}/${range}`;
}

export function isBullseyePoint(value: unknown): value is BullseyePoint {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return typeof p.lat === "number" && typeof p.lon === "number";
}
