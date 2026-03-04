"use client";

import React, { useState } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Cog,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  Wrench,
  Package,
  ArrowRight,
  Factory,
  Calendar,
} from "lucide-react";
import { useDataStore } from "@/lib/data-store";
import { useNotifications } from "@/lib/notifications";
import type { Machine, MachineToolAllocation } from "@/lib/mock-data";

export default function FerramentasMaquinasPage() {
  const { 
    productionLines, 
    machines, 
    setMachines, 
    tools, 
    machineToolAllocations, 
    setMachineToolAllocations 
  } = useDataStore();
  const { addNotification } = useNotifications();
  
  // Machine dialog
  const [isMachineDialogOpen, setIsMachineDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  
  // Allocation dialog
  const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false);
  const [selectedMachineForAllocation, setSelectedMachineForAllocation] = useState<Machine | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLine, setFilterLine] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("machines");

  // Machine CRUD
  const handleSaveMachine = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newMachine: Machine = {
      id: editingMachine?.id || `m-${Date.now()}`,
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      productionLineId: formData.get("productionLineId") as string,
      description: formData.get("description") as string,
      brand: formData.get("brand") as string,
      model: formData.get("model") as string,
      isActive: true,
    };

    if (editingMachine) {
      setMachines(machines.map((m) => (m.id === editingMachine.id ? newMachine : m)));
      addNotification({ type: "edit", title: "Maquina editada", message: `${newMachine.name} foi atualizada.` });
    } else {
      setMachines([...machines, newMachine]);
      addNotification({ type: "add", title: "Maquina cadastrada", message: `${newMachine.name} adicionada ao sistema.` });
    }
    setIsMachineDialogOpen(false);
    setEditingMachine(null);
  };

  const handleDeleteMachine = (id: string) => {
    const machine = machines.find((m) => m.id === id);
    const hasAllocations = machineToolAllocations.some((a) => a.machineId === id);
    
    if (hasAllocations) {
      addNotification({ type: "error", title: "Erro ao excluir", message: "Esta maquina possui ferramentas alocadas. Remova as alocacoes primeiro." });
      return;
    }

    setMachines(machines.filter((m) => m.id !== id));
    if (machine) {
      addNotification({ type: "delete", title: "Maquina excluida", message: `${machine.name} removida do sistema.` });
    }
  };

  const handleEditMachine = (machine: Machine) => {
    setEditingMachine(machine);
    setIsMachineDialogOpen(true);
  };

  // Tool Allocation
  const handleSaveAllocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMachineForAllocation) return;

    const formData = new FormData(e.currentTarget);
    const toolId = formData.get("toolId") as string;
    const quantity = Number(formData.get("quantity"));
    const notes = formData.get("notes") as string;

    const newAllocation: MachineToolAllocation = {
      id: `mta-${Date.now()}`,
      machineId: selectedMachineForAllocation.id,
      toolId,
      quantity,
      allocatedAt: new Date().toISOString(),
      allocatedBy: "eng-processo-1",
      notes,
    };

    setMachineToolAllocations([...machineToolAllocations, newAllocation]);
    
    const tool = tools.find((t) => t.id === toolId);
    addNotification({ 
      type: "add", 
      title: "Ferramenta alocada", 
      message: `${quantity}x ${tool?.code || toolId} alocada em ${selectedMachineForAllocation.name}` 
    });
    
    setIsAllocationDialogOpen(false);
    setSelectedMachineForAllocation(null);
  };

  const handleRemoveAllocation = (allocationId: string) => {
    const allocation = machineToolAllocations.find((a) => a.id === allocationId);
    setMachineToolAllocations(machineToolAllocations.filter((a) => a.id !== allocationId));
    
    if (allocation) {
      const tool = tools.find((t) => t.id === allocation.toolId);
      const machine = machines.find((m) => m.id === allocation.machineId);
      addNotification({ 
        type: "delete", 
        title: "Alocacao removida", 
        message: `${tool?.code || allocation.toolId} removida de ${machine?.name || allocation.machineId}` 
      });
    }
  };

  const openAllocationDialog = (machine: Machine) => {
    setSelectedMachineForAllocation(machine);
    setIsAllocationDialogOpen(true);
  };

  // Helpers
  const getLineName = (lineId: string) => productionLines.find((l) => l.id === lineId)?.name || "-";
  const getToolInfo = (toolId: string) => tools.find((t) => t.id === toolId);
  const getMachineAllocations = (machineId: string) => machineToolAllocations.filter((a) => a.machineId === machineId);
  const getAllocationsCount = (machineId: string) => getMachineAllocations(machineId).length;

  const filteredMachines = machines.filter((machine) => {
    const matchesSearch =
      machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLine = filterLine === "all" || machine.productionLineId === filterLine;
    return matchesSearch && matchesLine;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Ferramentas em Maquinas"
        subtitle="Gerencie maquinas e alocacao de ferramentas"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Cog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Gestao de Maquinas e Ferramentas
              </p>
              <p className="text-xs text-muted-foreground">
                Cadastre maquinas e controle quais ferramentas estao alocadas em cada uma.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="machines" className="gap-2">
              <Cog className="h-4 w-4" />
              Maquinas
            </TabsTrigger>
            <TabsTrigger value="allocations" className="gap-2">
              <Wrench className="h-4 w-4" />
              Alocacoes
            </TabsTrigger>
          </TabsList>

          {/* Machines Tab */}
          <TabsContent value="machines" className="space-y-4">
            {/* Actions Bar */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, codigo ou marca..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={filterLine} onValueChange={setFilterLine}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Linha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as linhas</SelectItem>
                        {productionLines.map((line) => (
                          <SelectItem key={line.id} value={line.id}>
                            {line.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Dialog open={isMachineDialogOpen} onOpenChange={(open) => { setIsMachineDialogOpen(open); if (!open) setEditingMachine(null); }}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingMachine(null)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Maquina
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <form onSubmit={handleSaveMachine}>
                        <DialogHeader>
                          <DialogTitle>
                            {editingMachine ? "Editar Maquina" : "Nova Maquina"}
                          </DialogTitle>
                          <DialogDescription>
                            Preencha os dados da maquina.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="name">Nome *</Label>
                              <Input
                                id="name"
                                name="name"
                                placeholder="Ex: CNC Vertical 01"
                                defaultValue={editingMachine?.name}
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="code">Codigo *</Label>
                              <Input
                                id="code"
                                name="code"
                                placeholder="Ex: CNC-V01"
                                defaultValue={editingMachine?.code}
                                required
                              />
                            </div>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="productionLineId">Linha de Producao *</Label>
                            <Select name="productionLineId" defaultValue={editingMachine?.productionLineId || productionLines[0]?.id}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {productionLines.filter((l) => l.isActive).map((line) => (
                                  <SelectItem key={line.id} value={line.id}>
                                    {line.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Descricao</Label>
                            <Input
                              id="description"
                              name="description"
                              placeholder="Ex: Centro de usinagem vertical"
                              defaultValue={editingMachine?.description}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="brand">Marca</Label>
                              <Input
                                id="brand"
                                name="brand"
                                placeholder="Ex: Romi"
                                defaultValue={editingMachine?.brand}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="model">Modelo</Label>
                              <Input
                                id="model"
                                name="model"
                                placeholder="Ex: D800"
                                defaultValue={editingMachine?.model}
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsMachineDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit">
                            {editingMachine ? "Salvar" : "Cadastrar"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Machines Table */}
            <Card>
              <CardHeader>
                <CardTitle>Maquinas Cadastradas</CardTitle>
                <CardDescription>{filteredMachines.length} maquina(s) encontrada(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Linha</TableHead>
                        <TableHead>Marca / Modelo</TableHead>
                        <TableHead className="text-center">Ferramentas</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMachines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhuma maquina encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMachines.map((machine) => (
                          <TableRow key={machine.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {machine.code}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{machine.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Factory className="h-3.5 w-3.5" />
                                {getLineName(machine.productionLineId)}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {machine.brand} {machine.model}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary" className="gap-1">
                                <Wrench className="h-3 w-3" />
                                {getAllocationsCount(machine.id)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openAllocationDialog(machine)}
                                  title="Alocar ferramenta"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditMachine(machine)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDeleteMachine(machine.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allocations Tab */}
          <TabsContent value="allocations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alocacoes de Ferramentas</CardTitle>
                <CardDescription>Ferramentas atualmente alocadas em maquinas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ferramenta</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            <ArrowRight className="h-3.5 w-3.5" />
                            Maquina
                          </div>
                        </TableHead>
                        <TableHead>Linha</TableHead>
                        <TableHead>Data Alocacao</TableHead>
                        <TableHead>Observacoes</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {machineToolAllocations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nenhuma alocacao registrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        machineToolAllocations.map((allocation) => {
                          const tool = getToolInfo(allocation.toolId);
                          const machine = machines.find((m) => m.id === allocation.machineId);
                          return (
                            <TableRow key={allocation.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{tool?.code || allocation.toolId}</p>
                                    <p className="text-xs text-muted-foreground">{tool?.description || "-"}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{allocation.quantity}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Cog className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{machine?.name || allocation.machineId}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{machine?.code}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {machine ? getLineName(machine.productionLineId) : "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(allocation.allocatedAt)}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                {allocation.notes || "-"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveAllocation(allocation.id)}
                                  title="Remover alocacao"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
          </TabsContent>
        </Tabs>

        {/* Allocation Dialog */}
        <Dialog open={isAllocationDialogOpen} onOpenChange={(open) => { setIsAllocationDialogOpen(open); if (!open) setSelectedMachineForAllocation(null); }}>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleSaveAllocation}>
              <DialogHeader>
                <DialogTitle>Alocar Ferramenta</DialogTitle>
                <DialogDescription>
                  {selectedMachineForAllocation && (
                    <>Alocando ferramenta para: <strong>{selectedMachineForAllocation.name}</strong></>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="toolId">Ferramenta *</Label>
                  <Select name="toolId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma ferramenta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tools.map((tool) => (
                        <SelectItem key={tool.id} value={tool.id}>
                          {tool.code} - {tool.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Observacoes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Ex: Operacao de desbaste"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAllocationDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Alocar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
