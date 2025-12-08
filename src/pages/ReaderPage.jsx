import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api"; 
import ReaderPageView from "../components/Reader/ReaderPageView";
import ReaderControls from "../components/Reader/ReaderControls";
import ReaderProgress from "../components/Reader/ReaderProgress";

export default function ReaderPage({ bookId }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [content, setContent] = useState("");

  // Load initial metadata (total pages)
  useEffect(() => {
    async function loadMeta() {
      const total = await invoke("get_total_pages", { bookId });
      setTotalPages(total);
    }
    loadMeta();
  }, [bookId]);

  // Load page content every time currentPage changes
  useEffect(() => {
    async function loadPage() {
      const pageContent = await invoke("get_page", { 
        bookId, 
        pageNumber: currentPage 
      });
      setContent(pageContent);
    }
    loadPage();
  }, [currentPage]);

  return (
    <div className="reader-container">
      <ReaderPageView content={content} />

      <ReaderProgress 
        currentPage={currentPage} 
        totalPages={totalPages} 
      />

      <ReaderControls
        currentPage={currentPage}
        totalPages={totalPages}
        onNext={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
        onPrev={() => setCurrentPage(p => Math.max(p - 1, 1))}
      />
    </div>
  );
}
