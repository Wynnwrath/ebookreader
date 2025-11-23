import { useState } from "react";
import AddFolderButton from "../components/LibraryComp/AddFolderButton";
import FolderList from "../components/LibraryComp/FolderList";
import ImportPopup from "../components/LibraryComp/ImportPopup";

export default function LibraryPage() {
  const [folders, setFolders] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [previewFolder, setPreviewFolder] = useState(null);

  const handleAddFolderClick = () => setShowPopup(true);

  const toggleExpand = (index) => {
    setFolders(prev =>
      prev.map((f, i) =>
        i === index ? { ...f, expanded: !f.expanded } : f
      )
    );
  };

  const handleConfirmAdd = () => {
    if (!previewFolder) return;

    setFolders(prev => [
      ...prev,
      { ...previewFolder, expanded: false }
    ]);

    setPreviewFolder(null);
    setShowPopup(false);
  };

  const handleCancel = () => {
    setPreviewFolder(null);
    setShowPopup(false);
  };

  return (
    <div className="min-h-screen w-full text-white p-6 space-y-6 relative">

      {/* Empty state */}
      {folders.length === 0 ? (
        <AddFolderButton onClick={handleAddFolderClick} centered />
      ) : (
        <>
          {/* Top button */}
          <AddFolderButton onClick={handleAddFolderClick} />

          {/* Folder list */}
          <FolderList
            folders={folders}
            toggleExpand={toggleExpand}
          />
        </>
      )}

      {/* Popup */}
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
