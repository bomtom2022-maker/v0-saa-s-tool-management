"use client";

import React, { useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowDownRight,
  Package,
  Search,
  CheckCircle,
  Plus,
  Archive,
  Layers,
  FileText,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { type Tool } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";
import { PriceTag } from "@/components/dashboard/price-tag";
import { ToolCodeDisplay } from "@/components/dashboard/tool-code-display";

export default function EntryPage() {
  const { tools, setTools, cabinets, drawers, toolTypes, movements, setMovements } = useDataStore();
  const [tab, setTab] = useState("existing");

  // Existing tool state
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [destCabinetId, setDestCabinetId] = useState("");
  const [destDrawerId, setDestDrawerId] = useState("");
  const [destPosition, setDestPosition] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // New tool state
  const [newSearchTerm, setNewSearchTerm] = useState("");
  const [newSelectedTool, setNewSelectedTool] = useState<Tool | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTypeId, setNewTypeId] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [newCabinetId, setNewCabinetId] = useState("");
  const [newDrawerId, setNewDrawerId] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newMinStock, setNewMinStock] = useState("");
  const [newUnitValue, setNewUnitValue] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const newFilteredTools = newSearchTerm.length > 0
    ? tools.filter(
        (tool) =>
          tool.code.toLowerCase().includes(newSearchTerm.toLowerCase()) ||
          tool.description.toLowerCase().includes(newSearchTerm.toLowerCase())
      )
    : [];

  const filteredTools = tools.filter(
    (tool) =>
      tool.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeName = (typeId: string) => toolTypes.find((t) => t.id === typeId)?.name || "N/A";
  const getCabinetName = (cabinetId: string) => cabinets.find((c) => c.id === cabinetId)?.name || "N/A";

  const drawersForCabinet = (cabinetId: string) => drawers.filter((d) => d.cabinetId === cabinetId);
  const newDrawersForCabinet = drawersForCabinet(newCabinetId);
  const destDrawersForCabinet = drawersForCabinet(destCabinetId || selectedTool?.cabinetId || "");

  // Calculate all pending reform sends for a tool (each with remaining qty)
  const getPendingReforms = (toolId: string) => {
    const sends = movements
      .filter(m => m.toolId === toolId && m.type === "reform_send")
      .map(m => ({ ...m, remaining: m.quantity }));
    // Subtract returns from oldest sends first
    const returns = movements.filter(m => m.toolId === toolId && m.type === "reform_return");
    let totalReturned = returns.reduce((acc, r) => acc + r.quantity, 0);
    for (const s of sends) {
      if (totalReturned <= 0) break;
      const deduct = Math.min(s.remaining, totalReturned);
      s.remaining -= deduct;
      totalReturned -= deduct;
    }
    return sends.filter(s => s.remaining > 0);
  };

  const getTotalPendingReform = (toolId: string) => {
    return getPendingReforms(toolId).reduce((acc, s) => acc + s.remaining, 0);
  };

  // Selected reform to give baixa
  const [selectedReformId, setSelectedReformId] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  };

  const pendingReforms = selectedTool ? getPendingReforms(selectedTool.id) : [];
  const totalPendingReform = selectedTool ? getTotalPendingReform(selectedTool.id) : 0;
  const selectedReform = pendingReforms.find(r => r.id === selectedReformId) || null;

  // Get reform-only cabinets
  const reformCabinets = cabinets.filter(c => c.isReformOnly);
  const normalCabinets = cabinets.filter(c => !c.isReformOnly);

  // Handle existing tool entry
  const handleExistingEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !quantity) return;

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const isReformReturn = !!selectedReform;
    const targetCabinetId = destCabinetId || selectedTool.cabinetId;
    const targetDrawerId = destDrawerId || selectedTool.drawerId;
    const targetPosition = destPosition || selectedTool.position;

    // If reform return: add "R" suffix to code, move to reform cabinet, increment reformCount
    const newCode = isReformReturn ? selectedTool.code + "R" : selectedTool.code;
    const newReformCount = isReformReturn ? (selectedTool.reformCount || 0) + 1 : (selectedTool.reformCount || 0);

    // Update tool quantity, code (if reform), and location
    setTools(prev =>
      prev.map(t =>
        t.id === selectedTool.id
          ? {
              ...t,
              code: newCode,
              quantity: t.quantity + qty,
              cabinetId: targetCabinetId,
              drawerId: targetDrawerId,
              position: targetPosition,
              reformCount: newReformCount,
            }
          : t
      )
    );

    const entryNotes = [
      isReformReturn ? `Retorno de reforma - Codigo: ${selectedTool.code} -> ${newCode}` : null,
      invoiceNumber ? `NF: ${invoiceNumber}` : null,
      notes || null,
    ].filter(Boolean).join(" | ") || `Entrada de ${qty} un. de ${selectedTool.code}`;

    // Register entry movement
    setMovements(prev => {
      const newMovements = [
        {
          id: `mov-${Date.now()}`,
          type: isReformReturn ? "reform_return" as const : "entry" as const,
          toolId: selectedTool.id,
          userId: "eng-processo-1",
          quantity: qty,
          date: new Date().toISOString(),
          notes: entryNotes,
          invoiceNumber: invoiceNumber || undefined,
        },
        ...prev,
      ];

      // If a specific reform was selected, register an additional reform_return (baixa) movement
      if (selectedReform) {
        const returnQty = Math.min(qty, selectedReform.remaining);
        const nfRetorno = invoiceNumber || selectedReform.invoiceNumber || "";
        newMovements.unshift({
          id: `mov-${Date.now()}-ret`,
          type: "reform_return" as const,
          toolId: selectedTool.id,
          userId: "eng-processo-1",
          quantity: returnQty,
          date: new Date().toISOString(),
          notes: `Baixa reforma - ${selectedTool.code} -> ${newCode} | NF retorno: ${nfRetorno || "N/A"} | NF envio: ${selectedReform.invoiceNumber || "N/A"}${selectedReform.supplier ? ` | Fornecedor: ${selectedReform.supplier}` : ""} | Destino: ${getCabinetName(targetCabinetId)}`,
          invoiceNumber: nfRetorno || undefined,
        });
      }

      return newMovements;
    });

    const reformMsg = selectedReform
      ? ` | Retorno reforma: ${selectedTool.code} -> ${newCode} | Destino: ${getCabinetName(targetCabinetId)}`
      : "";

    showSuccess(
      `Entrada registrada: +${qty} un. de ${newCode} no ${getCabinetName(targetCabinetId)}${invoiceNumber ? ` | NF: ${invoiceNumber}` : ""}${reformMsg}`
    );
    setSelectedTool(null);
    setSelectedReformId(null);
    setQuantity("");
    setDestCabinetId("");
    setDestDrawerId("");
    setDestPosition("");
    setInvoiceNumber("");
    setNotes("");
    setSearchTerm("");
  };

  // Handle new tool creation OR adding to existing
  const handleNewTool = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(newQuantity) || 0;

    if (newSelectedTool) {
      // Adding quantity to existing tool
      if (qty <= 0) return;
      setTools(prev =>
        prev.map(t =>
          t.id === newSelectedTool.id
            ? { ...t, quantity: t.quantity + qty }
            : t
        )
      );

      setMovements(prev => [
        {
          id: `mov-${Date.now()}`,
          type: "entry" as const,
          toolId: newSelectedTool.id,
          userId: "eng-processo-1",
          quantity: qty,
          date: new Date().toISOString(),
          notes: newNotes || `Adicao de estoque: +${qty} un. de ${newSelectedTool.code}`,
        },
        ...prev,
      ]);

      showSuccess(`+${qty} un. adicionadas a ${newSelectedTool.code} (${newSelectedTool.description}). Novo estoque: ${newSelectedTool.quantity + qty}`);
    } else {
      // Creating brand new tool
      if (!newCode || !newDescription || !newTypeId || !newCabinetId || !newDrawerId) return;

      const toolId = `tool-${Date.now()}`;
      const newTool: Tool = {
        id: toolId,
        code: newCode,
        description: newDescription,
        typeId: newTypeId,
        supplier: newSupplier,
        statusId: "1",
        cabinetId: newCabinetId,
        drawerId: newDrawerId,
        position: newPosition,
        quantity: qty,
        minStock: Number(newMinStock) || 0,
        unitValue: newUnitValue ? Number(newUnitValue) : undefined,
        notes: newNotes,
      };

      setTools(prev => [...prev, newTool]);

      if (qty > 0) {
        setMovements(prev => [
          {
            id: `mov-${Date.now()}`,
            type: "entry" as const,
            toolId,
            userId: "eng-processo-1",
            quantity: qty,
            date: new Date().toISOString(),
            notes: `Cadastro inicial: ${newCode} - ${newDescription}`,
          },
          ...prev,
        ]);
      }

      showSuccess(`Ferramenta ${newCode} cadastrada com ${qty} un. no ${getCabinetName(newCabinetId)}`);
    }

    setNewSelectedTool(null);
    setNewSearchTerm("");
    setNewCode("");
    setNewDescription("");
    setNewTypeId("");
    setNewSupplier("");
    setNewCabinetId("");
    setNewDrawerId("");
    setNewPosition("");
    setNewQuantity("");
    setNewMinStock("");
    setNewUnitValue("");
    setNewNotes("");
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Entrada de Ferramentas"
        subtitle="Registre a entrada de ferramentas no estoque"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
              <ArrowDownRight className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Entrada de Ferramentas
              </p>
              <p className="text-xs text-muted-foreground">
                Adicione ferramentas ao estoque. Se a ferramenta possui reforma pendente e voce informar o numero da NF, o sistema dara baixa automatica na reforma.
              </p>
            </div>
          </CardContent>
        </Card>

        {success && (
          <Card className="bg-success/10 border-success/30">
            <CardContent className="flex items-center gap-4 p-4">
              <CheckCircle className="h-6 w-6 text-success shrink-0" />
              <div>
                <p className="font-medium text-foreground">Entrada Registrada!</p>
                <p className="text-sm text-muted-foreground">{successMsg}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="existing" className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Ferramenta Existente
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Ferramenta
            </TabsTrigger>
          </TabsList>

          {/* TAB: Existing tool entry */}
          <TabsContent value="existing">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Tool Selection */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Selecionar Ferramenta</CardTitle>
                  <CardDescription>Busque e selecione a ferramenta para entrada</CardDescription>
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

                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {searchTerm && filteredTools.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhuma ferramenta encontrada
                      </p>
                    ) : searchTerm ? (
                      filteredTools.map((tool) => {
                        const toolPendingReforms = getPendingReforms(tool.id);
                        const reformPending = toolPendingReforms.reduce((a, s) => a + s.remaining, 0);
                        return (
                          <div
                            key={tool.id}
                            onClick={() => {
                              setSelectedTool(tool);
                              setSelectedReformId(null);
                              setDestCabinetId(tool.cabinetId);
                              setDestDrawerId(tool.drawerId);
                              setDestPosition(tool.position);
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                              selectedTool?.id === tool.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                                {reformPending > 0 ? (
                                  <Wrench className="h-5 w-5 text-orange-500" />
                                ) : (
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <ToolCodeDisplay code={tool.code} className="font-medium" />
                                  <PriceTag value={tool.unitValue} />
                                </div>
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {tool.description}
                                </p>
                                {reformPending > 0 && (
                                  <p className="text-xs text-orange-500 flex items-center gap-1 mt-0.5">
                                    <Wrench className="h-3 w-3" />
                                    {reformPending} un. em reforma
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">{getTypeName(tool.typeId)}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Qtd: {tool.quantity} | {getCabinetName(tool.cabinetId)}
                              </p>
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

              {/* Entry Form */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Dados da Entrada</CardTitle>
                  <CardDescription>Preencha os dados da movimentacao</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleExistingEntry} className="space-y-4">
                    {selectedTool ? (
                      <div className="p-4 rounded-lg bg-secondary">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${totalPendingReform > 0 ? "bg-orange-500/10" : "bg-primary/10"}`}>
                            {totalPendingReform > 0 ? (
                              <Wrench className="h-6 w-6 text-orange-500" />
                            ) : (
                              <Package className="h-6 w-6 text-primary" />
                            )}
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
                          <div>
                            Estoque atual: <span className="font-bold">{selectedTool.quantity}</span>
                          </div>
                        </div>

                        {/* Pending reforms list */}
                        {pendingReforms.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              {totalPendingReform} un. em reforma ({pendingReforms.length} envio{pendingReforms.length > 1 ? "s" : ""})
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Selecione a reforma para dar baixa ao registrar a entrada com NF:
                            </p>
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                              {pendingReforms.map((reform) => {
                                const sendDate = new Date(reform.date);
                                const isSelected = selectedReformId === reform.id;
                                return (
                                  <div
                                    key={reform.id}
                                    onClick={() => {
                    if (isSelected) {
                      setSelectedReformId(null);
                      setInvoiceNumber("");
                      // Reset cabinet to tool's original cabinet
                      if (selectedTool) {
                        setDestCabinetId(selectedTool.cabinetId);
                        setDestDrawerId(selectedTool.drawerId);
                        setDestPosition(selectedTool.position);
                      }
                    } else {
                      setSelectedReformId(reform.id);
                      setInvoiceNumber(reform.invoiceNumber || "");
                      // Auto-select first reform cabinet (A-R)
                      const firstReformCabinet = reformCabinets[0];
                      if (firstReformCabinet) {
                        setDestCabinetId(firstReformCabinet.id);
                        setDestDrawerId("");
                        setDestPosition("");
                      }
                    }
                                    }}
                                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                                      isSelected
                                        ? "border-orange-500 bg-orange-500/10"
                                        : "border-border hover:border-orange-500/50"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Wrench className={`h-3.5 w-3.5 ${isSelected ? "text-orange-500" : "text-muted-foreground"}`} />
                                        <span className="font-mono font-medium">
                                          NF: {reform.invoiceNumber || "Sem NF"}
                                        </span>
                                      </div>
                                      <Badge variant={isSelected ? "default" : "secondary"} className="text-[10px]">
                                        {reform.remaining} un.
                                      </Badge>
                                    </div>
                                    <div className="mt-1 text-muted-foreground flex flex-wrap gap-x-3">
                                      <span>Enviado: {sendDate.toLocaleDateString("pt-BR")}</span>
                                      {reform.supplier && <span>Fornecedor: {reform.supplier}</span>}
                                      {reform.estimatedReturn && (
                                        <span>
                                          Previsao: {new Date(reform.estimatedReturn).toLocaleDateString("pt-BR")}
                                          {new Date(reform.estimatedReturn) < new Date() && (
                                            <span className="text-destructive font-medium ml-1">(Atrasado)</span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 rounded-lg border border-dashed border-border text-center">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Selecione uma ferramenta ao lado</p>
                      </div>
                    )}

                    {/* Reform code change preview */}
                    {selectedTool && selectedReform && (
                      <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
                        <p className="text-xs font-medium text-sky-400 mb-2">Transformacao do Codigo ao Retornar</p>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-sm text-muted-foreground">{selectedTool.code}</span>
                          <span className="text-muted-foreground">{"-->"}</span>
                          <ToolCodeDisplay code={selectedTool.code + "R"} className="text-sm font-bold" />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          O codigo da ferramenta recebera o sufixo "R" e sera movida para o armario de ferramentas reformadas.
                        </p>
                      </div>
                    )}

                    {/* Invoice Number */}
                    <div className="grid gap-2">
                      <Label htmlFor="invoiceNumber" className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Numero da Nota Fiscal
                        {selectedReform && (
                          <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-500/30">
                            Baixa na NF {selectedReform.invoiceNumber || "s/n"}
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="invoiceNumber"
                        placeholder="Ex: NF-2026-001234"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        disabled={!selectedTool}
                        className={selectedReform ? "border-orange-500/30 focus-visible:ring-orange-500/30" : ""}
                      />
                      {selectedReform && (
                        <p className="text-xs text-orange-500">
                          Ao registrar, dara baixa automatica em {Math.min(Number(quantity) || selectedReform.remaining, selectedReform.remaining)} un. da reforma NF {selectedReform.invoiceNumber || "s/n"} ({new Date(selectedReform.date).toLocaleDateString("pt-BR")})
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="qty">Quantidade *</Label>
                      <Input
                        id="qty"
                        type="number"
                        min="1"
                        placeholder="Quantidade de entrada"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        disabled={!selectedTool}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label className="flex items-center gap-2">
                        Armario de Destino *
                        {selectedReform && (
                          <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 text-[10px]">
                            Somente armarios de reforma
                          </Badge>
                        )}
                      </Label>
                      <Select
                        value={destCabinetId}
                        onValueChange={(v) => {
                          setDestCabinetId(v);
                          setDestDrawerId("");
                          setDestPosition("");
                        }}
                        disabled={!selectedTool}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o armario" />
                        </SelectTrigger>
                        <SelectContent>
                          {(selectedReform ? reformCabinets : normalCabinets).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} - {c.location}
                              {c.isReformOnly ? " (Reformadas)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedReform && (
                        <p className="text-xs text-sky-400">
                          Ferramentas retornando de reforma devem ser armazenadas nos armarios A-R ou B-R.
                        </p>
                      )}
                    </div>

                    {destCabinetId && destDrawersForCabinet.length > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Gaveta</Label>
                          <Select value={destDrawerId} onValueChange={setDestDrawerId} disabled={!selectedTool}>
                            <SelectTrigger>
                              <SelectValue placeholder="Gaveta" />
                            </SelectTrigger>
                            <SelectContent>
                              {destDrawersForCabinet.map((d) => (
                                <SelectItem key={d.id} value={d.id}>Gaveta {d.number}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Posicao</Label>
                          {destDrawerId ? (
                            <Select value={destPosition} onValueChange={setDestPosition} disabled={!selectedTool}>
                              <SelectTrigger>
                                <SelectValue placeholder="Posicao" />
                              </SelectTrigger>
                              <SelectContent>
                                {drawers.find(d => d.id === destDrawerId)?.positions.map((p) => (
                                  <SelectItem key={p} value={p}>Posicao {p}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input placeholder="Selecione a gaveta" disabled />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="entryNotes">Observacoes</Label>
                      <Textarea
                        id="entryNotes"
                        placeholder="Motivo da entrada, referencia, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={!selectedTool}
                      />
                    </div>

                    <Button
                      type="submit"
                      className={`w-full ${selectedReform ? "bg-sky-600 hover:bg-sky-700 text-white" : ""}`}
                      disabled={!selectedTool || !quantity || !destCabinetId}
                    >
                      {selectedReform ? (
                        <>
                          <Wrench className="mr-2 h-4 w-4" />
                          {`Registrar Retorno de Reforma (${selectedTool?.code} -> ${selectedTool?.code}R)`}
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Registrar Entrada
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: New tool */}
          <TabsContent value="new">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Search / Select Tool */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Buscar Ferramenta
                  </CardTitle>
                  <CardDescription>
                    Busque uma ferramenta existente para adicionar ao estoque, ou cadastre uma nova abaixo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por codigo ou descricao..."
                      value={newSearchTerm}
                      onChange={(e) => {
                        setNewSearchTerm(e.target.value);
                        if (!e.target.value) setNewSelectedTool(null);
                      }}
                      className="pl-9"
                    />
                  </div>

                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {newSearchTerm && newFilteredTools.length === 0 ? (
                      <div className="text-center py-6 space-y-2">
                        <Package className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Nenhuma ferramenta encontrada para "{newSearchTerm}"
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Preencha o formulario ao lado para cadastrar uma nova.
                        </p>
                      </div>
                    ) : newSearchTerm ? (
                      newFilteredTools.map((tool) => (
                        <div
                          key={tool.id}
                          onClick={() => {
                            setNewSelectedTool(tool);
                            setNewSearchTerm(tool.code);
                            setNewCabinetId(tool.cabinetId);
                            setNewDrawerId(tool.drawerId);
                            setNewPosition(tool.position);
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            newSelectedTool?.id === tool.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <ToolCodeDisplay code={tool.code} className="font-medium text-sm" />
                                <PriceTag value={tool.unitValue} />
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="text-[10px]">{getTypeName(tool.typeId)}</Badge>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Estoque: <span className="font-bold">{tool.quantity}</span>
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {getCabinetName(tool.cabinetId)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Digite para buscar ferramentas existentes
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Form */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    {newSelectedTool ? "Adicionar ao Estoque" : "Cadastrar Nova Ferramenta"}
                  </CardTitle>
                  <CardDescription>
                    {newSelectedTool
                      ? `Adicionando unidades a ${newSelectedTool.code} - ${newSelectedTool.description}`
                      : "Preencha os dados para cadastrar uma nova ferramenta."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleNewTool} className="space-y-6">
                    {/* Selected existing tool info */}
                    {newSelectedTool && (
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <ToolCodeDisplay code={newSelectedTool.code} className="font-bold" />
                                <PriceTag value={newSelectedTool.unitValue} suffix="/un" />
                              </div>
                              <p className="text-sm text-muted-foreground">{newSelectedTool.description}</p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewSelectedTool(null);
                              setNewSearchTerm("");
                            }}
                            className="text-xs"
                          >
                            Limpar
                          </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{getCabinetName(newSelectedTool.cabinetId)}</span>
                          </div>
                          <div>
                            Estoque atual: <span className="font-bold">{newSelectedTool.quantity}</span>
                          </div>
                          <div>
                            Min: <span className="font-medium">{newSelectedTool.minStock}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* New tool fields - only if no existing selected */}
                    {!newSelectedTool && (
                      <>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4" /> Dados da Ferramenta
                          </p>
                          <div className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="newCode">Codigo Interno *</Label>
                                <Input
                                  id="newCode"
                                  placeholder="Ex: INS-006"
                                  value={newCode}
                                  onChange={(e) => setNewCode(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Tipo *</Label>
                                <Select value={newTypeId} onValueChange={setNewTypeId} required>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {toolTypes.filter(t => t.isActive).map((type) => (
                                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="newDesc">Descricao Tecnica *</Label>
                              <Input
                                id="newDesc"
                                placeholder="Ex: Inserto CNMG 120408 Metal Duro"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                required
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="newSupplier">Fornecedor</Label>
                              <Input
                                id="newSupplier"
                                placeholder="Nome do fornecedor"
                                value={newSupplier}
                                onChange={(e) => setNewSupplier(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Location */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                            <Archive className="h-4 w-4" /> Localizacao no Armario
                          </p>
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label>Armario *</Label>
                              <Select
                                value={newCabinetId}
                                onValueChange={(v) => {
                                  setNewCabinetId(v);
                                  setNewDrawerId("");
                                  setNewPosition("");
                                }}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o armario" />
                                </SelectTrigger>
                                <SelectContent>
                                  {normalCabinets.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name} - {c.location}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {newCabinetId && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label>Gaveta *</Label>
                                  <Select value={newDrawerId} onValueChange={setNewDrawerId} required>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {newDrawersForCabinet.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>Gaveta {d.number}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-2">
                                  <Label>Posicao</Label>
                                  {newDrawerId ? (
                                    <Select value={newPosition} onValueChange={setNewPosition}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Posicao" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {drawers.find(d => d.id === newDrawerId)?.positions.map((p) => (
                                          <SelectItem key={p} value={p}>Posicao {p}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input placeholder="Selecione a gaveta" disabled />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="newMin">Estoque Minimo</Label>
                            <Input
                              id="newMin"
                              type="number"
                              min="0"
                              placeholder="0"
                              value={newMinStock}
                              onChange={(e) => setNewMinStock(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="newUnitValue">Valor Unitario (R$)</Label>
                            <Input
                              id="newUnitValue"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0,00"
                              value={newUnitValue}
                              onChange={(e) => setNewUnitValue(e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Quantity - always shown */}
                    <div className="grid gap-2">
                      <Label htmlFor="newQty" className="font-medium">
                        {newSelectedTool ? "Quantidade a Adicionar *" : "Quantidade Inicial"}
                      </Label>
                      <Input
                        id="newQty"
                        type="number"
                        min={newSelectedTool ? "1" : "0"}
                        placeholder={newSelectedTool ? "Quantas unidades adicionar?" : "0"}
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        required={!!newSelectedTool}
                        className={newSelectedTool ? "text-lg font-mono" : ""}
                      />
                      {newSelectedTool && newQuantity && Number(newQuantity) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Novo estoque: {newSelectedTool.quantity} + {newQuantity} = <span className="font-bold text-foreground">{newSelectedTool.quantity + Number(newQuantity)}</span>
                        </p>
                      )}
                    </div>

                    {/* Notes - always shown */}
                    <div className="grid gap-2">
                      <Label htmlFor="newNotes">Observacoes</Label>
                      <Textarea
                        id="newNotes"
                        placeholder="Informacoes adicionais..."
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        newSelectedTool
                          ? !newQuantity || Number(newQuantity) <= 0
                          : !newCode || !newDescription || !newTypeId || !newCabinetId || !newDrawerId
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {newSelectedTool
                        ? `Adicionar ${newQuantity || 0} un. ao Estoque`
                        : "Cadastrar Ferramenta"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
