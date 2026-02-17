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
  ArrowUpRight,
  Package,
  Search,
  CheckCircle,
  Minus,
  Archive,
  AlertTriangle,
} from "lucide-react";
import { type Tool } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";

export default function ExitPage() {
  const { tools, cabinets, toolTypes } = useDataStore();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);

  const filteredTools = tools.filter(
    (tool) =>
      tool.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeName = (typeId: string) => {
    return toolTypes.find((t) => t.id === typeId)?.name || "N/A";
  };

  const getCabinetName = (cabinetId: string) => {
    return cabinets.find((c) => c.id === cabinetId)?.name || "N/A";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTool && quantity) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedTool(null);
        setQuantity("");
        setNotes("");
        setSearchTerm("");
      }, 2000);
    }
  };

  const isLowStock = (tool: Tool) => tool.quantity <= tool.minStock;
  const maxQuantity = selectedTool?.quantity || 0;

  return (
    <div className="min-h-screen">
      <Header
        title="Saida de Ferramentas"
        subtitle="Registre a saida de ferramentas do estoque"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
              <ArrowUpRight className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Saida de Ferramentas
              </p>
              <p className="text-xs text-muted-foreground">
                Selecione a ferramenta e registre a quantidade de saida. A quantidade
                nao pode exceder o estoque disponivel.
              </p>
            </div>
          </CardContent>
        </Card>

        {success && (
          <Card className="bg-success/10 border-success/30">
            <CardContent className="flex items-center gap-4 p-4">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <p className="font-medium text-foreground">Saida Registrada!</p>
                <p className="text-sm text-muted-foreground">
                  A movimentacao foi salva com sucesso.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tool Selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Selecionar Ferramenta</CardTitle>
              <CardDescription>Busque e selecione a ferramenta para saida</CardDescription>
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
                        <div className="flex items-center justify-end gap-1 mt-1">
                          {isLowStock(tool) && (
                            <AlertTriangle className="h-3 w-3 text-warning" />
                          )}
                          <span className={`text-xs ${isLowStock(tool) ? "text-warning" : "text-muted-foreground"}`}>
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
                    <div className="mt-3 flex gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Archive className="h-4 w-4 text-muted-foreground" />
                        {getCabinetName(selectedTool.cabinetId)}
                      </div>
                      <div className="flex items-center gap-1">
                        Disponivel: 
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
                    <p className="text-muted-foreground">Selecione uma ferramenta</p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
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
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Observacoes *</Label>
                  <Textarea
                    id="notes"
                    placeholder="Motivo da saida, numero do OP, etc."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={!selectedTool}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="destructive"
                  disabled={!selectedTool || !quantity || Number(quantity) > maxQuantity}
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
