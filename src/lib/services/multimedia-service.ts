import documentsData from "@/data/multimedia/documents.json";
import galleryData from "@/data/multimedia/gallery.json";
import videosData from "@/data/multimedia/videos.json";
import newsData from "@/data/multimedia/news.json";
import blogData from "@/data/multimedia/blog.json";
import type {
  MultimediaDocument,
  GalleryItem,
  VideoItem,
  NewsItem,
  BlogItem,
  MultimediaCategory,
  SearchResult,
  SearchResults,
} from "@/types/multimedia";

const CATEGORY_LABELS: Record<MultimediaCategory, string> = {
  documentos: "Documentos",
  galeria: "Galería",
  videos: "Videos",
  noticias: "Noticias",
  blog: "Blog",
};

function matches(query: string, fields: Array<string | undefined>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}

export class MultimediaService {
  getDocuments(): MultimediaDocument[] {
    return documentsData.documents;
  }

  getGallery(): GalleryItem[] {
    return galleryData.gallery;
  }

  getVideos(): VideoItem[] {
    return videosData.videos;
  }

  getNews(): NewsItem[] {
    return newsData.news;
  }

  getBlog(): BlogItem[] {
    return blogData.blog;
  }

  searchAll(query: string): SearchResults {
    const q = query.trim();

    const groups: SearchResult<unknown>[] = [
      {
        category: "documentos",
        label: CATEGORY_LABELS.documentos,
        items: this.getDocuments().filter((d) =>
          matches(q, [d.name, d.folderPath]),
        ),
      },
      {
        category: "galeria",
        label: CATEGORY_LABELS.galeria,
        items: this.getGallery().filter((g) => matches(q, [g.title])),
      },
      {
        category: "videos",
        label: CATEGORY_LABELS.videos,
        items: this.getVideos().filter((v) => matches(q, [v.title])),
      },
      {
        category: "noticias",
        label: CATEGORY_LABELS.noticias,
        items: this.getNews().filter((n) =>
          matches(q, [n.title, n.summary]),
        ),
      },
      {
        category: "blog",
        label: CATEGORY_LABELS.blog,
        items: this.getBlog().filter((b) => matches(q, [b.title, b.summary])),
      },
    ];

    const nonEmpty = groups.filter((g) => g.items.length > 0);
    const total = nonEmpty.reduce((acc, g) => acc + g.items.length, 0);

    return {
      query: q,
      total,
      groups: nonEmpty,
    };
  }

  getCategoryLabel(category: MultimediaCategory): string {
    return CATEGORY_LABELS[category];
  }
}

export const multimediaService = new MultimediaService();
