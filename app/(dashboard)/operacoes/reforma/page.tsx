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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wrench,
  Package,
  Search,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Building,
  Calendar,
} from "lucide-react";
import { type Tool } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";

interface ReformItem {
  id: string;
  tool: Tool;
  quantity: number;
  supplier: string;
  sentDate: string;
  status: "pending" | "returned";
  returnDate?: string;
}

export default function ReformPage() {
  const { tools, toolTypes } = useDataStore();

  const initialReformItems: ReformItem[] = tools.length > 3 ? [
    {
      id: "1",
      tool: tools[3],
      quantity: 5,
      supplier: "Afiadora ABC",
      sentDate: "2024-01-17",
      status: "pending",
    },
    {
      id: "2",
      tool: tools[0],
      quantity: 20,
      supplier: "Afiadora XYZ",
      sentDate: "2024-01-10",
      status: "returned",
      returnDate: "2024-01-15",
    },
  ] : [];

  const [reformItems, setReformItems] = useState<ReformItem[]>(initialReformItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [quantity, setQuantity] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedReformItem, setSelectedReformItem] = useState<ReformItem | null>(null);
  const [returnQuantity, setReturnQuantity] = useState("");

  const filteredTools = tools.filter(
    (tool) =>
      tool.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeName = (typeId: string) => {
    return toolTypes.find((t) => t.id === typeId)?.name || "N/A";
  };

  const handleSendToReform = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTool && quantity && supplier) {
      const newItem: ReformItem = {
        id: String(Date.now()),
        tool: selectedTool,
        quantity: Number(quantity),
        supplier,
        sentDate: new Date().toISOString().split("T")[0],
        status: "pending",
      };
      setReformItems([newItem, ...reformItems]);
      setSuccessMessage("Ferramenta enviada para reforma!");
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedTool(null);
        setQuantity("");
        setSupplier("");
        setNotes("");
        setSearchTerm("");
      }, 2000);
    }
  };

  const handleReturn = () => {
    if (selectedReformItem && returnQuantity) {
      setReformItems(
        reformItems.map((item) =>
          item.id === selectedReformItem.id
            ? { ...item, status: "returned" as const, returnDate: new Date().toISOString().split("T")[0] }
            : item
        )
      );
      setReturnDialogOpen(false);
      setSelectedReformItem(null);
      setReturnQuantity("");
      setSuccessMessage("Retorno registrado com sucesso!");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  const pendingItems = reformItems.filter((item) => item.status === "pending");
  const returnedItems = reformItems.filter((item) => item.status === "returned");

  return (
    <div className="min-h-screen">
      <Header
        title="Reforma e Afiacao"
        subtitle="Gerencie o envio e retorno de ferramentas para reforma"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
              <Wrench className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Gestao de Reforma e Afiacao
              </p>
              <p className="text-xs text-muted-foreground">
                Registre o envio de ferramentas para reforma/afiacao e controle o retorno.
                Acompanhe ferramentas pendentes de retorno.
              </p>
            </div>
          </CardContent>
        </Card>

        {success && (
          <Card className="bg-success/10 border-success/30">
            <CardContent className="flex items-center gap-4 p-4">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium text-foreground">{successMessage}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="send" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="send" className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Enviar para Reforma
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pendentes ({pendingItems.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Historico
            </TabsTrigger>
          </TabsList>

          {/* Send to Reform */}
          <TabsContent value="send" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Tool Selection */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Selecionar Ferramenta</CardTitle>
                  <CardDescription>Busque a ferramenta para enviar a reforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por codigo ou descricao..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="max-h-[350px] overflow-y-auto space-y-2">
                    {searchTerm && filteredTools.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhuma ferramenta encontrada
                      </p>
                    ) : searchTerm ? (
                      filteredTools.map((tool) => (
                        <div
                          key={tool.id}
                          onClick={() => setSelectedTool(tool)}
                          className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedTool?.id === tool.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-mono font-medium">{tool.code}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">{getTypeName(tool.typeId)}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Qtd: {tool.quantity}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Digite para buscar ferramentas
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Reform Form */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Dados do Envio</CardTitle>
                  <CardDescription>Preencha os dados da reforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendToReform} className="space-y-4">
                    {selectedTool ? (
                      <div className="p-4 rounded-lg bg-secondary">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-mono font-bold">{selectedTool.code}</p>
                            <p className="text-sm text-muted-foreground">{selectedTool.description}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 rounded-lg border border-dashed border-border text-center">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Selecione uma ferramenta</p>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="quantity">Quantidade *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={selectedTool?.quantity || 0}
                        placeholder="Quantidade para reforma"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        disabled={!selectedTool}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="supplier">Fornecedor/Afiadora *</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="supplier"
                          placeholder="Nome da afiadora ou prestador"
                          value={supplier}
                          onChange={(e) => setSupplier(e.target.value)}
                          className="pl-9"
                          required
                          disabled={!selectedTool}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="notes">Observacoes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Tipo de servico, urgencia, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={!selectedTool}
                      />
                    </div>

                    <Button type="submit" className="w-full bg-warning hover:bg-warning/90 text-warning-foreground" disabled={!selectedTool || !quantity || !supplier}>
                      <Wrench className="mr-2 h-4 w-4" />
                      Enviar para Reforma
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Returns */}
          <TabsContent value="pending" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Ferramentas Aguardando Retorno</CardTitle>
                <CardDescription>Ferramentas enviadas para reforma ainda nao devolvidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead>Ferramenta</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Data Envio</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead className="w-32"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhuma ferramenta pendente de retorno
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingItems.map((item) => {
                          const daysSent = Math.floor(
                            (new Date().getTime() - new Date(item.sentDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <p className="font-mono font-medium">{item.tool.code}</p>
                                  <p className="text-sm text-muted-foreground">{item.tool.description}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-bold">{item.quantity}</TableCell>
                              <TableCell>{item.supplier}</TableCell>
                              <TableCell>{new Date(item.sentDate).toLocaleDateString("pt-BR")}</TableCell>
                              <TableCell>
                                <Badge variant={daysSent > 7 ? "destructive" : "secondary"}>
                                  {daysSent} dias
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedReformItem(item);
                                    setReturnQuantity(String(item.quantity));
                                    setReturnDialogOpen(true);
                                  }}
                                >
                                  <ArrowDownRight className="mr-2 h-4 w-4" />
                                  Registrar Retorno
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

          {/* History */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Historico de Reformas</CardTitle>
                <CardDescription>Ferramentas que ja retornaram da reforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead>Ferramenta</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Data Envio</TableHead>
                        <TableHead>Data Retorno</TableHead>
                        <TableHead>Tempo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {returnedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhum historico de reforma encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        returnedItems.map((item) => {
                          const totalDays = item.returnDate
                            ? Math.floor(
                                (new Date(item.returnDate).getTime() - new Date(item.sentDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            : 0;
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <p className="font-mono font-medium">{item.tool.code}</p>
                                  <p className="text-sm text-muted-foreground">{item.tool.description}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-bold">{item.quantity}</TableCell>
                              <TableCell>{item.supplier}</TableCell>
                              <TableCell>{new Date(item.sentDate).toLocaleDateString("pt-BR")}</TableCell>
                              <TableCell>
                                {item.returnDate && new Date(item.returnDate).toLocaleDateString("pt-BR")}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{totalDays} dias</Badge>
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

        {/* Return Dialog */}
        <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Retorno de Reforma</DialogTitle>
              <DialogDescription>
                Confirme a quantidade retornada da reforma
              </DialogDescription>
            </DialogHeader>
            {selectedReformItem && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="font-mono font-bold">{selectedReformItem.tool.code}</p>
                  <p className="text-sm text-muted-foreground">{selectedReformItem.tool.description}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Enviado: {selectedReformItem.quantity}</span>
                    <span>Fornecedor: {selectedReformItem.supplier}</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="returnQuantity">Quantidade Retornada *</Label>
                  <Input
                    id="returnQuantity"
                    type="number"
                    min="0"
                    max={selectedReformItem.quantity}
                    value={returnQuantity}
                    onChange={(e) => setReturnQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReturn} disabled={!returnQuantity}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmar Retorno
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
