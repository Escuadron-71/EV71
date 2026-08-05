export type MapLayerId = "satellite" | "map" | "hybrid" | "topo";

export interface MapLayerSublayer {
  url: string;
  attribution: string;
}

export interface MapLayer {
  id: MapLayerId;
  nombre: string;
  descripcion: string;
  baseUrl: string;
  attribution: string;
  subLayers?: MapLayerSublayer[];
  maxZoom: number;
}

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";

export const MAP_LAYERS: MapLayer[] = [
  {
    id: "satellite",
    nombre: "Satélite",
    descripcion: "Imágenes aéreas de Esri World Imagery",
    baseUrl: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
    attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
  },
  {
    id: "map",
    nombre: "Mapa",
    descripcion: "Calles y nombres de Esri World Street Map",
    baseUrl: `${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`,
    attribution:
      "&copy; Esri, HERE, Garmin, Foursquare, GeoTechnologies, Inc., &copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
  {
    id: "hybrid",
    nombre: "Híbrido",
    descripcion: "Satélite con etiquetas de nombres",
    baseUrl: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
    attribution:
      "Imagery &copy; Esri, Maxar, Earthstar Geographics &copy; OpenStreetMap contributors &copy; CARTO",
    subLayers: [
      {
        url: "https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      },
    ],
    maxZoom: 19,
  },
  {
    id: "topo",
    nombre: "Topo",
    descripcion: "Terreno y relieve de Esri World Topo Map",
    baseUrl: `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}`,
    attribution:
      "&copy; Esri, USGS, NOAA, OpenStreetMap contributors",
    maxZoom: 19,
  },
];

export function getMapLayer(id: MapLayerId): MapLayer {
  return MAP_LAYERS.find((l) => l.id === id) ?? MAP_LAYERS[0];
}

export function isMapLayerId(value: unknown): value is MapLayerId {
  return MAP_LAYERS.some((l) => l.id === value);
}
