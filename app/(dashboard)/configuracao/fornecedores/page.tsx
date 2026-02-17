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
  Truck,
  Plus,
  Pencil,
  Trash2,
  Search,
  Building2,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import { useDataStore } from "@/lib/data-store";
import { type Supplier } from "@/lib/mock-data";

export default function FornecedoresPage() {
  const { suppliers, setSuppliers } = useDataStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCnpj, setFormCnpj] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cnpj.includes(searchTerm) ||
      s.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = suppliers.filter((s) => s.isActive).length;

  const openNewDialog = () => {
    setEditingSupplier(null);
    setFormName("");
    setFormCnpj("");
    setFormContact("");
    setFormPhone("");
    setFormEmail("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormCnpj(supplier.cnpj);
    setFormContact(supplier.contact);
    setFormPhone(supplier.phone);
    setFormEmail(supplier.email);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;

    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplier.id
            ? {
                ...s,
                name: formName.trim(),
                cnpj: formCnpj.trim(),
                contact: formContact.trim(),
                phone: formPhone.trim(),
                email: formEmail.trim(),
              }
            : s
        )
      );
    } else {
      const newSupplier: Supplier = {
        id: `s-${Date.now()}`,
        name: formName.trim(),
        cnpj: formCnpj.trim(),
        contact: formContact.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        isActive: true,
      };
      setSuppliers((prev) => [...prev, newSupplier]);
    }

    setIsDialogOpen(false);
  };

  const handleToggleActive = (id: string) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleDelete = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Fornecedores"
        subtitle="Cadastre e gerencie fornecedores de ferramentas"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suppliers.length}</p>
                <p className="text-xs text-muted-foreground">Total de fornecedores</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
                <Building2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Fornecedores ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Lista de Fornecedores</CardTitle>
                <CardDescription>Gerencie os fornecedores cadastrados no sistema</CardDescription>
              </div>
              <Button onClick={openNewDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead className="hidden md:table-cell">Contato</TableHead>
                    <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                    <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm
                          ? "Nenhum fornecedor encontrado para a busca"
                          : "Nenhum fornecedor cadastrado. Clique em \"Novo Fornecedor\" para adicionar."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium">{supplier.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{supplier.cnpj || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{supplier.contact || "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{supplier.phone || "-"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{supplier.email || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={supplier.isActive ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => handleToggleActive(supplier.id)}
                          >
                            {supplier.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(supplier)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirm(supplier.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "Atualize os dados do fornecedor"
                : "Preencha os dados do novo fornecedor"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="supplierName">Nome do Fornecedor *</Label>
              <Input
                id="supplierName"
                placeholder="Nome da empresa"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supplierCnpj" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                CNPJ
              </Label>
              <Input
                id="supplierCnpj"
                placeholder="00.000.000/0000-00"
                value={formCnpj}
                onChange={(e) => setFormCnpj(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supplierContact">Nome do Contato</Label>
              <Input
                id="supplierContact"
                placeholder="Pessoa de contato"
                value={formContact}
                onChange={(e) => setFormContact(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="supplierPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Telefone
                </Label>
                <Input
                  id="supplierPhone"
                  placeholder="(11) 99999-0000"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supplierEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  E-mail
                </Label>
                <Input
                  id="supplierEmail"
                  type="email"
                  placeholder="email@empresa.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formName.trim()}>
              {editingSupplier ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusao</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
