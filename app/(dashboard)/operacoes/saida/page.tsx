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
  ArrowUpRight,
  Package,
  Search,
  CheckCircle,
  Minus,
  Archive,
  AlertTriangle,
  Clock,
  FileText,
  Plus,
  X,
} from "lucide-react";
import { type Tool, type Supplier } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";

const DEFAULT_REASONS = [
  "Reforma",
  "Consumo em maquina",
  "Quebra",
  "Descarte",
  "Transferencia",
  "Teste",
];

export default function ExitPage() {
  const { tools, setTools, cabinets, drawers, toolTypes, movements, setMovements, suppliers } = useDataStore();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notaNumber, setNotaNumber] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [reason, setReason] = useState("Reforma");
  const [customReasons, setCustomReasons] = useState<string[]>([]);
  const [newCustomReason, setNewCustomReason] = useState("");
  const [showAddReason, setShowAddReason] = useState(false);
  const [notes, setNotes] = useState("");
  const [filterCabinetId, setFilterCabinetId] = useState("all");
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load custom reasons from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("tms-custom-exit-reasons");
      if (saved) setCustomReasons(JSON.parse(saved));
    } catch {}
  }, []);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const allReasons = [...DEFAULT_REASONS, ...customReasons];

  const handleAddCustomReason = () => {
    const trimmed = newCustomReason.trim();
    if (!trimmed || allReasons.includes(trimmed)) return;
    const updated = [...customReasons, trimmed];
    setCustomReasons(updated);
    setReason(trimmed);
    setNewCustomReason("");
    setShowAddReason(false);
    try { sessionStorage.setItem("tms-custom-exit-reasons", JSON.stringify(updated)); } catch {}
  };

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCabinet = filterCabinetId === "all" || tool.cabinetId === filterCabinetId;
    return matchesSearch && matchesCabinet && tool.quantity > 0;
  });

  const getTypeName = (typeId: string) => toolTypes.find((t) => t.id === typeId)?.name || "N/A";
  const getCabinetName = (cabinetId: string) => cabinets.find((c) => c.id === cabinetId)?.name || "N/A";
  const getDrawerLabel = (drawerId: string) => {
    const d = drawers.find((dr) => dr.id === drawerId);
    return d ? `Gaveta ${d.number}` : "";
  };

  const isLowStock = (tool: Tool) => tool.quantity <= tool.minStock;
  const maxQuantity = selectedTool?.quantity || 0;

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !quantity || !reason) return;

    const qty = Number(quantity);
    if (qty > maxQuantity || qty <= 0 || isNaN(qty)) return;

    const exitTimestamp = new Date();

    // Update tool quantity
    setTools(prev =>
      prev.map(t =>
        t.id === selectedTool.id
          ? { ...t, quantity: t.quantity - qty }
          : t
      )
    );

    // Register movement with nota, supplier and reason
    const supplierName = suppliers.find(s => s.id === selectedSupplierId)?.name || "";
    const movementNotes = [
      `Motivo: ${reason}`,
      notaNumber ? `Nota: ${notaNumber}` : null,
      supplierName ? `Fornecedor: ${supplierName}` : null,
      notes || null,
    ].filter(Boolean).join(" | ");

    setMovements(prev => [
      {
        id: `mov-${Date.now()}`,
        type: "exit" as const,
        toolId: selectedTool.id,
        userId: "eng-processo-1",
        quantity: qty,
        date: exitTimestamp.toISOString(),
        notes: movementNotes,
        invoiceNumber: notaNumber || undefined,
        supplier: supplierName || undefined,
      },
      ...prev,
    ]);

    setSuccessMsg(
      `Saida registrada em ${formatDateTime(exitTimestamp)}: -${qty} un. de ${selectedTool.code} | Motivo: ${reason}${notaNumber ? ` | Nota: ${notaNumber}` : ""}${supplierName ? ` | Fornecedor: ${supplierName}` : ""} | Estoque restante: ${selectedTool.quantity - qty}`
    );
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
    setSelectedTool(null);
    setQuantity("");
    setNotaNumber("");
    setSelectedSupplierId("");
    setNotes("");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Saida de Ferramentas"
        subtitle="Registre a saida de ferramentas do estoque"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card with Live Clock */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Saida de Ferramentas
                </p>
                <p className="text-xs text-muted-foreground">
                  Selecione a ferramenta, informe a nota, o motivo e a quantidade. A data/hora e registrada automaticamente.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm font-mono bg-background rounded-lg px-3 py-2 border border-border">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-foreground">{formatDateTime(currentTime)}</span>
            </div>
          </CardContent>
        </Card>

        {success && (
          <Card className="bg-success/10 border-success/30">
            <CardContent className="flex items-center gap-4 p-4">
              <CheckCircle className="h-6 w-6 text-success shrink-0" />
              <div>
                <p className="font-medium text-foreground">Saida Registrada!</p>
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
              <CardDescription>Filtre por armario e busque a ferramenta</CardDescription>
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
                    {cabinets.map((c) => (
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
                          <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {tool.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getCabinetName(tool.cabinetId)} / {getDrawerLabel(tool.drawerId)} / Pos. {tool.position}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{getTypeName(tool.typeId)}</Badge>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {isLowStock(tool) && (
                            <AlertTriangle className="h-3 w-3 text-warning" />
                          )}
                          <span className={`text-xs ${isLowStock(tool) ? "text-warning font-medium" : "text-muted-foreground"}`}>
                            Qtd: {tool.quantity}
                          </span>
                        </div>
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

          {/* Exit Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Dados da Saida</CardTitle>
              <CardDescription>Preencha os dados da movimentacao</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selected Tool */}
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
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4 text-muted-foreground" />
                        {getCabinetName(selectedTool.cabinetId)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getDrawerLabel(selectedTool.drawerId)} / Pos. {selectedTool.position}
                      </div>
                      <div className="flex items-center gap-1">
                        {"Disponivel: "}
                        {isLowStock(selectedTool) && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                        <span className={`font-bold ${isLowStock(selectedTool) ? "text-warning" : ""}`}>
                          {selectedTool.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-lg border border-dashed border-border text-center">
                    <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Selecione uma ferramenta ao lado</p>
                  </div>
                )}

                {/* Date/Time - automatic */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Data/Hora do Registro
                  </Label>
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                    <span className="text-sm font-mono text-foreground">{formatDateTime(currentTime)}</span>
                    <Badge variant="outline" className="ml-auto text-xs">Automatico</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A data e hora exata serao gravadas ao clicar em Registrar Saida
                  </p>
                </div>

                {/* Nota number */}
                <div className="grid gap-2">
                  <Label htmlFor="notaNumber" className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Numero da Nota
                  </Label>
                  <Input
                    id="notaNumber"
                    placeholder="Ex: NF-2026-001234"
                    value={notaNumber}
                    onChange={(e) => setNotaNumber(e.target.value)}
                    disabled={!selectedTool}
                  />
                  <p className="text-xs text-muted-foreground">
                    Numero da nota fiscal ou documento de referencia (usado para busca)
                  </p>
                </div>

                {/* Supplier */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    Fornecedor (Destino)
                  </Label>
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
                    Fornecedor de destino (reforma, devolucao, etc). Cadastre novos em Configuracao {'>'} Fornecedores.
                  </p>
                </div>

                {/* Reason */}
                <div className="grid gap-2">
                  <Label>Motivo da Saida *</Label>
                  <Select value={reason} onValueChange={setReason} disabled={!selectedTool}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {allReasons.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!showAddReason ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-fit text-xs text-muted-foreground"
                      onClick={() => setShowAddReason(true)}
                      disabled={!selectedTool}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar outro motivo
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Novo motivo..."
                        value={newCustomReason}
                        onChange={(e) => setNewCustomReason(e.target.value)}
                        className="text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomReason();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomReason}
                        disabled={!newCustomReason.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => { setShowAddReason(false); setNewCustomReason(""); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="grid gap-2">
                  <Label htmlFor="exitQty">Quantidade *</Label>
                  <Input
                    id="exitQty"
                    type="number"
                    min="1"
                    max={maxQuantity}
                    placeholder="Quantidade de saida"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    disabled={!selectedTool}
                  />
                  {selectedTool && (
                    <p className="text-xs text-muted-foreground">
                      Maximo disponivel: {selectedTool.quantity} unidades
                    </p>
                  )}
                  {selectedTool && Number(quantity) > maxQuantity && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Quantidade excede o estoque disponivel
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="grid gap-2">
                  <Label htmlFor="exitNotes">Observacoes</Label>
                  <Textarea
                    id="exitNotes"
                    placeholder="Numero da OP, maquina, operador, informacoes adicionais..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!selectedTool}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="destructive"
                  disabled={!selectedTool || !quantity || !reason || Number(quantity) > maxQuantity || Number(quantity) <= 0}
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Registrar Saida
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
