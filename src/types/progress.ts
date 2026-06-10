export interface ProgressInfo {
  current_position?: string | null;
  progress_percentage?: number;
}

export interface ProgressItem {
  book_id: number;
  progress_percentage: number;
  last_read_at: string | null;
}

export interface ReadingProgress {
  progress_percentage?: number;
  chapter_title?: string | null;
  page_number?: number | null;
  last_read_at?: string | null;
}
