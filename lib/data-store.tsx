"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from "react";
import {
  mockCabinets,
  mockDrawers,
  mockTools,
  mockMovements,
  mockStatuses,
  mockToolTypes,
  mockUsers,
  mockSuppliers,
  mockProfiles,
  mockReformQueue,
  type Cabinet,
  type Drawer,
  type Tool,
  type Movement,
  type ToolStatus,
  type ToolType,
  type User,
  type Supplier,
  type ReformQueueItem,
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
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  reformQueue: ReformQueueItem[];
  setReformQueue: React.Dispatch<React.SetStateAction<ReformQueueItem[]>>;
  profiles: typeof mockProfiles;
}

const DataStoreContext = createContext<DataStore | null>(null);

const STORAGE_KEY = "tms-data-store-v2";

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [cabinets, setCabinets] = useState<Cabinet[]>(mockCabinets);
  const [drawers, setDrawers] = useState<Drawer[]>(mockDrawers);
  const [tools, setTools] = useState<Tool[]>(mockTools);
  const [movements, setMovements] = useState<Movement[]>(mockMovements);
  const [statuses, setStatuses] = useState<ToolStatus[]>(mockStatuses);
  const [toolTypes, setToolTypes] = useState<ToolType[]>(mockToolTypes);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [reformQueue, setReformQueue] = useState<ReformQueueItem[]>(mockReformQueue);

  // Load persisted data on mount (client only)
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === "object" && data.cabinets) {
          setCabinets(data.cabinets);
          if (data.drawers) setDrawers(data.drawers);
          if (data.tools) setTools(data.tools);
          if (data.movements) setMovements(data.movements);
          if (data.statuses) setStatuses(data.statuses);
          if (data.toolTypes) setToolTypes(data.toolTypes);
          if (data.users) setUsers(data.users);
          if (data.suppliers) setSuppliers(data.suppliers);
          if (data.reformQueue) setReformQueue(data.reformQueue);
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Persist state to sessionStorage on every change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cabinets, drawers, tools, movements, statuses, toolTypes, users, suppliers, reformQueue })
      );
    } catch {
      // ignore quota errors
    }
  }, [cabinets, drawers, tools, movements, statuses, toolTypes, users, suppliers, reformQueue]);

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
      suppliers,
      setSuppliers,
      reformQueue,
      setReformQueue,
      profiles: mockProfiles,
    }),
    [cabinets, drawers, tools, movements, statuses, toolTypes, users, suppliers, reformQueue]
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
