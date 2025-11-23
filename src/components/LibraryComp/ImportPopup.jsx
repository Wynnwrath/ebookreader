export default function ImportPopup({
  previewFolder,
  setPreviewFolder,
  onConfirm,
  onCancel,
}) {
  const handleSelectFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker();
      await loadFolder(dirHandle);
    } catch (err) {
      console.warn("Canceled or failed:", err);
    }
  };

  const loadFolder = async (handle) => {
    const files = [];

    for await (const entry of handle.values()) {
      if (entry.kind === "file" && /\.(pdf|epub)$/i.test(entry.name)) {
        files.push({
          title: entry.name.replace(/\.[^/.]+$/, ""),
          author: "Unknown",
          coverImage: null,
        });
      }
    }

    if (files.length === 0) {
      alert("No PDF/EPUB files found in folder.");
      return;
    }

    setPreviewFolder({
      name: handle.name,
      books: files,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl p-6 w-[500px] shadow-lg text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#ff4500]">Import Books</h2>
          <button
            onClick={onCancel}
            className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
          >
            Close
          </button>
        </div>

        {/* Choose folder */}
        {!previewFolder && (
          <div
            onClick={handleSelectFolder}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              const item = e.dataTransfer.items[0];
              if (!item) return;

              const handle = await item.getAsFileSystemHandle();
              if (handle.kind !== "directory") {
                alert("Please drag a folder, not a file.");
                return;
              }

              await loadFolder(handle);
            }}
            className="flex flex-col items-center justify-center border-2 border-dashed 
            border-gray-300 rounded-lg h-[300px] cursor-pointer hover:bg-gray-50 transition 
            text-gray-600 text-sm hover:text-[#ff8a00]"
          >
            Click or DRAG a folder here
          </div>
        )}

        {/* Preview */}
        {previewFolder && (
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Folder: {previewFolder.name}
            </h3>

            <div className="max-h-[200px] overflow-y-auto border rounded-md p-2 bg-gray-50">
              {previewFolder.books.map((b, i) => (
                <p
                  key={i}
                  className="text-gray-700 text-sm border-b last:border-none py-1"
                >
                  📘 {b.title}
                </p>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-gradient-to-br from-[#ff8a00] to-[#ff4500] 
                text-white rounded hover:scale-105 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
