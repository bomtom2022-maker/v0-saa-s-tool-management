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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tags,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Settings2,
  Type,
  Hash,
  ToggleLeft,
  List,
} from "lucide-react";
  import { type ToolType, type CustomField } from "@/lib/mock-data";
  import { useDataStore } from "@/lib/data-store";
  import { useNotifications } from "@/lib/notifications";
  
  export default function ToolTypesPage() {
  const { toolTypes, setToolTypes } = useDataStore();
  const { addNotification } = useNotifications();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ToolType | null>(null);
  const [selectedType, setSelectedType] = useState<ToolType | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newType: ToolType = {
      id: editingType?.id || String(Date.now()),
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      customFields: editingType?.customFields || [],
      isActive: true,
    };

  if (editingType) {
    setToolTypes(toolTypes.map((t) => (t.id === editingType.id ? newType : t)));
    addNotification({ type: "edit", title: "Tipo Editado", message: `Tipo "${newType.name}" foi atualizado.` });
  } else {
    setToolTypes([...toolTypes, newType]);
    addNotification({ type: "tool_type", title: "Novo Tipo", message: `Tipo de ferramenta "${newType.name}" cadastrado.` });
  }
  setIsDialogOpen(false);
  setEditingType(null);
  };
  
  const handleDelete = (id: string) => {
    const tt = toolTypes.find(t => t.id === id);
    setToolTypes(toolTypes.filter((t) => t.id !== id));
    if (tt) addNotification({ type: "delete", title: "Tipo Removido", message: `Tipo "${tt.name}" foi removido.` });
  };

  const handleEdit = (type: ToolType) => {
    setEditingType(type);
    setIsDialogOpen(true);
  };

  const toggleActive = (id: string) => {
    setToolTypes(
      toolTypes.map((t) =>
        t.id === id ? { ...t, isActive: !t.isActive } : t
      )
    );
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: String(Date.now()),
      name: "",
      type: "text",
      required: false,
    };
    setCustomFields([...customFields, newField]);
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "text":
        return <Type className="h-4 w-4" />;
      case "number":
        return <Hash className="h-4 w-4" />;
      case "boolean":
        return <ToggleLeft className="h-4 w-4" />;
      case "select":
        return <List className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Tipos de Ferramenta"
        subtitle="Configure os tipos de ferramentas e seus atributos personalizados"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Tags className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Tipos de Ferramenta Personalizaveis
              </p>
              <p className="text-xs text-muted-foreground">
                Crie tipos dinamicos com campos personalizados. Cada tipo pode ter atributos
                especificos como diametro, comprimento, material, etc.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tool Types Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lista de Tipos</CardTitle>
              <CardDescription>Gerencie os tipos de ferramenta do sistema</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingType(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Tipo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSave}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingType ? "Editar Tipo" : "Novo Tipo de Ferramenta"}
                    </DialogTitle>
                    <DialogDescription>
                      Defina o tipo de ferramenta. Campos personalizados podem ser adicionados depois.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Inserto, Broca, Fresa"
                        defaultValue={editingType?.name}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descricao</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Descricao do tipo de ferramenta..."
                        defaultValue={editingType?.description}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingType ? "Salvar" : "Criar"}
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
                    <TableHead>Nome</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead className="text-center">Campos</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toolTypes.map((type) => (
                    <TableRow key={type.id} className="hover:bg-secondary/30">
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[250px] truncate">
                        {type.description}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{type.customFields.length}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={type.isActive}
                          onCheckedChange={() => toggleActive(type.id)}
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
                            <DropdownMenuItem onClick={() => setSelectedType(type)}>
                              <Settings2 className="mr-2 h-4 w-4" />
                              Campos Personalizados
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(type)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(type.id)}
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

        {/* Custom Fields Configuration */}
        {selectedType && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Campos Personalizados: {selectedType.name}
                </CardTitle>
                <CardDescription>
                  Configure os atributos especificos para este tipo de ferramenta
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={addCustomField}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Campo
                </Button>
                <Button variant="outline" onClick={() => setSelectedType(null)}>
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customFields.length === 0 && selectedType.customFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tags className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Nenhum campo personalizado configurado.</p>
                    <p className="text-sm">Clique em "Adicionar Campo" para comecar.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...selectedType.customFields, ...customFields].map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          {getFieldIcon(field.type)}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Input
                            placeholder="Nome do campo"
                            defaultValue={field.name}
                          />
                          <Select defaultValue={field.type}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="number">Numero</SelectItem>
                              <SelectItem value="boolean">Sim/Nao</SelectItem>
                              <SelectItem value="select">Lista</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-2">
                            <Switch defaultChecked={field.required} />
                            <Label className="text-sm">Obrigatorio</Label>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removeCustomField(field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
