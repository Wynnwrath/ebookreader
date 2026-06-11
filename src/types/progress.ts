export interface ReadingProgress {
  id: number;
  book_id: number;
  current_position: string;
  chapter_title: string | null;
  page_number: number | null;
  progress_percentage: number;
  last_read_at: string | null;
}

export type ProgressItem = ReadingProgress;
export type ProgressInfo = Partial<ReadingProgress>;
