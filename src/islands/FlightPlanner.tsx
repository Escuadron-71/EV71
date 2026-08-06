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

type PlannerTool = "waypoint" | "threat";

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
  openBlocks?: Record<string, boolean>;
}

const STORAGE_KEY = "ev71-planner-state";

const BLOCK_MISION = "hud-mision";
const BLOCK_CARTA = "hud-carta";
const BLOCK_RUMBO = "hud-rumbo";
const BLOCK_RUTA = "panel-ruta";
const BLOCK_TRAMOS = "panel-tramos";
const BLOCK_TIEMPOS = "panel-tiempos";
const BLOCK_AMENAZAS = "panel-amenazas";
const BLOCK_AYUDA = "panel-ayuda";

const DEFAULT_OPEN_BLOCKS: Record<string, boolean> = {
  [BLOCK_MISION]: true,
  [BLOCK_CARTA]: false,
  [BLOCK_RUMBO]: false,
  [BLOCK_RUTA]: true,
  [BLOCK_TRAMOS]: false,
  [BLOCK_TIEMPOS]: false,
  [BLOCK_AMENAZAS]: false,
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
  openBlocks: { ...DEFAULT_OPEN_BLOCKS },
};

const uid = () => Math.random().toString(36).slice(2, 10);

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
      isValidAttackWp
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
  const theaterIdRef = useRef<TheaterId>(theaterId);
  const waypointsRef = useRef<Waypoint[]>(waypoints);
  const threatsRef = useRef<Threat[]>(threats);
  const toolRef = useRef<PlannerTool>(tool);
  const samIdRef = useRef<SamId>("sa2");
  theaterIdRef.current = theaterId;
  waypointsRef.current = waypoints;
  threatsRef.current = threats;
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

    group.addTo(map);
    overlayRef.current = group;
  }, [mapReady, waypoints, threats, theaterId, bearingMode]);

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
    if (waypoints.length === 0) return;
    setWaypoints([]);
    showToast("Ruta limpiada");
  };

  const centerOnWaypoint = (lat: number, lon: number) => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.setView([lat, lon], Math.max(map.getZoom(), 9), { animate: true });
  };

  const onTheaterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as TheaterId;
    if (id === theaterId) return;
    setTheaterId(id);
    setWaypoints([]);
    setThreats([]);
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
    showToast(
      next === "threat" ? "Modo amenazas: clic coloca un SAM" : "Modo navegación: clic agrega waypoint"
    );
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
          <div
            className="planner-hud-seg planner-hud-seg--row"
            role="group"
            aria-label="Herramienta activa"
          >
            <button
              className={tool === "waypoint" ? "is-active" : ""}
              onClick={() => onToolChange("waypoint")}
              title="Clic agrega waypoints de navegación"
            >
              Navegación
            </button>
            <button
              className={tool === "threat" ? "is-active" : ""}
              onClick={() => onToolChange("threat")}
              title="Clic coloca una amenaza SAM"
            >
              Amenazas
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
            disabled={tool === "threat" ? threats.length === 0 : waypoints.length === 0}
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
                  <span className="planner-wp-index">WP{i}</span>
                  <span className="planner-wp-coords">
                    {w.lat.toFixed(4)}, {w.lon.toFixed(4)}
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
              <table className="planner-leg-table">
              <thead>
                <tr>
                  <th>Tramo</th>
                  <th>HDG</th>
                  <th>NM</th>
                  <th>ETE</th>
                  <th>Acum</th>
                  {etaByWp !== null && <th>ETA</th>}
                </tr>
              </thead>
              <tbody>
                {legs.map((l, i) => {
                  const eta = etaByWp !== null ? etaByWp[l.to] : undefined;
                  return (
                    <tr key={`${l.from}-${l.to}`}>
                      <td>
                        WP{l.from} → WP{l.to}
                      </td>
                      <td>{formatHeading(l.heading)}</td>
                      <td>{formatDistNm(l.distNm)}</td>
                      <td>{formatEte(l.eteMin)}</td>
                      <td>{formatEte(cumulativeArr[i])}</td>
                      {etaByWp !== null && (
                        <td className="planner-leg-eta">
                          {eta !== undefined ? formatZuluClock(eta) : "—"}
                        </td>
                      )}
                    </tr>
                  );
                })}
                <tr className="planner-leg-total">
                  <td>TOTAL</td>
                  <td>—</td>
                  <td>{formatDistNm(totalNm)}</td>
                  <td>{formatEte(totalEteMin)}</td>
                  <td>{formatEte(totalEteMin)}</td>
                  {etaByWp !== null && (
                    <td className="planner-leg-eta">
                      {etaByWp[etaByWp.length - 1] !== undefined
                        ? formatZuluClock(etaByWp[etaByWp.length - 1])
                        : "—"}
                    </td>
                  )}
                </tr>
              </tbody>
              </table>
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
              <li>Fija un TOT en el panel para calcular la velocidad requerida y la hora de despegue</li>
              <li>La ruta y amenazas se guardan automáticamente en tu navegador</li>
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
    </div>
  );
}
