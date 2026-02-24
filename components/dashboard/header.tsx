"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Settings,
  Plus,
  Pencil,
  Trash2,
  ArrowRightLeft,
  AlertTriangle,
  PackageMinus,
  Archive,
  Layers,
  Info,
  Check,
  CheckCheck,
  X,
  ArrowDownRight,
  ArrowUpRight,
  Wrench,
  RotateCcw,
  FileText,
  Truck,
  Users,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications, type Notification } from "@/lib/notifications";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

function getIcon(type: Notification["type"]) {
  const iconClass = "h-4 w-4";
  switch (type) {
    case "add":
      return <Plus className={`${iconClass} text-success`} />;
    case "edit":
      return <Pencil className={`${iconClass} text-chart-2`} />;
    case "delete":
      return <Trash2 className={`${iconClass} text-destructive`} />;
    case "move":
      return <ArrowRightLeft className={`${iconClass} text-chart-5`} />;
    case "reform_overdue":
      return <AlertTriangle className={`${iconClass} text-warning`} />;
    case "low_stock":
      return <PackageMinus className={`${iconClass} text-warning`} />;
    case "cabinet":
      return <Archive className={`${iconClass} text-primary`} />;
    case "drawer":
      return <Layers className={`${iconClass} text-primary`} />;
    case "entry":
    case "invoice":
      return <ArrowDownRight className={`${iconClass} text-success`} />;
    case "exit":
      return <ArrowUpRight className={`${iconClass} text-destructive`} />;
    case "reform_send":
      return <Wrench className={`${iconClass} text-warning`} />;
    case "reform_return":
      return <RotateCcw className={`${iconClass} text-sky-400`} />;
    case "supplier":
      return <Truck className={`${iconClass} text-chart-5`} />;
    case "user":
      return <Users className={`${iconClass} text-chart-2`} />;
    case "tool_type":
      return <Tag className={`${iconClass} text-chart-4`} />;
    case "info":
      return <Info className={`${iconClass} text-chart-2`} />;
  }
}

function formatTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin}min atras`;
  if (diffHours < 24) return `${diffHours}h atras`;
  if (diffDays < 7) return `${diffDays}d atras`;
  return date.toLocaleDateString("pt-BR");
}

export function Header({ title, subtitle }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, removeNotification } =
    useNotifications();

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6 mt-14 md:mt-0">
      <div>
        <h1 className="text-lg md:text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={panelRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 md:h-10 md:w-10"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>

          {/* Notification Panel */}
          {isOpen && (
            <div className="fixed inset-x-3 top-[7.5rem] md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-[420px] rounded-lg border border-border bg-card shadow-xl z-50">
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-sm">Notificacoes</h3>
                  {unreadCount > 0 && (
                    <Badge variant="default" className="text-xs h-5 px-1.5">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="mr-1 h-3 w-3" />
                      <span className="hidden sm:inline">Marcar todas</span>
                      <span className="sm:hidden">Todas</span>
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={clearAll}
                    >
                      Limpar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 md:hidden"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto overscroll-contain">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center py-10">
                    <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma notificacao
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 transition-colors active:bg-secondary/40 ${
                        !notif.read ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
                        {getIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                          {formatTime(notif.timestamp)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="shrink-0 flex items-center gap-0.5">
                        {!notif.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Marcar como lida"
                            onClick={() => markAsRead(notif.id)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          title="Remover"
                          onClick={() => removeNotification(notif.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
