"use client";

import React from "react"

import { useState } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  ToggleLeft,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Palette,
} from "lucide-react";
import { type ToolStatus } from "@/lib/mock-data";
  import { useDataStore } from "@/lib/data-store";
  import { useNotifications } from "@/lib/notifications";
  
const colorOptions = [
  // Verdes
  { value: "bg-green-400", label: "Verde Claro", hex: "#4ade80" },
  { value: "bg-green-500", label: "Verde", hex: "#22c55e" },
  { value: "bg-green-700", label: "Verde Escuro", hex: "#15803d" },
  { value: "bg-emerald-400", label: "Esmeralda", hex: "#34d399" },
  { value: "bg-emerald-600", label: "Esmeralda Escuro", hex: "#059669" },
  { value: "bg-teal-500", label: "Teal", hex: "#14b8a6" },
  // Azuis
  { value: "bg-sky-400", label: "Azul Claro", hex: "#38bdf8" },
  { value: "bg-blue-500", label: "Azul", hex: "#3b82f6" },
  { value: "bg-blue-700", label: "Azul Escuro", hex: "#1d4ed8" },
  { value: "bg-indigo-500", label: "Indigo", hex: "#6366f1" },
  { value: "bg-cyan-500", label: "Ciano", hex: "#06b6d4" },
  // Roxos e Rosas
  { value: "bg-violet-500", label: "Violeta", hex: "#8b5cf6" },
  { value: "bg-purple-500", label: "Roxo", hex: "#a855f7" },
  { value: "bg-fuchsia-500", label: "Fuchsia", hex: "#d946ef" },
  { value: "bg-pink-400", label: "Rosa Claro", hex: "#f472b6" },
  { value: "bg-pink-600", label: "Rosa", hex: "#db2777" },
  { value: "bg-rose-500", label: "Rose", hex: "#f43f5e" },
  // Vermelhos e Laranjas
  { value: "bg-red-500", label: "Vermelho", hex: "#ef4444" },
  { value: "bg-red-700", label: "Vermelho Escuro", hex: "#b91c1c" },
  { value: "bg-orange-400", label: "Laranja Claro", hex: "#fb923c" },
  { value: "bg-orange-500", label: "Laranja", hex: "#f97316" },
  { value: "bg-amber-400", label: "Ambar", hex: "#fbbf24" },
  { value: "bg-yellow-400", label: "Amarelo", hex: "#facc15" },
  { value: "bg-yellow-500", label: "Amarelo Escuro", hex: "#eab308" },
  // Neutros
  { value: "bg-gray-400", label: "Cinza Claro", hex: "#9ca3af" },
  { value: "bg-gray-500", label: "Cinza", hex: "#6b7280" },
  { value: "bg-gray-700", label: "Cinza Escuro", hex: "#374151" },
  { value: "bg-stone-500", label: "Pedra", hex: "#78716c" },
  { value: "bg-zinc-500", label: "Zinco", hex: "#71717a" },
  // Marrons
  { value: "bg-amber-700", label: "Marrom Claro", hex: "#b45309" },
  { value: "bg-yellow-800", label: "Marrom", hex: "#854d0e" },
  // Limao
  { value: "bg-lime-400", label: "Lima", hex: "#a3e635" },
  { value: "bg-lime-600", label: "Lima Escuro", hex: "#65a30d" },
];

  export default function StatusPage() {
  const { statuses, setStatuses } = useDataStore();
  const { addNotification } = useNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ToolStatus | null>(null);
  const [selectedColor, setSelectedColor] = useState("bg-success");

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newStatus: ToolStatus = {
      id: editingStatus?.id || String(Date.now()),
      name: formData.get("name") as string,
      color: selectedColor,
      isActive: true,
    };

  if (editingStatus) {
    setStatuses(statuses.map((s) => (s.id === editingStatus.id ? newStatus : s)));
    addNotification({ type: "edit", title: "Status Editado", message: `Status "${newStatus.name}" foi atualizado.` });
  } else {
    setStatuses([...statuses, newStatus]);
    addNotification({ type: "add", title: "Novo Status", message: `Status "${newStatus.name}" cadastrado no sistema.` });
  }
  setIsDialogOpen(false);
  setEditingStatus(null);
  setSelectedColor("bg-success");
  };
  
  const handleDelete = (id: string) => {
    const st = statuses.find(s => s.id === id);
    setStatuses(statuses.filter((s) => s.id !== id));
    if (st) addNotification({ type: "delete", title: "Status Removido", message: `Status "${st.name}" foi removido.` });
  };

  const handleEdit = (status: ToolStatus) => {
    setEditingStatus(status);
    setSelectedColor(status.color);
    setIsDialogOpen(true);
  };

  const toggleActive = (id: string) => {
    setStatuses(
      statuses.map((s) =>
        s.id === id ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  const getColorPreview = (colorClass: string) => {
    const color = colorOptions.find((c) => c.value === colorClass);
    if (color) return color.value;
    // Fallback for old color values
    if (colorClass === "bg-success") return "bg-green-500";
    if (colorClass === "bg-chart-2") return "bg-blue-500";
    if (colorClass === "bg-warning") return "bg-yellow-400";
    if (colorClass === "bg-destructive") return "bg-red-500";
    if (colorClass === "bg-chart-4") return "bg-pink-600";
    return colorClass;
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Status de Ferramentas"
        subtitle="Configure os status disponiveis para as ferramentas"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ToggleLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Status Configuraveis
              </p>
              <p className="text-xs text-muted-foreground">
                Defina os status que as ferramentas podem assumir. Ative ou desative status
                conforme a necessidade da operacao.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lista de Status</CardTitle>
              <CardDescription>Gerencie os status disponiveis no sistema</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingStatus(null);
                  setSelectedColor("bg-success");
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSave}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingStatus ? "Editar Status" : "Novo Status"}
                    </DialogTitle>
                    <DialogDescription>
                      Defina o nome e a cor do status.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Em Estoque, Em Uso, Quebrada"
                        defaultValue={editingStatus?.name}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Cor</Label>
                      <div className="grid grid-cols-8 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setSelectedColor(color.value)}
                            title={color.label}
                            className={`group relative h-8 w-8 rounded-full transition-all ${
                              selectedColor === color.value
                                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                                : "hover:scale-110"
                            }`}
                            style={{ backgroundColor: color.hex }}
                          />
                        ))}
                      </div>
                      {selectedColor && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecionada: {colorOptions.find(c => c.value === selectedColor)?.label || selectedColor}
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingStatus ? "Salvar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableHead>Cor</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-center">Ativo</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.map((status) => (
                    <TableRow key={status.id} className="hover:bg-secondary/30">
                      <TableCell>
                        <div className={`h-4 w-4 rounded-full ${getColorPreview(status.color)}`} />
                      </TableCell>
                      <TableCell className="font-medium">{status.name}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={status.isActive}
                          onCheckedChange={() => toggleActive(status.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(status)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(status.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Status Preview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Visualizacao dos Status
            </CardTitle>
            <CardDescription>
              Como os status aparecerao no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {statuses
                .filter((s) => s.isActive)
                .map((status) => (
                  <div
                    key={status.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-4 py-2"
                  >
                    <div className={`h-3 w-3 rounded-full ${getColorPreview(status.color)}`} />
                    <span className="text-sm font-medium">{status.name}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
