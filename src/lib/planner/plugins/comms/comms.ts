export type CommBand = "vhf" | "uhf" | "fm";

export interface CommEntry {
  id: string;
  label: string;
  frequency: string;
}

export const COMM_BAND_NAMES: Record<CommBand, string> = {
  vhf: "VHF AM",
  uhf: "UHF",
  fm: "FM",
};

/**
 * B9 — COMM Frequencies
 * Banda segun la frecuencia numerica en MHz (rangos de aviacion DCS).
 */
export function bandForFrequency(frequency: string): CommBand | null {
  const value = Number(frequency.replace(",", "."));
  if (!Number.isFinite(value)) return null;
  if (value >= 118 && value <= 137) return "vhf";
  if (value >= 225 && value <= 400) return "uhf";
  if (value >= 30 && value <= 88) return "fm";
  return null;
}

/**
 * Valida que la frecuencia sea numerica y caiga dentro de una banda de aviacion.
 */
export function isValidFrequency(frequency: string): boolean {
  return bandForFrequency(frequency) !== null;
}

export function isCommEntry(value: unknown): value is CommEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.label === "string" &&
    typeof e.frequency === "string"
  );
}
