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

  // Calculate pending reform for a tool
  const getPendingReform = (toolId: string) => {
    let out = 0;
    for (const m of movements) {
      if (m.toolId === toolId && m.type === "reform_send") out += m.quantity;
      if (m.toolId === toolId && m.type === "reform_return") out -= m.quantity;
    }
    return Math.max(0, out);
  };

  // Get the latest reform_send movement for a tool (to show NF info)
  const getLatestReformSend = (toolId: string) => {
    return movements.find(m => m.toolId === toolId && m.type === "reform_send");
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 5000);
  };

  const pendingReform = selectedTool ? getPendingReform(selectedTool.id) : 0;
  const latestReformSend = selectedTool ? getLatestReformSend(selectedTool.id) : null;

  // Handle existing tool entry
  const handleExistingEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !quantity) return;

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const targetCabinetId = destCabinetId || selectedTool.cabinetId;
    const targetDrawerId = destDrawerId || selectedTool.drawerId;
    const targetPosition = destPosition || selectedTool.position;

    // Update tool quantity and optionally location
    setTools(prev =>
      prev.map(t =>
        t.id === selectedTool.id
          ? {
              ...t,
              quantity: t.quantity + qty,
              cabinetId: targetCabinetId,
              drawerId: targetDrawerId,
              position: targetPosition,
            }
          : t
      )
    );

    const entryNotes = [
      invoiceNumber ? `NF: ${invoiceNumber}` : null,
      notes || null,
    ].filter(Boolean).join(" | ") || `Entrada de ${qty} un. de ${selectedTool.code}`;

    // Register entry movement
    setMovements(prev => {
      const newMovements = [
        {
          id: `mov-${Date.now()}`,
          type: "entry" as const,
          toolId: selectedTool.id,
          userId: "eng-processo-1",
          quantity: qty,
          date: new Date().toISOString(),
          notes: entryNotes,
          invoiceNumber: invoiceNumber || undefined,
        },
        ...prev,
      ];

      // If tool has pending reform and NF was provided, automatically register reform_return
      if (pendingReform > 0 && invoiceNumber) {
        const returnQty = Math.min(qty, pendingReform);
        newMovements.unshift({
          id: `mov-${Date.now()}-ret`,
          type: "reform_return" as const,
          toolId: selectedTool.id,
          userId: "eng-processo-1",
          quantity: returnQty,
          date: new Date().toISOString(),
          notes: `Retorno de reforma - NF: ${invoiceNumber}${latestReformSend?.invoiceNumber ? ` | NF envio: ${latestReformSend.invoiceNumber}` : ""}`,
          invoiceNumber: invoiceNumber,
        });
      }

      return newMovements;
    });

    const reformMsg = pendingReform > 0 && invoiceNumber
      ? ` | Baixa automatica na reforma: ${Math.min(qty, pendingReform)} un.`
      : "";

    showSuccess(
      `Entrada registrada: +${qty} un. de ${selectedTool.code} no ${getCabinetName(targetCabinetId)}${invoiceNumber ? ` | NF: ${invoiceNumber}` : ""}${reformMsg}`
    );
    setSelectedTool(null);
    setQuantity("");
    setDestCabinetId("");
    setDestDrawerId("");
    setDestPosition("");
    setInvoiceNumber("");
    setNotes("");
    setSearchTerm("");
  };

  // Handle new tool creation
  const handleNewTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDescription || !newTypeId || !newCabinetId || !newDrawerId) return;

    const qty = Number(newQuantity) || 0;
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
                        const reformPending = getPendingReform(tool.id);
                        return (
                          <div
                            key={tool.id}
                            onClick={() => {
                              setSelectedTool(tool);
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
                                  <p className="font-mono font-medium">{tool.code}</p>
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
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${pendingReform > 0 ? "bg-orange-500/10" : "bg-primary/10"}`}>
                            {pendingReform > 0 ? (
                              <Wrench className="h-6 w-6 text-orange-500" />
                            ) : (
                              <Package className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="font-mono font-bold">{selectedTool.code}</p>
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

                        {/* Reform pending alert */}
                        {pendingReform > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              {pendingReform} un. em reforma pendente
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Informe o numero da NF abaixo para dar baixa automatica na reforma.
                            </p>
                            {latestReformSend?.invoiceNumber && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                NF de envio: <span className="font-mono font-medium text-foreground">{latestReformSend.invoiceNumber}</span>
                                {latestReformSend.supplier && <> | Fornecedor: {latestReformSend.supplier}</>}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 rounded-lg border border-dashed border-border text-center">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Selecione uma ferramenta ao lado</p>
                      </div>
                    )}

                    {/* Invoice Number */}
                    <div className="grid gap-2">
                      <Label htmlFor="invoiceNumber" className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        Numero da Nota Fiscal
                        {pendingReform > 0 && (
                          <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-500/30">
                            Dar baixa na reforma
                          </Badge>
                        )}
                      </Label>
                      <Input
                        id="invoiceNumber"
                        placeholder="Ex: NF-2026-001234"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        disabled={!selectedTool}
                        className={pendingReform > 0 ? "border-orange-500/30 focus-visible:ring-orange-500/30" : ""}
                      />
                      {pendingReform > 0 && (
                        <p className="text-xs text-orange-500">
                          Ao informar a NF, o sistema registrara automaticamente o retorno de {Math.min(Number(quantity) || pendingReform, pendingReform)} un. da reforma.
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
                      <Label>Armario de Destino *</Label>
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
                          {cabinets.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name} - {c.location}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                    <Button type="submit" className="w-full" disabled={!selectedTool || !quantity || !destCabinetId}>
                      <Plus className="mr-2 h-4 w-4" />
                      Registrar Entrada
                      {pendingReform > 0 && invoiceNumber && " e Baixa na Reforma"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: New tool */}
          <TabsContent value="new">
            <Card className="bg-card border-border max-w-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Cadastrar Nova Ferramenta
                </CardTitle>
                <CardDescription>
                  Cadastre uma nova ferramenta diretamente vinculada a um armario, gaveta e posicao.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNewTool} className="space-y-6">
                  {/* Basic info */}
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
                            {cabinets.map((c) => (
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

                  {/* Stock */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4" /> Estoque
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="newQty">Quantidade Inicial</Label>
                        <Input
                          id="newQty"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={newQuantity}
                          onChange={(e) => setNewQuantity(e.target.value)}
                        />
                      </div>
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
                    </div>

                    {/* Unit Value */}
                    <div className="grid gap-2 mt-4">
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
                      <p className="text-xs text-muted-foreground">Opcional. Valor unitario da ferramenta em Reais.</p>
                    </div>
                  </div>

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
                    disabled={!newCode || !newDescription || !newTypeId || !newCabinetId || !newDrawerId}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Ferramenta e Registrar Entrada
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
