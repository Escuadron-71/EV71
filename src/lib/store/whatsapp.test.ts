import { describe, expect, it } from "vitest";
import {
  buildProductMessage,
  buildProductWhatsAppLink,
  buildWhatsAppLink,
  descuentoPct,
  formatPrice,
  sanitizePhone,
} from "./whatsapp";
import type { Product } from "@/types/store";

const product: Product = {
  slug: "parche-escuadron-71",
  nombre: "Parche bordado Escuadrón 71",
  precio: 25000,
  moneda: "COP",
  categoria: "Insignias",
  imagen: "assets/images/products/parche-71.svg",
  descripcion: "Parche bordado",
  especificaciones: [],
  disponible: true,
};

describe("sanitizePhone", () => {
  it("strips spaces, plus and dashes keeping digits", () => {
    expect(sanitizePhone("+57 300 000 0000")).toBe("573000000000");
    expect(sanitizePhone("57-300-000-0000")).toBe("573000000000");
  });
});

describe("formatPrice", () => {
  it("formats COP with es-CO grouping", () => {
    expect(formatPrice(25000, "COP")).toBe("COP 25.000");
  });
});

describe("descuentoPct", () => {
  it("returns null when there is no previous price", () => {
    expect(descuentoPct(product)).toBeNull();
  });

  it("returns null when the previous price is not higher", () => {
    expect(descuentoPct({ ...product, precioAnterior: product.precio })).toBeNull();
    expect(descuentoPct({ ...product, precioAnterior: 20000 })).toBeNull();
  });

  it("computes the rounded discount percentage", () => {
    expect(descuentoPct({ ...product, precioAnterior: 30000 })).toBe(17);
    expect(descuentoPct({ ...product, precioAnterior: 100000 })).toBe(75);
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with the encoded message", () => {
    const link = buildWhatsAppLink("+57 300 000 0000", "Hola, ¿disponible?");
    expect(link).toBe(
      "https://wa.me/573000000000?text=Hola%2C%20%C2%BFdisponible%3F",
    );
  });
});

describe("buildProductMessage", () => {
  it("includes product name, price and availability notice", () => {
    const message = buildProductMessage(product);
    expect(message).toContain("Parche bordado Escuadrón 71");
    expect(message).toContain("COP 25.000");
    expect(message).toContain("confirmar disponibilidad");
  });

  it("marks out-of-stock products differently", () => {
    const agotado = { ...product, disponible: false };
    expect(buildProductMessage(agotado)).toContain("no esté en stock");
  });
});

describe("buildProductWhatsAppLink", () => {
  it("uses the given phone and product message", () => {
    const link = buildProductWhatsAppLink(product, "573000000000");
    expect(link).toContain("https://wa.me/573000000000?text=");
    expect(decodeURIComponent(link)).toContain("Parche bordado Escuadrón 71");
  });

  it("uses a custom template replacing the product placeholder", () => {
    const conPlantilla = {
      ...product,
      whatsapp: { plantilla: "Quiero el {producto} por favor" },
    };
    const link = buildProductWhatsAppLink(conPlantilla, "573000000000");
    expect(decodeURIComponent(link)).toContain(
      "Quiero el Parche bordado Escuadrón 71 por favor",
    );
  });
});
