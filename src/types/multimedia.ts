export interface MultimediaDocument {
  id: string;
  name: string;
  mimeType: string;
  folderPath: string;
  webViewLink: string;
  modifiedTime: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  image: string;
  date: string;
}

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  date: string;
}

export interface NewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  url: string;
}

export interface BlogItem {
  id: string;
  title: string;
  date: string;
  summary: string;
  url: string;
}

export type MultimediaCategory = "documentos" | "galeria" | "videos" | "noticias" | "blog";

export interface SearchResult<T> {
  category: MultimediaCategory;
  label: string;
  items: T[];
}

export interface SearchResults {
  query: string;
  total: number;
  groups: SearchResult<unknown>[];
}
