export type DestinationTheme =
  | "wildlife"
  | "nature"
  | "beach"
  | "culture"
  | "heritage"
  | "adventure";

export interface Destination {
  id: number;
  name: string;
  province: string;
  themes: DestinationTheme[];
  image: string;
  galleryImages: string[];
  description: string;
  longDescription: string;
  attractions: string[];
}
