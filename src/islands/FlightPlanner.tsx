import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import type { TheaterId } from "@/lib/planner/theaters";
import type { AircraftId } from "@/lib/planner/aircraft";
import { THEATERS, getTheater } from "@/lib/planner/theaters";
import { AIRCRAFT, getAircraft } from "@/lib/planner/aircraft";
import type { MapLayerId } from "@/lib/planner/plugins/map-layers";
import { MAP_LAYERS, getMapLayer, isMapLayerId } from "@/lib/planner/plugins/map-layers";
import type { SamId } from "@/lib/planner/plugins/sam-rings";
import { SAM_SYSTEMS, getSam, isSamId } from "@/lib/planner/plugins/sam-rings";
import type { BullseyePoint } from "@/lib/planner/plugins/bullseye";
import {
  braaFromBullseye,
  formatBraa,
  isBullseyePoint,
} from "@/lib/planner/plugins/bullseye";
import type { CommEntry } from "@/lib/planner/plugins/comms";
import { isCommEntry } from "@/lib/planner/plugins/comms";
import type { BrevityEntry } from "@/lib/planner/plugins/brevity";
import { BREVITY_CODES, isBrevityEntry } from "@/lib/planner/plugins/brevity";
import type { Airfield } from "@/lib/planner/plugins/airfields";
import {
  AIRFIELDS,
  getAirfields,
  formatFreqMhz,
  bandLabelForFreqMhz,
} from "@/lib/planner/plugins/airfields";
import type { KneeboardInput } from "@/lib/planner/kneeboard";
import { buildKneeboardCards } from "@/lib/planner/kneeboard";
import type { BearingMode } from "@/lib/planner/navigation";
import {
  haversineNm,
  initialBearing,
  rhumbLineBearing,
  eteMinutesForLeg,
  greatCirclePoints,
  formatHeading,
  formatDistNm,
  formatEte,
  formatZuluClock,
  parseZuluClock,
  clampMinutesToDay,
  cumulativeEteMinutes,
  departureMinutesForTot,
  requiredSpeedKt,
  etaMinutesPerWaypoint,
} from "@/lib/planner/navigation";

import type * as L from "leaflet";
import PlannerBlock from "@/islands/planner/widgets/PlannerBlock";
import ToolSelector from "@/islands/planner/widgets/ToolSelector";
import type { PlannerTool } from "@/islands/planner/widgets/ToolSelector";
import CommList from "@/islands/planner/widgets/CommList";
import BrevityList from "@/islands/planner/widgets/BrevityList";
import KneeboardExport from "@/islands/planner/widgets/KneeboardExport";

type LeafletModule = typeof import("leaflet");

interface Waypoint {
  id: string;
  lat: number;
  lon: number;
}

interface Leg {
  from: number;
  to: number;
  heading: number;
  distNm: number;
  eteMin: number;
}

interface Threat {
  id: string;
  samId: SamId;
  lat: number;
  lon: number;
}

interface PersistedPlannerState {
  theaterId: TheaterId;
  aircraftId: AircraftId;
  speedKt: number;
  layerId: MapLayerId;
  bearingMode: BearingMode;
  waypoints: Waypoint[];
  threats: Threat[];
  tool: PlannerTool;
  totMinutes: number | null;
  departureMinutes: number | null;
  attackWpIndex: number | null;
  bullseye: BullseyePoint | null;
  frequencies: CommEntry[];
  brevityCodes: BrevityEntry[];
  airfieldsVisible: boolean;
  openBlocks?: Record<string, boolean>;
}

const STORAGE_KEY = "ev71-planner-state";

const BLOCK_MISION = "hud-mision";
const BLOCK_CARTA = "hud-carta";
const BLOCK_RUMBO = "hud-rumbo";
const BLOCK_RUTA = "panel-ruta";
const BLOCK_TRAMOS = "panel-tramos";
const BLOCK_TIEMPOS = "panel-tiempos";
const BLOCK_BULLSEYE = "panel-bullseye";
const BLOCK_FRECUENCIAS = "panel-frecuencias";
const BLOCK_BREVITY = "panel-brevity";
const BLOCK_AMENAZAS = "panel-amenazas";
const BLOCK_BASES = "panel-bases";
const BLOCK_KNEEDBOARD = "panel-kneeboard";
const BLOCK_AYUDA = "panel-ayuda";

const DEFAULT_OPEN_BLOCKS: Record<string, boolean> = {
  [BLOCK_MISION]: true,
  [BLOCK_CARTA]: false,
  [BLOCK_RUMBO]: false,
  [BLOCK_RUTA]: true,
  [BLOCK_TRAMOS]: false,
  [BLOCK_TIEMPOS]: false,
  [BLOCK_BULLSEYE]: false,
  [BLOCK_FRECUENCIAS]: false,
  [BLOCK_BREVITY]: false,
  [BLOCK_AMENAZAS]: false,
  [BLOCK_BASES]: false,
  [BLOCK_KNEEDBOARD]: false,
  [BLOCK_AYUDA]: false,
};

const DEFAULT_STATE: PersistedPlannerState = {
  theaterId: "caucasus",
  aircraftId: "f18",
  speedKt: 400,
  layerId: "satellite",
  bearingMode: "great-circle",
  waypoints: [],
  threats: [],
  tool: "waypoint",
  totMinutes: null,
  departureMinutes: null,
  attackWpIndex: null,
  bullseye: null,
  frequencies: [],
  brevityCodes: [...BREVITY_CODES],
  airfieldsVisible: false,
  openBlocks: { ...DEFAULT_OPEN_BLOCKS },
};

const uid = () => Math.random().toString(36).slice(2, 10);

function buildAirfieldPopupHtml(af: Airfield): string {
  const atc = af.atc;
  const freqRows = atc
    ? ([
        ["HF", atc.hf],
        ["VHF (LO)", atc.vhfLow],
        ["VHF (HI)", atc.vhfHigh],
        ["UHF", atc.uhf],
      ] as const)
        .map(([label, value]) => {
          const band = bandLabelForFreqMhz(value);
          return `<tr><th>${label}</th><td>${formatFreqMhz(value)}${band ? ` <small>${band}</small>` : ""}</td></tr>`;
        })
        .join("")
    : "";
  const runways = af.runways
    .map(
      (rw) =>
        `<div class="planner-airfield-rw"><strong>${rw.name}</strong>` +
        `<span>${rw.main ? rw.main.name : "?"} → ${rw.opposite ? rw.opposite.name : "?"}` +
        ` · ${rw.main ? String(rw.main.heading).padStart(3, "0") : "???"}°/${rw.opposite ? String(rw.opposite.heading).padStart(3, "0") : "???"}°</span></div>`
    )
    .join("");
  return (
    `<div class="planner-airfield-popup">` +
    `<h4>${af.name}${af.civilian ? '<span class="planner-airfield-tag">Civil</span>' : ""}</h4>` +
    `<p class="planner-airfield-coords">${af.lat.toFixed(4)}, ${af.lon.toFixed(4)}</p>` +
    `<p class="planner-airfield-tacan"><strong>TACAN</strong><span>${af.tacan ?? "—"}</span></p>` +
    (freqRows
      ? `<table class="planner-airfield-freqs"><tbody>${freqRows}</tbody></table>`
      : `<p class="planner-airfield-empty">Sin radio ATC</p>`) +
    `<div class="planner-airfield-runways"><strong>Pistas</strong>${runways}</div>` +
    `</div>`
  );
}

function loadState(): PersistedPlannerState {
  const fallback: PersistedPlannerState = DEFAULT_STATE;
  let base: PersistedPlannerState = fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw) as Partial<PersistedPlannerState>;
    const hasValidTheater = THEATERS.some((t) => t.id === p.theaterId);
    const hasValidAircraft = AIRCRAFT.some((a) => a.id === p.aircraftId);
    const hasValidWaypoints =
      Array.isArray(p.waypoints) &&
      p.waypoints.every(
        (w) =>
          w &&
          typeof w.lat === "number" &&
          typeof w.lon === "number" &&
          typeof w.id === "string"
      );
    const hasValidThreats =
      !Array.isArray(p.threats) ||
      p.threats.every(
        (t) =>
          t &&
          isSamId(t.samId) &&
          typeof t.lat === "number" &&
          typeof t.lon === "number" &&
          typeof t.id === "string"
      );
    const isValidTool = p.tool === undefined || p.tool === "waypoint" || p.tool === "threat";
    const isValidTot =
      p.totMinutes === undefined ||
      p.totMinutes === null ||
      (typeof p.totMinutes === "number" && isFinite(p.totMinutes));
    const isValidDeparture =
      p.departureMinutes === undefined ||
      p.departureMinutes === null ||
      (typeof p.departureMinutes === "number" && isFinite(p.departureMinutes));
    const isValidAttackWp =
      p.attackWpIndex === undefined ||
      p.attackWpIndex === null ||
      (typeof p.attackWpIndex === "number" && Number.isInteger(p.attackWpIndex));
    const isValidBullseye =
      p.bullseye === undefined || p.bullseye === null || isBullseyePoint(p.bullseye);
    const hasValidFrequencies =
      !Array.isArray(p.frequencies) || p.frequencies.every((f) => isCommEntry(f));
    const hasValidBrevity =
      !Array.isArray(p.brevityCodes) || p.brevityCodes.every((c) => isBrevityEntry(c));
    const isValidAirfieldsVisible =
      p.airfieldsVisible === undefined || typeof p.airfieldsVisible === "boolean";
    if (
      hasValidTheater &&
      hasValidAircraft &&
      typeof p.speedKt === "number" &&
      isMapLayerId(p.layerId) &&
      (p.bearingMode === "great-circle" || p.bearingMode === "rhumb") &&
      hasValidWaypoints &&
      hasValidThreats &&
      isValidTool &&
      isValidTot &&
      isValidDeparture &&
      isValidAttackWp &&
      isValidBullseye &&
      hasValidFrequencies &&
      hasValidBrevity &&
      isValidAirfieldsVisible
    ) {
      base = {
        theaterId: p.theaterId as TheaterId,
        aircraftId: p.aircraftId as AircraftId,
        speedKt: p.speedKt,
        layerId: p.layerId as MapLayerId,
        bearingMode: p.bearingMode as BearingMode,
        waypoints: p.waypoints as Waypoint[],
        threats: Array.isArray(p.threats) ? (p.threats as Threat[]) : [],
        tool: p.tool ?? "waypoint",
        totMinutes: p.totMinutes ?? null,
        departureMinutes: p.departureMinutes ?? null,
        attackWpIndex: p.attackWpIndex ?? null,
        bullseye:
          p.bullseye === undefined || p.bullseye === null
            ? null
            : (p.bullseye as BullseyePoint),
        frequencies: Array.isArray(p.frequencies) ? (p.frequencies as CommEntry[]) : [],
        brevityCodes: Array.isArray(p.brevityCodes)
          ? (p.brevityCodes as BrevityEntry[])
          : [...BREVITY_CODES],
        airfieldsVisible: p.airfieldsVisible ?? false,
      };
    }
  } catch {}

  const openBlocks = { ...DEFAULT_OPEN_BLOCKS };
  const saved = base.openBlocks;
  if (saved && typeof saved === "object") {
    for (const key of Object.keys(DEFAULT_OPEN_BLOCKS)) {
      if (typeof saved[key] === "boolean") openBlocks[key] = saved[key];
    }
  }
  return { ...base, openBlocks };
}

export default function FlightPlanner() {
  const [theaterId, setTheaterId] = useState<TheaterId>(DEFAULT_STATE.theaterId);
  const [aircraftId, setAircraftId] = useState<AircraftId>(DEFAULT_STATE.aircraftId);
  const [speedKt, setSpeedKt] = useState<number>(DEFAULT_STATE.speedKt);
  const [layerId, setLayerId] = useState<MapLayerId>(DEFAULT_STATE.layerId);
  const [bearingMode, setBearingMode] = useState<BearingMode>(DEFAULT_STATE.bearingMode);
  const [waypoints, setWaypoints] = useState<Waypoint[]>(DEFAULT_STATE.waypoints);
  const [threats, setThreats] = useState<Threat[]>(DEFAULT_STATE.threats);
  const [tool, setTool] = useState<PlannerTool>(DEFAULT_STATE.tool);
  const [activeSamId, setActiveSamId] = useState<SamId>("sa2");
  const [totMinutes, setTotMinutes] = useState<number | null>(DEFAULT_STATE.totMinutes);
  const [departureMinutes, setDepartureMinutes] = useState<number | null>(
    DEFAULT_STATE.departureMinutes
  );
  const [attackWpIndex, setAttackWpIndex] = useState<number | null>(DEFAULT_STATE.attackWpIndex);
  const [bullseye, setBullseye] = useState<BullseyePoint | null>(DEFAULT_STATE.bullseye);
  const [frequencies, setFrequencies] = useState<CommEntry[]>(DEFAULT_STATE.frequencies);
  const [brevityCodes, setBrevityCodes] = useState<BrevityEntry[]>(DEFAULT_STATE.brevityCodes);
  const [airfieldsVisible, setAirfieldsVisible] = useState(DEFAULT_STATE.airfieldsVisible);
  const [kneeboardOpen, setKneeboardOpen] = useState(false);
  const [basesQuery, setBasesQuery] = useState("");
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({
    ...DEFAULT_OPEN_BLOCKS,
  });
  const [mapReady, setMapReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const airfieldMarkersRef = useRef<Map<number, L.Marker>>(new Map());
  const pendingAirfieldFocusRef = useRef<number | null>(null);
  const theaterIdRef = useRef<TheaterId>(theaterId);
  const waypointsRef = useRef<Waypoint[]>(waypoints);
  const threatsRef = useRef<Threat[]>(threats);
  const bullseyeRef = useRef<BullseyePoint | null>(bullseye);
  const toolRef = useRef<PlannerTool>(tool);
  const samIdRef = useRef<SamId>("sa2");
  theaterIdRef.current = theaterId;
  waypointsRef.current = waypoints;
  threatsRef.current = threats;
  bullseyeRef.current = bullseye;
  toolRef.current = tool;
  samIdRef.current = activeSamId;

  useEffect(() => {
    const s = loadState();
    setTheaterId(s.theaterId);
    setAircraftId(s.aircraftId);
    setSpeedKt(s.speedKt);
    setLayerId(s.layerId);
    setBearingMode(s.bearingMode);
    setWaypoints(s.waypoints);
    setThreats(s.threats);
    setTool(s.tool);
    setTotMinutes(s.totMinutes);
    setDepartureMinutes(s.departureMinutes);
    setAttackWpIndex(s.attackWpIndex);
    setBullseye(s.bullseye);
    setFrequencies(s.frequencies);
    setBrevityCodes(s.brevityCodes);
    setAirfieldsVisible(s.airfieldsVisible);
    setOpenBlocks(s.openBlocks ?? { ...DEFAULT_OPEN_BLOCKS });
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const toggleBlock = useCallback((id: string, open: boolean) => {
    setOpenBlocks((prev) => ({ ...prev, [id]: open }));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("planner-focus", focusMode);
    const t = window.setTimeout(() => mapRef.current?.invalidateSize(), 80);
    return () => {
      document.body.classList.remove("planner-focus");
      window.clearTimeout(t);
    };
  }, [focusMode]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theaterId,
        aircraftId,
        speedKt,
        layerId,
        bearingMode,
        waypoints,
        threats,
        tool,
        totMinutes,
        departureMinutes,
        attackWpIndex,
        bullseye,
        frequencies,
        brevityCodes,
        airfieldsVisible,
        openBlocks,
      })
    );
  }, [
    theaterId,
    aircraftId,
    speedKt,
    layerId,
    bearingMode,
    waypoints,
    threats,
    tool,
    totMinutes,
    departureMinutes,
    attackWpIndex,
    bullseye,
    frequencies,
    brevityCodes,
    airfieldsVisible,
    openBlocks,
  ]);

  const onMapClick = useCallback((e: L.LeafletMouseEvent) => {
    const theater = getTheater(theaterIdRef.current);
    const { lat, lng } = e.latlng;
    if (
      lat > theater.bounds.north ||
      lat < theater.bounds.south ||
      lng > theater.bounds.east ||
      lng < theater.bounds.west
    ) {
      return;
    }
    if (toolRef.current === "threat") {
      setThreats((prev) => [
        ...prev,
        {
          id: uid(),
          samId: samIdRef.current,
          lat: Number(lat.toFixed(5)),
          lon: Number(lng.toFixed(5)),
        },
      ]);
      setOpenBlocks((prev) => ({ ...prev, [BLOCK_AMENAZAS]: true }));
      return;
    }
    if (toolRef.current === "bullseye") {
      setBullseye({ lat: Number(lat.toFixed(5)), lon: Number(lng.toFixed(5)) });
      setOpenBlocks((prev) => ({ ...prev, [BLOCK_BULLSEYE]: true }));
      return;
    }
    setWaypoints((prev) => [
      ...prev,
      { id: uid(), lat: Number(lat.toFixed(5)), lon: Number(lng.toFixed(5)) },
    ]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leafletModule = await import("leaflet");
      if (cancelled || !containerRef.current) return;
      leafletRef.current = leafletModule;
      const theater = getTheater(theaterIdRef.current);
      const map = leafletModule.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: theater.minZoom,
      });
      map.setView(theater.center, theater.minZoom + 2);
      leafletModule.control.zoom({ position: "topleft" }).addTo(map);
      leafletModule.control
        .attribution({ position: "bottomleft", prefix: "Escuadrón 71" })
        .addTo(map);
      mapRef.current = map;

      map.on("click", onMapClick);
      map.on("contextmenu", (e: L.LeafletMouseEvent) => {
        e.originalEvent.preventDefault();
        if (toolRef.current === "threat") {
          if (threatsRef.current.length > 0) {
            setThreats((prev) => prev.slice(0, -1));
            showToast("Última amenaza eliminada");
          }
          return;
        }
        if (toolRef.current === "bullseye") {
          if (bullseyeRef.current) {
            setBullseye(null);
            showToast("Bullseye eliminado");
          }
          return;
        }
        if (waypointsRef.current.length > 0) {
          setWaypoints((prev) => prev.slice(0, -1));
          showToast("Último waypoint eliminado");
        }
      });

      setMapReady(true);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      leafletRef.current = null;
      overlayRef.current = null;
    };
  }, [onMapClick, showToast]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    const layer = getMapLayer(layerId);
    L.tileLayer(layer.baseUrl, {
      attribution: layer.attribution,
      maxZoom: layer.maxZoom,
    }).addTo(map);
    layer.subLayers?.forEach((sub) => {
      L.tileLayer(sub.url, {
        attribution: sub.attribution,
        maxZoom: layer.maxZoom,
      }).addTo(map);
    });
  }, [mapReady, layerId]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) return;
    const map = mapRef.current;
    const theater = getTheater(theaterId);
    map.setMinZoom(theater.minZoom);
    map.setMaxBounds([
      [theater.bounds.south, theater.bounds.west],
      [theater.bounds.north, theater.bounds.east],
    ]);
    map.fitBounds(
      [
        [theater.bounds.south, theater.bounds.west],
        [theater.bounds.north, theater.bounds.east],
      ],
      { padding: [16, 16] }
    );
  }, [mapReady, theaterId]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapRef.current;
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
      overlayRef.current = null;
    }
    const group = L.layerGroup();
    airfieldMarkersRef.current.clear();

    if (waypoints.length >= 2) {
      const points: [number, number][] = [];
      if (bearingMode === "great-circle") {
        for (let i = 0; i < waypoints.length - 1; i++) {
          const a = waypoints[i];
          const b = waypoints[i + 1];
          const seg = greatCirclePoints(a.lat, a.lon, b.lat, b.lon, 24);
          if (i > 0) seg.shift();
          points.push(...seg);
        }
      } else {
        points.push(...waypoints.map((w) => [w.lat, w.lon] as [number, number]));
      }
      L.polyline(points, {
        color: "#E8B25C",
        weight: 2,
        dashArray: "5 5",
        opacity: 0.9,
      }).addTo(group);
    }

    waypoints.forEach((w, i) => {
      const icon = L.divIcon({
        className: "planner-marker-wrap",
        html: `<div class="planner-marker"><span>WP${i}</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      L.marker([w.lat, w.lon], { icon }).addTo(group);
    });

    threats.forEach((t) => {
      const sam = getSam(t.samId);
      const center: [number, number] = [t.lat, t.lon];
      L.circle(center, {
        radius: sam.detectionNm * 1852,
        color: "#F2B84B",
        weight: 1,
        dashArray: "6 6",
        fillColor: "#F2B84B",
        fillOpacity: 0.06,
        interactive: false,
      }).addTo(group);
      L.circle(center, {
        radius: sam.engagementNm * 1852,
        color: "#E5586B",
        weight: 1.5,
        fillColor: "#E5586B",
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(group);
      const icon = L.divIcon({
        className: "planner-sam-wrap",
        html: `<div class="planner-sam-marker" title="${sam.nombreLargo}">${sam.nombre}</div>`,
        iconSize: [42, 22],
        iconAnchor: [21, 11],
      });
      L.marker(center, { icon }).addTo(group);
    });

    if (bullseye) {
      const bullIcon = L.divIcon({
        className: "planner-bullseye-wrap",
        html: `<div class="planner-bullseye-marker">◎</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = L.marker([bullseye.lat, bullseye.lon], { icon: bullIcon, draggable: true });
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setBullseye({ lat: Number(pos.lat.toFixed(5)), lon: Number(pos.lng.toFixed(5)) });
      });
      marker.addTo(group);
    }

    if (airfieldsVisible) {
      getAirfields(theaterId).forEach((af) => {
        const icon = L.divIcon({
          className: "planner-airfield-wrap",
          html: `<div class="planner-airfield-marker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21h6"/><path d="M12 21v-8"/><path d="M10 13 12 9l2 4"/><path d="M12 9V4"/><path d="M8 4h8l-1 2h-6Z"/></svg></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const marker = L.marker([af.lat, af.lon], { icon });
        marker.bindPopup(buildAirfieldPopupHtml(af), {
          maxWidth: 300,
          className: "planner-airfield-popup-wrap",
        });
        marker.addTo(group);
        airfieldMarkersRef.current.set(af.id, marker);
      });
    }

    group.addTo(map);
    overlayRef.current = group;

    if (pendingAirfieldFocusRef.current !== null) {
      const target = airfieldMarkersRef.current.get(pendingAirfieldFocusRef.current);
      if (target) target.openPopup();
      pendingAirfieldFocusRef.current = null;
    }
  }, [mapReady, waypoints, threats, bullseye, theaterId, bearingMode, airfieldsVisible]);

  const legs = useMemo<Leg[]>(() => {
    const result: Leg[] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const a = waypoints[i];
      const b = waypoints[i + 1];
      const distNm = haversineNm(a.lat, a.lon, b.lat, b.lon);
      const heading =
        bearingMode === "rhumb"
          ? rhumbLineBearing(a.lat, a.lon, b.lat, b.lon)
          : initialBearing(a.lat, a.lon, b.lat, b.lon);
      result.push({
        from: i,
        to: i + 1,
        heading,
        distNm,
        eteMin: eteMinutesForLeg(distNm, speedKt),
      });
    }
    return result;
  }, [waypoints, bearingMode, speedKt]);

  const totalNm = legs.reduce((acc, l) => acc + l.distNm, 0);
  const totalEteMin = legs.reduce((acc, l) => acc + l.eteMin, 0);
  const cumulativeArr = useMemo(() => cumulativeEteMinutes(legs), [legs]);

  const removeWaypoint = (id: string) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
  };

  const clearAll = () => {
    if (tool === "threat") {
      if (threats.length === 0) return;
      setThreats([]);
      showToast("Amenazas limpiadas");
      return;
    }
    if (tool === "bullseye") {
      if (!bullseye) return;
      setBullseye(null);
      showToast("Bullseye eliminado");
      return;
    }
    if (waypoints.length === 0) return;
    setWaypoints([]);
    showToast("Ruta limpiada");
  };

  const centerOnWaypoint = (lat: number, lon: number) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.setView([lat, lon], Math.max(map.getZoom(), 9), { animate: true });
  };

  const focusAirfield = (af: Airfield) => {
    pendingAirfieldFocusRef.current = af.id;
    if (!airfieldsVisible) {
      setAirfieldsVisible(true);
    } else {
      const marker = airfieldMarkersRef.current.get(af.id);
      if (marker) marker.openPopup();
    }
    const map = mapRef.current;
    if (map) {
      map.setView([af.lat, af.lon], Math.max(map.getZoom(), 9), { animate: true });
    }
  };

  const toggleAirfields = () => {
    const next = !airfieldsVisible;
    setAirfieldsVisible(next);
    showToast(next ? "Bases aéreas visibles" : "Bases aéreas ocultas");
  };

  const onTheaterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as TheaterId;
    if (id === theaterId) return;
    setTheaterId(id);
    setWaypoints([]);
    setThreats([]);
    setBullseye(null);
    setAttackWpIndex(null);
    setTool("waypoint");
    showToast("Teatro cambiado — plan limpio");
  };

  const onAircraftChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as AircraftId;
    setAircraftId(id);
    setSpeedKt(getAircraft(id).defaultSpeedKt);
  };

  const onSpeedChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") return;
    const v = Number(e.target.value);
    if (!Number.isFinite(v)) return;
    setSpeedKt(Math.min(900, Math.max(50, v)));
  };

  const removeThreat = (id: string) => {
    setThreats((prev) => prev.filter((t) => t.id !== id));
  };

  const onToolChange = (next: PlannerTool) => {
    if (next === tool) return;
    setTool(next);
    if (next === "threat") {
      setOpenBlocks((prev) => ({ ...prev, [BLOCK_AMENAZAS]: true }));
    }
    if (next === "bullseye") {
      setOpenBlocks((prev) => ({ ...prev, [BLOCK_BULLSEYE]: true }));
    }
    const toolToasts: Record<PlannerTool, string> = {
      waypoint: "Modo navegación: clic agrega waypoint",
      threat: "Modo amenazas: clic coloca un SAM",
      bullseye: "Modo referencia: clic coloca el bullseye",
    };
    showToast(toolToasts[next]);
  };

  const onSamChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as SamId;
    if (isSamId(id)) setActiveSamId(id);
  };

  const onTotInput = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    const parsed = v === "" ? null : parseZuluClock(v);
    setTotMinutes(parsed);
    if (parsed !== null) {
      setOpenBlocks((prev) => ({ ...prev, [BLOCK_TIEMPOS]: true }));
    }
  };

  const onDepartureInput = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    const parsed = v === "" ? null : parseZuluClock(v);
    setDepartureMinutes(parsed);
    if (parsed !== null) {
      setOpenBlocks((prev) => ({ ...prev, [BLOCK_TIEMPOS]: true }));
    }
  };

  const onAttackWpChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setAttackWpIndex(v === "" ? null : Number(v));
  };

  const applyRequiredSpeed = () => {
    if (reqSpeed === null) return;
    setSpeedKt(Math.min(900, Math.max(50, Math.round(reqSpeed))));
    showToast(`Velocidad ajustada a ${Math.round(reqSpeed)} kt`);
  };

  const attackIdx =
    attackWpIndex !== null && attackWpIndex >= 0 && attackWpIndex < waypoints.length
      ? attackWpIndex
      : waypoints.length > 0
        ? waypoints.length - 1
        : null;

  const legsToAttack = attackIdx !== null ? legs.slice(0, attackIdx) : [];
  const distToAttackNm = legsToAttack.reduce((acc, l) => acc + l.distNm, 0);
  const eteToAttackMin = legsToAttack.reduce((acc, l) => acc + l.eteMin, 0);

  const computedDeparture =
    totMinutes !== null && attackIdx !== null ? departureMinutesForTot(totMinutes, eteToAttackMin) : null;

  const effectiveDeparture = departureMinutes ?? computedDeparture;

  const etaByWp =
    effectiveDeparture !== null && legs.length > 0
      ? etaMinutesPerWaypoint(legs, effectiveDeparture)
      : null;

  const reqSpeed =
    totMinutes !== null &&
    departureMinutes !== null &&
    attackIdx !== null &&
    distToAttackNm > 0
      ? (() => {
          const available = clampMinutesToDay(totMinutes - departureMinutes);
          return available > 0 ? requiredSpeedKt(distToAttackNm, available) : null;
        })()
      : null;

  const theater = getTheater(theaterId);
  const aircraft = getAircraft(aircraftId);

  const airfields = useMemo(() => getAirfields(theaterId), [theaterId]);
  const filteredAirfields = useMemo(() => {
    const q = basesQuery.trim().toLowerCase();
    if (!q) return airfields;
    return airfields.filter((a) => a.name.toLowerCase().includes(q));
  }, [airfields, basesQuery]);

  const kneeboardInput = useMemo<KneeboardInput>(
    () => ({
      theaterNombre: theater.nombre,
      aircraftNombre: aircraft.nombre,
      speedKt,
      bearingLabel: bearingMode === "great-circle" ? "Gran círculo" : "Loxodrómica",
      waypoints,
      legs,
      totalNm,
      totalEteMin,
      cumulativeMin: cumulativeArr,
      etaByWp,
      totMinutes,
      departureMinutes: effectiveDeparture,
      bullseye,
      frequencies,
      brevityCodes,
      threats: threats.map((t) => ({ samNombre: getSam(t.samId).nombre, lat: t.lat, lon: t.lon })),
    }),
    [
      theater.nombre,
      aircraft.nombre,
      speedKt,
      bearingMode,
      waypoints,
      legs,
      totalNm,
      totalEteMin,
      cumulativeArr,
      etaByWp,
      totMinutes,
      effectiveDeparture,
      bullseye,
      frequencies,
      brevityCodes,
      threats,
    ]
  );
  const kneeboardCards = useMemo(() => buildKneeboardCards(kneeboardInput), [kneeboardInput]);

  return (
    <div className="planner-app">
      {toast && (
        <div className="planner-toast" role="status">
          {toast}
        </div>
      )}

      <div className="planner-hud">
        <PlannerBlock
          id={BLOCK_MISION}
          title="Misión"
          open={openBlocks[BLOCK_MISION]}
          onToggle={toggleBlock}
        >
          <div className="planner-hud-group">
            <label className="planner-hud-field">
              <span>Teatro</span>
              <select value={theaterId} onChange={onTheaterChange}>
                {THEATERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="planner-hud-field">
              <span>Aeronave</span>
              <select value={aircraftId} onChange={onAircraftChange}>
                {AIRCRAFT.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="planner-hud-field">
              <span>Velocidad</span>
              <span className="planner-speed">
                <input
                  type="number"
                  min={50}
                  max={900}
                  step={10}
                  value={speedKt}
                  onChange={onSpeedChange}
                  aria-label="Velocidad en nudos"
                />
                <span className="planner-speed-unit">kt</span>
              </span>
            </label>
          </div>
        </PlannerBlock>

        <PlannerBlock
          id={BLOCK_CARTA}
          title="Carta"
          open={openBlocks[BLOCK_CARTA]}
          onToggle={toggleBlock}
        >
          <div className="planner-hud-seg" role="group" aria-label="Capa del mapa">
            {MAP_LAYERS.map((l) => (
              <button
                key={l.id}
                className={layerId === l.id ? "is-active" : ""}
                onClick={() => setLayerId(l.id)}
                title={l.descripcion}
              >
                {l.nombre}
              </button>
            ))}
          </div>
        </PlannerBlock>

        <div className="planner-hud-toolbar">
          <span className="planner-hud-toolbar-label">Herramienta</span>
          <div className="planner-tools-row">
            <ToolSelector tool={tool} onToolChange={onToolChange} />
            <button
              type="button"
              className={`planner-tool planner-tool--toggle${airfieldsVisible ? " is-active" : ""}`}
              onClick={toggleAirfields}
              title="Mostrar u ocultar los aeródromos del teatro"
              aria-pressed={airfieldsVisible}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21h6" />
                <path d="M12 21v-8" />
                <path d="M10 13 12 9l2 4" />
                <path d="M12 9V4" />
                <path d="M8 4h8l-1 2h-6Z" />
              </svg>
              <span className="planner-tool-label">Bases</span>
            </button>
          </div>
        </div>

        <PlannerBlock
          id={BLOCK_RUMBO}
          title="Rumbo"
          open={openBlocks[BLOCK_RUMBO]}
          onToggle={toggleBlock}
        >
          <div className="planner-hud-seg" role="group" aria-label="Modo de navegacion">
            <button
              className={bearingMode === "great-circle" ? "is-active" : ""}
              onClick={() => setBearingMode("great-circle")}
              title="Gran circulo (ruta corta)"
            >
              G. Círculo
            </button>
            <button
              className={bearingMode === "rhumb" ? "is-active" : ""}
              onClick={() => setBearingMode("rhumb")}
              title="Loxodromica (rumbo constante)"
            >
              Loxo
            </button>
          </div>
        </PlannerBlock>

        <div className="planner-hud-actions">
          <button
            className="planner-hud-action"
            onClick={clearAll}
            disabled={
              tool === "threat"
                ? threats.length === 0
                : tool === "bullseye"
                  ? !bullseye
                  : waypoints.length === 0
            }
          >
            Limpiar
          </button>
          <button
            className="planner-hud-action planner-hud-action--focus"
            onClick={() => setFocusMode((prev) => !prev)}
            title="Ocultar paneles y maximizar el mapa"
          >
            {focusMode ? "Salir" : "Enfoque"}
          </button>
        </div>
      </div>

      <div className="planner-map" ref={containerRef} aria-label="Mapa del planificador">
        {focusMode && (
          <button
            type="button"
            className="planner-focus-exit"
            onClick={() => setFocusMode(false)}
            aria-label="Salir del modo enfoque"
          >
            ✕ Salir
          </button>
        )}
      </div>

      <aside className="planner-panel" aria-label="Waypoints y tramos">
        <PlannerBlock
          id={BLOCK_RUTA}
          title="Ruta"
          badge={waypoints.length > 0 ? `${waypoints.length} WP` : undefined}
          open={openBlocks[BLOCK_RUTA]}
          onToggle={toggleBlock}
        >
          {waypoints.length === 0 ? (
            <div className="planner-empty">
              <span>Sin waypoints</span>
              <small>Clic en el mapa para crear el WP0</small>
            </div>
          ) : (
            <ul className="planner-wp-list">
              {waypoints.map((w, i) => (
                <li key={w.id} className="planner-wp-item">
                  <span className="planner-wp-main">
                    <span className="planner-wp-index">WP{i}</span>
                    <span className="planner-wp-coords">
                      {w.lat.toFixed(4)}, {w.lon.toFixed(4)}
                    </span>
                  </span>
                  <span className="planner-wp-actions">
                    <button
                      className="planner-wp-btn"
                      title="Centrar en el mapa"
                      aria-label={`Centrar WP${i}`}
                      onClick={() => centerOnWaypoint(w.lat, w.lon)}
                    >
                      ⌖
                    </button>
                    <button
                      className="planner-wp-btn planner-wp-btn--danger"
                      title="Eliminar"
                      aria-label={`Eliminar WP${i}`}
                      onClick={() => removeWaypoint(w.id)}
                    >
                      ×
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PlannerBlock>

        <PlannerBlock
          id={BLOCK_TRAMOS}
          title="Tramos"
          badge={legs.length > 0 ? formatEte(totalEteMin) : undefined}
          open={openBlocks[BLOCK_TRAMOS]}
          onToggle={toggleBlock}
        >
          {legs.length > 0 ? (
            <div className="planner-legs">
              {legs.map((l, i) => {
                const eta = etaByWp !== null ? etaByWp[l.to] : undefined;
                return (
                  <div key={`${l.from}-${l.to}`} className="planner-leg-card">
                    <div className="planner-leg-head">
                      <span className="planner-leg-pair">
                        WP{l.from} <span aria-hidden="true">→</span> WP{l.to}
                      </span>
                      {eta !== undefined && (
                        <span className="planner-leg-eta">{formatZuluClock(eta)}</span>
                      )}
                    </div>
                    <div className="planner-leg-grid">
                      <div className="planner-leg-stat">
                        <span className="planner-leg-label">Rumbo</span>
                        <span className="planner-leg-value">{formatHeading(l.heading)}</span>
                      </div>
                      <div className="planner-leg-stat">
                        <span className="planner-leg-label">Distancia</span>
                        <span className="planner-leg-value">{formatDistNm(l.distNm)}</span>
                      </div>
                      <div className="planner-leg-stat">
                        <span className="planner-leg-label">ETE</span>
                        <span className="planner-leg-value">{formatEte(l.eteMin)}</span>
                      </div>
                      <div className="planner-leg-stat">
                        <span className="planner-leg-label">ACUM</span>
                        <span className="planner-leg-value">{formatEte(cumulativeArr[i])}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="planner-leg-total">
                <span>TOTAL</span>
                <span>{formatDistNm(totalNm)}</span>
                <span>{formatEte(totalEteMin)}</span>
              </div>
            </div>
          ) : (
            <div className="planner-empty">
              <span>Sin tramos</span>
              <small>Agrega al menos 2 waypoints</small>
            </div>
          )}
        </PlannerBlock>

        <PlannerBlock
          id={BLOCK_TIEMPOS}
          title="Tiempos (Z)"
          badge={totMinutes !== null ? formatZuluClock(totMinutes).slice(0, 5) : undefined}
          open={openBlocks[BLOCK_TIEMPOS]}
          onToggle={toggleBlock}
        >
          {waypoints.length > 0 && (
            <div className="planner-times">
              <div className="planner-times-grid">
              <label className="planner-times-field planner-times-field--wide">
                <span>WP de ataque</span>
                <select
                  value={attackIdx !== null ? String(attackIdx) : ""}
                  onChange={onAttackWpChange}
                >
                  <option value="">—</option>
                  {waypoints.map((w, i) => (
                    <option key={w.id} value={i}>
                      WP{i}
                    </option>
                  ))}
                </select>
              </label>
              <label className="planner-times-field">
                <span>TOT</span>
                <input
                  type="time"
                  value={totMinutes !== null ? formatZuluClock(totMinutes).slice(0, 5) : ""}
                  onChange={onTotInput}
                  aria-label="Tiempo sobre objetivo en Zulu"
                />
              </label>
              <label className="planner-times-field">
                <span>Despegue</span>
                <input
                  type="time"
                  value={
                    departureMinutes !== null
                      ? formatZuluClock(departureMinutes).slice(0, 5)
                      : ""
                  }
                  onChange={onDepartureInput}
                  aria-label="Hora de despegue en Zulu"
                />
              </label>
            </div>
            {attackIdx !== null && totMinutes !== null && computedDeparture !== null && (
              <div className="planner-times-out">
                <span>Despegue calculado</span>
                <strong>{formatZuluClock(computedDeparture)}</strong>
              </div>
            )}
            {reqSpeed !== null && (
              <div className="planner-times-out">
                <span>Vel. requerida</span>
                <strong>{Math.round(reqSpeed)} kt</strong>
                <button onClick={applyRequiredSpeed} title="Aplicar velocidad calculada">
                  Aplicar
                </button>
              </div>
            )}
            </div>
          )}
        </PlannerBlock>

        {(bullseye !== null || tool === "bullseye") && (
          <PlannerBlock
            id={BLOCK_BULLSEYE}
            title="Bullseye"
            badge={bullseye ? "BR" : undefined}
            open={openBlocks[BLOCK_BULLSEYE]}
            onToggle={toggleBlock}
          >
            {bullseye === null ? (
              <div className="planner-empty">
                <span>Sin bullseye</span>
                <small>Clic en el mapa coloca la referencia</small>
              </div>
            ) : (
              <div className="planner-bullseye">
                <div className="planner-bullseye-head">
                  <span className="planner-wp-coords">
                    {bullseye.lat.toFixed(4)}, {bullseye.lon.toFixed(4)}
                  </span>
                  <button
                    className="planner-wp-btn planner-wp-btn--danger"
                    title="Eliminar bullseye"
                    aria-label="Eliminar bullseye"
                    onClick={() => setBullseye(null)}
                  >
                    ×
                  </button>
                </div>
                {waypoints.length === 0 ? (
                  <div className="planner-empty">
                    <span>Sin waypoints</span>
                    <small>Agrega waypoints para ver su BR</small>
                  </div>
                ) : (
                  <table className="planner-leg-table planner-braa-table">
                    <thead>
                      <tr>
                        <th>WP</th>
                        <th>BR desde bullseye</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waypoints.map((w, i) => (
                        <tr key={w.id}>
                          <td>WP{i}</td>
                          <td className="planner-leg-eta">{formatBraa(braaFromBullseye(w, bullseye))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="planner-bullseye-note">
                  Callout de posicion relativa al bullseye (rumbo/alcance). El marcador se puede
                  arrastrar sobre el mapa.
                </p>
              </div>
            )}
          </PlannerBlock>
        )}

        <PlannerBlock
          id={BLOCK_FRECUENCIAS}
          title="Frecuencias"
          badge={frequencies.length > 0 ? `${frequencies.length}` : undefined}
          open={openBlocks[BLOCK_FRECUENCIAS]}
          onToggle={toggleBlock}
        >
          <CommList entries={frequencies} onChange={setFrequencies} />
        </PlannerBlock>

        <PlannerBlock
          id={BLOCK_BREVITY}
          title="Brevity"
          badge={brevityCodes.length > 0 ? `${brevityCodes.length}` : undefined}
          open={openBlocks[BLOCK_BREVITY]}
          onToggle={toggleBlock}
        >
          <BrevityList codes={brevityCodes} onChange={setBrevityCodes} />
        </PlannerBlock>

        {(threats.length > 0 || tool === "threat") && (
          <PlannerBlock
            id={BLOCK_AMENAZAS}
            title="Amenazas"
            badge={threats.length > 0 ? `${threats.length}` : undefined}
            open={openBlocks[BLOCK_AMENAZAS]}
            onToggle={toggleBlock}
          >
            <label className="planner-hud-field">
              <span>Unidad SAM</span>
              <select value={activeSamId} onChange={onSamChange}>
                {SAM_SYSTEMS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} — {s.radar}
                  </option>
                ))}
              </select>
            </label>
            {threats.length === 0 ? (
              <div className="planner-empty">
                <span>Sin amenazas</span>
                <small>Clic en el mapa coloca un SAM</small>
              </div>
            ) : (
              <>
                <ul className="planner-threat-list">
                  {threats.map((t) => {
                    const sam = getSam(t.samId);
                    return (
                      <li key={t.id} className="planner-threat-item">
                        <span className="planner-threat-badge">{sam.nombre}</span>
                        <span className="planner-wp-coords">
                          {t.lat.toFixed(4)}, {t.lon.toFixed(4)}
                        </span>
                        <button
                          className="planner-wp-btn planner-wp-btn--danger"
                          title="Eliminar"
                          aria-label="Eliminar amenaza"
                          onClick={() => removeThreat(t.id)}
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="planner-legend">
                  <span className="planner-legend-item">
                    <i className="planner-legend-swatch planner-legend-swatch--detect" />
                    Detección
                  </span>
                  <span className="planner-legend-item">
                    <i className="planner-legend-swatch planner-legend-swatch--engage" />
                    Disparo
                  </span>
                </div>
              </>
            )}
          </PlannerBlock>
        )}

        <PlannerBlock
          id={BLOCK_BASES}
          title="Bases aéreas"
          badge={airfields.length > 0 ? `${airfields.length}` : undefined}
          open={openBlocks[BLOCK_BASES]}
          onToggle={toggleBlock}
        >
          <div className="planner-bases">
            <input
              type="search"
              className="planner-bases-search"
              placeholder="Buscar base..."
              value={basesQuery}
              onChange={(e) => setBasesQuery(e.target.value)}
              aria-label="Buscar base aérea"
            />
            {!airfieldsVisible && (
              <p className="planner-bases-note">
                La capa está oculta. Activa <strong>Bases</strong> en la herramienta para ver los
                marcadores en el mapa.
              </p>
            )}
            {filteredAirfields.length === 0 ? (
              <div className="planner-empty">
                <span>Sin resultados</span>
              </div>
            ) : (
              <ul className="planner-bases-list">
                {filteredAirfields.map((af) => (
                  <li key={af.id} className="planner-bases-item">
                    <button
                      type="button"
                      className="planner-bases-btn"
                      onClick={() => focusAirfield(af)}
                    >
                      <span className="planner-bases-name">
                        {af.name}
                        {af.civilian ? " · Civil" : ""}
                      </span>
                      <span className="planner-bases-meta">
                        {af.runways.length} pista{af.runways.length > 1 ? "s" : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PlannerBlock>

        <PlannerBlock
          id={BLOCK_KNEEDBOARD}
          title="Kneeboard"
          badge={kneeboardCards.length > 0 ? `${kneeboardCards.length}` : undefined}
          open={openBlocks[BLOCK_KNEEDBOARD]}
          onToggle={toggleBlock}
        >
          <div className="planner-kneeboard">
            <p className="planner-kneeboard-desc">
              Genera cards PNG 512×512 con el plan actual (waypoints, tramos, frecuencias, brevity
              y amenazas) listas para el kneeboard de DCS.
            </p>
            <button
              type="button"
              className="planner-hud-action planner-kneeboard-gen"
              onClick={() => setKneeboardOpen(true)}
            >
              Generar kneeboard
            </button>
          </div>
        </PlannerBlock>

        <PlannerBlock
          id={BLOCK_AYUDA}
          title="Ayuda"
          open={openBlocks[BLOCK_AYUDA]}
          onToggle={toggleBlock}
        >
          <div className="planner-help">
            <h4>Cómo usar</h4>
            <ol>
              <li>Clic sobre el mapa agrega un waypoint</li>
              <li>El rumbo, distancia y ETE se calculan al instante</li>
              <li>Clic derecho elimina el último elemento según la herramienta</li>
              <li>Modo Amenazas: clic coloca un SAM con sus círculos de detección y disparo</li>
              <li>Modo Referencia: clic coloca el bullseye; cada WP muestra su BR (rumbo/alcance)</li>
              <li>
                Bases aéreas: activa <strong>Bases</strong> para ver los aeródromos del teatro;
                clic en un marcador muestra ATC, TACAN y pistas
              </li>
              <li>Fija un TOT en el panel para calcular la velocidad requerida y la hora de despegue</li>
              <li>Agrega frecuencias y códigos brevity como referencia del plan</li>
              <li>
                Exporta el plan como cards PNG para el kneeboard de DCS desde el bloque Kneeboard
              </li>
              <li>La ruta, amenazas y datos se guardan automáticamente en tu navegador</li>
            </ol>
          </div>
        </PlannerBlock>

        <div className="planner-panel-foot">
          <span>
            {theater.nombre} · {aircraft.nombre} · {speedKt} kt
          </span>
          <span>{bearingMode === "great-circle" ? "Gran círculo" : "Loxodrómica"}</span>
        </div>
      </aside>

      <KneeboardExport
        open={kneeboardOpen}
        onClose={() => setKneeboardOpen(false)}
        cards={kneeboardCards}
      />
    </div>
  );
}
