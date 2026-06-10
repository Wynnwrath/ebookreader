export interface Bookmark {
  bookmark_id: number;
  book_id: number;
  user_id: number;
  position: string;
  chapter_title?: string;
  page_number?: number;
}

export interface Annotation {
  id: number;
  book_id: number;
  chapter_title?: string;
  highlighted_text?: string;
  note?: string;
  color?: string;
  created_at?: string;
}

export interface ExtendedAnnotation extends Annotation {
  bookTitle: string;
  bookAuthor: string;
}
