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
  Wrench,
  Package,
  Search,
  CheckCircle,
  Archive,
  AlertTriangle,
  Clock,
  FileText,
  Send,
  Calendar,
} from "lucide-react";
import { type Tool } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";
import { PriceTag } from "@/components/dashboard/price-tag";
import { ToolCodeDisplay } from "@/components/dashboard/tool-code-display";

export default function ReformaPage() {
  const { tools, cabinets, drawers, toolTypes, movements, setMovements, suppliers } = useDataStore();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notaNumber, setNotaNumber] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [estimatedReturn, setEstimatedReturn] = useState("");
  const [notes, setNotes] = useState("");
  const [filterCabinetId, setFilterCabinetId] = useState("all");
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  // Live clock - only on client to avoid hydration mismatch
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

  // Count how many are currently out for reform (from movements)
  const getReformCount = (toolId: string) => {
    let out = 0;
    for (const m of movements) {
      if (m.toolId === toolId && m.type === "reform_send") out += m.quantity;
      if (m.toolId === toolId && m.type === "reform_return") out -= m.quantity;
    }
    return Math.max(0, out);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !quantity) return;

    const qty = Number(quantity);
    if (qty <= 0 || isNaN(qty)) return;

    const timestamp = new Date();

    // Register reform movement - does NOT subtract from cabinet stock
    const supplierName = suppliers.find(s => s.id === selectedSupplierId)?.name || "";
    const movementNotes = [
      notaNumber ? `Nota: ${notaNumber}` : null,
      supplierName ? `Fornecedor: ${supplierName}` : null,
      notes || null,
    ].filter(Boolean).join(" | ");

    setMovements(prev => [
      {
        id: `mov-${Date.now()}`,
        type: "reform_send" as const,
        toolId: selectedTool.id,
        userId: "eng-processo-1",
        quantity: qty,
        date: timestamp.toISOString(),
        notes: movementNotes || "Enviado para reforma",
        invoiceNumber: notaNumber || undefined,
        supplier: supplierName || undefined,
        estimatedReturn: estimatedReturn || undefined,
      },
      ...prev,
    ]);

    setSuccessMsg(
      `Reforma registrada em ${formatDateTime(timestamp)}: ${qty} un. de ${selectedTool.code} enviada(s) para reforma${supplierName ? ` | Fornecedor: ${supplierName}` : ""}${notaNumber ? ` | Nota: ${notaNumber}` : ""} | Estoque no armario: ${selectedTool.quantity} (sem alteracao)`
    );
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
    setSelectedTool(null);
    setQuantity("");
    setNotaNumber("");
    setSelectedSupplierId("");
    setEstimatedReturn("");
    setNotes("");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Reforma de Ferramentas"
        subtitle="Registre o envio de ferramentas para reforma / afiacao"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                <Wrench className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Envio para Reforma
                </p>
                <p className="text-xs text-muted-foreground">
                  Aponte de onde a ferramenta esta saindo (armario/gaveta/posicao). O estoque no armario nao sera alterado pois as ferramentas sao novas.
                </p>
              </div>
            </div>
            {currentTime && (
              <div className="hidden sm:flex items-center gap-2 text-sm font-mono bg-background rounded-lg px-3 py-2 border border-border">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-foreground">{formatDateTime(currentTime)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {success && (
          <Card className="bg-success/10 border-success/30">
            <CardContent className="flex items-center gap-4 p-4">
              <CheckCircle className="h-6 w-6 text-success shrink-0" />
              <div>
                <p className="font-medium text-foreground">Reforma Registrada!</p>
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
              <CardDescription>Filtre por armario e busque a ferramenta que sera enviada para reforma</CardDescription>
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
                              <PriceTag value={tool.unitValue} />
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

          {/* Reform Form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Dados da Reforma</CardTitle>
              <CardDescription>Preencha os dados do envio para reforma</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                          <PriceTag value={selectedTool.unitValue} suffix="/un" />
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
                        {"Estoque: "}
                        <span className="font-bold">{selectedTool.quantity}</span>
                        <span className="text-xs text-muted-foreground">(nao sera alterado)</span>
                      </div>
                    </div>
                    {getReformCount(selectedTool.id) > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-orange-500">
                        <AlertTriangle className="h-3 w-3" />
                        Ja ha {getReformCount(selectedTool.id)} un. em reforma atualmente
                      </div>
                    )}
                    {/* Return code preview */}
                    <div className="mt-3 p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20">
                      <p className="text-[11px] font-medium text-sky-400 mb-1.5">Ao retornar da reforma:</p>
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="text-muted-foreground">{selectedTool.code}</span>
                        <span className="text-muted-foreground">{"-->"}</span>
                        <ToolCodeDisplay code={selectedTool.code + "R"} className="font-bold" />
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

                {/* Date/Time - automatic */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Data/Hora do Envio
                  </Label>
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                    <span className="text-sm font-mono text-foreground">{currentTime ? formatDateTime(currentTime) : "--/--/----, --:--:--"}</span>
                    <Badge variant="outline" className="ml-auto text-xs">Automatico</Badge>
                  </div>
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
                </div>

                {/* Supplier */}
                <div className="grid gap-2">
                  <Label>Fornecedor (Destino da Reforma)</Label>
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

                {/* Estimated Return Date */}
                <div className="grid gap-2">
                  <Label htmlFor="estimatedReturn" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Data Estimada de Retorno
                  </Label>
                  <Input
                    id="estimatedReturn"
                    type="date"
                    value={estimatedReturn}
                    onChange={(e) => setEstimatedReturn(e.target.value)}
                    disabled={!selectedTool}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional. Previsao de quando a ferramenta retorna da reforma. Usado para controle de atrasos.
                  </p>
                </div>

                {/* Quantity */}
                <div className="grid gap-2">
                  <Label htmlFor="reformQty">Quantidade *</Label>
                  <Input
                    id="reformQty"
                    type="number"
                    min="1"
                    placeholder="Quantidade enviada para reforma"
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
                    placeholder="Tipo de reforma, prazo previsto, informacoes adicionais..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!selectedTool}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={!selectedTool || !quantity || Number(quantity) <= 0}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Registrar Envio para Reforma
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
