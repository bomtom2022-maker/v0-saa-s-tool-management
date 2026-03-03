"use client";

import React from "react";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  LayoutDashboard,
  Settings,
  Package,
  ArrowRightLeft,
  FileText,
  History,
  Users,
  ChevronDown,
  ChevronRight,
  Building2,
  Menu,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: { name: string; href: string }[];
}

const defaultNavigation: NavItem[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: "configuracao",
    name: "Configuracao",
    href: "/configuracao",
    icon: <Settings className="h-5 w-5" />,
    children: [
      { name: "Armarios", href: "/configuracao/armarios" },
      { name: "Tipos de Ferramenta", href: "/configuracao/tipos" },
      { name: "Status", href: "/configuracao/status" },
      { name: "Fornecedores", href: "/configuracao/fornecedores" },
      { name: "Usuarios", href: "/configuracao/usuarios" },
    ],
  },
  {
    id: "catalogo",
    name: "Catalogo",
    href: "/catalogo",
    icon: <Package className="h-5 w-5" />,
  },
  {
    id: "operacoes",
    name: "Operacoes",
    href: "/operacoes",
    icon: <ArrowRightLeft className="h-5 w-5" />,
    children: [
      { name: "Entrada", href: "/operacoes/entrada" },
      { name: "Reforma", href: "/operacoes/reforma" },
      { name: "Enviar para Reforma", href: "/operacoes/enviar-reforma" },
    ],
  },
  {
    id: "historico",
    name: "Historico",
    href: "/historico",
    icon: <History className="h-5 w-5" />,
  },
  {
    id: "relatorios",
    name: "Relatorios",
    href: "/relatorios",
    icon: <FileText className="h-5 w-5" />,
  },
];

function saveOrder(order: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("tms-sidebar-order", JSON.stringify(order));
  } catch {
    // ignore
  }
}

function getOrderedNavigation(items: NavItem[], order: string[] | null): NavItem[] {
  if (!order) return items;
  const mapped = new Map(items.map((item) => [item.id, item]));
  const ordered: NavItem[] = [];
  for (const id of order) {
    const item = mapped.get(id);
    if (item) {
      ordered.push(item);
      mapped.delete(id);
    }
  }
  // Add any items not in the stored order at the end
  for (const item of mapped.values()) {
    ordered.push(item);
  }
  return ordered;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Configuracao", "Operacoes"]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const companyLogoRef = useRef<HTMLInputElement>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);

  // Initialize with default order, then load from localStorage in useEffect
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavigation);
  const hasLoadedOrder = useRef(false);

  // Load order from localStorage only on client side
  React.useEffect(() => {
    if (hasLoadedOrder.current) return;
    hasLoadedOrder.current = true;
    try {
      const stored = localStorage.getItem("tms-sidebar-order");
      if (stored) {
        const order = JSON.parse(stored);
        setNavItems(getOrderedNavigation(defaultNavigation, order));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const closeMobile = () => setIsMobileMenuOpen(false);

  const moveItem = useCallback((index: number, direction: "up" | "down") => {
    setNavItems((prev) => {
      const newItems = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newItems.length) return prev;
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      saveOrder(newItems.map((item) => item.id));
      return newItems;
    });
  }, []);

  // --- Drag and Drop ---
  const dragItemRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragItemRef.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverRef.current = index;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragItemRef.current === null || dragOverRef.current === null) return;
    if (dragItemRef.current === dragOverRef.current) return;

    setNavItems((prev) => {
      const newItems = [...prev];
      const draggedItem = newItems.splice(dragItemRef.current!, 1)[0];
      newItems.splice(dragOverRef.current!, 0, draggedItem);
      saveOrder(newItems.map((item) => item.id));
      return newItems;
    });

    dragItemRef.current = null;
    dragOverRef.current = null;
  }, []);

  const renderNavItem = (item: NavItem, index: number) => {
    const itemContent = item.children ? (
      <>
        <button
          type="button"
          onClick={() => !isReorderMode && toggleExpanded(item.name)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors active:bg-sidebar-accent/80",
            isActive(item.href)
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
            isReorderMode && "pointer-events-none opacity-80"
          )}
        >
          {item.icon}
          <span className="flex-1 text-left">{item.name}</span>
          {!isReorderMode && (
            expandedItems.includes(item.name) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          )}
        </button>
        {!isReorderMode && expandedItems.includes(item.name) && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-4">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={closeMobile}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm transition-colors active:bg-primary/20",
                  pathname === child.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </>
    ) : (
      <Link
        href={isReorderMode ? "#" : item.href}
        onClick={(e) => {
          if (isReorderMode) {
            e.preventDefault();
            return;
          }
          closeMobile();
        }}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors active:bg-sidebar-accent/80",
          isActive(item.href)
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
          isReorderMode && "opacity-80"
        )}
      >
        {item.icon}
        {item.name}
      </Link>
    );

    if (isReorderMode) {
      return (
        <div
          key={item.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          className="group flex items-center gap-1 rounded-lg border border-dashed border-sidebar-border/60 hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing"
        >
          <div className="flex flex-col items-center gap-0.5 pl-1.5 py-1">
            <button
              type="button"
              onClick={() => moveItem(index, "up")}
              disabled={index === 0}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              aria-label={`Mover ${item.name} para cima`}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <GripVertical className="h-4 w-4 text-muted-foreground/60" />
            <button
              type="button"
              onClick={() => moveItem(index, "down")}
              disabled={index === navItems.length - 1}
              className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              aria-label={`Mover ${item.name} para baixo`}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 min-w-0">{itemContent}</div>
        </div>
      );
    }

    return <div key={item.id}>{itemContent}</div>;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-20 items-center gap-1 border-b border-sidebar-border px-2">
        <div className="relative shrink-0 h-20 w-20 overflow-hidden">
          <Image
            src="/logo-tms-icon.png"
            alt="TMS One"
            width={400}
            height={400}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] max-w-none object-contain"
            priority
          />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">TMS One</h1>
          <p className="text-[11px] text-muted-foreground">Gestao de Ferramentas</p>
        </div>
      </div>

      {/* Company Logo */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <input
          type="file"
          ref={companyLogoRef}
          accept="image/*"
          className="hidden"
          onChange={handleLogoUpload}
        />
        <button
          type="button"
          onClick={() => companyLogoRef.current?.click()}
          className="group flex w-full items-center justify-center rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors overflow-hidden h-14"
          title="Clique para enviar a logo da empresa"
        >
          {companyLogo ? (
            <img
              src={companyLogo || "/placeholder.svg"}
              alt="Logo da empresa"
              className="h-full w-full object-contain px-3 py-2"
            />
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
              <Building2 className="h-5 w-5" />
              <span className="text-sm">Enviar logo da empresa</span>
            </div>
          )}
        </button>
      </div>

      {/* Reorder Toggle */}
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
          Navegacao
        </span>
        <button
          type="button"
          onClick={() => setIsReorderMode(!isReorderMode)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors",
            isReorderMode
              ? "bg-primary/20 text-primary"
              : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-sidebar-accent"
          )}
          title={isReorderMode ? "Concluir reordenacao" : "Reordenar abas"}
        >
          {isReorderMode ? (
            <>
              <Settings2 className="h-3 w-3" />
              Concluir
            </>
          ) : (
            <>
              <Settings2 className="h-3 w-3" />
              Ordenar
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {navItems.map((item, index) => renderNavItem(item, index))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 shrink-0">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "Sem usuario"}</p>
            <p className="text-xs text-muted-foreground">{user?.role || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-background px-4 md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground active:bg-secondary"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <div className="flex items-center gap-0">
          <div className="relative h-12 w-12 overflow-hidden">
            <Image
              src="/logo-tms-icon.png"
              alt="TMS One"
              width={200}
              height={200}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] max-w-none object-contain"
            />
          </div>
          <span className="text-lg font-extrabold text-foreground">TMS One</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
          onKeyDown={(e) => { if (e.key === "Escape") closeMobile(); }}
          role="button"
          tabIndex={0}
          aria-label="Fechar menu"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-72 bg-sidebar shadow-2xl transition-transform duration-200 ease-out will-change-transform md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={closeMobile}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground active:bg-sidebar-accent"
        >
          <X className="h-5 w-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-72 md:flex-col bg-sidebar border-r border-sidebar-border">
        {sidebarContent}
      </aside>
    </>
  );
}
