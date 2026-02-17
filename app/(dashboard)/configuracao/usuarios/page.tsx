"use client";

import React from "react"

import { useState } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Mail,
  Settings2,
  Eye,
  Package,
  ArrowRightLeft,
  FileText,
  Archive,
} from "lucide-react";
import { type User } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const allPermissions: Permission[] = [
  { id: "view", name: "Visualizar", description: "Ver dados do sistema", category: "Geral" },
  { id: "edit_tools", name: "Editar Ferramentas", description: "Criar e editar cadastro de ferramentas", category: "Catalogo" },
  { id: "edit_cabinets", name: "Editar Armarios", description: "Configurar armarios e gavetas", category: "Configuracao" },
  { id: "edit_types", name: "Editar Tipos", description: "Gerenciar tipos de ferramentas", category: "Configuracao" },
  { id: "move_stock", name: "Movimentar Estoque", description: "Realizar entradas e saidas", category: "Operacoes" },
  { id: "invoices", name: "Notas Fiscais", description: "Registrar recebimento de NF", category: "Operacoes" },
  { id: "reform", name: "Reforma", description: "Enviar e receber ferramentas de reforma", category: "Operacoes" },
  { id: "reports", name: "Relatorios", description: "Gerar e exportar relatorios", category: "Relatorios" },
  { id: "manage_users", name: "Gerenciar Usuarios", description: "Criar e editar usuarios", category: "Administracao" },
  { id: "all", name: "Acesso Total", description: "Todas as permissoes do sistema", category: "Administracao" },
];

export default function UsersPage() {
  const { users, setUsers, profiles } = useDataStore();
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState("Consulta");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newUser: User = {
      id: editingUser?.id || String(Date.now()),
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: selectedRole,
      isActive: true,
    };

    if (editingUser) {
      setUsers(users.map((u) => (u.id === editingUser.id ? newUser : u)));
    } else {
      setUsers([...users, newUser]);
    }
    setIsUserDialogOpen(false);
    setEditingUser(null);
    setSelectedRole("Consulta");
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setIsUserDialogOpen(true);
  };

  const toggleUserActive = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, isActive: !u.isActive } : u
      )
    );
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Administrador":
        return "bg-primary text-primary-foreground";
      case "Engenharia":
        return "bg-chart-2 text-white";
      case "Compras":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Catalogo":
        return <Package className="h-4 w-4" />;
      case "Configuracao":
        return <Settings2 className="h-4 w-4" />;
      case "Operacoes":
        return <ArrowRightLeft className="h-4 w-4" />;
      case "Relatorios":
        return <FileText className="h-4 w-4" />;
      case "Administracao":
        return <Shield className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Usuarios e Permissoes"
        subtitle="Gerencie usuarios e defina perfis de acesso"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Controle de Acesso
              </p>
              <p className="text-xs text-muted-foreground">
                Defina perfis de permissao e atribua usuarios. Apenas usuarios autorizados
                podem movimentar estoque e acessar funcoes especificas.
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="profiles" className="gap-2">
              <Shield className="h-4 w-4" />
              Perfis de Acesso
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Lista de Usuarios</CardTitle>
                  <CardDescription>Gerencie os usuarios do sistema</CardDescription>
                </div>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingUser(null);
                      setSelectedRole("Consulta");
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleSaveUser}>
                      <DialogHeader>
                        <DialogTitle>
                          {editingUser ? "Editar Usuario" : "Novo Usuario"}
                        </DialogTitle>
                        <DialogDescription>
                          Preencha os dados do usuario e selecione o perfil de acesso.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Nome *</Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Nome completo"
                            defaultValue={editingUser?.name}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="email@exemplo.com"
                            defaultValue={editingUser?.email}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Perfil de Acesso *</Label>
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {profiles.map((profile) => (
                                <SelectItem key={profile.id} value={profile.name}>
                                  {profile.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editingUser ? "Salvar" : "Criar"}
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
                        <TableHead>Email</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead className="text-center">Ativo</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-secondary/30">
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={() => toggleUserActive(user.id)}
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
                                <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteUser(user.id)}
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
          </TabsContent>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Profiles List */}
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Perfis de Acesso</CardTitle>
                    <CardDescription>Configure as permissoes de cada perfil</CardDescription>
                  </div>
                  <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Perfil
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Novo Perfil de Acesso</DialogTitle>
                        <DialogDescription>
                          Defina um nome e selecione as permissoes.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="profileName">Nome do Perfil *</Label>
                          <Input
                            id="profileName"
                            placeholder="Ex: Supervisor, Operador"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={() => setIsProfileDialogOpen(false)}>
                          Criar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedPermissions(profile.permissions);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{profile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {profile.permissions.includes("all")
                                ? "Acesso total"
                                : `${profile.permissions.length} permissoes`}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Permissions Grid */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Permissoes Disponiveis</CardTitle>
                  <CardDescription>
                    Selecione um perfil para editar suas permissoes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["Geral", "Catalogo", "Configuracao", "Operacoes", "Relatorios", "Administracao"].map(
                      (category) => (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-2">
                            {getCategoryIcon(category)}
                            <h4 className="text-sm font-medium text-muted-foreground">
                              {category}
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {allPermissions
                              .filter((p) => p.category === category)
                              .map((permission) => (
                                <div
                                  key={permission.id}
                                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                                >
                                  <Checkbox
                                    checked={selectedPermissions.includes(permission.id)}
                                    onCheckedChange={() => togglePermission(permission.id)}
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{permission.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {permission.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
