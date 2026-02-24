"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wrench,
  Package,
  Search,
  CheckCircle,
  Archive,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  Send,
  ShoppingCart,
} from "lucide-react";
import { type Tool } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";
import { useNotifications } from "@/lib/notifications";
import { PriceTag } from "@/components/dashboard/price-tag";
import { ToolCodeDisplay } from "@/components/dashboard/tool-code-display";
import Link from "next/link";

export default function ReformaPage() {
  const { tools, cabinets, drawers, toolTypes, movements, suppliers, reformQueue, setReformQueue } = useDataStore();
  const { addNotification } = useNotifications();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [filterCabinetId, setFilterCabinetId] = useState("all");
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCabinet = filterCabinetId === "all" || tool.cabinetId === filterCabinetId;
    return matchesSearch && matchesCabinet;
  });

  const getTypeName = (typeId: string) => toolTypes.find((t) => t.id === typeId)?.name || "N/A";
  const getCabinetName = (cabinetId: string) => cabinets.find((c) => c.id === cabinetId)?.name || "N/A";
  const getDrawerLabel = (drawerId: string) => {
    const d = drawers.find((dr) => dr.id === drawerId);
    return d ? `Gaveta ${d.number}` : "";
  };

  const formatDateTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getReformCount = (toolId: string) => {
    let out = 0;
    for (const m of movements) {
      if (m.toolId === toolId && m.type === "reform_send") out += m.quantity;
      if (m.toolId === toolId && m.type === "reform_return") out -= m.quantity;
    }
    return Math.max(0, out);
  };

  // Get queue count for a specific tool
  const getQueueCount = (toolId: string) => {
    return reformQueue.filter(q => q.toolId === toolId).reduce((sum, q) => sum + q.quantity, 0);
  };

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !quantity || !selectedSupplierId) return;

    const qty = Number(quantity);
    if (qty <= 0 || isNaN(qty)) return;

    const supplierName = suppliers.find(s => s.id === selectedSupplierId)?.name || "";

    const newItem = {
      id: `rq-${Date.now()}`,
      toolId: selectedTool.id,
      quantity: qty,
      supplierId: selectedSupplierId,
      supplierName,
      notes: notes || "",
      addedAt: new Date().toISOString(),
      addedBy: "eng-processo-1",
    };

    setReformQueue(prev => [newItem, ...prev]);

    setSuccessMsg(
      `${qty} un. de ${selectedTool.code} adicionada(s) a fila de reforma | Fornecedor: ${supplierName}`
    );
    addNotification({
      type: "info",
      title: "Item adicionado a fila de reforma",
      message: `${qty} un. de ${selectedTool.code} (${selectedTool.description}) para ${supplierName}`,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
    setSelectedTool(null);
    setQuantity("");
    setSelectedSupplierId("");
    setNotes("");
    setSearchTerm("");
  };

  const handleRemoveFromQueue = (itemId: string) => {
    setReformQueue(prev => prev.filter(q => q.id !== itemId));
  };

  const getToolInfo = (toolId: string) => tools.find(t => t.id === toolId);

  return (
    <div className="min-h-screen">
      <Header
        title="Fila de Reforma"
        subtitle="Adicione ferramentas a fila para envio semanal ao fornecedor"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card + Queue Counter */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20 shrink-0">
                <Wrench className="h-5 w-5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Adicionar a Fila
                </p>
                <p className="text-xs text-muted-foreground">
                  Busque as ferramentas, selecione o fornecedor e a quantidade. Depois va em "Enviar para Reforma" para finalizar o envio com NF e romaneio.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={`border ${reformQueue.length > 0 ? "border-orange-500/30 bg-orange-500/5" : "border-border bg-card"}`}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20 shrink-0">
                  <ShoppingCart className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Itens na Fila
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reformQueue.length} {reformQueue.length === 1 ? "item" : "itens"} | {reformQueue.reduce((s, q) => s + q.quantity, 0)} un. total
                  </p>
                </div>
              </div>
              {reformQueue.length > 0 && (
                <Link href="/operacoes/enviar-reforma">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {success && (
          <Card className="bg-success/10 border-success/30">
            <CardContent className="flex items-center gap-4 p-4">
              <CheckCircle className="h-6 w-6 text-success shrink-0" />
              <div>
                <p className="font-medium text-foreground">Adicionado a Fila!</p>
                <p className="text-sm text-muted-foreground">{successMsg}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tool Selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Selecionar Ferramenta</CardTitle>
              <CardDescription>Filtre por armario e busque a ferramenta para adicionar a fila</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Filtrar por Armario</Label>
                <Select value={filterCabinetId} onValueChange={setFilterCabinetId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os armarios</SelectItem>
                    {cabinets.filter(c => !c.isReformOnly).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} - {c.location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  filteredTools.map((tool) => {
                    const reformOut = getReformCount(tool.id);
                    const queueCount = getQueueCount(tool.id);
                    return (
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
                            <div className="flex flex-wrap items-center gap-1.5">
                              <ToolCodeDisplay code={tool.code} className="font-medium" />
                              <PriceTag value={tool.unitValue} reformValue={tool.reformUnitValue} />
                            </div>
                            <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                              {tool.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getCabinetName(tool.cabinetId)} / {getDrawerLabel(tool.drawerId)} / Pos. {tool.position}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge variant="secondary">{getTypeName(tool.typeId)}</Badge>
                          <p className="text-xs text-muted-foreground">
                            Estoque: <span className="font-bold text-foreground">{tool.quantity}</span>
                          </p>
                          {reformOut > 0 && (
                            <p className="text-xs text-orange-500">
                              Em reforma: {reformOut}
                            </p>
                          )}
                          {queueCount > 0 && (
                            <p className="text-xs text-sky-500">
                              Na fila: {queueCount}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Digite para buscar ferramentas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add to Queue Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Adicionar a Fila</CardTitle>
              <CardDescription>Selecione o fornecedor e a quantidade para adicionar a fila de envio</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddToQueue} className="space-y-4">
                {/* Selected Tool */}
                {selectedTool ? (
                  <div className="p-4 rounded-lg bg-secondary">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                        <Wrench className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ToolCodeDisplay code={selectedTool.code} className="font-bold" />
                          <PriceTag value={selectedTool.unitValue} reformValue={selectedTool.reformUnitValue} suffix="/un" />
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedTool.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4 text-muted-foreground" />
                        {getCabinetName(selectedTool.cabinetId)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getDrawerLabel(selectedTool.drawerId)} / Pos. {selectedTool.position}
                      </div>
                      <div className="flex items-center gap-1">
                        {"Estoque armario: "}
                        <span className="font-bold">{selectedTool.quantity}</span>
                      </div>
                    </div>
                    {getReformCount(selectedTool.id) > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-orange-500">
                        <AlertTriangle className="h-3 w-3" />
                        Ja ha {getReformCount(selectedTool.id)} un. em reforma atualmente
                      </div>
                    )}
                    {getQueueCount(selectedTool.id) > 0 && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-sky-500">
                        <ShoppingCart className="h-3 w-3" />
                        Ja ha {getQueueCount(selectedTool.id)} un. na fila de envio
                      </div>
                    )}
                    {/* Return code preview */}
                    <div className="mt-3 p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
                      <p className="text-[11px] font-medium text-sky-400 mb-1.5">Ao retornar da reforma:</p>
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="text-muted-foreground">{selectedTool.code}</span>
                        <span className="text-muted-foreground">{"-->"}</span>
                        <ToolCodeDisplay code={selectedTool.code.replace(/R$/, "") + "R"} className="font-bold" />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        A ferramenta recebera sufixo "R" e ira para armario de reformadas (A-R / B-R)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-lg border border-dashed border-border text-center">
                    <Wrench className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Selecione uma ferramenta ao lado</p>
                  </div>
                )}

                {/* Supplier */}
                <div className="grid gap-2">
                  <Label>Fornecedor (Destino da Reforma) *</Label>
                  <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} disabled={!selectedTool}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.filter(s => s.isActive).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name} - {s.cnpj}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {"Cadastre novos em Configuracao > Fornecedores"}
                  </p>
                </div>

                {/* Quantity */}
                <div className="grid gap-2">
                  <Label htmlFor="reformQty">Quantidade *</Label>
                  <Input
                    id="reformQty"
                    type="number"
                    min="1"
                    placeholder="Quantidade para reforma"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    disabled={!selectedTool}
                  />
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <Label htmlFor="reformNotes">Observacoes</Label>
                  <Textarea
                    id="reformNotes"
                    placeholder="Informacoes adicionais sobre a reforma..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!selectedTool}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={!selectedTool || !quantity || Number(quantity) <= 0 || !selectedSupplierId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar a Fila de Reforma
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Queue Table */}
        {reformQueue.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-orange-500" />
                    Fila de Envio para Reforma
                  </CardTitle>
                  <CardDescription>
                    {reformQueue.length} {reformQueue.length === 1 ? "item" : "itens"} aguardando envio | {reformQueue.reduce((s, q) => s + q.quantity, 0)} un. total
                  </CardDescription>
                </div>
                <Link href="/operacoes/enviar-reforma">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Enviar para Reforma
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Descricao</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Observacoes</TableHead>
                      <TableHead>Adicionado em</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reformQueue.map((item) => {
                      const tool = getToolInfo(item.toolId);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            {tool ? <ToolCodeDisplay code={tool.code} className="font-medium" /> : <span className="text-muted-foreground">N/A</span>}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {tool?.description || "N/A"}
                          </TableCell>
                          <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                          <TableCell className="text-sm">{item.supplierName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                            {item.notes || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDateTime(item.addedAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveFromQueue(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remover da fila</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
