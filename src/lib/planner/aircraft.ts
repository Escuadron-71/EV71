export type AircraftId =
  | "f18"
  | "f16"
  | "f15c"
  | "f15e"
  | "a10"
  | "t45"
  | "c130"
  | "ch47"
  | "uh60";

export interface Aircraft {
  id: AircraftId;
  nombre: string;
  defaultSpeedKt: number;
}

export const AIRCRAFT: Aircraft[] = [
  { id: "f18", nombre: "F/A-18C Hornet", defaultSpeedKt: 400 },
  { id: "f16", nombre: "F-16C Viper", defaultSpeedKt: 450 },
  { id: "f15c", nombre: "F-15C Eagle", defaultSpeedKt: 450 },
  { id: "f15e", nombre: "F-15E Strike Eagle", defaultSpeedKt: 450 },
  { id: "a10", nombre: "A-10C II Warthog", defaultSpeedKt: 300 },
  { id: "t45", nombre: "T-45 Goshawk", defaultSpeedKt: 350 },
  { id: "c130", nombre: "C-130H Hercules", defaultSpeedKt: 290 },
  { id: "ch47", nombre: "CH-47F Chinook", defaultSpeedKt: 140 },
  { id: "uh60", nombre: "UH-60L Black Hawk", defaultSpeedKt: 135 },
];

export function getAircraft(id: AircraftId): Aircraft {
  return AIRCRAFT.find((a) => a.id === id) ?? AIRCRAFT[0];
}
