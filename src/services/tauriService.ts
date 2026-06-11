import { invoke } from "@tauri-apps/api/core";
import { 
  TauriBook, 
  BookDetails, 
  Bookmark, 
  Annotation, 
  UserInfo,
  ReadingProgress
} from "../types";

export const tauriService = {
  // Authentication & Session
  async register(username: string, password: string): Promise<void> {
    await invoke("register", { username, password });
  },

  async getAccountInfo(username: string): Promise<UserInfo> {
    return await invoke<UserInfo>("get_account_info", { username });
  },

  // Books
  async listBooks(): Promise<TauriBook[]> {
    return await invoke<TauriBook[]>("list_books");
  },

  async getBookDetails(bookId: number): Promise<BookDetails | null> {
    return await invoke<BookDetails | null>("get_book_details", { bookId });
  },

  async importBook(path: string): Promise<void> {
    await invoke("import_book", { path });
  },

  async removeBook(bookId: number): Promise<void> {
    await invoke("remove_book", { bookId });
  },

  async scanBooksDirectory(directoryPath: string): Promise<string[]> {
    return await invoke<string[]>("scan_books_directory", { directoryPath });
  },

  async getCoverImg(bookId: number): Promise<number[]> {
    return await invoke<number[]>("get_cover_img", { bookId });
  },

  // Reading Progress
  async getReadingProgress(params: { bookId: number; userId?: number }): Promise<ReadingProgress | null> {
    return await invoke<ReadingProgress | null>("get_reading_progress", params);
  },

  async updateReadingProgress(params: {
    userId: number;
    bookId: number;
    currentPosition: string;
    chapterTitle: string;
    pageNumber: number;
    progressPercentage: number;
  }): Promise<void> {
    await invoke("update_reading_progress", params);
  },

  // Bookmarks
  async getBookmarks(params: { userId: number; bookId: number }): Promise<Bookmark[]> {
    return await invoke<Bookmark[]>("get_bookmarks", params);
  },

  async addBookmark(params: {
    userId: number;
    bookId: number;
    position: string;
    chapterTitle: string;
    pageNumber: number;
  }): Promise<void> {
    await invoke("add_bookmark", params);
  },

  async deleteBookmark(bookmarkId: number): Promise<void> {
    await invoke("delete_bookmark", { bookmarkId });
  },

  // Annotations
  async getAnnotations(params: { userId?: number; bookId?: number; limit?: number }): Promise<Annotation[]> {
    return await invoke<Annotation[]>("get_annotations", params);
  },

  // PDF
  async readPdfPage(path: string, pageNumber: number): Promise<{ image_data: string }> {
    return await invoke<{ image_data: string }>("read_pdf_page", { path, pageNumber });
  },

  async getPdfPageCount(path: string): Promise<number> {
    return await invoke<number>("get_pdf_page_count", { path });
  },

  async readEpub(path: string): Promise<string> {
    return await invoke<string>("read_epub", { path });
  },
};
