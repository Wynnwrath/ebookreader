import { useState, useCallback } from "react";
import { open, message } from "@tauri-apps/plugin-dialog";
import { tauriService } from "../services/tauriService";

interface UseImportOptions {
  onSuccess?: () => void;
}

/**
 * Manages book import operations (single file and directory).
 * Replaces duplicated import handlers in HomePage, LibraryPage, and RootLayout.
 */
export function useImport(options: UseImportOptions = {}) {
  const [importing, setImporting] = useState<boolean>(false);

  const handleImport = useCallback(async () => {
    try {
      setImporting(true);
      const selected = await open({
        multiple: false,
        filters: [{ name: "Ebook / Document", extensions: ["epub", "pdf"] }],
      });
      if (selected && typeof selected === "string") {
        await tauriService.importBook(selected);
        options.onSuccess?.();
        return selected;
      }
    } catch (err) {
      console.error("Failed to import book:", err);
      await message(
        typeof err === "string" ? err : String(err),
        { title: "Import Failed", kind: "error" }
      );
    } finally {
      setImporting(false);
    }
    return null;
  }, [options.onSuccess]);

  const handleImportFolder = useCallback(async () => {
    try {
      setImporting(true);
      const selected = await open({
        multiple: false,
        directory: true,
      });
      if (selected && typeof selected === "string") {
        const errors = await tauriService.scanBooksDirectory(selected);
        options.onSuccess?.();
        if (errors && errors.length > 0) {
          await message(
            `Imported books, but some files failed to import:\n\n${errors.join("\n")}`,
            { title: "Folder Import Warning", kind: "warning" }
          );
        }
        return selected;
      }
    } catch (err) {
      console.error("Failed to import folder:", err);
      await message(
        typeof err === "string" ? err : String(err),
        { title: "Folder Import Failed", kind: "error" }
      );
    } finally {
      setImporting(false);
    }
    return null;
  }, [options.onSuccess]);

  return { handleImport, handleImportFolder, importing };
}
