import type { Product } from "@/types/store";
import { getStoreWhatsAppNumber } from "./config";

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function formatPrice(precio: number, moneda: string): string {
  const formatted = new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(precio);
  return `${moneda} ${formatted}`;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${sanitizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

export function buildProductMessage(product: Product): string {
  const disponibilidad =
    product.disponible ? "Quisiera confirmar disponibilidad" : "Me interesa aunque no esté en stock";
  return [
    `Hola Escuadrón 71, me interesa el producto: ${product.nombre}`,
    `Precio: ${formatPrice(product.precio, product.moneda)}`,
    disponibilidad,
  ].join("\n");
}

export function buildProductWhatsAppLink(
  product: Product,
  phone: string = getStoreWhatsAppNumber(),
): string {
  const plantilla = product.whatsapp?.plantilla;
  const message = plantilla ? plantilla.replace("{producto}", product.nombre) : buildProductMessage(product);
  const numero = product.whatsapp?.numero || phone;
  return buildWhatsAppLink(numero, message);
}
