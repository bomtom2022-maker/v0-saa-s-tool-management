"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  mockCabinets,
  mockDrawers,
  mockTools,
  mockMovements,
  mockStatuses,
  mockToolTypes,
  mockUsers,
  mockProfiles,
  type Cabinet,
  type Drawer,
  type Tool,
  type Movement,
  type ToolStatus,
  type ToolType,
  type User,
} from "@/lib/mock-data";

interface DataStore {
  cabinets: Cabinet[];
  setCabinets: React.Dispatch<React.SetStateAction<Cabinet[]>>;
  drawers: Drawer[];
  setDrawers: React.Dispatch<React.SetStateAction<Drawer[]>>;
  tools: Tool[];
  setTools: React.Dispatch<React.SetStateAction<Tool[]>>;
  movements: Movement[];
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
  statuses: ToolStatus[];
  setStatuses: React.Dispatch<React.SetStateAction<ToolStatus[]>>;
  toolTypes: ToolType[];
  setToolTypes: React.Dispatch<React.SetStateAction<ToolType[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  profiles: typeof mockProfiles;
}

const DataStoreContext = createContext<DataStore | null>(null);

const STORAGE_KEY = "tms-data-store";

function loadPersistedState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const persisted = useRef(loadPersistedState());

  const [cabinets, setCabinets] = useState<Cabinet[]>(persisted.current?.cabinets ?? mockCabinets);
  const [drawers, setDrawers] = useState<Drawer[]>(persisted.current?.drawers ?? mockDrawers);
  const [tools, setTools] = useState<Tool[]>(persisted.current?.tools ?? mockTools);
  const [movements, setMovements] = useState<Movement[]>(persisted.current?.movements ?? mockMovements);
  const [statuses, setStatuses] = useState<ToolStatus[]>(persisted.current?.statuses ?? mockStatuses);
  const [toolTypes, setToolTypes] = useState<ToolType[]>(persisted.current?.toolTypes ?? mockToolTypes);
  const [users, setUsers] = useState<User[]>(persisted.current?.users ?? mockUsers);

  // Persist state to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cabinets, drawers, tools, movements, statuses, toolTypes, users })
      );
    } catch {
      // ignore quota errors
    }
  }, [cabinets, drawers, tools, movements, statuses, toolTypes, users]);

  const value = useMemo(
    () => ({
      cabinets,
      setCabinets,
      drawers,
      setDrawers,
      tools,
      setTools,
      movements,
      setMovements,
      statuses,
      setStatuses,
      toolTypes,
      setToolTypes,
      users,
      setUsers,
      profiles: mockProfiles,
    }),
    [cabinets, drawers, tools, movements, statuses, toolTypes, users]
  );

  return (
    <DataStoreContext.Provider value={value}>
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}
