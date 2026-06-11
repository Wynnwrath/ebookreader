import { useState, useEffect, useCallback } from "react";
import { Collection } from "../types";

const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: "philosophy",
    name: "Philosophy & Ethics",
    description: "Meditations on existence, morality, and the nature of consciousness.",
    accentColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    bookIds: [],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBADxipR4kafjQ3B8ms2HYo8xOTkT89WTQd142yrxjlu-goN3ohm90i2OVZmx0F8fzm2Y3PAkOlnNczPeFHi3RRIWrkLSltQAmRiffdq1RsCGo1B2sIMZUBo3i2voMuZF3A4-rd-TjRwXN_jWJQ4c7beDY35CuY67hiyQmR84vYPKipwBvW6I_Iwy5oFLf30T1bgWTJbAb831p00dSKjElxlAFAFlDjCVnEhfNMbk3YkjlccZ2qsjxvcyhNHUi0IHqF7iEQUK8wC-s",
  },
  {
    id: "science",
    name: "Science & Nature",
    description: "Inquiries into physical reality, taxonomy, and cosmic structure.",
    accentColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    bookIds: [],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuC0ZOxxfq410kcSfE_qrDjZHcPxYzCCVpKnkaGX-z9i-w4LmBTy1jZksfVxlrl2OCCERqp-QtUmSCFXbcwUXid5QcBBpeG651F472Gjj6qh4_hAJTUE25ll5a3AyrejEJSejEaAfIk84N3Z_irEg8Nzs7AqCFu2zYpZCJfWEWfjfm4wfVwS7lZcTxW9KI-LkSfDDC30faI5h6VHsfljiSw6aqbAV_8DkiXZsVFLyoRBu9ALZppcNkjVl9ffn528Wu2peWc6tAUG44k",
  },
  {
    id: "fiction",
    name: "Literary Fiction",
    description: "Novels, poems, and stories that illuminate the human condition.",
    accentColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    bookIds: [],
    coverImage: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "history",
    name: "Historical Archives",
    description: "Primary sources, biographies, and global histories spanning Antiquity to the Modern Era.",
    accentColor: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    bookIds: [],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLlUf9k2HWN6HAvjNGS34zqHpwj4pboo5htbpCVdpQkBPWFu6-04qg5aFaqb8o82I5UA5NepHukjgkw_DCz-Rhj3GkfzMG7r0AfhPEY9YZ-Pg6u9CSOtFe-CJsyGGthl1-3OwgUQUwPAXtkCEdabro11fUXP3Cd8I97rhixS3vwkS0FCO-qR5eEzdWlpE-KS41nMc769k2H2LyhHd7mXhWY8LNBx4EQq-UMxCUBr8uivQ0Dl8fE67zYsAIGfffAZ-AC0oXhQaqRWE",
  },
];

/**
 * Manages collection CRUD operations backed by localStorage.
 * Replaces duplicated collection logic in HomePage, CollectionsPage, and RootLayout.
 */
export function useCollections(userId: number | null) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const loadCollections = useCallback(() => {
    if (!userId) return;
    const saved = localStorage.getItem(`stellaron-collections-${userId}`);
    if (saved) {
      try {
        const parsed: Collection[] = JSON.parse(saved);
        // Migrate default collections to pick up any updated cover images/descriptions
        const migrated = parsed.map((c) => {
          const matchingDefault = DEFAULT_COLLECTIONS.find((d) => d.id === c.id);
          if (matchingDefault) {
            return { ...matchingDefault, bookIds: c.bookIds };
          }
          return c;
        });
        setCollections(migrated);
      } catch {
        setCollections(DEFAULT_COLLECTIONS);
      }
    } else {
      setCollections(DEFAULT_COLLECTIONS);
      localStorage.setItem(
        `stellaron-collections-${userId}`,
        JSON.stringify(DEFAULT_COLLECTIONS)
      );
    }
  }, [userId]);

  useEffect(() => {
    if (userId) loadCollections();
  }, [userId, loadCollections]);

  const saveCollections = useCallback(
    (updated: Collection[]) => {
      setCollections(updated);
      if (userId) {
        localStorage.setItem(
          `stellaron-collections-${userId}`,
          JSON.stringify(updated)
        );
      }
    },
    [userId]
  );

  const assignBook = useCallback(
    (collectionId: string, bookId: number) => {
      setCollections((prev) => {
        const updated = prev.map((c) => {
          if (c.id === collectionId && !c.bookIds.includes(bookId)) {
            return { ...c, bookIds: [...c.bookIds, bookId] };
          }
          return c;
        });
        if (userId) {
          localStorage.setItem(
            `stellaron-collections-${userId}`,
            JSON.stringify(updated)
          );
        }
        return updated;
      });
    },
    [userId]
  );

  const removeBook = useCallback(
    (collectionId: string, bookId: number) => {
      setCollections((prev) => {
        const updated = prev.map((c) => {
          if (c.id === collectionId) {
            return { ...c, bookIds: c.bookIds.filter((id) => id !== bookId) };
          }
          return c;
        });
        if (userId) {
          localStorage.setItem(
            `stellaron-collections-${userId}`,
            JSON.stringify(updated)
          );
        }
        return updated;
      });
    },
    [userId]
  );

  const deleteCollection = useCallback(
    (collectionId: string) => {
      if (!confirm("Are you sure you want to delete this collection? Books inside will not be deleted.")) {
        return;
      }
      setCollections((prev) => {
        const updated = prev.filter((c) => c.id !== collectionId);
        if (userId) {
          localStorage.setItem(
            `stellaron-collections-${userId}`,
            JSON.stringify(updated)
          );
        }
        return updated;
      });
      setActiveCollectionId((prev) => (prev === collectionId ? null : prev));
    },
    [userId]
  );

  const createCollection = useCallback(
    (newCol: Collection) => {
      setCollections((prev) => {
        const updated = [...prev, newCol];
        if (userId) {
          localStorage.setItem(
            `stellaron-collections-${userId}`,
            JSON.stringify(updated)
          );
        }
        return updated;
      });
    },
    [userId]
  );

  return {
    collections,
    setCollections,
    activeCollectionId,
    setActiveCollectionId,
    loadCollections,
    saveCollections,
    assignBook,
    removeBook,
    deleteCollection,
    createCollection,
  };
}
