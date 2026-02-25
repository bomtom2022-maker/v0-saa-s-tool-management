"use client";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Send,
  Package,
  FileText,
  ClipboardList,
  Calendar,
  CheckCircle,
  Trash2,
  ShoppingCart,
  Wrench,
  ArrowLeft,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { useDataStore } from "@/lib/data-store";
import { useNotifications } from "@/lib/notifications";
import { ToolCodeDisplay } from "@/components/dashboard/tool-code-display";
import Link from "next/link";

export default function EnviarReformaPage() {
  const { tools, reformQueue, setReformQueue, movements, setMovements, suppliers } = useDataStore();
  const { addNotification } = useNotifications();

  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notaNumber, setNotaNumber] = useState("");
  const [packingListNumber, setPackingListNumber] = useState("");
  const [estimatedReturn, setEstimatedReturn] = useState("");
  const [sendNotes, setSendNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);

  const getToolInfo = (toolId: string) => tools.find(t => t.id === toolId);

  const formatDateTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    return new Date(date + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Unique suppliers in the queue for filter
  const queueSuppliers = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of reformQueue) {
      if (!map.has(item.supplierId)) {
        map.set(item.supplierId, item.supplierName);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [reformQueue]);

  // Filtered queue based on supplier filter
  const filteredQueue = useMemo(() => {
    if (supplierFilter === "all") return reformQueue;
    return reformQueue.filter(q => q.supplierId === supplierFilter);
  }, [reformQueue, supplierFilter]);

  // Grouped summary by supplier for selected items
  const selectedItems = useMemo(() => reformQueue.filter(q => selectedIds.has(q.id)), [reformQueue, selectedIds]);
  const totalSelectedQty = useMemo(() => selectedItems.reduce((s, q) => s + q.quantity, 0), [selectedItems]);
  const supplierSummary = useMemo(() => {
    const map = new Map<string, { name: string; count: number; qty: number }>();
    for (const item of selectedItems) {
      const existing = map.get(item.supplierId);
      if (existing) {
        existing.count++;
        existing.qty += item.quantity;
      } else {
        map.set(item.supplierId, { name: item.supplierName, count: 1, qty: item.quantity });
      }
    }
    return Array.from(map.values());
  }, [selectedItems]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredQueue.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQueue.map(q => q.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRemoveSelected = () => {
    setReformQueue(prev => prev.filter(q => !selectedIds.has(q.id)));
    setSelectedIds(new Set());
  };

  const handleSend = () => {
    if (selectedItems.length === 0) return;

    const timestamp = new Date();

    // Create a movement for each selected queue item
    const newMovements = selectedItems.map((item) => {
      const tool = getToolInfo(item.toolId);
      const movementNotes = [
        notaNumber ? `Nota: ${notaNumber}` : null,
        packingListNumber ? `Romaneio: ${packingListNumber}` : null,
        item.supplierName ? `Fornecedor: ${item.supplierName}` : null,
        item.notes || null,
        sendNotes || null,
      ].filter(Boolean).join(" | ");

      return {
        id: `mov-${Date.now()}-${item.id}`,
        type: "reform_send" as const,
        toolId: item.toolId,
        userId: "eng-processo-1",
        quantity: item.quantity,
        date: timestamp.toISOString(),
        notes: movementNotes || "Enviado para reforma",
        invoiceNumber: notaNumber || undefined,
        packingListNumber: packingListNumber || undefined,
        supplier: item.supplierName || undefined,
        estimatedReturn: estimatedReturn || undefined,
      };
    });

    setMovements(prev => [...newMovements, ...prev]);

    // Remove sent items from queue
    const sentIds = new Set(selectedItems.map(q => q.id));
    setReformQueue(prev => prev.filter(q => !sentIds.has(q.id)));

    // Build success message
    const supplierNames = [...new Set(selectedItems.map(q => q.supplierName))].join(", ");
    setSuccessMsg(
      `${selectedItems.length} ${selectedItems.length === 1 ? "item enviado" : "itens enviados"} para reforma (${totalSelectedQty} un.)${notaNumber ? ` | NF: ${notaNumber}` : ""}${packingListNumber ? ` | Romaneio: ${packingListNumber}` : ""} | Fornecedor(es): ${supplierNames}`
    );

    addNotification({
      type: "reform_send",
      title: "Envio para Reforma Realizado",
      message: `${selectedItems.length} itens (${totalSelectedQty} un.) enviados para reforma${notaNumber ? ` | NF: ${notaNumber}` : ""}`,
    });

    // Reset form
    setSelectedIds(new Set());
    setNotaNumber("");
    setPackingListNumber("");
    setEstimatedReturn("");
    setSendNotes("");
    setConfirmStep(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 6000);
  };

  const allSelected = filteredQueue.length > 0 && selectedIds.size === filteredQueue.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredQueue.length;

  return (
    <div className="min-h-screen">
      <Header
        title="Enviar para Reforma"
        subtitle="Selecione os itens da fila e finalize o envio com NF e romaneio"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Back + Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/operacoes/reforma">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Fila
            </Button>
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-orange-500 border-orange-500/30">
              {reformQueue.length} {reformQueue.length === 1 ? "item" : "itens"} na fila
            </Badge>
            <span>|</span>
            <span>{reformQueue.reduce((s, q) => s + q.quantity, 0)} un. total</span>
          </div>
        </div>

        {success && (
          <Card className="bg-success/10 border-success/30">
            <CardContent className="flex items-center gap-4 p-4">
              <CheckCircle className="h-6 w-6 text-success shrink-0" />
              <div>
                <p className="font-medium text-foreground">Envio Realizado com Sucesso!</p>
                <p className="text-sm text-muted-foreground">{successMsg}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {reformQueue.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">Fila vazia</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhuma ferramenta na fila de envio. Adicione itens na aba "Reforma".
                </p>
              </div>
              <Link href="/operacoes/reforma">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Ir para Fila de Reforma
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Queue Table - 2 cols */}
            <div className="xl:col-span-2 space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-orange-500" />
                        Itens para Envio
                      </CardTitle>
                      <CardDescription>
                        Selecione os itens que deseja enviar neste lote
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Supplier Filter */}
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Select
                          value={supplierFilter}
                          onValueChange={(v) => {
                            setSupplierFilter(v);
                            setSelectedIds(new Set());
                          }}
                        >
                          <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Fornecedor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos os Fornecedores</SelectItem>
                            {queueSuppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedIds.size > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={handleRemoveSelected}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover {selectedIds.size}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={allSelected ? true : someSelected ? "indeterminate" : false}
                              onCheckedChange={toggleSelectAll}
                              aria-label="Selecionar todos"
                            />
                          </TableHead>
                          <TableHead>Codigo</TableHead>
                          <TableHead>Descricao</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead>Observacoes</TableHead>
                          <TableHead>Adicionado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQueue.map((item) => {
                          const tool = getToolInfo(item.toolId);
                          const isSelected = selectedIds.has(item.id);
                          return (
                            <TableRow
                              key={item.id}
                              className={`cursor-pointer transition-colors ${isSelected ? "bg-orange-500/10 border-l-2 border-l-orange-500" : "hover:bg-secondary/50"}`}
                              onClick={() => toggleSelect(item.id)}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelect(item.id)}
                                  aria-label={`Selecionar ${tool?.code || "item"}`}
                                  className={`h-5 w-5 ${isSelected ? "border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white" : ""}`}
                                />
                              </TableCell>
                              <TableCell>
                                {tool ? (
                                  <ToolCodeDisplay code={tool.code} className="font-medium" />
                                ) : (
                                  <span className="text-muted-foreground">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="text-sm max-w-[180px] truncate">
                                {tool?.description || "N/A"}
                              </TableCell>
                              <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                              <TableCell className="text-sm">
                                <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-[10px]">
                                  {item.supplierName}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                                {item.notes || "-"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {formatDateTime(item.addedAt)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Selection summary */}
                  {selectedIds.size > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <Badge className="bg-orange-500/20 text-orange-500 border-0">
                          {selectedIds.size} {selectedIds.size === 1 ? "item selecionado" : "itens selecionados"}
                        </Badge>
                        <span className="text-muted-foreground">|</span>
                        <span className="font-medium">{totalSelectedQty} un. total</span>
                        {supplierSummary.length > 0 && (
                          <>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-muted-foreground">
                              {supplierSummary.map(s => `${s.name} (${s.qty} un.)`).join(", ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Send Form - 1 col */}
            <div className="space-y-4">
              <Card className={`bg-card border-border ${selectedIds.size > 0 ? "ring-1 ring-orange-500/30" : ""}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-orange-500" />
                    Dados do Envio
                  </CardTitle>
                  <CardDescription>
                    {selectedIds.size > 0
                      ? `Preencha os dados para enviar ${selectedIds.size} ${selectedIds.size === 1 ? "item" : "itens"}`
                      : "Selecione itens na tabela para habilitar o envio"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Nota number */}
                  <div className="grid gap-2">
                    <Label htmlFor="notaNumber" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Numero da Nota Fiscal
                    </Label>
                    <Input
                      id="notaNumber"
                      placeholder="Ex: NF-2026-001234"
                      value={notaNumber}
                      onChange={(e) => setNotaNumber(e.target.value)}
                      disabled={selectedIds.size === 0}
                    />
                  </div>

                  {/* Packing List Number (Romaneio) */}
                  <div className="grid gap-2">
                    <Label htmlFor="packingListNumber" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      Numero do Romaneio
                    </Label>
                    <Input
                      id="packingListNumber"
                      placeholder="Ex: ROM-2026-000123"
                      value={packingListNumber}
                      onChange={(e) => setPackingListNumber(e.target.value)}
                      disabled={selectedIds.size === 0}
                    />
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
                      disabled={selectedIds.size === 0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Opcional. Previsao de quando as ferramentas retornam.
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="grid gap-2">
                    <Label htmlFor="sendNotes">Observacoes do Envio</Label>
                    <Textarea
                      id="sendNotes"
                      placeholder="Informacoes adicionais sobre este envio..."
                      value={sendNotes}
                      onChange={(e) => setSendNotes(e.target.value)}
                      disabled={selectedIds.size === 0}
                    />
                  </div>

                  {/* Confirm / Send */}
                  {!confirmStep ? (
                    <Button
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={selectedIds.size === 0}
                      onClick={() => setConfirmStep(true)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Enviar {selectedIds.size} {selectedIds.size === 1 ? "item" : "itens"} para Reforma
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <p className="text-sm font-medium text-foreground">Confirmar envio?</p>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>{selectedIds.size} {selectedIds.size === 1 ? "item" : "itens"} ({totalSelectedQty} un.) serao registrados como enviados para reforma.</p>
                          {notaNumber && <p>NF: {notaNumber}</p>}
                          {packingListNumber && <p>Romaneio: {packingListNumber}</p>}
                          {estimatedReturn && <p>Retorno estimado: {formatDate(estimatedReturn)}</p>}
                          {supplierSummary.length > 0 && (
                            <p>Fornecedores: {supplierSummary.map(s => s.name).join(", ")}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setConfirmStep(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={handleSend}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
