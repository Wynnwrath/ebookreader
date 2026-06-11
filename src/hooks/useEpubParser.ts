import { useState, useCallback } from "react";
import { tauriService } from "../services/tauriService";
import { Chapter } from "../types";

interface UseEpubParserReturn {
  htmlContent: string;
  chapters: Chapter[];
  parseEpub: (filePath: string) => Promise<void>;
  parsePdfChapters: (filePath: string) => Promise<void>;
}

/**
 * Handles EPUB HTML parsing and chapter extraction.
 * Also handles PDF page-as-chapter mapping.
 * Replaces duplicated parsing logic in BookPage and BookDetailPage.
 */
export function useEpubParser(): UseEpubParserReturn {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const parseEpub = useCallback(async (filePath: string) => {
    try {
      const epubHtml = await tauriService.readEpub(filePath);

      // Parse chapters from the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(epubHtml, "text/html");

      // Strip heavy styles that interfere with reader theming
      const styleTags = doc.querySelectorAll("style");
      styleTags.forEach((style) => {
        const cleaned = style.textContent
          ?.replace(
            /(?:color|background(?:-color)?|font-family|font-size|line-height)\s*:[^;]+;?/gi,
            ""
          ) ?? "";
        style.textContent = cleaned;
      });

      // Add IDs to headings for navigation
      const headings = Array.from(
        doc.querySelectorAll(
          "h1, h2, h3, h4, h5, h6, [class*='chapter'], [id*='chapter']"
        )
      );

      const parsedChaps: Chapter[] = headings
        .map((h, idx) => {
          if (!h.id) {
            h.id = `chapter-heading-${idx}`;
          }
          return {
            title: h.textContent?.trim() || `Section ${idx + 1}`,
            id: h.id,
          };
        })
        .filter((c) => c.title.length > 0 && c.title.length < 120);

      setHtmlContent(doc.documentElement.outerHTML);
      setChapters(parsedChaps);
    } catch (e) {
      console.warn("Failed to parse EPUB:", e);
      setHtmlContent("");
      setChapters([]);
    }
  }, []);

  const parsePdfChapters = useCallback(async (filePath: string) => {
    try {
      const pageCount = await tauriService.getPdfPageCount(filePath);
      const pdfChaps: Chapter[] = [];
      for (let i = 1; i <= pageCount; i++) {
        pdfChaps.push({ title: `Page ${i}`, id: `page-${i}` });
      }
      setChapters(pdfChaps);
    } catch (e) {
      console.warn("Failed to parse PDF page count:", e);
      setChapters([]);
    }
  }, []);

  return { htmlContent, chapters, parseEpub, parsePdfChapters };
}
