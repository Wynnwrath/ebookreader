import React from "react";
import { Collection } from "./collection";

/**
 * Shared context type for data passed through React Router's Outlet.
 * Replaces the independently re-declared OutletContextType in each page.
 */
export interface AppOutletContext {
  userId: number | null;
  importTrigger: number;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  collections: Collection[];
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  activeCollectionId: string | null;
  setActiveCollectionId: React.Dispatch<React.SetStateAction<string | null>>;
  loadCollections: () => void;
}
