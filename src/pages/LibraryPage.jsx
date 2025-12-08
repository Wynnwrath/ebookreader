import { useEffect, useState } from "react";
import AddFolderButton from "../components/LibraryComp/AddFolderButton";
import FolderList from "../components/LibraryComp/FolderList";
import ImportPopup from "../components/LibraryComp/ImportPopup";
import { fetchLibraryFolders, saveFolder } from "../services/library";

export default function LibraryPage() {
  const [folders, setFolders] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [previewFolder, setPreviewFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLibrary() {
      setLoading(true);
      setError(null);
      try {
        const fetchedFolders = await fetchLibraryFolders();
        if (!isMounted) return;
        setFolders(fetchedFolders);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Unable to load library folders.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLibrary();

    return () => {
      isMounted = false;
    };
  }, []);

  // TEMP: Will be replaced with Tauri folder picker
  const handlePickFolder = () => {
    console.log("[LibraryPage] Folder picker triggered");
  };

  const handleAddFolderClick = () => setShowPopup(true);

  const toggleExpand = (index) => {
    setFolders((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, expanded: !f.expanded } : f
      )
    );
  };

  const handleConfirmAdd = async () => {
    if (!previewFolder) return;

    try {
      const savedFolder = await saveFolder({
        ...previewFolder,
        expanded: false,
      });
      setFolders((prev) => [...prev, savedFolder]);
    } catch (err) {
      setError(err.message || "Unable to save folder.");
    }

    setPreviewFolder(null);
    setShowPopup(false);
  };

  const handleCancel = () => {
    setPreviewFolder(null);
    setShowPopup(false);
  };

  const renderContent = () => {
    if (loading) {
      return <p className="text-gray-300">Loading your library...</p>;
    }

    if (error) {
      return <p className="text-red-300">{error}</p>;
    }

    if (folders.length === 0) {
      return <AddFolderButton onClick={handleAddFolderClick} centered />;
    }

    return (
      <>
        <AddFolderButton onClick={handleAddFolderClick} />
        <FolderList
          folders={folders}
          toggleExpand={toggleExpand}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen w-full text-white p-6 space-y-6 relative">
      {renderContent()}

      {showPopup && (
        <ImportPopup
          previewFolder={previewFolder}
          setPreviewFolder={setPreviewFolder}
          onConfirm={handleConfirmAdd}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}