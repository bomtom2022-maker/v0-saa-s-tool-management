"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const getSupplier = (name: string) => suppliers.find((s) => s.name === name);

  // All movements come exclusively from the data store (single source of truth)
  const filteredMovements = useMemo(() => {
    return movements
      .filter((movement) => {
        const tool = getTool(movement.toolId);
        const user = getUser(movement.userId);

        // Search: code, description, notes, invoice number, supplier
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

        // Filter by cabinet: match the tool's current cabinet
        const matchesCabinet = filterCabinet === "all" || tool?.cabinetId === filterCabinet;

        const movementDate = new Date(movement.date);
        const matchesDateFrom = !dateFrom || movementDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || movementDate <= new Date(dateTo + "T23:59:59");

        return matchesSearch && matchesType && matchesUser && matchesCabinet && matchesDateFrom && matchesDateTo;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, tools, users, searchTerm, filterType, filterUser, filterCabinet, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
  const paginatedMovements = filteredMovements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary stats from filtered movements
  const stats = useMemo(() => {
    const entries = filteredMovements.filter((m) => m.type === "entry" || m.type === "invoice");
    const exits = filteredMovements.filter((m) => m.type === "exit");
    const reformSends = filteredMovements.filter((m) => m.type === "reform_send");
    const reformReturns = filteredMovements.filter((m) => m.type === "reform_return");
    const totalEntryQty = entries.reduce((s, m) => s + m.quantity, 0);
    const totalExitQty = exits.reduce((s, m) => s + m.quantity, 0);
    return {
      entries: entries.length,
      exits: exits.length,
      reformSends: reformSends.length,
      reformReturns: reformReturns.length,
      totalEntryQty,
      totalExitQty,
    };
  }, [filteredMovements]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterUser("all");
    setFilterCabinet("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // CSV Export
  const handleExport = () => {
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

  // Unique users from movements for the user filter dropdown
  const activeUserIds = useMemo(() => {
    const ids = new Set(movements.map((m) => m.userId));
    return Array.from(ids);
  }, [movements]);

  return (
    <div className="min-h-screen">
      <Header
        title="Historico e Auditoria"
        subtitle="Registro de todas as movimentacoes do sistema"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Historico de Movimentacoes
              </p>
              <p className="text-xs text-muted-foreground">
                Todas as movimentacoes sao registradas automaticamente com usuario, data/hora, tipo e quantidade.
                Use os filtros para localizar movimentacoes especificas. Dados prontos para integracao com Supabase.
              </p>
            </div>
            <Badge variant="outline" className="ml-auto shrink-0">
              {movements.length} registro(s) total
            </Badge>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              <div className="lg:col-span-2 grid gap-2">
                <Label>Busca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Codigo, descricao, NF, fornecedor..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="entry">Entrada</SelectItem>
                    <SelectItem value="exit">Saida</SelectItem>
                    <SelectItem value="invoice">Nota Fiscal</SelectItem>
                    <SelectItem value="reform_send">Envio Reforma</SelectItem>
                    <SelectItem value="reform_return">Retorno Reforma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Armario</Label>
                <Select value={filterCabinet} onValueChange={(v) => { setFilterCabinet(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {cabinets.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.isReformOnly ? " (Reformadas)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Usuario</Label>
                <Select value={filterUser} onValueChange={(v) => { setFilterUser(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
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
              </div>

              <div className="grid gap-2">
                <Label>Periodo</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <Button variant="secondary" onClick={handleExport} disabled={filteredMovements.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV ({filteredMovements.length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <ArrowDownRight className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entradas</p>
                  <p className="text-xl font-bold">{stats.entries}</p>
                  <p className="text-[11px] text-muted-foreground">+{stats.totalEntryQty} un.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <ArrowUpRight className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saidas</p>
                  <p className="text-xl font-bold">{stats.exits}</p>
                  <p className="text-[11px] text-muted-foreground">-{stats.totalExitQty} un.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Wrench className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Envios Reforma</p>
                  <p className="text-xl font-bold">{stats.reformSends}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                  <RotateCcw className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Retornos Reforma</p>
                  <p className="text-xl font-bold">{stats.reformReturns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <FileText className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Notas Fiscais</p>
                  <p className="text-xl font-bold">
                    {filteredMovements.filter((m) => m.invoiceNumber).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Filtrado</p>
                  <p className="text-xl font-bold">{filteredMovements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <div className="rounded-lg border border-border overflow-hidden">
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
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
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
                  <span className="text-sm font-medium px-2">
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeInfo.bg}`}>
                    <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                  </div>
                  {typeInfo.label}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Date */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data/Hora</span>
                  <span className="font-medium">
                    {new Date(selectedMovement.date).toLocaleDateString("pt-BR")} {" "}
                    {new Date(selectedMovement.date).toLocaleTimeString("pt-BR")}
                  </span>
                </div>

                {/* Tool */}
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

                {/* Quantity */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quantidade</span>
                  <span className={`text-lg font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                    {isPositive ? "+" : "-"}{selectedMovement.quantity} un.
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Localizacao</span>
                  <span className="font-medium">
                    {cabinet?.name || "N/A"}
                    {drawer ? ` > Gaveta ${drawer.number}` : ""}
                    {tool?.position ? ` > Pos. ${tool.position}` : ""}
                  </span>
                </div>

                {/* User */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usuario</span>
                  <span className="font-medium">{user?.name || selectedMovement.userId}</span>
                </div>

                {/* Invoice */}
                {selectedMovement.invoiceNumber && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nota Fiscal</span>
                    <Badge variant="outline">{selectedMovement.invoiceNumber}</Badge>
                  </div>
                )}

                {/* Supplier */}
                {selectedMovement.supplier && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fornecedor</span>
                    <span className="font-medium">{selectedMovement.supplier}</span>
                  </div>
                )}

                {/* Estimated Return */}
                {selectedMovement.estimatedReturn && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Retorno Estimado</span>
                    <span className="font-medium">
                      {new Date(selectedMovement.estimatedReturn).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {selectedMovement.notes && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Observacoes</p>
                    <p className="text-sm p-2 rounded bg-muted/50 whitespace-pre-wrap">{selectedMovement.notes}</p>
                  </div>
                )}

                {/* Movement ID for debugging / Supabase reference */}
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
