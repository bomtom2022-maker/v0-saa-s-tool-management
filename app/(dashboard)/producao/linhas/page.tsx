"use client";

import React, { useState } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import {
  Factory,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  Cog,
  MapPin,
} from "lucide-react";
import { useDataStore } from "@/lib/data-store";
import { useNotifications } from "@/lib/notifications";
import type { ProductionLine } from "@/lib/mock-data";

export default function LinhasProducaoPage() {
  const { productionLines, setProductionLines, machines } = useDataStore();
  const { addNotification } = useNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ProductionLine | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newLine: ProductionLine = {
      id: editingLine?.id || `pl-${Date.now()}`,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      isActive: formData.get("isActive") === "on",
      machinesCount: editingLine?.machinesCount || 0,
    };

    if (editingLine) {
      setProductionLines(productionLines.map((l) => (l.id === editingLine.id ? newLine : l)));
      addNotification({ type: "edit", title: "Linha editada", message: `${newLine.name} foi atualizada.` });
    } else {
      setProductionLines([...productionLines, newLine]);
      addNotification({ type: "add", title: "Linha cadastrada", message: `${newLine.name} adicionada ao sistema.` });
    }
    setIsDialogOpen(false);
    setEditingLine(null);
  };

  const handleDelete = (id: string) => {
    const line = productionLines.find((l) => l.id === id);
    const hasMachines = machines.some((m) => m.productionLineId === id);
    
    if (hasMachines) {
      addNotification({ type: "error", title: "Erro ao excluir", message: "Esta linha possui maquinas vinculadas. Remova as maquinas primeiro." });
      return;
    }

    setProductionLines(productionLines.filter((l) => l.id !== id));
    if (line) {
      addNotification({ type: "delete", title: "Linha excluida", message: `${line.name} removida do sistema.` });
    }
  };

  const handleEdit = (line: ProductionLine) => {
    setEditingLine(line);
    setIsDialogOpen(true);
  };

  const getMachinesCount = (lineId: string) => {
    return machines.filter((m) => m.productionLineId === lineId).length;
  };

  const filteredLines = productionLines.filter((line) => {
    const matchesSearch =
      line.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      line.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "active" && line.isActive) ||
      (filterStatus === "inactive" && !line.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen">
      <Header
        title="Linhas de Producao"
        subtitle="Gerencie as linhas de producao da fabrica"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Factory className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Linhas de Producao
              </p>
              <p className="text-xs text-muted-foreground">
                Configure as linhas de producao e vincule maquinas a cada uma delas.
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
                    placeholder="Buscar por nome, descricao ou local..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingLine(null); }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingLine(null)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Linha
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <form onSubmit={handleSave}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingLine ? "Editar Linha" : "Nova Linha de Producao"}
                      </DialogTitle>
                      <DialogDescription>
                        Preencha os dados da linha de producao.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Nome da Linha *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Ex: Linha 1 - Usinagem"
                          defaultValue={editingLine?.name}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Descricao</Label>
                        <Input
                          id="description"
                          name="description"
                          placeholder="Ex: Linha principal de usinagem CNC"
                          defaultValue={editingLine?.description}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="location">Localizacao</Label>
                        <Input
                          id="location"
                          name="location"
                          placeholder="Ex: Galpao 1"
                          defaultValue={editingLine?.location}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="isActive"
                          name="isActive"
                          defaultChecked={editingLine?.isActive ?? true}
                        />
                        <Label htmlFor="isActive">Linha ativa</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingLine ? "Salvar" : "Cadastrar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Linhas Cadastradas</CardTitle>
            <CardDescription>{filteredLines.length} linha(s) encontrada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Localizacao</TableHead>
                    <TableHead className="text-center">Maquinas</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma linha encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="font-medium">{line.name}</TableCell>
                        <TableCell className="text-muted-foreground">{line.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {line.location || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="gap-1">
                            <Cog className="h-3 w-3" />
                            {getMachinesCount(line.id)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={line.isActive ? "default" : "secondary"}>
                            {line.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(line)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(line.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
