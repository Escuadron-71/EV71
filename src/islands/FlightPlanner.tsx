import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import type { TheaterId } from "@/lib/planner/theaters";
import type { AircraftId } from "@/lib/planner/aircraft";
import { THEATERS, getTheater } from "@/lib/planner/theaters";
import { AIRCRAFT, getAircraft } from "@/lib/planner/aircraft";
import type { MapLayerId } from "@/lib/planner/plugins/map-layers";
import { MAP_LAYERS, getMapLayer, isMapLayerId } from "@/lib/planner/plugins/map-layers";
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
} from "@/lib/planner/navigation";

import type * as L from "leaflet";

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

interface PersistedPlannerState {
  theaterId: TheaterId;
  aircraftId: AircraftId;
  speedKt: number;
  layerId: MapLayerId;
  bearingMode: BearingMode;
  waypoints: Waypoint[];
}

const STORAGE_KEY = "ev71-planner-state";

const uid = () => Math.random().toString(36).slice(2, 10);

function loadState(): PersistedPlannerState {
  const fallback: PersistedPlannerState = {
    theaterId: "caucasus",
    aircraftId: "f18",
    speedKt: 400,
    layerId: "satellite",
    bearingMode: "great-circle",
    waypoints: [],
  };
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
    if (
      hasValidTheater &&
      hasValidAircraft &&
      typeof p.speedKt === "number" &&
      isMapLayerId(p.layerId) &&
      (p.bearingMode === "great-circle" || p.bearingMode === "rhumb") &&
      hasValidWaypoints
    ) {
      return {
        theaterId: p.theaterId as TheaterId,
        aircraftId: p.aircraftId as AircraftId,
        speedKt: p.speedKt,
        layerId: p.layerId as MapLayerId,
        bearingMode: p.bearingMode as BearingMode,
        waypoints: p.waypoints as Waypoint[],
      };
    }
  } catch {}
  return fallback;
}

export default function FlightPlanner() {
  const [theaterId, setTheaterId] = useState<TheaterId>(() => loadState().theaterId);
  const [aircraftId, setAircraftId] = useState<AircraftId>(() => loadState().aircraftId);
  const [speedKt, setSpeedKt] = useState<number>(() => loadState().speedKt);
  const [layerId, setLayerId] = useState<MapLayerId>(() => loadState().layerId);
  const [bearingMode, setBearingMode] = useState<BearingMode>(() => loadState().bearingMode);
  const [waypoints, setWaypoints] = useState<Waypoint[]>(() => loadState().waypoints);
  const [mapReady, setMapReady] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const theaterIdRef = useRef<TheaterId>(theaterId);
  const waypointsRef = useRef<Waypoint[]>(waypoints);
  theaterIdRef.current = theaterId;
  waypointsRef.current = waypoints;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theaterId, aircraftId, speedKt, layerId, bearingMode, waypoints })
    );
  }, [theaterId, aircraftId, speedKt, layerId, bearingMode, waypoints]);

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

    group.addTo(map);
    overlayRef.current = group;
  }, [mapReady, waypoints, theaterId, bearingMode]);

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

  const removeWaypoint = (id: string) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
  };

  const clearAll = () => {
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
    showToast("Teatro cambiado — ruta limpiada");
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
        <div className="planner-hud-group planner-hud-group--main">
          <label className="planner-hud-field">
            <span>Teatro</span>
            <select
              value={theaterId}
              onChange={onTheaterChange}
            >
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

        <div className="planner-hud-group planner-hud-group--modes">
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
          <div className="planner-hud-actions">
            <button
              className="planner-hud-action"
              onClick={clearAll}
              disabled={waypoints.length === 0}
            >
              Limpiar
            </button>
            <button
              className="planner-hud-help"
              onClick={() => setShowHelp((p) => !p)}
              aria-label="Como funciona"
              title="Como funciona"
            >
              {showHelp ? "✕" : "?"}
            </button>
          </div>
        </div>
      </div>

      <div className="planner-map" ref={containerRef} aria-label="Mapa del planificador" />

      <aside className="planner-panel" aria-label="Waypoints y tramos">
        {showHelp && (
          <div className="planner-help">
            <h4>Cómo usar</h4>
            <ol>
              <li>Clic sobre el mapa agrega un waypoint</li>
              <li>El rumbo, distancia y ETE se calculan al instante</li>
              <li>Clic derecho elimina el último waypoint</li>
              <li>Compara gran círculo vs loxodrómica</li>
              <li>La ruta se guarda automáticamente en tu navegador</li>
            </ol>
          </div>
        )}

        <div className="planner-panel-head">
          <span className="planner-panel-title">RUTA</span>
          <span className="planner-panel-sub">
            {waypoints.length} WP · {theater.nombre}
          </span>
        </div>

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

        {legs.length > 0 && (
          <div className="planner-legs">
            <div className="planner-legs-title">Tramos</div>
            <table className="planner-leg-table">
              <thead>
                <tr>
                  <th>Tramo</th>
                  <th>HDG</th>
                  <th>NM</th>
                  <th>ETE</th>
                </tr>
              </thead>
              <tbody>
                {legs.map((l) => (
                  <tr key={`${l.from}-${l.to}`}>
                    <td>
                      WP{l.from} → WP{l.to}
                    </td>
                    <td>{formatHeading(l.heading)}</td>
                    <td>{formatDistNm(l.distNm)}</td>
                    <td>{formatEte(l.eteMin)}</td>
                  </tr>
                ))}
                <tr className="planner-leg-total">
                  <td>TOTAL</td>
                  <td>—</td>
                  <td>{formatDistNm(totalNm)}</td>
                  <td>{formatEte(totalEteMin)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="planner-panel-foot">
          <span>
            {aircraft.nombre} · {speedKt} kt
          </span>
          <span>{bearingMode === "great-circle" ? "Gran círculo" : "Loxodrómica"}</span>
        </div>
      </aside>
    </div>
  );
}
