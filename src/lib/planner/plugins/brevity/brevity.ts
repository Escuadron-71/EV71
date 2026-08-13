export interface BrevityEntry {
  id: string;
  code: string;
  meaning: string;
}

/**
 * B9 — Brevity codes
 * Set inicial de codigos estandar de comunicacion (NATO/DCS). Lista editable:
 * la direccion de la ORG puede solicitar agregar, cambiar o eliminar codigos.
 */
export const BREVITY_CODES: BrevityEntry[] = [
  { id: "bingo", code: "BINGO", meaning: "Combustible para regresar a base" },
  { id: "joker", code: "JOKER", meaning: "Combustible minimo para el objetivo; listo para regresar" },
  { id: "fox1", code: "FOX 1", meaning: "Disparo de misil SARH (semiactivo)" },
  { id: "fox2", code: "FOX 2", meaning: "Disparo de misil IR (infrarrojo)" },
  { id: "fox3", code: "FOX 3", meaning: "Disparo de misil ARH (activo)" },
  { id: "rifle", code: "RIFLE", meaning: "Disparo de misil aire-superficie" },
  { id: "magnum", code: "MAGNUM", meaning: "Disparo de misil anti-radiacion" },
  { id: "mudspikes", code: "MUD SPIKES", meaning: "Deteccion de emision de defensa aerea enemiga" },
  { id: "spiked", code: "SPIKED", meaning: "Radar enemigo te ilumina / lock en tu aeronave" },
  { id: "nojo", code: "NOJO", meaning: "Sin emision de radar (No Joy)" },
  { id: "tally", code: "TALLY", meaning: "Contacto visual con el objetivo" },
  { id: "visual", code: "VISUAL", meaning: "Contacto visual con aeronave amiga" },
  { id: "picture", code: "PICTURE", meaning: "Describe la situacion tactica completa" },
  { id: "winchester", code: "WINCHESTER", meaning: "Sin armamento disponible" },
  { id: "buddyspike", code: "BUDDY SPIKE", meaning: "Emision de radar proveniente de un aliado" },
  { id: "snaplock", code: "SNAPLOCK", meaning: "Bloqueo de radar instantaneo" },
  { id: "hot", code: "HOT", meaning: "Aspecto de acercamiento (proximo)" },
  { id: "cold", code: "COLD", meaning: "Aspecto de alejamiento" },
  { id: "commout", code: "COMM OUT", meaning: "Radio fuera de servicio" },
  { id: "fencedin", code: "FENCED IN", meaning: "Ingreso a zona de operaciones" },
];

export function isBrevityEntry(value: unknown): value is BrevityEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.code === "string" &&
    typeof e.meaning === "string"
  );
}
