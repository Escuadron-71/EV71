import { getBase, resolvePath } from "./base-url";

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavSeparator {
  separator: true;
}

export type NavItem = NavLink | NavSeparator;

export interface NavEntry {
  type: "link" | "dropdown";
  label: string;
  href?: string;
  active?: boolean;
  match?: string[];
  items?: NavItem[];
}

const norm = (p: string) => p.replace(/\/+$/, "") || "/";

function routeOf(href: string): string {
  return norm("/" + href.replace(getBase(), ""));
}

function isCurrent(href: string, pathname: string): boolean {
  return routeOf(href) === norm(pathname);
}

function isParentCurrent(matches: string[], pathname: string): boolean {
  const current = norm(pathname);
  return matches.some((prefix) => {
    const route = routeOf(prefix);
    if (route === "/") return false;
    return current === route || current.startsWith(route + "/");
  });
}

function decorate(items: NavItem[], pathname: string): NavItem[] {
  return items.map((item) => {
    if ("separator" in item) return item;
    return { ...item, active: isCurrent(item.href, pathname) };
  });
}

/**
 * Configuracion central del menu de navegacion.
 * SSR-safe: no usa window/document; recibe el pathname en build-time.
 */
export function buildNav(pathname: string): NavEntry[] {
  const link = (label: string, href: string): NavLink => ({ label, href });

  return [
    {
      type: "link",
      label: "Inicio",
      href: resolvePath("/"),
      active: isCurrent(resolvePath("/"), pathname),
    },
    {
      type: "link",
      label: "Operaciones",
      href: resolvePath("/operaciones"),
      active: isCurrent(resolvePath("/operaciones"), pathname),
    },
    {
      type: "dropdown",
      label: "Multimedia",
      match: ["/multimedia"],
      items: decorate(
        [
          link("Documentos", resolvePath("/multimedia#documentos")),
          link("Galería", resolvePath("/multimedia#galeria")),
          link("Videos", resolvePath("/multimedia#videos")),
          link("Noticias", resolvePath("/multimedia#noticias")),
          link("Blog", resolvePath("/multimedia#blog")),
        ],
        pathname,
      ),
    },
    {
      type: "dropdown",
      label: "Nosotros",
      match: ["/nosotros"],
      items: decorate(
        [
          link("Quiénes somos", resolvePath("/#nosotros")),
          { separator: true as const },
          link("Misión y Visión", resolvePath("/nosotros/mision-vision")),
          link("Declaración", resolvePath("/nosotros/declaracion")),
          link("Objetivos", resolvePath("/nosotros/objetivos")),
          link("Reglamento", resolvePath("/nosotros/reglamento")),
          link("Historia", resolvePath("/nosotros/historia")),
          link("Estructura", resolvePath("/nosotros/estructura")),
        ],
        pathname,
      ),
    },
    {
      type: "dropdown",
      label: "Academia",
      match: ["/academia", "/flota", "/login"],
      items: decorate(
        [
          link("AVVA71", resolvePath("/academia/avva71")),
          { separator: true as const },
          link("Curso Básico FR1", resolvePath("/academia/curso-fr1")),
          link("Curso Básico CR1", resolvePath("/academia/curso-cr1")),
          link("Curso Avanzado CR2", resolvePath("/academia/curso-cr2")),
          link("Curso Avanzado CR3", resolvePath("/academia/curso-cr3")),
          { separator: true as const },
          link("Flota", resolvePath("/flota")),
          link("Lista de instructores", resolvePath("/academia/instructores")),
          { separator: true as const },
          link("Ingreso / Login", resolvePath("/login")),
        ],
        pathname,
      ),
    },
    {
      type: "dropdown",
      label: "Herramientas",
      match: ["/dogfight", "/planificador"],
      items: decorate(
        [
          link("Dogfight", resolvePath("/dogfight")),
          link("Planificador", resolvePath("/planificador")),
        ],
        pathname,
      ),
    },
    {
      type: "dropdown",
      label: "Comunidad",
      match: ["/tienda", "/donaciones"],
      items: decorate(
        [
          link("VitrinaVirtual", resolvePath("/tienda")),
          link("Donaciones", resolvePath("/donaciones")),
        ],
        pathname,
      ),
    },
  ];
}
