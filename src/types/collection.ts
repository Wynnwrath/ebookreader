export interface Collection {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  bookIds: number[];
  coverImage?: string;
}
