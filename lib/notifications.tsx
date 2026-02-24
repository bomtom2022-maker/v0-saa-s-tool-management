"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";

export interface Notification {
  id: string;
  type: "add" | "edit" | "delete" | "move" | "reform_overdue" | "low_stock" | "cabinet" | "drawer" | "info" | "entry" | "exit" | "reform_send" | "reform_return" | "invoice" | "supplier" | "user" | "tool_type";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  addNotificationsBatch: (items: Omit<Notification, "id" | "timestamp" | "read">[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "init-1",
      type: "info",
      title: "Bem-vindo ao TMS One",
      message: "Sistema de gestao de ferramentas CNC iniciado com sucesso.",
      timestamp: new Date(),
      read: false,
    },
  ]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  const addNotificationsBatch = useCallback(
    (items: Omit<Notification, "id" | "timestamp" | "read">[]) => {
      const now = new Date();
      const newNotifications: Notification[] = items.map((item, i) => ({
        ...item,
        id: `notif-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: now,
        read: false,
      }));
      setNotifications((prev) => [...newNotifications, ...prev]);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      addNotificationsBatch,
      markAsRead,
      markAllAsRead,
      clearAll,
      removeNotification,
    }),
    [notifications, unreadCount, addNotification, addNotificationsBatch, markAsRead, markAllAsRead, clearAll, removeNotification]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

// Helper to get icon type
export function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "add":
      return "plus";
    case "edit":
      return "pencil";
    case "delete":
      return "trash";
    case "move":
      return "move";
    case "reform_overdue":
    case "low_stock":
      return "alert";
    case "cabinet":
      return "cabinet";
    case "drawer":
      return "drawer";
    case "entry":
    case "invoice":
      return "entry";
    case "exit":
      return "exit";
    case "reform_send":
      return "reform_send";
    case "reform_return":
      return "reform_return";
    case "supplier":
      return "supplier";
    case "user":
      return "user";
    case "tool_type":
      return "tool_type";
    case "info":
      return "info";
  }
}
