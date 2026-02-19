"use client";

import React from "react"

import { useState } from "react";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Package,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  Archive,
  MapPin,
} from "lucide-react";
import { type Tool } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";
import { PriceTag } from "@/components/dashboard/price-tag";
import { ToolCodeDisplay } from "@/components/dashboard/tool-code-display";

export default function CatalogPage() {
  const { tools, setTools, toolTypes, statuses, cabinets } = useDataStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cabinetId = formData.get("cabinetId") as string;
    const selectedCab = cabinets.find(c => c.id === cabinetId);
    let rawCode = formData.get("code") as string;
    // Auto-append "R" suffix if saving into a reform-only cabinet
    if (selectedCab?.isReformOnly && !rawCode.endsWith("R")) {
      rawCode = rawCode + "R";
    }
    const newTool: Tool = {
      id: editingTool?.id || String(Date.now()),
      code: rawCode,
      description: formData.get("description") as string,
      typeId: formData.get("typeId") as string,
      supplier: formData.get("supplier") as string,
      statusId: "1",
      cabinetId: cabinetId,
      drawerId: "1",
      position: formData.get("position") as string,
      quantity: Number(formData.get("quantity")) || 0,
      minStock: Number(formData.get("minStock")) || 0,
      unitValue: formData.get("unitValue") ? Number(formData.get("unitValue")) : undefined,
      reformUnitValue: formData.get("reformUnitValue") ? Number(formData.get("reformUnitValue")) : undefined,
      notes: formData.get("notes") as string,
    };

    if (editingTool) {
      setTools(tools.map((t) => (t.id === editingTool.id ? { ...newTool, statusId: t.statusId } : t)));
    } else {
      setTools([...tools, newTool]);
    }
    setIsDialogOpen(false);
    setEditingTool(null);
  };

  const handleDelete = (id: string) => {
    setTools(tools.filter((t) => t.id !== id));
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setIsDialogOpen(true);
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

  const getStatusColorClass = (color: string) => {
    switch (color) {
      case "bg-success":
        return "bg-success";
      case "bg-chart-2":
        return "bg-chart-2";
      case "bg-warning":
        return "bg-warning";
      case "bg-destructive":
        return "bg-destructive";
      default:
        return "bg-muted-foreground";
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
                Cadastre ferramentas com codigo interno, tipo, fornecedor e campos personalizados.
                Todos os dados sao exemplos para demonstracao.
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingTool(null)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Ferramenta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
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
                            <Label htmlFor="cabinetId">Armario</Label>
                            <Select name="cabinetId" defaultValue={editingTool?.cabinetId || "1"}>
                              <SelectTrigger>
                                <SelectValue />
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
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="position">Posicao</Label>
                            <Input
                              id="position"
                              name="position"
                              placeholder="Ex: A, B, 1, 2"
                              defaultValue={editingTool?.position}
                            />
                          </div>
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
                        <Button type="submit">
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
                    <TableHead>Armario</TableHead>
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
                          <TableCell className="max-w-[200px] truncate">{tool.description}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{getTypeName(tool.typeId)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Archive className="h-4 w-4 text-muted-foreground" />
                              {getCabinetName(tool.cabinetId)}
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
                      <span className="text-sm text-muted-foreground">Posicao</span>
                      <span className="text-sm font-medium">Gaveta {selectedTool.drawerId}, Pos. {selectedTool.position}</span>
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
