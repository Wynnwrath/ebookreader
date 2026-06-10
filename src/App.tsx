import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RootLayout from "./layout/RootLayout";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import CollectionsPage from "./pages/CollectionsPage";
import BookPage from "./pages/BookPage";
import "./App.css";
import "./theme.css";
import PlainLayout from "./layout/PlainLayout";
import { HelpPage } from "./pages/InfoPages";
import ProfilePage from "./pages/ProfilePage";
import BookDetailPage from "./pages/BookDetailPage";
import BookPlansPage from "./pages/BookPlansPage";
import { tauriService } from "./services/tauriService";
import { UserInfo } from "./types";

const App: React.FC = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initUser() {
      try {
        await tauriService.register("cruiz", "password").catch(() => {
          // Ignore registration errors if user already exists
        });

        // Retrieve the registered user's ID
        const user = await tauriService.getAccountInfo("cruiz");
        if (user && user.user_id) {
          setUserId(user.user_id);
        } else {
          setUserId(1); // fallback
        }
      } catch (err) {
        console.error("Failed to initialize user session", err);
        setUserId(1); // dev fallback
      } finally {
        setLoading(false);
      }
    }
    initUser();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-bg text-text-dim text-sm font-semibold">
        Initializing Stellaron...
      </div>
    );
  }

  return (
    <Routes>
      {/* App pages inside RootLayout (sidebar, header) */}
      <Route element={<RootLayout userId={userId} />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/plans" element={<BookPlansPage />} />
        <Route path="/book-details/:id" element={<BookDetailPage />} />
      </Route>

      {/* Immersive Reader (standalone, no shared sidebar/header) */}
      <Route path="/book/:id" element={<BookPage userId={userId} />} />

      {/* App pages inside PlainLayout (full screen info pages) */}
      <Route element={<PlainLayout userId={userId} />}>
        <Route path="/help" element={<HelpPage />} />
      </Route>
    </Routes>
  );
}

export default App;
