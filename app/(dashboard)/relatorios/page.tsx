"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText, Download, Archive, AlertTriangle, Wrench, TrendingUp, Package,
  BarChart3, PieChart, Calendar, FileSpreadsheet, Clock, ArrowUp, ArrowDown,
  RotateCcw, Pencil, DollarSign, Save,
} from "lucide-react";
import { useDataStore } from "@/lib/data-store";
import type { Movement, Tool } from "@/lib/mock-data";
import { ToolCodeDisplay } from "@/components/dashboard/tool-code-display";

export default function ReportsPage() {
  const {
    tools, setTools, cabinets, drawers, toolTypes, statuses,
    movements, setMovements, suppliers,
  } = useDataStore();
  const [selectedCabinet, setSelectedCabinet] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Editing states
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  const getToolInfo = (toolId: string) => tools.find((t) => t.id === toolId);
  const getTypeName = (typeId: string) => toolTypes.find((t) => t.id === typeId)?.name || "N/A";
  const getCabinetName = (cabinetId: string) => cabinets.find((c) => c.id === cabinetId)?.name || "N/A";
  const getDrawerLabel = (drawerId: string) => {
    const d = drawers.find((dr) => dr.id === drawerId);
    return d ? `Gaveta ${d.number}` : "";
  };
  const getStatusInfo = (statusId: string) => statuses.find((s) => s.id === statusId) || { name: "N/A", color: "bg-muted" };
  const getStatusColorClass = (color: string) => {
    switch (color) {
      case "bg-success": return "bg-success";
      case "bg-chart-2": return "bg-chart-2";
      case "bg-warning": return "bg-warning";
      case "bg-destructive": return "bg-destructive";
      default: return "bg-muted-foreground";
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString("pt-BR"); } catch { return dateStr; }
  };
  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return dateStr; }
  };

  // Stats
  const totalValue = tools.reduce((acc, t) => acc + (t.unitValue || 0) * t.quantity, 0);
  const lowStockTools = tools.filter((t) => t.quantity <= t.minStock);
  const filteredTools = selectedCabinet === "all" ? tools : tools.filter((t) => t.cabinetId === selectedCabinet);

  const cabinetStats = cabinets.map((cabinet) => {
    const cabinetTools = tools.filter((t) => t.cabinetId === cabinet.id);
    const totalQuantity = cabinetTools.reduce((acc, t) => acc + t.quantity, 0);
    const totalCabValue = cabinetTools.reduce((acc, t) => acc + (t.unitValue || 0) * t.quantity, 0);
    const lowStock = cabinetTools.filter((t) => t.quantity <= t.minStock).length;
    return { ...cabinet, toolTypes: cabinetTools.length, totalQuantity, totalCabValue, lowStock };
  });

  const typeStats = toolTypes.filter((t) => t.isActive).map((type) => {
    const typeTools = tools.filter((t) => t.typeId === type.id);
    return { ...type, toolCount: typeTools.length, totalQuantity: typeTools.reduce((a, t) => a + t.quantity, 0) };
  });

  // Reform tracking
  const reformItems = useMemo(() => {
    const sendMovements = movements.filter(m => m.type === "reform_send");
    const returnMovements = movements.filter(m => m.type === "reform_return");
    const now = new Date();

    return sendMovements.map(send => {
      const tool = getToolInfo(send.toolId);
      const totalReturned = returnMovements.filter(r => r.toolId === send.toolId).reduce((a, r) => a + r.quantity, 0);
      const totalSent = sendMovements.filter(s => s.toolId === send.toolId).reduce((a, s) => a + s.quantity, 0);
      const stillOut = Math.max(0, totalSent - totalReturned);
      let isOverdue = false;
      let daysOverdue = 0;
      if (send.estimatedReturn) {
        const estimated = new Date(send.estimatedReturn);
        if (now > estimated && stillOut > 0) {
          isOverdue = true;
          daysOverdue = Math.floor((now.getTime() - estimated.getTime()) / 86400000);
        }
      }
      return {
        movementId: send.id, toolId: send.toolId, toolCode: tool?.code || "N/A",
        toolDescription: tool?.description || "N/A", cabinetName: tool ? getCabinetName(tool.cabinetId) : "N/A",
        drawerLabel: tool ? getDrawerLabel(tool.drawerId) : "", position: tool?.position || "",
        quantitySent: send.quantity, stillOut, dateSent: send.date,
        estimatedReturn: send.estimatedReturn || null, supplier: send.supplier || "N/A",
        nota: send.invoiceNumber || "-", romaneio: send.packingListNumber || "-", notes: send.notes, isOverdue, daysOverdue,
        status: stillOut <= 0 ? "returned" : isOverdue ? "overdue" : "pending",
      };
    });
  }, [movements, tools, cabinets, drawers]);

  const reformPending = reformItems.filter(r => r.status === "pending");
  const reformOverdue = reformItems.filter(r => r.status === "overdue");
  const reformReturned = reformItems.filter(r => r.status === "returned");

  // Movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (dateFrom && new Date(m.date) < new Date(dateFrom)) return false;
      if (dateTo) { const to = new Date(dateTo); to.setHours(23, 59, 59, 999); if (new Date(m.date) > to) return false; }
      return true;
    });
  }, [movements, dateFrom, dateTo]);

  const movementStats = useMemo(() => {
    const entries = filteredMovements.filter(m => m.type === "entry" || m.type === "invoice");
    const exits = filteredMovements.filter(m => m.type === "exit" || m.type === "reform_send");
    return { totalIn: entries.reduce((a, m) => a + m.quantity, 0), totalOut: exits.reduce((a, m) => a + m.quantity, 0), total: filteredMovements.length };
  }, [filteredMovements]);

  // --- Editing handlers ---
  const handleSaveTool = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTool) return;
    const fd = new FormData(e.currentTarget);
    const updated: Tool = {
      ...editingTool,
      quantity: Number(fd.get("quantity")) || editingTool.quantity,
      minStock: Number(fd.get("minStock")) || editingTool.minStock,
      unitValue: fd.get("unitValue") ? Number(fd.get("unitValue")) : undefined,
    reformUnitValue: fd.get("reformUnitValue") ? Number(fd.get("reformUnitValue")) : undefined,
    };
    setTools(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTool(null);
  };

  const handleSaveMovement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMovement) return;
    const fd = new FormData(e.currentTarget);
    const dateVal = fd.get("date") as string;
    const estimatedVal = fd.get("estimatedReturn") as string;
    const updated: Movement = {
      ...editingMovement,
      quantity: Number(fd.get("quantity")) || editingMovement.quantity,
      date: dateVal ? new Date(dateVal).toISOString() : editingMovement.date,
      notes: fd.get("notes") as string || editingMovement.notes,
      invoiceNumber: (fd.get("invoiceNumber") as string) || editingMovement.invoiceNumber,
      packingListNumber: (fd.get("packingListNumber") as string) || editingMovement.packingListNumber,
      estimatedReturn: estimatedVal || editingMovement.estimatedReturn,
    };
    setMovements(prev => prev.map(m => m.id === updated.id ? updated : m));
    setEditingMovement(null);
  };

  const exportCSV = (data: Record<string, string | number>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(";"),
      ...data.map(row => headers.map(h => String(row[h] ?? "")).join(";"))
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <Header title="Relatorios" subtitle="Visualize, edite e exporte relatorios do sistema" />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Ferramentas</p>
                  <p className="text-2xl font-bold">{tools.reduce((a, t) => a + t.quantity, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total Estoque</p>
                  <p className="text-lg font-bold">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estoque Minimo</p>
                  <p className="text-2xl font-bold">{lowStockTools.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Wrench className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Em Reforma</p>
                  <p className="text-2xl font-bold">{reformPending.length + reformOverdue.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Clock className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reformas Atrasadas</p>
                  <p className="text-2xl font-bold text-destructive">{reformOverdue.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="bg-secondary flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="stock" className="gap-2"><Archive className="h-4 w-4" />Estoque</TabsTrigger>
            <TabsTrigger value="low-stock" className="gap-2"><AlertTriangle className="h-4 w-4" />Estoque Minimo</TabsTrigger>
            <TabsTrigger value="reform" className="gap-2"><Wrench className="h-4 w-4" />Reforma</TabsTrigger>
            <TabsTrigger value="movements" className="gap-2"><TrendingUp className="h-4 w-4" />Movimentacoes</TabsTrigger>
          </TabsList>

          {/* ====== STOCK REPORT ====== */}
          <TabsContent value="stock" className="space-y-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="grid gap-2">
                    <Label>Armario</Label>
                    <Select value={selectedCabinet} onValueChange={setSelectedCabinet}>
                      <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os armarios</SelectItem>
                        {cabinets.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={() => {
                    exportCSV(filteredTools.map(t => ({
                      Codigo: t.code, Descricao: t.description, Tipo: getTypeName(t.typeId),
                      Armario: getCabinetName(t.cabinetId), Quantidade: t.quantity, Minimo: t.minStock,
                      "Valor Unit.": t.unitValue || 0, "Valor Total": (t.unitValue || 0) * t.quantity,
                      Status: getStatusInfo(t.statusId).name,
                    })), "estoque");
                  }}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />Exportar CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Estoque por Armario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead>Armario</TableHead>
                        <TableHead>Localizacao</TableHead>
                        <TableHead className="text-center">Tipos</TableHead>
                        <TableHead className="text-center">Qtd. Total</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-center">Estoque Min.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cabinetStats.map((cab) => (
                        <TableRow key={cab.id}>
                          <TableCell className="font-medium">{cab.name}</TableCell>
                          <TableCell className="text-muted-foreground">{cab.location}</TableCell>
                          <TableCell className="text-center"><Badge variant="secondary">{cab.toolTypes}</Badge></TableCell>
                          <TableCell className="text-center font-bold">{cab.totalQuantity}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(cab.totalCabValue)}</TableCell>
                          <TableCell className="text-center">
                            {cab.lowStock > 0 ? <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />{cab.lowStock}</Badge> : <Badge variant="secondary">0</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />Estoque Detalhado
                  {selectedCabinet !== "all" && <span className="text-sm font-normal text-muted-foreground">- {getCabinetName(selectedCabinet)}</span>}
                </CardTitle>
                <CardDescription>Clique no icone de edicao para alterar quantidade, estoque minimo ou valor.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Armario</TableHead>
                        <TableHead className="text-center">Qtd.</TableHead>
                        <TableHead className="text-center">Min.</TableHead>
                        <TableHead className="text-right">Valor Un.</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTools.map((tool) => {
                        const st = getStatusInfo(tool.statusId);
                        const isLow = tool.quantity <= tool.minStock;
                        return (
                          <TableRow key={tool.id}>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTool(tool)}>
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </TableCell>
                            <TableCell><ToolCodeDisplay code={tool.code} className="font-medium" /></TableCell>
                            <TableCell className="max-w-[180px] truncate">{tool.description}</TableCell>
                            <TableCell><Badge variant="secondary">{getTypeName(tool.typeId)}</Badge></TableCell>
                            <TableCell>{getCabinetName(tool.cabinetId)}</TableCell>
                            <TableCell className="text-center">
                              <span className={isLow ? "text-warning font-bold" : "font-medium"}>{tool.quantity}</span>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">{tool.minStock}</TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(tool.unitValue)}
                              {tool.reformUnitValue ? <span className="block text-sky-400 text-[11px]">R {formatCurrency(tool.reformUnitValue)}</span> : null}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">{tool.unitValue ? formatCurrency(tool.unitValue * tool.quantity) : "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${getStatusColorClass(st.color)}`} />
                                <span className="text-sm">{st.name}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== LOW STOCK REPORT ====== */}
          <TabsContent value="low-stock" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Ferramentas Abaixo do Estoque Minimo</CardTitle>
                  <CardDescription>{lowStockTools.length} ferramenta(s) precisam de reposicao</CardDescription>
                </div>
                <Button variant="outline" onClick={() => {
                  exportCSV(lowStockTools.map(t => ({
                    Codigo: t.code, Descricao: t.description, Armario: getCabinetName(t.cabinetId),
                    Atual: t.quantity, Minimo: t.minStock, Falta: Math.max(0, t.minStock - t.quantity),
                    "Valor Unit.": t.unitValue || 0,
                  })), "estoque-minimo");
                }}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />Exportar
                </Button>
              </CardHeader>
              <CardContent>
                {lowStockTools.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma ferramenta abaixo do estoque minimo</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Codigo</TableHead>
                          <TableHead>Descricao</TableHead>
                          <TableHead>Armario</TableHead>
                          <TableHead className="text-center">Atual</TableHead>
                          <TableHead className="text-center">Minimo</TableHead>
                          <TableHead className="text-center">Falta</TableHead>
                          <TableHead className="text-right">Valor Un.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockTools.map((tool) => (
                          <TableRow key={tool.id}>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTool(tool)}>
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </TableCell>
                            <TableCell><ToolCodeDisplay code={tool.code} className="font-medium" /></TableCell>
                            <TableCell>{tool.description}</TableCell>
                            <TableCell>{getCabinetName(tool.cabinetId)}</TableCell>
                            <TableCell className="text-center text-warning font-bold">{tool.quantity}</TableCell>
                            <TableCell className="text-center">{tool.minStock}</TableCell>
                            <TableCell className="text-center"><Badge variant="destructive">{Math.max(0, tool.minStock - tool.quantity)}</Badge></TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(tool.unitValue)}
                              {tool.reformUnitValue ? <span className="block text-sky-400 text-[11px]">R {formatCurrency(tool.reformUnitValue)}</span> : null}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== REFORM REPORT ====== */}
          <TabsContent value="reform" className="space-y-6">
            {reformOverdue.length > 0 && (
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{reformOverdue.length} reforma(s) com prazo atrasado!</p>
                    <p className="text-xs text-muted-foreground">Ferramentas que ultrapassaram a data estimada de retorno.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-orange-500" />Controle de Reformas</CardTitle>
                  <CardDescription>
                    {reformPending.length + reformOverdue.length} pendente(s) | {reformOverdue.length} atrasada(s) | {reformReturned.length} concluida(s) -- Clique no icone para editar datas e valores.
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={() => {
                  exportCSV(reformItems.map(r => ({
                    Codigo: r.toolCode, Descricao: r.toolDescription, Armario: r.cabinetName,
                    Quantidade: r.quantitySent, DataEnvio: formatDateTime(r.dateSent),
                    PrevisaoRetorno: r.estimatedReturn ? formatDate(r.estimatedReturn) : "N/A",
                    Fornecedor: r.supplier, Nota: r.nota, Romaneio: r.romaneio,
                    Status: r.status === "overdue" ? `ATRASADO (${r.daysOverdue} dias)` : r.status === "returned" ? "Concluido" : "Pendente",
                  })), "reformas");
                }}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />Exportar
                </Button>
              </CardHeader>
              <CardContent>
                {reformItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma reforma registrada</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Codigo</TableHead>
                          <TableHead>Descricao</TableHead>
                          <TableHead>Origem</TableHead>
                          <TableHead className="text-center">Qtd.</TableHead>
                          <TableHead>Data Envio</TableHead>
                          <TableHead>Previsao</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Nota</TableHead>
                          <TableHead>Romaneio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reformItems.map((item) => {
                          const mov = movements.find(m => m.id === item.movementId);
                          return (
                            <TableRow key={item.movementId} className={item.isOverdue ? "bg-destructive/5" : ""}>
                              <TableCell>
                                {mov && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingMovement(mov)}>
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell>
                                {item.status === "overdue" ? (
                                  <Badge variant="destructive" className="gap-1 whitespace-nowrap"><AlertTriangle className="h-3 w-3" />{item.daysOverdue}d atraso</Badge>
                                ) : item.status === "returned" ? (
                                  <Badge className="bg-success/20 text-success border-success/30 gap-1"><RotateCcw className="h-3 w-3" />Concluido</Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1 text-orange-500 border-orange-500/30"><Clock className="h-3 w-3" />Pendente</Badge>
                                )}
                              </TableCell>
                              <TableCell><ToolCodeDisplay code={item.toolCode} className="font-medium" /></TableCell>
                              <TableCell className="max-w-[150px] truncate">{item.toolDescription}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {item.cabinetName} {item.drawerLabel && `/ ${item.drawerLabel}`} {item.position && `/ ${item.position}`}
                              </TableCell>
                              <TableCell className="text-center font-bold">{item.quantitySent}</TableCell>
                              <TableCell className="text-sm">{formatDateTime(item.dateSent)}</TableCell>
                              <TableCell>
                                {item.estimatedReturn ? (
                                  <span className={item.isOverdue ? "text-destructive font-medium" : ""}>{formatDate(item.estimatedReturn)}</span>
                                ) : <span className="text-muted-foreground">-</span>}
                              </TableCell>
                              <TableCell className="text-sm">{item.supplier}</TableCell>
                              <TableCell className="text-sm font-mono">{item.nota}</TableCell>
                              <TableCell className="text-sm font-mono">{item.romaneio}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== MOVEMENTS REPORT ====== */}
          <TabsContent value="movements" className="space-y-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex gap-4 items-end flex-wrap">
                    <div className="grid gap-2">
                      <Label>Data Inicial</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="date" className="pl-9 w-[180px]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Data Final</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input type="date" className="pl-9 w-[180px]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                      </div>
                    </div>
                    {(dateFrom || dateTo) && <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>Limpar</Button>}
                  </div>
                  <Button variant="outline" onClick={() => {
                    exportCSV(filteredMovements.map(m => {
                      const tool = getToolInfo(m.toolId);
                      return {
                        Data: formatDateTime(m.date),
                        Tipo: m.type === "entry" ? "Entrada" : m.type === "exit" ? "Saida" : m.type === "reform_send" ? "Reforma (envio)" : m.type === "reform_return" ? "Reforma (retorno)" : "Nota Fiscal",
                        Codigo: tool?.code || "N/A", Descricao: tool?.description || "N/A",
                        Quantidade: m.quantity, Nota: m.invoiceNumber || "-", Romaneio: m.packingListNumber || "-", Fornecedor: m.supplier || "-", Observacoes: m.notes,
                      };
                    }), "movimentacoes");
                  }}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-success/10"><ArrowDown className="h-4 w-4 text-success" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entradas</p>
                    <p className="text-lg font-bold">{movementStats.totalIn}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-destructive/10"><ArrowUp className="h-4 w-4 text-destructive" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saidas / Reformas</p>
                    <p className="text-lg font-bold">{movementStats.totalOut}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10"><TrendingUp className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Movimentacoes</p>
                    <p className="text-lg font-bold">{movementStats.total}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />Historico de Movimentacoes
                  {(dateFrom || dateTo) && <span className="text-sm font-normal text-muted-foreground">({filteredMovements.length} registros)</span>}
                </CardTitle>
                <CardDescription>Clique no icone para editar datas, quantidades ou observacoes.</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredMovements.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma movimentacao no periodo</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Codigo</TableHead>
                          <TableHead>Descricao</TableHead>
                          <TableHead className="text-center">Qtd.</TableHead>
                          <TableHead>Nota</TableHead>
                          <TableHead>Romaneio</TableHead>
                          <TableHead>Observacoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((m) => {
                          const tool = getToolInfo(m.toolId);
                          const typeLabel = m.type === "entry" ? "Entrada" : m.type === "exit" ? "Saida" : m.type === "reform_send" ? "Reforma (envio)" : m.type === "reform_return" ? "Reforma (retorno)" : "Nota Fiscal";
                          const typeColor = m.type === "entry" || m.type === "invoice" ? "bg-success/20 text-success" : m.type === "reform_send" ? "bg-orange-500/20 text-orange-500" : m.type === "reform_return" ? "bg-chart-2/20 text-chart-2" : "bg-destructive/20 text-destructive";
                          return (
                            <TableRow key={m.id}>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingMovement(m)}>
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </TableCell>
                              <TableCell className="text-sm whitespace-nowrap">{formatDateTime(m.date)}</TableCell>
                              <TableCell><Badge className={`${typeColor} border-0`}>{typeLabel}</Badge></TableCell>
                              <TableCell>{tool?.code ? <ToolCodeDisplay code={tool.code} className="font-medium" /> : <span className="font-mono">N/A</span>}</TableCell>
                              <TableCell className="max-w-[150px] truncate">{tool?.description || "N/A"}</TableCell>
                              <TableCell className="text-center font-bold">{m.quantity}</TableCell>
                              <TableCell className="text-sm font-mono">{m.invoiceNumber || "-"}</TableCell>
                              <TableCell className="text-sm font-mono">{m.packingListNumber || "-"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{m.notes || "-"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ====== EDIT TOOL DIALOG ====== */}
      <Dialog open={!!editingTool} onOpenChange={(open) => { if (!open) setEditingTool(null); }}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" />Editar Ferramenta</DialogTitle>
            <DialogDescription>Altere os valores e clique em Salvar.</DialogDescription>
          </DialogHeader>
          {editingTool && (
            <form onSubmit={handleSaveTool} className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary">
                <ToolCodeDisplay code={editingTool.code} className="font-bold" />
                <p className="text-sm text-muted-foreground">{editingTool.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{getCabinetName(editingTool.cabinetId)} / {getDrawerLabel(editingTool.drawerId)} / Pos. {editingTool.position}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-qty">Quantidade</Label>
                  <Input id="edit-qty" name="quantity" type="number" min="0" defaultValue={editingTool.quantity} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-min">Estoque Minimo</Label>
                  <Input id="edit-min" name="minStock" type="number" min="0" defaultValue={editingTool.minStock} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-value">Valor Nova (R$)</Label>
                  <Input id="edit-value" name="unitValue" type="number" min="0" step="0.01" defaultValue={editingTool.unitValue || ""} placeholder="0,00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-reform-value" className="flex items-center gap-1.5">
                    Valor Reforma (R$)
                    <span className="text-sky-400 text-[10px] font-mono">R</span>
                  </Label>
                  <Input id="edit-reform-value" name="reformUnitValue" type="number" min="0" step="0.01" defaultValue={editingTool.reformUnitValue || ""} placeholder="0,00" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingTool(null)}>Cancelar</Button>
                <Button type="submit"><Save className="mr-2 h-4 w-4" />Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ====== EDIT MOVEMENT DIALOG ====== */}
      <Dialog open={!!editingMovement} onOpenChange={(open) => { if (!open) setEditingMovement(null); }}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" />Editar Movimentacao</DialogTitle>
            <DialogDescription>Altere os dados da movimentacao e clique em Salvar.</DialogDescription>
          </DialogHeader>
          {editingMovement && (
            <form onSubmit={handleSaveMovement} className="space-y-4">
              <div className="p-3 rounded-lg bg-secondary">
                <p className="text-sm font-medium">
                  {editingMovement.type === "entry" ? "Entrada" : editingMovement.type === "exit" ? "Saida" : editingMovement.type === "reform_send" ? "Reforma (envio)" : editingMovement.type === "reform_return" ? "Reforma (retorno)" : "Nota Fiscal"}
                </p>
                <p className="text-xs text-muted-foreground">{getToolInfo(editingMovement.toolId)?.code ? <ToolCodeDisplay code={getToolInfo(editingMovement.toolId)!.code} className="text-xs" /> : "N/A"} - {getToolInfo(editingMovement.toolId)?.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-mov-qty">Quantidade</Label>
                  <Input id="edit-mov-qty" name="quantity" type="number" min="1" defaultValue={editingMovement.quantity} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-mov-date">Data/Hora</Label>
                  <Input id="edit-mov-date" name="date" type="datetime-local" defaultValue={editingMovement.date.slice(0, 16)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-mov-nota">Numero da Nota</Label>
                <Input id="edit-mov-nota" name="invoiceNumber" defaultValue={editingMovement.invoiceNumber || ""} placeholder="NF-..." />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-mov-romaneio">Numero do Romaneio</Label>
                <Input id="edit-mov-romaneio" name="packingListNumber" defaultValue={editingMovement.packingListNumber || ""} placeholder="ROM-..." />
              </div>
              {(editingMovement.type === "reform_send") && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-mov-est">Data Estimada de Retorno</Label>
                  <Input id="edit-mov-est" name="estimatedReturn" type="date" defaultValue={editingMovement.estimatedReturn || ""} />
                  <p className="text-xs text-muted-foreground">Altere a previsao de retorno da reforma.</p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-mov-notes">Observacoes</Label>
                <Input id="edit-mov-notes" name="notes" defaultValue={editingMovement.notes} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingMovement(null)}>Cancelar</Button>
                <Button type="submit"><Save className="mr-2 h-4 w-4" />Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
