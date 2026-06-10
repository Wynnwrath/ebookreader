export interface Book {
  id: number;
  title: string;
  author: string;
  favorite?: boolean;
  progress: number;
  lastRead?: string;
  lastReadAt?: string | null;
}

export interface TauriBook {
  id: number;
  title: string;
  author?: string;
  published_date?: string;
  publisher?: string;
  isbn?: string;
  description?: string;
  cover_url?: string;
  file_path?: string;
  file_type?: string;
}

export interface BookDetails {
  id: number;
  title: string;
  author?: string;
  published_date?: string;
  publisher?: string;
  isbn?: string;
  description?: string;
  cover_url?: string;
  file_path: string;
  file_type: string;
  added_at?: string;
}

export interface Chapter {
  title: string;
  id: string;
  elementTop?: number;
}

export interface UserInfo {
  user_id: number;
  username: string;
}
