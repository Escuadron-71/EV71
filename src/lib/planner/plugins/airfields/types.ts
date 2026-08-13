import type { TheaterId } from "@/lib/planner/theaters";

export interface AirfieldRunwayApproach {
  name: string;
  heading: number;
}

export interface AirfieldRunway {
  id: number | null;
  name: string;
  main: AirfieldRunwayApproach;
  opposite: AirfieldRunwayApproach;
}

export interface AirfieldAtcRadio {
  hf: number | null;
  vhfLow: number | null;
  vhfHigh: number | null;
  uhf: number | null;
}

export interface Airfield {
  id: number;
  name: string;
  tacan: string | null;
  civilian: boolean;
  atc: AirfieldAtcRadio | null;
  lat: number;
  lon: number;
  runways: AirfieldRunway[];
}

export type AirfieldMap = Record<TheaterId, Airfield[]>;

export function formatFreqMhz(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(value % 1 === 0 ? 0 : 3)} MHz`;
}

export function bandLabelForFreqMhz(value: number | null): string {
  if (value === null) return "";
  if (value >= 118 && value <= 137) return "VHF AM";
  if (value >= 225 && value <= 400) return "UHF";
  if (value >= 30 && value <= 88) return "FM";
  if (value >= 3 && value <= 30) return "HF";
  return "VHF";
}
