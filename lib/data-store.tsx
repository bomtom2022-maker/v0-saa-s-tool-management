"use client";

import React, { createContext, useContext, useState, useMemo } from "react";
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

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [cabinets, setCabinets] = useState<Cabinet[]>(mockCabinets);
  const [drawers, setDrawers] = useState<Drawer[]>(mockDrawers);
  const [tools, setTools] = useState<Tool[]>(mockTools);
  const [movements, setMovements] = useState<Movement[]>(mockMovements);
  const [statuses, setStatuses] = useState<ToolStatus[]>(mockStatuses);
  const [toolTypes, setToolTypes] = useState<ToolType[]>(mockToolTypes);
  const [users, setUsers] = useState<User[]>(mockUsers);

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
