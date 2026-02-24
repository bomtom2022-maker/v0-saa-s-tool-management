"use client";

import { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  History,
  Search,
  Filter,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  Wrench,
  FileText,
  RotateCcw,
  Calendar,
  User,
  Package,
  Archive,
  Info,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { type Movement } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";
import { ToolCodeDisplay } from "@/components/dashboard/tool-code-display";
import { PriceTag } from "@/components/dashboard/price-tag";

const PAGE_SIZE = 25;

export default function HistoryPage() {
  const { movements, tools, users, cabinets, drawers, suppliers } = useDataStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterCabinet, setFilterCabinet] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const getMovementType = (type: Movement["type"]) => {
    const types: Record<Movement["type"], { label: string; icon: typeof ArrowDownRight; color: string; bg: string }> = {
      entry: { label: "Entrada", icon: ArrowDownRight, color: "text-success", bg: "bg-success/10" },
      exit: { label: "Saida", icon: ArrowUpRight, color: "text-destructive", bg: "bg-destructive/10" },
      reform_send: { label: "Envio Reforma", icon: Wrench, color: "text-warning", bg: "bg-warning/10" },
      reform_return: { label: "Retorno Reforma", icon: RotateCcw, color: "text-sky-400", bg: "bg-sky-500/10" },
      invoice: { label: "Nota Fiscal", icon: FileText, color: "text-chart-2", bg: "bg-chart-2/10" },
    };
    return types[type];
  };

  const getTool = (toolId: string) => tools.find((t) => t.id === toolId);
  const getUser = (userId: string) => users.find((u) => u.id === userId);
  const getCabinet = (cabinetId: string) => cabinets.find((c) => c.id === cabinetId);
  const getDrawer = (drawerId: string) => drawers.find((d) => d.id === drawerId);

  const filteredMovements = useMemo(() => {
    return movements
      .filter((movement) => {
        const tool = getTool(movement.toolId);
        const user = getUser(movement.userId);
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          (tool?.code || "").toLowerCase().includes(search) ||
          (tool?.description || "").toLowerCase().includes(search) ||
          (movement.notes || "").toLowerCase().includes(search) ||
          (movement.invoiceNumber || "").toLowerCase().includes(search) ||
          (movement.supplier || "").toLowerCase().includes(search) ||
          (user?.name || "").toLowerCase().includes(search);

        const matchesType = filterType === "all" || movement.type === filterType;
        const matchesUser = filterUser === "all" || movement.userId === filterUser;
        const matchesCabinet = filterCabinet === "all" || tool?.cabinetId === filterCabinet;
        const movementDate = new Date(movement.date);
        const matchesDateFrom = !dateFrom || movementDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || movementDate <= new Date(dateTo + "T23:59:59");

        return matchesSearch && matchesType && matchesUser && matchesCabinet && matchesDateFrom && matchesDateTo;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, tools, users, searchTerm, filterType, filterUser, filterCabinet, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
  const paginatedMovements = filteredMovements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const entries = filteredMovements.filter((m) => m.type === "entry" || m.type === "invoice");
    const exits = filteredMovements.filter((m) => m.type === "exit");
    const reformSends = filteredMovements.filter((m) => m.type === "reform_send");
    const reformReturns = filteredMovements.filter((m) => m.type === "reform_return");
    const totalEntryQty = entries.reduce((s, m) => s + m.quantity, 0);
    const totalExitQty = exits.reduce((s, m) => s + m.quantity, 0);
    return { entries: entries.length, exits: exits.length, reformSends: reformSends.length, reformReturns: reformReturns.length, totalEntryQty, totalExitQty };
  }, [filteredMovements]);

  const activeFilterCount = [filterType !== "all", filterUser !== "all", filterCabinet !== "all", !!dateFrom, !!dateTo].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterUser("all");
    setFilterCabinet("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const activeUserIds = useMemo(() => {
    const ids = new Set(movements.map((m) => m.userId));
    return Array.from(ids);
  }, [movements]);

  // Active filter labels
  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; onRemove: () => void }[] = [];
    if (filterType !== "all") {
      const t = getMovementType(filterType as Movement["type"]);
      filters.push({ key: "type", label: `Tipo: ${t.label}`, onRemove: () => { setFilterType("all"); setPage(1); } });
    }
    if (filterCabinet !== "all") {
      const c = getCabinet(filterCabinet);
      filters.push({ key: "cabinet", label: `Armario: ${c?.name || filterCabinet}`, onRemove: () => { setFilterCabinet("all"); setPage(1); } });
    }
    if (filterUser !== "all") {
      const u = getUser(filterUser);
      filters.push({ key: "user", label: `Usuario: ${u?.name || filterUser}`, onRemove: () => { setFilterUser("all"); setPage(1); } });
    }
    if (dateFrom) {
      filters.push({ key: "dateFrom", label: `De: ${new Date(dateFrom + "T12:00:00").toLocaleDateString("pt-BR")}`, onRemove: () => { setDateFrom(""); setPage(1); } });
    }
    if (dateTo) {
      filters.push({ key: "dateTo", label: `Ate: ${new Date(dateTo + "T12:00:00").toLocaleDateString("pt-BR")}`, onRemove: () => { setDateTo(""); setPage(1); } });
    }
    return filters;
  }, [filterType, filterCabinet, filterUser, dateFrom, dateTo, cabinets, users]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Data", "Hora", "Tipo", "Codigo", "Descricao", "Armario", "Gaveta", "Posicao", "Qtd", "Usuario", "NF", "Fornecedor", "Observacoes"];
    const rows = filteredMovements.map((m) => {
      const tool = getTool(m.toolId);
      const user = getUser(m.userId);
      const cabinet = tool ? getCabinet(tool.cabinetId) : null;
      const drawer = tool ? getDrawer(tool.drawerId) : null;
      const d = new Date(m.date);
      const typeInfo = getMovementType(m.type);
      return [
        d.toLocaleDateString("pt-BR"),
        d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        typeInfo.label,
        tool?.code || "N/A",
        tool?.description || "N/A",
        cabinet?.name || "N/A",
        drawer ? `Gaveta ${drawer.number}` : "",
        tool?.position || "",
        `${m.type === "entry" || m.type === "invoice" || m.type === "reform_return" ? "+" : "-"}${m.quantity}`,
        user?.name || "N/A",
        m.invoiceNumber || "",
        m.supplier || "",
        (m.notes || "").replace(/,/g, ";"),
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-movimentacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // PDF Export - Professional fiscal/admin layout
  const handleExportPDF = useCallback(async () => {
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default;
    const autoTableModule = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const primaryColor: [number, number, number] = [180, 50, 40];
    const darkGray: [number, number, number] = [40, 40, 45];
    const medGray: [number, number, number] = [100, 100, 105];
    const lightBg: [number, number, number] = [245, 245, 248];

    const now = new Date();
    const reportDate = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const reportTime = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // --- HEADER ---
    // Top accent line
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 2, "F");

    // Title block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...darkGray);
    doc.text("RELATORIO DE MOVIMENTACOES", margin, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...medGray);
    doc.text("Sistema de Gerenciamento de Ferramentas", margin, 22);

    // Right side - date/time block
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...medGray);
    doc.text(`Emitido em: ${reportDate} as ${reportTime}`, pageWidth - margin, 12, { align: "right" });
    doc.text(`Total de registros: ${filteredMovements.length}`, pageWidth - margin, 17, { align: "right" });

    // Separator
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, 26, pageWidth - margin, 26);

    // --- FILTERS APPLIED ---
    let yPos = 31;
    if (activeFilters.length > 0 || searchTerm) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...primaryColor);
      doc.text("FILTROS APLICADOS", margin, yPos);
      yPos += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...medGray);

      const filterTexts: string[] = [];
      if (searchTerm) filterTexts.push(`Busca: "${searchTerm}"`);
      activeFilters.forEach(f => filterTexts.push(f.label));

      doc.text(filterTexts.join("   |   "), margin, yPos);
      yPos += 7;
    }

    // --- SUMMARY BOX ---
    doc.setFillColor(...lightBg);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 14, 2, 2, "F");

    const summaryItems = [
      { label: "Entradas", value: `${stats.entries} (+${stats.totalEntryQty} un.)` },
      { label: "Saidas", value: `${stats.exits} (-${stats.totalExitQty} un.)` },
      { label: "Env. Reforma", value: String(stats.reformSends) },
      { label: "Ret. Reforma", value: String(stats.reformReturns) },
      { label: "Notas Fiscais", value: String(filteredMovements.filter(m => m.invoiceNumber).length) },
    ];

    const boxWidth = (pageWidth - margin * 2) / summaryItems.length;
    summaryItems.forEach((item, i) => {
      const x = margin + boxWidth * i + boxWidth / 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...medGray);
      doc.text(item.label, x, yPos + 5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...darkGray);
      doc.text(item.value, x, yPos + 11, { align: "center" });
    });

    yPos += 19;

    // --- PERIOD ---
    if (dateFrom || dateTo) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...medGray);
      const periodText = `Periodo: ${dateFrom ? new Date(dateFrom + "T12:00:00").toLocaleDateString("pt-BR") : "Inicio"} a ${dateTo ? new Date(dateTo + "T12:00:00").toLocaleDateString("pt-BR") : "Atual"}`;
      doc.text(periodText, margin, yPos);
      yPos += 5;
    }

    // --- TABLE ---
    const tableData = filteredMovements.map((m) => {
      const tool = getTool(m.toolId);
      const user = getUser(m.userId);
      const cabinet = tool ? getCabinet(tool.cabinetId) : null;
      const drawer = tool ? getDrawer(tool.drawerId) : null;
      const d = new Date(m.date);
      const typeInfo = getMovementType(m.type);
      const isPositive = m.type === "entry" || m.type === "invoice" || m.type === "reform_return";
      return [
        `${d.toLocaleDateString("pt-BR")}\n${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
        typeInfo.label,
        tool?.code || "N/A",
        tool?.description || "Removida",
        `${cabinet?.name || "N/A"}${drawer ? ` / G${drawer.number}` : ""}${tool?.position ? ` / P${tool.position}` : ""}`,
        `${isPositive ? "+" : "-"}${m.quantity}`,
        user?.name || m.userId,
        m.invoiceNumber || "-",
        m.supplier || "-",
      ];
    });

    (doc as any).autoTable({
      startY: yPos,
      head: [["Data/Hora", "Tipo", "Codigo", "Descricao", "Localizacao", "Qtd", "Usuario", "NF", "Fornecedor"]],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7,
        cellPadding: 2.5,
        textColor: darkGray,
        lineColor: [220, 220, 225],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: darkGray,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 253],
      },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 26 },
        2: { cellWidth: 28, fontStyle: "bold", font: "courier" },
        3: { cellWidth: 40 },
        4: { cellWidth: 36 },
        5: { cellWidth: 14, halign: "center" as const, fontStyle: "bold" },
        6: { cellWidth: 30 },
        7: { cellWidth: 28 },
        8: { cellWidth: 36 },
      },
      didDrawPage: (data: any) => {
        // Footer on every page
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...medGray);

        // Left: document ID
        doc.text(`REF: MOV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`, margin, pageHeight - 8);

        // Center: page number
        const pageNum = (doc as any).internal.getCurrentPageInfo().pageNumber;
        doc.text(`Pagina ${pageNum} de ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" });

        // Right: confidential label
        doc.text("Documento de uso interno", pageWidth - margin, pageHeight - 8, { align: "right" });

        // Bottom accent line
        doc.setFillColor(...primaryColor);
        doc.rect(0, pageHeight - 3, pageWidth, 3, "F");
      },
    });

    doc.save(`relatorio-movimentacoes-${now.toISOString().slice(0, 10)}.pdf`);
  }, [filteredMovements, activeFilters, searchTerm, stats, dateFrom, dateTo]);

  return (
    <div className="min-h-screen">
      <Header
        title="Historico e Auditoria"
        subtitle="Registro de todas as movimentacoes do sistema"
      />

      <div className="p-4 md:p-6 space-y-4">
        {/* Filters */}
        <Card className="bg-card border-border">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <button type="button" className="flex items-center gap-2 group cursor-pointer">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <CardTitle className="text-base">Filtros</CardTitle>
                      <CardDescription className="text-xs">
                        {filteredMovements.length} de {movements.length} registro(s)
                      </CardDescription>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ml-1 ${filtersOpen ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>

                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeFilterCount} filtro(s)
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredMovements.length === 0} className="h-8 text-xs">
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    CSV
                  </Button>
                  <Button size="sm" onClick={handleExportPDF} disabled={filteredMovements.length === 0} className="h-8 text-xs bg-primary hover:bg-primary/90">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="pt-0 pb-4">
                {/* Row 1: Search + Quick Type Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por codigo, descricao, NF, fornecedor..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                      className="pl-9 h-9"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => { setSearchTerm(""); setPage(1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Filters grid */}
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-5 mt-3">
                  <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
                    <SelectTrigger className="h-9 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="Tipo" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="entry">Entrada</SelectItem>
                      <SelectItem value="exit">Saida</SelectItem>
                      <SelectItem value="invoice">Nota Fiscal</SelectItem>
                      <SelectItem value="reform_send">Envio Reforma</SelectItem>
                      <SelectItem value="reform_return">Retorno Reforma</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCabinet} onValueChange={(v) => { setFilterCabinet(v); setPage(1); }}>
                    <SelectTrigger className="h-9 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Archive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="Armario" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os armarios</SelectItem>
                      {cabinets.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.isReformOnly ? " (R)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterUser} onValueChange={(v) => { setFilterUser(v); setPage(1); }}>
                    <SelectTrigger className="h-9 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <SelectValue placeholder="Usuario" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os usuarios</SelectItem>
                      {activeUserIds.map((uid) => {
                        const user = getUser(uid);
                        return (
                          <SelectItem key={uid} value={uid}>
                            {user?.name || uid}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                      className="h-9 text-xs pl-8"
                      placeholder="Data inicio"
                    />
                  </div>

                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                      className="h-9 text-xs pl-8"
                      placeholder="Data fim"
                    />
                  </div>
                </div>

                {/* Active filters pills */}
                {(activeFilters.length > 0 || searchTerm) && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {searchTerm && (
                      <Badge variant="secondary" className="text-[11px] gap-1 pr-1">
                        Busca: &quot;{searchTerm.slice(0, 20)}&quot;
                        <button type="button" onClick={() => { setSearchTerm(""); setPage(1); }} className="ml-0.5 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {activeFilters.map((f) => (
                      <Badge key={f.key} variant="secondary" className="text-[11px] gap-1 pr-1">
                        {f.label}
                        <button type="button" onClick={f.onRemove} className="ml-0.5 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <button type="button" onClick={clearFilters} className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1">
                      Limpar tudo
                    </button>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Entradas", value: stats.entries, sub: `+${stats.totalEntryQty} un.`, icon: ArrowDownRight, color: "text-success", bg: "bg-success/10" },
            { label: "Saidas", value: stats.exits, sub: `-${stats.totalExitQty} un.`, icon: ArrowUpRight, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Env. Reforma", value: stats.reformSends, icon: Wrench, color: "text-warning", bg: "bg-warning/10" },
            { label: "Ret. Reforma", value: stats.reformReturns, icon: RotateCcw, color: "text-sky-400", bg: "bg-sky-500/10" },
            { label: "Notas Fiscais", value: filteredMovements.filter((m) => m.invoiceNumber).length, icon: FileText, color: "text-chart-2", bg: "bg-chart-2/10" },
            { label: "Total Filtrado", value: filteredMovements.length, icon: History, color: "text-primary", bg: "bg-primary/10" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="bg-card border-border">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
                      <p className="text-lg sm:text-xl font-bold leading-tight">{stat.value}</p>
                      {stat.sub && <p className="text-[10px] sm:text-[11px] text-muted-foreground">{stat.sub}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Movements Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registro de Movimentacoes</CardTitle>
                <CardDescription>
                  Mostrando {paginatedMovements.length} de {filteredMovements.length} registro(s) - Pagina {page} de {totalPages}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile card layout */}
            <div className="space-y-3 sm:hidden">
              {paginatedMovements.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <History className="h-8 w-8 text-muted-foreground/50" />
                  <p>Nenhuma movimentacao encontrada</p>
                  <p className="text-xs">Ajuste os filtros ou realize uma operacao</p>
                </div>
              ) : (
                paginatedMovements.map((movement) => {
                  const tool = getTool(movement.toolId);
                  const user = getUser(movement.userId);
                  const cabinet = tool ? getCabinet(tool.cabinetId) : null;
                  const typeInfo = getMovementType(movement.type);
                  const TypeIcon = typeInfo.icon;
                  const isPositive = movement.type === "entry" || movement.type === "invoice" || movement.type === "reform_return";

                  return (
                    <div
                      key={movement.id}
                      className="rounded-lg border border-border p-3 space-y-2 active:bg-secondary/30"
                      onClick={() => setSelectedMovement(movement)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${typeInfo.bg}`}>
                            <TypeIcon className={`h-3.5 w-3.5 ${typeInfo.color}`} />
                          </div>
                          <span className="text-sm font-medium">{typeInfo.label}</span>
                        </div>
                        <span className={`text-sm font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                          {isPositive ? "+" : "-"}{movement.quantity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {tool?.code ? (
                            <ToolCodeDisplay code={tool.code} className="text-sm font-medium" />
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground">ID: {movement.toolId}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {cabinet?.name || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(movement.date).toLocaleDateString("pt-BR")}{" "}
                          {new Date(movement.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="truncate ml-2">{user?.name || movement.userId}</span>
                      </div>
                      {(movement.invoiceNumber || movement.supplier) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {movement.invoiceNumber && (
                            <Badge variant="outline" className="text-[10px]">{movement.invoiceNumber}</Badge>
                          )}
                          {movement.supplier && (
                            <span className="text-[11px] text-muted-foreground">{movement.supplier}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop table layout */}
            <div className="hidden sm:block rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableHead className="w-[130px]">Data/Hora</TableHead>
                    <TableHead className="w-[150px]">Tipo</TableHead>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead>Localizacao</TableHead>
                    <TableHead className="text-center w-[70px]">Qtd.</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>NF / Fornecedor</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                        <div className="flex flex-col items-center gap-2">
                          <History className="h-8 w-8 text-muted-foreground/50" />
                          <p>Nenhuma movimentacao encontrada</p>
                          <p className="text-xs">Ajuste os filtros ou realize uma operacao no sistema</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedMovements.map((movement) => {
                      const tool = getTool(movement.toolId);
                      const user = getUser(movement.userId);
                      const cabinet = tool ? getCabinet(tool.cabinetId) : null;
                      const drawer = tool ? getDrawer(tool.drawerId) : null;
                      const typeInfo = getMovementType(movement.type);
                      const TypeIcon = typeInfo.icon;
                      const isPositive = movement.type === "entry" || movement.type === "invoice" || movement.type === "reform_return";

                      return (
                        <TableRow key={movement.id} className="hover:bg-secondary/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-sm">
                                  {new Date(movement.date).toLocaleDateString("pt-BR")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(movement.date).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${typeInfo.bg}`}>
                                <TypeIcon className={`h-3.5 w-3.5 ${typeInfo.color}`} />
                              </div>
                              <span className="text-sm font-medium">{typeInfo.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <div>
                                {tool?.code ? (
                                  <ToolCodeDisplay code={tool.code} className="text-sm font-medium" />
                                ) : (
                                  <span className="font-mono text-sm text-muted-foreground">ID: {movement.toolId}</span>
                                )}
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {tool?.description || "Ferramenta removida"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-sm">
                                <Archive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>{cabinet?.name || "N/A"}</span>
                                {cabinet?.isReformOnly && (
                                  <span className="text-sky-400 text-[10px] font-mono">R</span>
                                )}
                              </div>
                              {drawer && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  Gaveta {drawer.number}{tool?.position ? ` - Pos. ${tool.position}` : ""}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`text-sm font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                              {isPositive ? "+" : "-"}{movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm truncate max-w-[100px]">{user?.name || movement.userId}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {movement.invoiceNumber && (
                                <Badge variant="outline" className="text-[11px]">
                                  {movement.invoiceNumber}
                                </Badge>
                              )}
                              {movement.supplier && (
                                <p className="text-xs text-muted-foreground truncate max-w-[120px]">{movement.supplier}</p>
                              )}
                              {!movement.invoiceNumber && !movement.supplier && (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setSelectedMovement(movement)}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-2 mt-4 sm:flex-row sm:justify-between">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredMovements.length)} de {filteredMovements.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs sm:text-sm font-medium px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Movement Detail Dialog */}
      <Dialog open={!!selectedMovement} onOpenChange={(open) => !open && setSelectedMovement(null)}>
        {selectedMovement && (() => {
          const tool = getTool(selectedMovement.toolId);
          const user = getUser(selectedMovement.userId);
          const cabinet = tool ? getCabinet(tool.cabinetId) : null;
          const drawer = tool ? getDrawer(tool.drawerId) : null;
          const typeInfo = getMovementType(selectedMovement.type);
          const TypeIcon = typeInfo.icon;
          const isPositive = selectedMovement.type === "entry" || selectedMovement.type === "invoice" || selectedMovement.type === "reform_return";

          return (
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeInfo.bg}`}>
                    <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                  </div>
                  {typeInfo.label}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data/Hora</span>
                  <span className="font-medium">
                    {new Date(selectedMovement.date).toLocaleDateString("pt-BR")} {" "}
                    {new Date(selectedMovement.date).toLocaleTimeString("pt-BR")}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                  <div className="flex items-center gap-2">
                    {tool?.code ? (
                      <ToolCodeDisplay code={tool.code} className="font-bold" />
                    ) : (
                      <span className="font-mono text-muted-foreground">ID: {selectedMovement.toolId}</span>
                    )}
                    {tool && <PriceTag value={tool.unitValue} reformValue={tool.reformUnitValue} />}
                  </div>
                  <p className="text-sm text-muted-foreground">{tool?.description || "Ferramenta removida"}</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span className={`text-lg font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                    {isPositive ? "+" : "-"}{selectedMovement.quantity} un.
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Localizacao</span>
                  <span className="font-medium">
                    {cabinet?.name || "N/A"}
                    {drawer ? ` > Gaveta ${drawer.number}` : ""}
                    {tool?.position ? ` > Pos. ${tool.position}` : ""}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usuario</span>
                  <span className="font-medium">{user?.name || selectedMovement.userId}</span>
                </div>

                {selectedMovement.invoiceNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nota Fiscal</span>
                    <Badge variant="outline">{selectedMovement.invoiceNumber}</Badge>
                  </div>
                )}

                {selectedMovement.supplier && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fornecedor</span>
                    <span className="font-medium">{selectedMovement.supplier}</span>
                  </div>
                )}

                {selectedMovement.estimatedReturn && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Retorno Estimado</span>
                    <span className="font-medium">
                      {new Date(selectedMovement.estimatedReturn).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}

                {selectedMovement.notes && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Observacoes</p>
                    <p className="text-sm p-2 rounded bg-muted/50 whitespace-pre-wrap">{selectedMovement.notes}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] text-muted-foreground font-mono">ID: {selectedMovement.id}</p>
                </div>
              </div>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
}
