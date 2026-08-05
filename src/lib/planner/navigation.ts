export type BearingMode = "great-circle" | "rhumb";

const NM_PER_KM = 0.5399568;
const R_KM = 6371.0088;

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function normalizeDeg360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function haversineNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_KM * c * NM_PER_KM;
}

export function initialBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
  return normalizeDeg360(toDeg(Math.atan2(y, x)));
}

export function rhumbLineBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  let dLon = toRad(lon2 - lon1);
  if (Math.abs(dLon) > Math.PI) {
    dLon = dLon > 0 ? dLon - 2 * Math.PI : dLon + 2 * Math.PI;
  }
  const dPsi = Math.log(
    Math.tan(phi2 / 2 + Math.PI / 4) / Math.tan(phi1 / 2 + Math.PI / 4)
  );
  return normalizeDeg360(toDeg(Math.atan2(dLon, dPsi)));
}

export function eteMinutesForLeg(distNm: number, speedKt: number): number {
  if (!isFinite(distNm) || !speedKt || speedKt <= 0) return 0;
  return (distNm / speedKt) * 60;
}

export function greatCirclePoints(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  steps = 24
): [number, number][] {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const lam1 = toRad(lon1);
  const lam2 = toRad(lon2);

  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((phi2 - phi1) / 2) ** 2 +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin((lam2 - lam1) / 2) ** 2
  ));
  if (d === 0) return [[lat1, lon1], [lat2, lon2]];

  const points: [number, number][] = [[lat1, lon1]];
  for (let i = 1; i <= steps; i++) {
    const f = i / steps;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);
    const x = a * Math.cos(phi1) * Math.cos(lam1) + b * Math.cos(phi2) * Math.cos(lam2);
    const y = a * Math.cos(phi1) * Math.sin(lam1) + b * Math.cos(phi2) * Math.sin(lam2);
    const z = a * Math.sin(phi1) + b * Math.sin(phi2);
    points.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]);
  }
  return points;
}

export function formatHeading(deg: number): string {
  return `${String(Math.round(deg)).padStart(3, "0")}°`;
}

export function formatDistNm(nm: number): string {
  if (!isFinite(nm)) return "—";
  if (nm >= 100) return `${Math.round(nm)} NM`;
  if (nm >= 10) return `${nm.toFixed(1)} NM`;
  return `${nm.toFixed(2)} NM`;
}

export function formatEte(totalMinutes: number): string {
  if (!isFinite(totalMinutes) || totalMinutes <= 0) return "—";
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}
