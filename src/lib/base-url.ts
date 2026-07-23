export function getBase(): string {
  return import.meta.env.BASE_URL.replace(/\/?$/, '/');
}

export function resolvePath(path: string): string {
  const base = getBase();
  if (path.startsWith(base) || path.startsWith('http')) return path;
  if (path.startsWith('#')) return `${base.slice(0, -1)}${path}`;
  return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
}
