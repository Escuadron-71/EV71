import { formatHeading, formatDistNm, formatEte, formatZuluClock } from "./navigation";
import { braaFromBullseye, formatBraa } from "./plugins/bullseye";
import { COMM_BAND_NAMES, bandForFrequency } from "./plugins/comms";

/**
 * B7 — Kneeboard
 * Construye las cards de datos para exportar como imagenes PNG listas para el
 * kneeboard de DCS. Modulo puro (SSR-safe): no toca canvas ni DOM; el render
 * canvas queda en el widget React `KneeboardExport.tsx`.
 */

export interface KneeboardSegment {
  text: string;
  color?: string;
  bold?: boolean;
}

export interface KneeboardLine {
  segments: KneeboardSegment[];
}

export interface KneeboardCard {
  id: string;
  title: string;
  subtitle?: string;
  lines: KneeboardLine[];
}

export interface KneeboardInput {
  theaterNombre: string;
  aircraftNombre: string;
  speedKt: number;
  bearingLabel: string;
  waypoints: { lat: number; lon: number }[];
  legs: { from: number; to: number; heading: number; distNm: number; eteMin: number }[];
  totalNm: number;
  totalEteMin: number;
  cumulativeMin: number[];
  etaByWp: number[] | null;
  totMinutes: number | null;
  departureMinutes: number | null;
  bullseye: { lat: number; lon: number } | null;
  frequencies: { label: string; frequency: string }[];
  brevityCodes: { code: string; meaning: string }[];
  threats: { samNombre: string; lat: number; lon: number }[];
}

export const KNEEDARK = "#0A0E17";
export const KNEE_PANEL = "#202D46";
export const KNEE_GOLD = "#E8B25C";
export const KNEE_TEXT = "#EAF0FA";
export const KNEE_DIM = "#9AA7BC";
export const KNEE_LABEL = "#C9D2E0";

const gold = (text: string): KneeboardSegment => ({ text, color: KNEE_GOLD, bold: true });
const dim = (text: string): KneeboardSegment => ({ text, color: KNEE_DIM });
const label = (text: string): KneeboardSegment => ({ text, color: KNEE_LABEL });
const white = (text: string): KneeboardSegment => ({ text, color: KNEE_TEXT });

const line = (...segments: KneeboardSegment[]): KneeboardLine => ({ segments });
const blank = (): KneeboardLine => ({ segments: [{ text: " " }] });

export function buildKneeboardCards(input: KneeboardInput): KneeboardCard[] {
  const cards: KneeboardCard[] = [];
  const { waypoints, legs } = input;

  // --- RESUMEN ---
  const resumen: KneeboardLine[] = [
    line(label("Teatro"), white(input.theaterNombre)),
    line(label("Aeronave"), white(input.aircraftNombre)),
    line(label("Velocidad"), white(`${input.speedKt} kt`)),
    line(label("Navegación"), white(input.bearingLabel)),
    blank(),
    line(label("Distancia total"), white(formatDistNm(input.totalNm))),
    line(label("Tiempo total"), white(formatEte(input.totalEteMin))),
  ];
  if (input.departureMinutes !== null) {
    resumen.push(line(label("Despegue"), gold(formatZuluClock(input.departureMinutes))));
  }
  if (input.totMinutes !== null) {
    resumen.push(line(label("TOT"), gold(formatZuluClock(input.totMinutes))));
  }
  cards.push({
    id: "resumen",
    title: "RESUMEN",
    subtitle: "Escuadrón 71 · Plan de vuelo",
    lines: resumen,
  });

  // --- WAYPOINTS ---
  if (waypoints.length > 0) {
    const lines = waypoints.map((w, i) => {
      const segments: KneeboardSegment[] = [
        gold(`WP${i}`),
        white(`  ${w.lat.toFixed(4)}, ${w.lon.toFixed(4)}`),
      ];
      if (input.bullseye) {
        segments.push(dim(`   ${formatBraa(braaFromBullseye(w, input.bullseye))}`));
      }
      return { segments };
    });
    cards.push({
      id: "waypoints",
      title: "WAYPOINTS",
      subtitle: `${waypoints.length} punto${waypoints.length > 1 ? "s" : ""} de ruta`,
      lines,
    });
  }

  // --- TRAMOS ---
  if (legs.length > 0) {
    const lines = legs.map((leg, i) => {
      const eta = input.etaByWp ? input.etaByWp[leg.to] : undefined;
      const segments: KneeboardSegment[] = [
        gold(`WP${leg.from}→WP${leg.to}`),
        dim(`  ${formatHeading(leg.heading)}`),
        white(`  ${formatDistNm(leg.distNm)}`),
        white(`  ${formatEte(leg.eteMin)}`),
        dim(`  AC ${formatEte(input.cumulativeMin[i] ?? leg.eteMin)}`),
      ];
      if (eta !== undefined) segments.push(gold(`  ${formatZuluClock(eta)}`));
      return { segments };
    });
    cards.push({
      id: "tramos",
      title: "TRAMOS",
      subtitle: "Rumbo · distancia · ETE · acumulado",
      lines,
    });
  }

  // --- FRECUENCIAS ---
  if (input.frequencies.length > 0) {
    const lines = input.frequencies.map((f) => {
      const band = bandForFrequency(f.frequency);
      return {
        segments: [
          label(f.label),
          white(`  ${f.frequency} MHz`),
          dim(band ? `  ${COMM_BAND_NAMES[band]}` : ""),
        ],
      };
    });
    cards.push({ id: "frecuencias", title: "FRECUENCIAS", subtitle: "Radio COMM", lines });
  }

  // --- BREVITY ---
  if (input.brevityCodes.length > 0) {
    const lines = input.brevityCodes.map((b) => ({
      segments: [gold(b.code), dim(`  ${b.meaning}`)],
    }));
    cards.push({
      id: "brevity",
      title: "BREVITY",
      subtitle: "Códigos de comunicación",
      lines,
    });
  }

  // --- AMENAZAS ---
  if (input.threats.length > 0 || input.bullseye) {
    const lines: KneeboardLine[] = [];
    if (input.bullseye) {
      lines.push(
        line(
          gold("Bullseye"),
          white(`${input.bullseye.lat.toFixed(4)}, ${input.bullseye.lon.toFixed(4)}`)
        )
      );
      lines.push(blank());
    }
    for (const t of input.threats) {
      lines.push(line(gold(t.samNombre), white(`  ${t.lat.toFixed(4)}, ${t.lon.toFixed(4)}`)));
    }
    cards.push({ id: "amenazas", title: "AMENAZAS", subtitle: "Posiciones SAM", lines });
  }

  return cards;
}
