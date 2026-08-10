export type TheaterId = "caucasus" | "syria";

export interface TheaterBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Theater {
  id: TheaterId;
  nombre: string;
  region: string;
  center: [number, number];
  bounds: TheaterBounds;
  minZoom: number;
  maxZoom: number;
}

export const THEATERS: Theater[] = [
  {
    id: "caucasus",
    nombre: "Cáucaso",
    region: "Mar Negro · Georgia · Rusia",
    center: [43.1, 42.0],
    bounds: { north: 48.3876, south: 38.8651, east: 47.1423, west: 26.7787 },
    minZoom: 5,
    maxZoom: 13,
  },
  {
    id: "syria",
    nombre: "Siria",
    region: "Chipre · Levante · Irak",
    center: [34.8, 36.5],
    bounds: { north: 37.7179, south: 31.8473, east: 42.3717, west: 29.8978 },
    minZoom: 6,
    maxZoom: 13,
  },
];

export function getTheater(id: TheaterId): Theater {
  return THEATERS.find((t) => t.id === id) ?? THEATERS[0];
}
