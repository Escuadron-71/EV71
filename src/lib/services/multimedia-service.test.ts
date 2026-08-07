import { describe, it, expect } from "vitest";
import { MultimediaService } from "./multimedia-service";

const service = new MultimediaService();

describe("MultimediaService", () => {
  it("returns documents from build-time JSON", () => {
    const docs = service.getDocuments();
    expect(docs.length).toBeGreaterThan(0);
    expect(docs[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      mimeType: expect.any(String),
      webViewLink: expect.any(String),
    });
  });

  it("returns gallery, videos, news and blog collections", () => {
    expect(service.getGallery().length).toBeGreaterThan(0);
    expect(service.getVideos().length).toBeGreaterThan(0);
    expect(service.getNews().length).toBeGreaterThan(0);
    expect(service.getBlog().length).toBeGreaterThan(0);
  });

  it("searchAll returns every category as a non-empty group when query is empty", () => {
    const results = service.searchAll("");
    expect(results.total).toBeGreaterThan(0);
    expect(results.groups.map((g) => g.category)).toEqual([
      "documentos",
      "galeria",
      "videos",
      "noticias",
      "blog",
    ]);
  });

  it("searchAll filters documents by name", () => {
    const results = service.searchAll("checklist");
    expect(results.groups).toHaveLength(1);
    expect(results.groups[0].category).toBe("documentos");
    const [first] = results.groups[0].items as Array<{ name: string }>;
    expect(first.name).toContain("Checklist");
  });

  it("searchAll filters across multiple categories and trims whitespace", () => {
    const results = service.searchAll("  vuelo  ");
    const categories = results.groups.map((g) => g.category);
    expect(categories).toContain("documentos");
    expect(categories).toContain("videos");
    expect(results.query).toBe("vuelo");
  });

  it("searchAll returns empty groups when nothing matches", () => {
    const results = service.searchAll("zzzz-no-existe");
    expect(results.total).toBe(0);
    expect(results.groups).toHaveLength(0);
  });

  it("getCategoryLabel returns Spanish labels", () => {
    expect(service.getCategoryLabel("documentos")).toBe("Documentos");
    expect(service.getCategoryLabel("galeria")).toBe("Galería");
  });
});
