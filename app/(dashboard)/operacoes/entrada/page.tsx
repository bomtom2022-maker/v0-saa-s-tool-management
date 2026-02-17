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
} from "lucide-react";
import { type Tool } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";

export default function EntryPage() {
  const { tools, setTools, cabinets, drawers, toolTypes, statuses, movements, setMovements } = useDataStore();
  const [tab, setTab] = useState("existing");

  // Existing tool state
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [destCabinetId, setDestCabinetId] = useState("");
  const [destDrawerId, setDestDrawerId] = useState("");
  const [destPosition, setDestPosition] = useState("");
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

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

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

    // Register movement
    setMovements(prev => [
      {
        id: `mov-${Date.now()}`,
        type: "entry" as const,
        toolId: selectedTool.id,
        userId: "eng-processo-1",
        quantity: qty,
        date: new Date().toISOString(),
        notes: notes || `Entrada de ${qty} un. de ${selectedTool.code}`,
      },
      ...prev,
    ]);

    showSuccess(`Entrada registrada: +${qty} un. de ${selectedTool.code} no ${getCabinetName(targetCabinetId)}`);
    setSelectedTool(null);
    setQuantity("");
    setDestCabinetId("");
    setDestDrawerId("");
    setDestPosition("");
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
      statusId: "1", // Em Estoque
      cabinetId: newCabinetId,
      drawerId: newDrawerId,
      position: newPosition,
      quantity: qty,
      minStock: Number(newMinStock) || 0,
      notes: newNotes,
    };

    setTools(prev => [...prev, newTool]);

    // Register movement if has quantity
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
                Adicione quantidade a ferramentas existentes ou cadastre novas ferramentas vinculadas a armarios especificos.
              </p>
            </div>
          </CardContent>
        </Card>

        {success && (
          <Card className="bg-success/10 border-success/30">
            <CardContent className="flex items-center gap-4 p-4">
              <CheckCircle className="h-6 w-6 text-success" />
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
                      filteredTools.map((tool) => (
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
                              Qtd: {tool.quantity} | {getCabinetName(tool.cabinetId)}
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
                          <div>
                            Estoque atual: <span className="font-bold">{selectedTool.quantity}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 rounded-lg border border-dashed border-border text-center">
                        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Selecione uma ferramenta ao lado</p>
                      </div>
                    )}

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
