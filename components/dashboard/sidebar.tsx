"use client";

import React from "react"

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  LayoutDashboard,
  Archive,
  Settings,
  Package,
  ArrowRightLeft,
  FileText,
  History,
  Users,
  ChevronDown,
  ChevronRight,
  Wrench,
  Tags,
  ToggleLeft,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  children?: { name: string; href: string }[];
}

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: "Configuracao",
    href: "/configuracao",
    icon: <Settings className="h-5 w-5" />,
    children: [
      { name: "Armarios", href: "/configuracao/armarios" },
      { name: "Tipos de Ferramenta", href: "/configuracao/tipos" },
      { name: "Status", href: "/configuracao/status" },
      { name: "Usuarios", href: "/configuracao/usuarios" },
    ],
  },
  {
    name: "Catalogo",
    href: "/catalogo",
    icon: <Package className="h-5 w-5" />,
  },
  {
    name: "Operacoes",
    href: "/operacoes",
    icon: <ArrowRightLeft className="h-5 w-5" />,
    children: [
      { name: "Entrada", href: "/operacoes/entrada" },
      { name: "Saida", href: "/operacoes/saida" },
      { name: "Nota Fiscal", href: "/operacoes/nota-fiscal" },
      { name: "Reforma", href: "/operacoes/reforma" },
    ],
  },
  {
    name: "Historico",
    href: "/historico",
    icon: <History className="h-5 w-5" />,
  },
  {
    name: "Relatorios",
    href: "/relatorios",
    icon: <FileText className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Configuracao", "Operacoes"]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const companyLogoRef = React.useRef<HTMLInputElement>(null);

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

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <>
                <button
                  type="button"
                  onClick={() => toggleExpanded(item.name)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors active:bg-sidebar-accent/80",
                    isActive(item.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.name}</span>
                  {expandedItems.includes(item.name) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expandedItems.includes(item.name) && (
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
                href={item.href}
                onClick={closeMobile}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors active:bg-sidebar-accent/80",
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            )}
          </div>
        ))}
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
          onKeyDown={(e) => { if (e.key === 'Escape') closeMobile(); }}
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
        {/* Close button inside sidebar */}
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
