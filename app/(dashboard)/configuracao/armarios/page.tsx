"use client";

import React from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import { Header } from "@/components/dashboard/header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Archive,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  MapPin,
  ChevronRight,
  Package,
  ArrowLeft,
  Search,
  Layers,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import {
  type Cabinet,
  type Drawer,
  type Tool,
} from "@/lib/mock-data";
import { DrawerForm } from "@/components/dashboard/drawer-form";
import { useNotifications } from "@/lib/notifications";
import { useDataStore } from "@/lib/data-store";
import { PriceTag } from "@/components/dashboard/price-tag";
import { ToolCodeDisplay } from "@/components/dashboard/tool-code-display";

export default function CabinetsPage() {
  const { addNotification, addNotificationsBatch } = useNotifications();
  const { cabinets, setCabinets, drawers, setDrawers, tools, setTools, toolTypes, statuses } = useDataStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);
  const [isDrawerDialogOpen, setIsDrawerDialogOpen] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState<Cabinet | null>(null);
  const [editingDrawer, setEditingDrawer] = useState<Drawer | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);
  const [selectedDrawer, setSelectedDrawer] = useState<Drawer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineQty, setInlineQty] = useState("");
  const [inlineMinStock, setInlineMinStock] = useState("");

  const startInlineEdit = (tool: Tool) => {
    setInlineEditId(tool.id);
    setInlineQty(String(tool.quantity));
    setInlineMinStock(String(tool.minStock));
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineQty("");
    setInlineMinStock("");
  };

  const saveInlineEdit = (toolId: string) => {
    const newQty = Math.max(0, Number(inlineQty) || 0);
    const newMin = Math.max(0, Number(inlineMinStock) || 0);
    const tool = tools.find(t => t.id === toolId);
    if (!tool) return;
    setTools(tools.map(t =>
      t.id === toolId ? { ...t, quantity: newQty, minStock: newMin } : t
    ));
    if (tool.quantity !== newQty || tool.minStock !== newMin) {
      addNotification({
        type: "edit",
        title: "Quantidade editada",
        message: `${tool.code}: Qtd ${tool.quantity} -> ${newQty}, Est. Min ${tool.minStock} -> ${newMin}`,
      });
    }
    cancelInlineEdit();
  };

  // Global search across ALL cabinets
  const globalSearchResults = useMemo(() => {
    if (!globalSearch) return [];
    const term = globalSearch.toLowerCase();
    return tools
      .filter((t) => {
        const type = toolTypes.find((tp) => tp.id === t.typeId);
        return (
          t.code.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          t.supplier.toLowerCase().includes(term) ||
          (type?.name.toLowerCase().includes(term) ?? false)
        );
      })
      .map((tool) => {
        const cabinet = cabinets.find((c) => c.id === tool.cabinetId);
        const drawer = drawers.find((d) => d.id === tool.drawerId);
        const type = toolTypes.find((tp) => tp.id === tool.typeId);
        const status = statuses.find((s) => s.id === tool.statusId);
        return { tool, cabinet, drawer, type, status };
      });
  }, [globalSearch, tools, cabinets, drawers]);

  // Check overdue reforms and low stock on load
  const hasCheckedRef = useRef(false);
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    const now = new Date();
    const batch: { type: "reform_overdue" | "low_stock"; title: string; message: string }[] = [];
    for (const tool of tools) {
      if (tool.reformDate) {
        const reformDate = new Date(tool.reformDate);
        if (reformDate < now) {
          const cab = cabinets.find((c) => c.id === tool.cabinetId);
          const days = Math.floor((now.getTime() - reformDate.getTime()) / 86400000);
          batch.push({
            type: "reform_overdue",
            title: "Reforma atrasada!",
            message: `${tool.code} - ${tool.description} esta com reforma atrasada ha ${days} dia(s). Armario: ${cab?.name || "N/A"}. Prevista: ${reformDate.toLocaleDateString("pt-BR")}`,
          });
        }
      }
      if (tool.quantity <= tool.minStock) {
        const cab = cabinets.find((c) => c.id === tool.cabinetId);
        batch.push({
          type: "low_stock",
          title: "Estoque baixo",
          message: `${tool.code} - ${tool.description} com apenas ${tool.quantity} un. (min: ${tool.minStock}). Armario: ${cab?.name || "N/A"}`,
        });
      }
    }
    if (batch.length > 0) {
      addNotificationsBatch(batch);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get drawers for selected cabinet
  const cabinetDrawers = useMemo(() => {
    if (!selectedCabinet) return [];
    return drawers.filter((d) => d.cabinetId === selectedCabinet.id);
  }, [selectedCabinet, drawers]);

  // Get tools for selected cabinet
  const cabinetTools = useMemo(() => {
    if (!selectedCabinet) return [];
    return tools.filter((t) => t.cabinetId === selectedCabinet.id);
  }, [selectedCabinet, tools]);

  // Get tools for a specific drawer
  const getDrawerTools = (drawerId: string) => {
    return tools.filter((t) => t.drawerId === drawerId);
  };

  // Get tool at specific position
  const getToolAtPosition = (drawerId: string, position: string) => {
    return tools.find((t) => t.drawerId === drawerId && t.position === position);
  };

  // Filter tools by search
  const filteredTools = useMemo(() => {
    if (!searchTerm) return cabinetTools;
    const term = searchTerm.toLowerCase();
    return cabinetTools.filter((t) => {
      const type = toolTypes.find((tp) => tp.id === t.typeId);
      return (
        t.code.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.supplier.toLowerCase().includes(term) ||
        (type?.name.toLowerCase().includes(term) ?? false)
      );
    });
  }, [cabinetTools, searchTerm]);

  // Get status info
  const getStatus = (statusId: string) => {
    return statuses.find((s) => s.id === statusId);
  };

  // Get type info
  const getType = (typeId: string) => {
    return toolTypes.find((t) => t.id === typeId);
  };

  // Get drawer info
  const getDrawer = (drawerId: string) => {
    return drawers.find((d) => d.id === drawerId);
  };

  // Save cabinet
  const handleSaveCabinet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCabinet: Cabinet = {
      id: editingCabinet?.id || String(Date.now()),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      drawersCount: editingCabinet?.drawersCount || 0,
      totalTools: editingCabinet?.totalTools || 0,
      isReformOnly: editingCabinet?.isReformOnly,
    };

    if (editingCabinet) {
      setCabinets(
        cabinets.map((c) =>
          c.id === editingCabinet.id
            ? {
                ...newCabinet,
                drawersCount: c.drawersCount,
                totalTools: c.totalTools,
              }
            : c
        )
      );
      addNotification({
        type: "edit",
        title: "Armario editado",
        message: `Armario "${newCabinet.name}" foi atualizado. Local: ${newCabinet.location}`,
      });
    } else {
      setCabinets([...cabinets, newCabinet]);
      addNotification({
        type: "cabinet",
        title: "Novo armario criado",
        message: `Armario "${newCabinet.name}" adicionado em ${newCabinet.location}`,
      });
    }
    setIsDialogOpen(false);
    setEditingCabinet(null);
  };

  // Delete cabinet (reform-only cabinets are protected)
  const handleDeleteCabinet = (id: string) => {
    const cab = cabinets.find((c) => c.id === id);
    if (cab?.isReformOnly) return;
    setCabinets(cabinets.filter((c) => c.id !== id));
    setDrawers(drawers.filter((d) => d.cabinetId !== id));
    setTools(tools.filter((t) => t.cabinetId !== id));
    if (cab) {
      addNotification({
        type: "delete",
        title: "Armario removido",
        message: `Armario "${cab.name}" e todas suas gavetas/ferramentas foram removidos.`,
      });
    }
  };

  // Edit cabinet
  const handleEditCabinet = (cabinet: Cabinet) => {
    setEditingCabinet(cabinet);
    setIsDialogOpen(true);
  };

  // Add or edit drawer
  const handleSaveDrawer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCabinet) return;
    const formData = new FormData(e.currentTarget);
    const positions = (formData.get("positions") as string)
      .split(",")
      .map((p) => p.trim().toUpperCase())
      .filter((p) => p.length > 0);
    const drawerId = formData.get("drawerId") as string;
    
    const drawerNumber = formData.get("number") as string;
    if (editingDrawer && drawerId) {
      // Edit existing drawer
      setDrawers(
        drawers.map((d) =>
          d.id === drawerId
            ? {
                ...d,
                number: drawerNumber,
                positions,
              }
            : d
        )
      );
      addNotification({
        type: "edit",
        title: "Gaveta editada",
        message: `Gaveta ${drawerNumber} do armario "${selectedCabinet.name}" atualizada. Posicoes: ${positions.join(", ")}`,
      });
    } else {
      // Add new drawer
      const newDrawer: Drawer = {
        id: `d${Date.now()}`,
        cabinetId: selectedCabinet.id,
        number: drawerNumber,
        positions,
      };
      setDrawers([...drawers, newDrawer]);
      setCabinets(
        cabinets.map((c) =>
          c.id === selectedCabinet.id
            ? { ...c, drawersCount: c.drawersCount + 1 }
            : c
        )
      );
      addNotification({
        type: "drawer",
        title: "Nova gaveta adicionada",
        message: `Gaveta ${drawerNumber} criada no armario "${selectedCabinet.name}" com posicoes ${positions.join(", ")}`,
      });
    }
    setIsDrawerDialogOpen(false);
    setEditingDrawer(null);
  };

  // Edit drawer
  const handleEditDrawer = (drawer: Drawer) => {
    setEditingDrawer(drawer);
    setIsDrawerDialogOpen(true);
  };

  // Delete drawer
  const handleDeleteDrawer = (drawerId: string) => {
    const drawerToDelete = drawers.find((d) => d.id === drawerId);
    setDrawers(drawers.filter((d) => d.id !== drawerId));
    setTools(tools.filter((t) => t.drawerId !== drawerId));
    if (selectedCabinet) {
      setCabinets(
        cabinets.map((c) =>
          c.id === selectedCabinet.id
            ? { ...c, drawersCount: Math.max(0, c.drawersCount - 1) }
            : c
        )
      );
    }
    if (drawerToDelete) {
      addNotification({
        type: "delete",
        title: "Gaveta removida",
        message: `Gaveta ${drawerToDelete.number} removida do armario "${selectedCabinet?.name}".`,
      });
    }
  };

  // Add or edit tool
  const handleSaveTool = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCabinet) return;
    const formData = new FormData(e.currentTarget);
    let rawCode = formData.get("code") as string;
    // Auto-append "R" suffix if saving into a reform-only cabinet
    if (selectedCabinet.isReformOnly && !rawCode.endsWith("R")) {
      rawCode = rawCode + "R";
    }
    const toolData: Tool = {
      id: editingTool?.id || String(Date.now()),
      code: rawCode,
      description: formData.get("description") as string,
      typeId: formData.get("typeId") as string,
      supplier: formData.get("supplier") as string,
      statusId: formData.get("statusId") as string || "1",
      cabinetId: selectedCabinet.id,
      drawerId: formData.get("drawerId") as string,
      position: (formData.get("position") as string).toUpperCase(),
      quantity: Number(formData.get("quantity")),
      minStock: Number(formData.get("minStock")),
      unitValue: formData.get("unitValue") ? Number(formData.get("unitValue")) : undefined,
      reformUnitValue: formData.get("reformUnitValue") ? Number(formData.get("reformUnitValue")) : undefined,
      notes: formData.get("notes") as string || "",
      reformDate: (formData.get("reformDate") as string) || undefined,
    };

    const drawerInfo = drawers.find((d) => d.id === toolData.drawerId);
    if (editingTool) {
      setTools(tools.map((t) => (t.id === editingTool.id ? toolData : t)));
      addNotification({
        type: "edit",
        title: "Ferramenta editada",
        message: `${toolData.code} - ${toolData.description} atualizada. Armario "${selectedCabinet.name}", Gaveta ${drawerInfo?.number}, Pos. ${toolData.position}`,
      });
    } else {
      setTools([...tools, toolData]);
      setCabinets(
        cabinets.map((c) =>
          c.id === selectedCabinet.id ? { ...c, totalTools: c.totalTools + 1 } : c
        )
      );
      addNotification({
        type: "add",
        title: "Nova ferramenta cadastrada",
        message: `${toolData.code} - ${toolData.description} (Qtd: ${toolData.quantity}) adicionada no armario "${selectedCabinet.name}", Gaveta ${drawerInfo?.number}, Pos. ${toolData.position}`,
      });
    }
    setIsToolDialogOpen(false);
    setEditingTool(null);
    setSelectedDrawer(null);
  };

  // Edit tool
  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setSelectedDrawer(drawers.find((d) => d.id === tool.drawerId) || null);
    setIsToolDialogOpen(true);
  };

  // Delete tool
  const handleDeleteTool = (toolId: string) => {
    const toolToDelete = tools.find((t) => t.id === toolId);
    setTools(tools.filter((t) => t.id !== toolId));
    if (selectedCabinet) {
      setCabinets(
        cabinets.map((c) =>
          c.id === selectedCabinet.id
            ? { ...c, totalTools: Math.max(0, c.totalTools - 1) }
            : c
        )
      );
    }
    if (toolToDelete) {
      addNotification({
        type: "delete",
        title: "Ferramenta removida",
        message: `${toolToDelete.code} - ${toolToDelete.description} foi removida do armario "${selectedCabinet?.name}".`,
      });
    }
  };

  // Back to cabinet list
  const handleBackToCabinets = () => {
    setSelectedCabinet(null);
    setSelectedDrawer(null);
    setSearchTerm("");
  };

  // Cabinet List View
  if (!selectedCabinet) {
    return (
      <div className="min-h-screen">
        <Header
          title="Armarios"
          subtitle="Clique em um armario para visualizar e gerenciar as ferramentas"
        />

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Global Search */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar ferramenta em todos os armarios por codigo, descricao, tipo ou fornecedor..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="pl-11 h-12 text-base"
                />
                {globalSearch && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2 text-muted-foreground"
                    onClick={() => setGlobalSearch("")}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Global Search Results */}
          {globalSearch && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Resultados da Busca</CardTitle>
                    <CardDescription>
                      {globalSearchResults.length} ferramenta(s) encontrada(s) para "{globalSearch}"
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{globalSearchResults.length} resultado(s)</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {globalSearchResults.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Nenhuma ferramenta encontrada para "{globalSearch}"
                    </p>
                    <p className="text-muted-foreground/60 text-xs mt-1">
                      Tente buscar por codigo, descricao, tipo ou fornecedor
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                          <TableHead className="w-[120px]">Codigo</TableHead>
                          <TableHead className="min-w-[200px]">Descricao</TableHead>
                          <TableHead className="w-[100px]">Tipo</TableHead>
                          <TableHead className="w-[130px]">Fornecedor</TableHead>
                          <TableHead className="w-[160px]">Armario</TableHead>
                          <TableHead className="w-[100px]">Gaveta / Pos.</TableHead>
                          <TableHead className="w-[80px] text-center">Qtd</TableHead>
                          <TableHead className="w-[80px] text-center">Min</TableHead>
                          <TableHead className="w-[90px]">Status</TableHead>
                          <TableHead className="w-[40px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {globalSearchResults.map(({ tool, cabinet, drawer, type, status }) => {
                          const isLowStock = tool.quantity <= tool.minStock;
                          return (
                            <TableRow
                              key={tool.id}
                              className={`${isLowStock ? "bg-warning/5 hover:bg-warning/10" : "hover:bg-secondary/20"}`}
                            >
                              <TableCell>
                                <div className="flex flex-wrap items-center gap-1.5">
                              <ToolCodeDisplay code={tool.code} className="font-semibold text-foreground" />
                              <PriceTag value={tool.unitValue} reformValue={tool.reformUnitValue} />
                                </div>
                              </TableCell>
                              <TableCell className="text-foreground">
                                {tool.description}
                              </TableCell>
                              <TableCell>
                                {type && (
                                  <Badge variant="outline" className="text-xs">{type.name}</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {tool.supplier}
                              </TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                                  onClick={() => {
                                    if (cabinet) {
                                      setGlobalSearch("");
                                      setSelectedCabinet(cabinet);
                                    }
                                  }}
                                >
                                  <Archive className="h-3 w-3" />
                                  {cabinet?.name || "--"}
                                </button>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  Gav. {drawer?.number || "--"} / {tool.position}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {inlineEditId === tool.id ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={inlineQty}
                                    onChange={(e) => setInlineQty(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveInlineEdit(tool.id);
                                      if (e.key === "Escape") cancelInlineEdit();
                                    }}
                                    className="h-7 w-16 text-center text-sm mx-auto"
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => startInlineEdit(tool)}
                                    className={`font-semibold cursor-pointer hover:underline ${isLowStock ? "text-warning" : "text-foreground"}`}
                                    title="Clique para editar"
                                  >
                                    {tool.quantity}
                                  </button>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {inlineEditId === tool.id ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={inlineMinStock}
                                      onChange={(e) => setInlineMinStock(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveInlineEdit(tool.id);
                                        if (e.key === "Escape") cancelInlineEdit();
                                      }}
                                      className="h-7 w-16 text-center text-sm"
                                    />
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-success" onClick={() => saveInlineEdit(tool.id)}>
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={cancelInlineEdit}>
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => startInlineEdit(tool)}
                                    className="text-sm text-muted-foreground cursor-pointer hover:underline"
                                    title="Clique para editar"
                                  >
                                    {tool.minStock}
                                  </button>
                                )}
                              </TableCell>
                              <TableCell>
                                {status && (
                                  <Badge variant="secondary" className={`${status.color} text-foreground text-xs`}>
                                    {status.name}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="Ir para armario"
                                  onClick={() => {
                                    if (cabinet) {
                                      setGlobalSearch("");
                                      setSelectedCabinet(cabinet);
                                    }
                                  }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info Card - show only when not searching */}
          {!globalSearch && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Archive className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Gestao de Armarios
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Selecione um armario para ver todas as ferramentas, gavetas e
                    cadastrar novas ferramentas diretamente.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Cabinet Button */}
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCabinet(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Armario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSaveCabinet}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCabinet ? "Editar Armario" : "Novo Armario"}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do armario. Campos com * sao obrigatorios.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Armario Principal"
                        defaultValue={editingCabinet?.name}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descricao</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Descricao do armario..."
                        defaultValue={editingCabinet?.description}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Localizacao *</Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="Ex: Galpao 1, Setor A"
                        defaultValue={editingCabinet?.location}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingCabinet ? "Salvar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Cabinets Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cabinets.map((cabinet) => {
              const cabinetToolsList = tools.filter(
                (t) => t.cabinetId === cabinet.id
              );
              const lowStockCount = cabinetToolsList.filter(
                (t) => t.quantity <= t.minStock
              ).length;

              return (
                <Card
                  key={cabinet.id}
                  className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedCabinet(cabinet)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Archive className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                              {cabinet.name}
                            </CardTitle>
                            {cabinet.isReformOnly && (
                              <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 text-[10px]">
                                Reformadas
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {cabinet.location}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {cabinet.isReformOnly ? (
                            <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                              Armario protegido (somente reformadas)
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditCabinet(cabinet);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCabinet(cabinet.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {cabinet.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {
                              drawers.filter((d) => d.cabinetId === cabinet.id)
                                .length
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">Gavetas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">
                            {cabinetToolsList.length}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ferramentas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lowStockCount > 0 && (
                          <Badge
                            variant="outline"
                            className="border-warning text-warning"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {lowStockCount} baixo
                          </Badge>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Cabinet Detail View
  return (
    <div className="min-h-screen">
      <Header
        title={selectedCabinet.name}
        subtitle={`${selectedCabinet.location} - ${selectedCabinet.description}`}
      />

      <div className="p-6 space-y-6">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBackToCabinets}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Armarios
          </Button>
          <div className="flex gap-2">
            {/* Add/Edit Drawer Dialog */}
            <Dialog
              open={isDrawerDialogOpen}
              onOpenChange={(open) => {
                setIsDrawerDialogOpen(open);
                if (!open) setEditingDrawer(null);
              }}
            >
              <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setEditingDrawer(null)}>
                  <Layers className="mr-2 h-4 w-4" />
                  Nova Gaveta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-0 gap-0 max-h-[85vh] flex flex-col [&>form]:flex [&>form]:flex-col [&>form]:max-h-[85vh]">
                <DrawerForm
                  cabinetName={selectedCabinet.name}
                  existingDrawers={cabinetDrawers}
                  editingDrawer={editingDrawer}
                  onSubmit={handleSaveDrawer}
                  onCancel={() => {
                    setIsDrawerDialogOpen(false);
                    setEditingDrawer(null);
                  }}
                />
              </DialogContent>
            </Dialog>

            {/* Add/Edit Tool Dialog */}
            <Dialog
              open={isToolDialogOpen}
              onOpenChange={(open) => {
                setIsToolDialogOpen(open);
                if (!open) {
                  setEditingTool(null);
                  setSelectedDrawer(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingTool(null); setSelectedDrawer(null); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Ferramenta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0 gap-0 max-h-[85vh] flex flex-col">
                <form onSubmit={handleSaveTool} className="flex flex-col max-h-[85vh]">
                  {/* Fixed Header */}
                  <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTool ? "Editar Ferramenta" : "Cadastrar Nova Ferramenta"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingTool
                          ? `Editando ${editingTool.code} - ${editingTool.description}`
                          : `Adicione uma ferramenta ao armario ${selectedCabinet.name}`}
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="code">Codigo *</Label>
                          <Input
                            id="code"
                            name="code"
                            placeholder="Ex: INS-006"
                            defaultValue={editingTool?.code}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="typeId">Tipo *</Label>
                          <Select name="typeId" required defaultValue={editingTool?.typeId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {toolTypes
                                .filter((t) => t.isActive)
                                .map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Descricao Completa *</Label>
                        <Input
                          id="description"
                          name="description"
                          placeholder="Ex: Inserto CNMG 120408 Metal Duro"
                          defaultValue={editingTool?.description}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="supplier">Fornecedor *</Label>
                        <Input
                          id="supplier"
                          name="supplier"
                          placeholder="Ex: Fornecedor A"
                          defaultValue={editingTool?.supplier}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="drawerId">Gaveta *</Label>
                          <Select
                            name="drawerId"
                            required
                            defaultValue={editingTool?.drawerId}
                            onValueChange={(val) =>
                              setSelectedDrawer(
                                cabinetDrawers.find((d) => d.id === val) || null
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a gaveta..." />
                            </SelectTrigger>
                            <SelectContent>
                              {cabinetDrawers
                                .sort((a, b) => Number(a.number) - Number(b.number))
                                .map((drawer) => (
                                  <SelectItem key={drawer.id} value={drawer.id}>
                                    Gaveta {drawer.number} (Pos. {drawer.positions.join(", ")})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="position">Posicao *</Label>
                          <Select name="position" required defaultValue={editingTool?.position}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedDrawer?.positions.map((pos) => {
                                const occupied = getToolAtPosition(
                                  selectedDrawer.id,
                                  pos
                                );
                                const isSameToolPos = editingTool?.position === pos && editingTool?.drawerId === selectedDrawer.id;
                                return (
                                  <SelectItem
                                    key={pos}
                                    value={pos}
                                    disabled={!!occupied && !isSameToolPos}
                                  >
                                    Posicao {pos}{" "}
                                    {occupied && !isSameToolPos
                                      ? `(Ocupado: ${occupied.code})`
                                      : ""}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="quantity">Quantidade *</Label>
                          <Input
                            id="quantity"
                            name="quantity"
                            type="number"
                            min="0"
                            placeholder="0"
                            defaultValue={editingTool?.quantity}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="minStock">Estoque Minimo *</Label>
                          <Input
                            id="minStock"
                            name="minStock"
                            type="number"
                            min="0"
                            placeholder="0"
                            defaultValue={editingTool?.minStock}
                            required
                          />
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
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="statusId">Status</Label>
                          <Select name="statusId" defaultValue={editingTool?.statusId || "1"}>
                            <SelectTrigger>
                              <SelectValue placeholder="Status..." />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses
                                .filter((s) => s.isActive)
                                .map((status) => (
                                  <SelectItem key={status.id} value={status.id}>
                                    {status.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Observacoes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          placeholder="Observacoes adicionais..."
                          defaultValue={editingTool?.notes}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fixed Footer */}
                  <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-border bg-card">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsToolDialogOpen(false);
                        setEditingTool(null);
                        setSelectedDrawer(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingTool ? "Salvar Alteracoes" : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{cabinetDrawers.length}</p>
                  <p className="text-xs text-muted-foreground">Gavetas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <Package className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{cabinetTools.length}</p>
                  <p className="text-xs text-muted-foreground">Ferramentas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Package className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {cabinetTools.reduce((acc, t) => acc + t.quantity, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Qtd. Total</p>
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
                  <p className="text-2xl font-bold">
                    {cabinetTools.filter((t) => t.quantity <= t.minStock).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Estoque Baixo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ferramenta por codigo, descricao, tipo ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base"
              />
              {searchTerm && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {filteredTools.length} ferramenta(s) encontrada(s)
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => setSearchTerm("")}
                  >
                    Limpar busca
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Drawers - Full Row Layout with all tool details */}
        <div className="space-y-4">
          {cabinetDrawers
            .sort((a, b) => Number(a.number) - Number(b.number))
            .filter((drawer) => {
              if (!searchTerm) return true;
              // Show drawer only if it has at least one matching tool
              return drawer.positions.some((pos) => {
                const tool = getToolAtPosition(drawer.id, pos);
                if (!tool) return false;
                const term = searchTerm.toLowerCase();
                const type = getType(tool.typeId);
                return (
                  tool.code.toLowerCase().includes(term) ||
                  tool.description.toLowerCase().includes(term) ||
                  tool.supplier.toLowerCase().includes(term) ||
                  (type?.name.toLowerCase().includes(term) ?? false)
                );
              });
            })
            .map((drawer) => {
              const drawerTools = getDrawerTools(drawer.id);
              return (
                <Card key={drawer.id} className="bg-card border-border overflow-hidden">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-secondary/30 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
                        <Layers className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          Gaveta {drawer.number}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Posicoes {drawer.positions[0]} ate {drawer.positions[drawer.positions.length - 1]}
                          {" "}&middot;{" "}
                          {drawerTools.length} de {drawer.positions.length} ocupadas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={drawerTools.length === drawer.positions.length ? "default" : "secondary"}
                      >
                        {drawerTools.length}/{drawer.positions.length}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleEditDrawer(drawer)}>
                        <Edit className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteDrawer(drawer.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Gaveta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Positions Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/10 hover:bg-secondary/10">
                          <TableHead className="w-[70px]">Posicao</TableHead>
                          <TableHead className="w-[120px]">Codigo</TableHead>
                          <TableHead className="min-w-[200px]">Descricao da Ferramenta</TableHead>
                          <TableHead className="w-[100px]">Tipo</TableHead>
                          <TableHead className="w-[130px]">Fornecedor</TableHead>
                          <TableHead className="w-[90px] text-center">Qtd</TableHead>
                          <TableHead className="w-[90px] text-center">Est. Min</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[110px]">Reforma</TableHead>
                          <TableHead className="w-[60px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drawer.positions
                          .filter((pos) => {
                            if (!searchTerm) return true;
                            const tool = getToolAtPosition(drawer.id, pos);
                            if (!tool) return false;
                            const term = searchTerm.toLowerCase();
                            const type = getType(tool.typeId);
                            return (
                              tool.code.toLowerCase().includes(term) ||
                              tool.description.toLowerCase().includes(term) ||
                              tool.supplier.toLowerCase().includes(term) ||
                              (type?.name.toLowerCase().includes(term) ?? false)
                            );
                          })
                          .map((pos) => {
                          const tool = getToolAtPosition(drawer.id, pos);
                          const isLowStock = tool && tool.quantity <= tool.minStock;
                          const status = tool ? getStatus(tool.statusId) : null;
                          const type = tool ? getType(tool.typeId) : null;

                          return (
                            <TableRow
                              key={pos}
                              className={`${
                                tool
                                  ? isLowStock
                                    ? "bg-warning/5 hover:bg-warning/10"
                                    : "hover:bg-secondary/20"
                                  : "hover:bg-secondary/10"
                              }`}
                            >
                              <TableCell>
                                <div className={`flex items-center justify-center w-8 h-8 rounded-md text-sm font-bold ${
                                  tool
                                    ? isLowStock
                                      ? "bg-warning/20 text-warning"
                                      : "bg-primary/20 text-primary"
                                    : "bg-secondary text-muted-foreground"
                                }`}>
                                  {pos}
                                </div>
                              </TableCell>
                              <TableCell>
                                {tool ? (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <ToolCodeDisplay code={tool.code} className="font-semibold text-foreground" />
                                    <PriceTag value={tool.unitValue} reformValue={tool.reformUnitValue} />
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic text-sm">--</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {tool ? (
                                  <span className="text-foreground">{tool.description}</span>
                                ) : (
                                  <span className="text-muted-foreground italic text-sm">Posicao vazia</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {type ? (
                                  <Badge variant="outline" className="text-xs">{type.name}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {tool ? (
                                  <span className="text-sm text-muted-foreground">{tool.supplier}</span>
                                ) : (
                                  <span className="text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {tool ? (
                                  inlineEditId === tool.id ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      value={inlineQty}
                                      onChange={(e) => setInlineQty(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") saveInlineEdit(tool.id);
                                        if (e.key === "Escape") cancelInlineEdit();
                                      }}
                                      className="h-7 w-16 text-center text-sm mx-auto"
                                      autoFocus
                                    />
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => startInlineEdit(tool)}
                                      className={`font-semibold cursor-pointer hover:underline ${isLowStock ? "text-warning" : "text-foreground"}`}
                                      title="Clique para editar"
                                    >
                                      {tool.quantity}
                                    </button>
                                  )
                                ) : (
                                  <span className="text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {tool ? (
                                  inlineEditId === tool.id ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Input
                                        type="number"
                                        min="0"
                                        value={inlineMinStock}
                                        onChange={(e) => setInlineMinStock(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") saveInlineEdit(tool.id);
                                          if (e.key === "Escape") cancelInlineEdit();
                                        }}
                                        className="h-7 w-16 text-center text-sm"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-success"
                                        onClick={() => saveInlineEdit(tool.id)}
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive"
                                        onClick={cancelInlineEdit}
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => startInlineEdit(tool)}
                                      className="text-sm text-muted-foreground cursor-pointer hover:underline"
                                      title="Clique para editar"
                                    >
                                      {tool.minStock}
                                    </button>
                                  )
                                ) : (
                                  <span className="text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {status ? (
                                  <Badge variant="secondary" className={`${status.color} text-foreground text-xs`}>
                                    {status.name}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">--</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {tool?.reformDate ? (() => {
                                  const rd = new Date(tool.reformDate);
                                  const now = new Date();
                                  const isOverdue = rd < now;
                                  return (
                                    <span className={`text-xs font-medium ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                                      {isOverdue && <AlertTriangle className="inline mr-1 h-3 w-3" />}
                                      {rd.toLocaleDateString("pt-BR")}
                                    </span>
                                  );
                                })() : (
                                  <span className="text-muted-foreground text-xs">--</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {tool && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditTool(tool)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar Ferramenta
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteTool(tool.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remover
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              );
            })}

          {searchTerm && filteredTools.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">
                  Nenhuma ferramenta encontrada para "{searchTerm}"
                </p>
                <p className="text-sm text-muted-foreground">
                  Tente buscar por outro codigo, descricao ou fornecedor
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 bg-transparent"
                  onClick={() => setSearchTerm("")}
                >
                  Limpar busca
                </Button>
              </CardContent>
            </Card>
          )}

          {!searchTerm && cabinetDrawers.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhuma gaveta cadastrada</p>
                <p className="text-sm text-muted-foreground">
                  Clique em "Nova Gaveta" para adicionar gavetas a este armario
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
