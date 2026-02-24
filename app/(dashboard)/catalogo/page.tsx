"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Package,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Search,
  Download,
  Upload,
  AlertTriangle,
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  Minus,
} from "lucide-react";
import { type Tool } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";
import { useNotifications } from "@/lib/notifications";
import { PriceTag } from "@/components/dashboard/price-tag";
import { ToolCodeDisplay } from "@/components/dashboard/tool-code-display";

export default function CatalogPage() {
  const { tools, setTools, toolTypes, statuses, cabinets, drawers, movements, setMovements } = useDataStore();
  const { addNotification } = useNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Quick quantity dialog state
  const [qtyDialogTool, setQtyDialogTool] = useState<Tool | null>(null);
  const [qtyMode, setQtyMode] = useState<"entry" | "exit" | null>(null);
  const [qtyValue, setQtyValue] = useState(1);

  // Cascading selectors state for add/edit form
  const [formCabinetId, setFormCabinetId] = useState("");
  const [formDrawerId, setFormDrawerId] = useState("");
  const [formPosition, setFormPosition] = useState("");

  // Derived: drawers for selected cabinet, positions for selected drawer
  const cabinetDrawers = drawers.filter((d) => d.cabinetId === formCabinetId);
  const drawerPositions = drawers.find((d) => d.id === formDrawerId)?.positions || [];

  // Reset cascading on dialog open
  useEffect(() => {
    if (isDialogOpen) {
      if (editingTool) {
        setFormCabinetId(editingTool.cabinetId);
        setFormDrawerId(editingTool.drawerId);
        setFormPosition(editingTool.position);
      } else {
        setFormCabinetId("");
        setFormDrawerId("");
        setFormPosition("");
      }
    }
  }, [isDialogOpen, editingTool]);

  // When cabinet changes, reset drawer and position
  const handleCabinetChange = (val: string) => {
    setFormCabinetId(val);
    setFormDrawerId("");
    setFormPosition("");
  };

  // When drawer changes, reset position
  const handleDrawerChange = (val: string) => {
    setFormDrawerId(val);
    setFormPosition("");
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedCab = cabinets.find((c) => c.id === formCabinetId);
    let rawCode = formData.get("code") as string;
    if (selectedCab?.isReformOnly && !rawCode.endsWith("R")) {
      rawCode = rawCode + "R";
    }

    const selectedDrawer = drawers.find((d) => d.id === formDrawerId);

    const newTool: Tool = {
      id: editingTool?.id || String(Date.now()),
      code: rawCode,
      description: formData.get("description") as string,
      typeId: formData.get("typeId") as string,
      supplier: formData.get("supplier") as string,
      statusId: editingTool?.statusId || "1",
      cabinetId: formCabinetId,
      drawerId: formDrawerId,
      position: formPosition,
      quantity: Number(formData.get("quantity")) || 0,
      minStock: Number(formData.get("minStock")) || 0,
      unitValue: formData.get("unitValue") ? Number(formData.get("unitValue")) : undefined,
      reformUnitValue: formData.get("reformUnitValue") ? Number(formData.get("reformUnitValue")) : undefined,
      notes: formData.get("notes") as string,
    };

    if (editingTool) {
      setTools(tools.map((t) => (t.id === editingTool.id ? newTool : t)));
      addNotification({ type: "edit", title: "Ferramenta editada", message: `${newTool.code} - ${newTool.description} foi atualizada.` });
    } else {
      setTools([...tools, newTool]);
      addNotification({ type: "add", title: "Ferramenta cadastrada", message: `${newTool.code} - ${newTool.description} adicionada ao catalogo.` });
    }
    setIsDialogOpen(false);
    setEditingTool(null);
  };

  const handleDelete = (id: string) => {
    const tool = tools.find((t) => t.id === id);
    setTools(tools.filter((t) => t.id !== id));
    if (tool) {
      addNotification({ type: "delete", title: "Ferramenta excluida", message: `${tool.code} - ${tool.description} removida do catalogo.` });
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setIsDialogOpen(true);
  };

  // Quick quantity adjustment
  const handleQtyConfirm = () => {
    if (!qtyDialogTool || !qtyMode || qtyValue <= 0) return;

    const delta = qtyMode === "entry" ? qtyValue : -qtyValue;
    const newQty = Math.max(0, qtyDialogTool.quantity + delta);

    setTools(tools.map((t) => (t.id === qtyDialogTool.id ? { ...t, quantity: newQty } : t)));

    // Register movement
    const timestamp = new Date().toISOString();
    const newMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: qtyMode as "entry" | "exit",
      toolId: qtyDialogTool.id,
      userId: "eng-processo-1",
      quantity: qtyValue,
      date: timestamp,
      notes: qtyMode === "entry" ? "Entrada rapida via catalogo" : "Saida rapida via catalogo",
    };
    setMovements([...movements, newMovement]);

    addNotification({
      type: qtyMode === "entry" ? "entry" : "exit",
      title: qtyMode === "entry" ? "Entrada registrada" : "Saida registrada",
      message: `${qtyValue} un. de ${qtyDialogTool.code} | Estoque: ${qtyDialogTool.quantity} -> ${newQty}`,
    });

    setQtyDialogTool(null);
    setQtyMode(null);
    setQtyValue(1);
  };

  const getTypeName = (typeId: string) => {
    return toolTypes.find((t) => t.id === typeId)?.name || "N/A";
  };

  const getStatusInfo = (statusId: string) => {
    return statuses.find((s) => s.id === statusId) || { name: "N/A", color: "bg-muted" };
  };

  const getCabinetName = (cabinetId: string) => {
    return cabinets.find((c) => c.id === cabinetId)?.name || "N/A";
  };

  const getDrawerNumber = (drawerId: string) => {
    return drawers.find((d) => d.id === drawerId)?.number || "-";
  };

  const getStatusColorClass = (color: string) => {
    switch (color) {
      case "bg-success": return "bg-success";
      case "bg-chart-2": return "bg-chart-2";
      case "bg-warning": return "bg-warning";
      case "bg-destructive": return "bg-destructive";
      default: return "bg-muted-foreground";
    }
  };

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || tool.typeId === filterType;
    const matchesStatus = filterStatus === "all" || tool.statusId === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const isLowStock = (tool: Tool) => tool.quantity <= tool.minStock;

  return (
    <div className="min-h-screen">
      <Header
        title="Catalogo de Ferramentas"
        subtitle="Cadastro mestre de todas as ferramentas do sistema"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Cadastro Mestre de Ferramentas
              </p>
              <p className="text-xs text-muted-foreground">
                Clique no nome da ferramenta para ajuste rapido de quantidade (entrada ou saida).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions Bar */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por codigo ou descricao..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {toolTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {statuses.filter((s) => s.isActive).map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingTool(null); }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingTool(null)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Ferramenta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSave}>
                      <DialogHeader>
                        <DialogTitle>
                          {editingTool ? "Editar Ferramenta" : "Nova Ferramenta"}
                        </DialogTitle>
                        <DialogDescription>
                          Preencha os dados da ferramenta. Campos com * sao obrigatorios.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="code">Codigo Interno *</Label>
                            <Input
                              id="code"
                              name="code"
                              placeholder="Ex: INS-001"
                              defaultValue={editingTool?.code}
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="typeId">Tipo *</Label>
                            <Select name="typeId" defaultValue={editingTool?.typeId || "1"}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {toolTypes.filter((t) => t.isActive).map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Descricao Tecnica *</Label>
                          <Input
                            id="description"
                            name="description"
                            placeholder="Ex: Inserto CNMG 120408 Metal Duro"
                            defaultValue={editingTool?.description}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="supplier">Fornecedor</Label>
                            <Input
                              id="supplier"
                              name="supplier"
                              placeholder="Nome do fornecedor"
                              defaultValue={editingTool?.supplier}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select name="statusId" defaultValue={editingTool?.statusId || "1"}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statuses.filter((s) => s.isActive).map((status) => (
                                  <SelectItem key={status.id} value={status.id}>
                                    {status.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Cascading: Armario -> Gaveta -> Posicao */}
                        <div className="p-4 rounded-lg border border-border bg-secondary/30 space-y-4">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Archive className="h-4 w-4 text-muted-foreground" />
                            Localizacao no Armario
                          </p>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                              <Label>Armario *</Label>
                              <Select value={formCabinetId} onValueChange={handleCabinetChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {cabinets.map((cabinet) => (
                                    <SelectItem key={cabinet.id} value={cabinet.id}>
                                      {cabinet.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label>Gaveta *</Label>
                              <Select value={formDrawerId} onValueChange={handleDrawerChange} disabled={!formCabinetId}>
                                <SelectTrigger>
                                  <SelectValue placeholder={formCabinetId ? "Selecione..." : "Selecione armario"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {cabinetDrawers.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                      Gaveta {d.number}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label>Posicao *</Label>
                              <Select value={formPosition} onValueChange={setFormPosition} disabled={!formDrawerId}>
                                <SelectTrigger>
                                  <SelectValue placeholder={formDrawerId ? "Selecione..." : "Selecione gaveta"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {drawerPositions.map((pos) => (
                                    <SelectItem key={pos} value={pos}>
                                      Posicao {pos}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantidade Inicial</Label>
                            <Input
                              id="quantity"
                              name="quantity"
                              type="number"
                              min="0"
                              defaultValue={editingTool?.quantity || 0}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="minStock">Estoque Minimo</Label>
                            <Input
                              id="minStock"
                              name="minStock"
                              type="number"
                              min="0"
                              defaultValue={editingTool?.minStock || 0}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="unitValue">Valor Nova (R$)</Label>
                            <Input
                              id="unitValue"
                              name="unitValue"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0,00"
                              defaultValue={editingTool?.unitValue || ""}
                            />
                            <p className="text-xs text-muted-foreground">Preco da ferramenta nova.</p>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="reformUnitValue" className="flex items-center gap-1.5">
                              Valor Reforma (R$)
                              <span className="text-sky-400 text-[10px] font-mono">R</span>
                            </Label>
                            <Input
                              id="reformUnitValue"
                              name="reformUnitValue"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0,00"
                              defaultValue={editingTool?.reformUnitValue || ""}
                            />
                            <p className="text-xs text-muted-foreground">Preco apos reforma/recondicionamento.</p>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="notes">Observacoes</Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Informacoes adicionais..."
                            defaultValue={editingTool?.notes}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={!formCabinetId || !formDrawerId || !formPosition}>
                          {editingTool ? "Salvar" : "Cadastrar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tools Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ferramentas Cadastradas</CardTitle>
                <CardDescription>
                  {filteredTools.length} ferramenta(s) encontrada(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableHead>Codigo</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Localizacao</TableHead>
                    <TableHead className="text-center">Qtd.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhuma ferramenta encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTools.map((tool) => {
                      const status = getStatusInfo(tool.statusId);
                      return (
                        <TableRow key={tool.id} className="hover:bg-secondary/30">
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <ToolCodeDisplay code={tool.code} className="font-medium" />
                              <PriceTag value={tool.unitValue} reformValue={tool.reformUnitValue} />
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <button
                              type="button"
                              className="text-left hover:text-primary hover:underline underline-offset-2 transition-colors cursor-pointer truncate block max-w-full"
                              onClick={() => { setQtyDialogTool(tool); setQtyMode(null); setQtyValue(1); }}
                              title="Clique para ajuste rapido de quantidade"
                            >
                              {tool.description}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getTypeName(tool.typeId)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5 text-sm">
                              <span className="flex items-center gap-1.5">
                                <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                                {getCabinetName(tool.cabinetId)}
                              </span>
                              <span className="text-xs text-muted-foreground pl-5">
                                {"Gaveta "}{getDrawerNumber(tool.drawerId)}{" | Pos. "}{tool.position || "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isLowStock(tool) && (
                                <AlertTriangle className="h-4 w-4 text-warning" />
                              )}
                              <span className={isLowStock(tool) ? "text-warning font-medium" : ""}>
                                {tool.quantity}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`h-2.5 w-2.5 rounded-full ${getStatusColorClass(status.color)}`} />
                              <span className="text-sm">{status.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedTool(tool)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(tool)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(tool.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Quantity Adjustment Dialog */}
        <Dialog open={!!qtyDialogTool} onOpenChange={(open) => { if (!open) { setQtyDialogTool(null); setQtyMode(null); } }}>
          <DialogContent className="max-w-md">
            {qtyDialogTool && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Ajuste Rapido de Quantidade
                  </DialogTitle>
                  <DialogDescription>
                    <ToolCodeDisplay code={qtyDialogTool.code} className="font-semibold" />
                    {" - "}{qtyDialogTool.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Current info */}
                  <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Localizacao</span>
                      <span className="font-medium">{getCabinetName(qtyDialogTool.cabinetId)} | Gaveta {getDrawerNumber(qtyDialogTool.drawerId)} | Pos. {qtyDialogTool.position || "-"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estoque atual</span>
                      <span className={`font-bold text-base ${isLowStock(qtyDialogTool) ? "text-warning" : ""}`}>{qtyDialogTool.quantity} un.</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estoque minimo</span>
                      <span>{qtyDialogTool.minStock} un.</span>
                    </div>
                  </div>

                  {/* Mode selection */}
                  {qtyMode === null ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 border-success/30 hover:bg-success/10 hover:border-success/60"
                        onClick={() => setQtyMode("entry")}
                      >
                        <ArrowDownToLine className="h-6 w-6 text-success" />
                        <span className="text-sm font-medium">Entrada</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2 border-destructive/30 hover:bg-destructive/10 hover:border-destructive/60"
                        onClick={() => setQtyMode("exit")}
                      >
                        <ArrowUpFromLine className="h-6 w-6 text-destructive" />
                        <span className="text-sm font-medium">Saida</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Mode indicator */}
                      <div className={`p-3 rounded-lg flex items-center gap-3 ${qtyMode === "entry" ? "bg-success/10 border border-success/30" : "bg-destructive/10 border border-destructive/30"}`}>
                        {qtyMode === "entry" ? (
                          <ArrowDownToLine className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowUpFromLine className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${qtyMode === "entry" ? "text-success" : "text-destructive"}`}>
                            {qtyMode === "entry" ? "Entrada de ferramentas" : "Saida de ferramentas"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {qtyMode === "entry" ? "A quantidade sera adicionada ao estoque" : "A quantidade sera subtraida do estoque"}
                          </p>
                        </div>
                      </div>

                      {/* Quantity input */}
                      <div className="grid gap-2">
                        <Label>Quantidade</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setQtyValue(Math.max(1, qtyValue - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            max={qtyMode === "exit" ? qtyDialogTool.quantity : 9999}
                            value={qtyValue}
                            onChange={(e) => setQtyValue(Math.max(1, Number(e.target.value)))}
                            className="text-center text-lg font-bold"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => setQtyValue(qtyValue + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="p-3 rounded-lg bg-secondary/50 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Estoque apos ajuste</p>
                        <p className="text-2xl font-bold">
                          {Math.max(0, qtyDialogTool.quantity + (qtyMode === "entry" ? qtyValue : -qtyValue))} un.
                        </p>
                      </div>

                      {/* Warning if exit > stock */}
                      {qtyMode === "exit" && qtyValue > qtyDialogTool.quantity && (
                        <div className="flex items-center gap-2 p-2 rounded bg-warning/10 text-warning text-sm">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          A quantidade de saida e maior que o estoque. O estoque sera zerado.
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setQtyMode(null)}>
                          Voltar
                        </Button>
                        <Button
                          className={`flex-1 ${qtyMode === "entry" ? "bg-success hover:bg-success/90 text-success-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}`}
                          onClick={handleQtyConfirm}
                        >
                          {qtyMode === "entry" ? "Confirmar Entrada" : "Confirmar Saida"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Tool Details Sheet */}
        <Sheet open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
          <SheetContent className="sm:max-w-lg">
            {selectedTool && (
              <>
                <SheetHeader>
                  <SheetTitle>Detalhes da Ferramenta</SheetTitle>
                  <SheetDescription>
                    Informacoes completas do cadastro
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <ToolCodeDisplay code={selectedTool.code} className="text-lg font-bold" />
                      <p className="text-sm text-muted-foreground">{selectedTool.description}</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Tipo</span>
                      <Badge variant="secondary">{getTypeName(selectedTool.typeId)}</Badge>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${getStatusColorClass(getStatusInfo(selectedTool.statusId).color)}`} />
                        <span className="text-sm">{getStatusInfo(selectedTool.statusId).name}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Fornecedor</span>
                      <span className="text-sm font-medium">{selectedTool.supplier || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Armario</span>
                      <span className="text-sm font-medium">{getCabinetName(selectedTool.cabinetId)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Localizacao</span>
                      <span className="text-sm font-medium">Gaveta {getDrawerNumber(selectedTool.drawerId)}, Pos. {selectedTool.position || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Quantidade</span>
                      <span className={`text-sm font-bold ${isLowStock(selectedTool) ? "text-warning" : ""}`}>
                        {selectedTool.quantity} unidades
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Estoque Minimo</span>
                      <span className="text-sm font-medium">{selectedTool.minStock} unidades</span>
                    </div>
                    {(selectedTool.unitValue || selectedTool.reformUnitValue) && (
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Valor</span>
                        <PriceTag value={selectedTool.unitValue} reformValue={selectedTool.reformUnitValue} />
                      </div>
                    )}
                  </div>

                  {selectedTool.notes && (
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-sm text-muted-foreground mb-1">Observacoes</p>
                      <p className="text-sm">{selectedTool.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => { setSelectedTool(null); handleEdit(selectedTool); }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedTool(null)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
