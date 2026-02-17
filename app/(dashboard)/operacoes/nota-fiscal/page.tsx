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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Package,
  Search,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  Building,
} from "lucide-react";
import { type Tool } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";

interface InvoiceItem {
  id: string;
  tool: Tool;
  quantity: number;
}

export default function InvoicePage() {
  const { tools, cabinets, toolTypes } = useDataStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [itemQuantity, setItemQuantity] = useState("");
  const [success, setSuccess] = useState(false);

  const filteredTools = tools.filter(
    (tool) =>
      tool.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeName = (typeId: string) => {
    return toolTypes.find((t) => t.id === typeId)?.name || "N/A";
  };

  const addItem = () => {
    if (selectedTool && itemQuantity) {
      const newItem: InvoiceItem = {
        id: String(Date.now()),
        tool: selectedTool,
        quantity: Number(itemQuantity),
      };
      setItems([...items, newItem]);
      setSelectedTool(null);
      setItemQuantity("");
      setSearchTerm("");
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceNumber && supplier && items.length > 0) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setInvoiceNumber("");
        setSupplier("");
        setInvoiceDate("");
        setNotes("");
        setItems([]);
      }, 2000);
    }
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen">
      <Header
        title="Recebimento por Nota Fiscal"
        subtitle="Registre o recebimento de ferramentas vinculado a nota fiscal"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Recebimento com Nota Fiscal
              </p>
              <p className="text-xs text-muted-foreground">
                Vincule a entrada de ferramentas a uma nota fiscal do fornecedor.
                Adicione multiplos itens em uma unica operacao.
              </p>
            </div>
          </CardContent>
        </Card>

        {success && (
          <Card className="bg-success/10 border-success/30">
            <CardContent className="flex items-center gap-4 p-4">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium text-foreground">Nota Fiscal Registrada!</p>
                <p className="text-sm text-muted-foreground">
                  Todos os itens foram adicionados ao estoque.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Invoice Data */}
            <Card className="bg-card border-border lg:col-span-1">
              <CardHeader>
                <CardTitle>Dados da Nota Fiscal</CardTitle>
                <CardDescription>Informacoes do documento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="invoiceNumber">Numero da NF *</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="invoiceNumber"
                      placeholder="Ex: NF-12345"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="supplier">Fornecedor *</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="supplier"
                      placeholder="Nome do fornecedor"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="invoiceDate">Data da NF</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cabinet">Armario de Destino</Label>
                  <Select defaultValue="1">
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

                <div className="grid gap-2">
                  <Label htmlFor="notes">Observacoes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informacoes adicionais..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader>
                <CardTitle>Itens da Nota Fiscal</CardTitle>
                <CardDescription>Adicione as ferramentas recebidas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Item */}
                <div className="flex flex-col gap-4 p-4 rounded-lg bg-secondary md:flex-row md:items-end">
                  <div className="flex-1 grid gap-2">
                    <Label>Ferramenta</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar ferramenta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {searchTerm && (
                      <div className="absolute z-10 mt-16 w-full max-w-md bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredTools.slice(0, 5).map((tool) => (
                          <div
                            key={tool.id}
                            onClick={() => {
                              setSelectedTool(tool);
                              setSearchTerm(tool.code);
                            }}
                            className="flex items-center justify-between p-3 hover:bg-secondary cursor-pointer"
                          >
                            <div>
                              <p className="font-mono text-sm font-medium">{tool.code}</p>
                              <p className="text-xs text-muted-foreground">{tool.description}</p>
                            </div>
                            <Badge variant="outline">{getTypeName(tool.typeId)}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-32 grid gap-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qtd"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addItem}
                    disabled={!selectedTool || !itemQuantity}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                {/* Items Table */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead>Codigo</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum item adicionado. Busque e adicione ferramentas acima.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono font-medium">{item.tool.code}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{item.tool.description}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{getTypeName(item.tool.typeId)}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de itens</p>
                    <p className="text-2xl font-bold">{items.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade total</p>
                    <p className="text-2xl font-bold">{totalItems}</p>
                  </div>
                  <Button
                    type="submit"
                    disabled={!invoiceNumber || !supplier || items.length === 0}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Registrar Nota Fiscal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
