export type Moneda = "COP" | "USD";

export interface ProductSpecs {
  label: string;
  value: string;
}

export interface ProductWhatsApp {
  numero?: string;
  plantilla?: string;
}

export interface Product {
  slug: string;
  nombre: string;
  precio: number;
  moneda: Moneda;
  categoria: string;
  imagen: string;
  descripcion: string;
  especificaciones: ProductSpecs[];
  disponible: boolean;
  publicado?: string;
  nuevo?: boolean;
  precioAnterior?: number;
  whatsapp?: ProductWhatsApp;
}

export interface StoreData {
  timestamp: string;
  note: string;
  productos: Product[];
}
