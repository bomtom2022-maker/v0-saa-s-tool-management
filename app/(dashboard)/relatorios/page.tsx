"use client";

import { useState } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Archive,
  AlertTriangle,
  Wrench,
  TrendingUp,
  Package,
  BarChart3,
  PieChart,
  Calendar,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { useDataStore } from "@/lib/data-store";

export default function ReportsPage() {
  const { tools, cabinets, toolTypes, statuses } = useDataStore();
  const [selectedCabinet, setSelectedCabinet] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const getTypeName = (typeId: string) => {
    return toolTypes.find((t) => t.id === typeId)?.name || "N/A";
  };

  const getCabinetName = (cabinetId: string) => {
    return cabinets.find((c) => c.id === cabinetId)?.name || "N/A";
  };

  const getStatusInfo = (statusId: string) => {
    return statuses.find((s) => s.id === statusId) || { name: "N/A", color: "bg-muted" };
  };

  const getStatusColorClass = (color: string) => {
    switch (color) {
      case "bg-success":
        return "bg-success";
      case "bg-chart-2":
        return "bg-chart-2";
      case "bg-warning":
        return "bg-warning";
      case "bg-destructive":
        return "bg-destructive";
      default:
        return "bg-muted-foreground";
    }
  };

  const lowStockTools = tools.filter((t) => t.quantity <= t.minStock);
  const inReformTools = tools.filter((t) => t.statusId === "3");
  const filteredTools = selectedCabinet === "all"
    ? tools
    : tools.filter((t) => t.cabinetId === selectedCabinet);

  // Calculate stats per cabinet
  const cabinetStats = cabinets.map((cabinet) => {
    const cabinetTools = tools.filter((t) => t.cabinetId === cabinet.id);
    const totalQuantity = cabinetTools.reduce((acc, t) => acc + t.quantity, 0);
    const lowStock = cabinetTools.filter((t) => t.quantity <= t.minStock).length;
    return {
      ...cabinet,
      toolTypes: cabinetTools.length,
      totalQuantity,
      lowStock,
    };
  });

  // Calculate stats per type
  const typeStats = toolTypes
    .filter((t) => t.isActive)
    .map((type) => {
      const typeTools = tools.filter((t) => t.typeId === type.id);
      const totalQuantity = typeTools.reduce((acc, t) => acc + t.quantity, 0);
      return {
        ...type,
        toolCount: typeTools.length,
        totalQuantity,
      };
    });

  return (
    <div className="min-h-screen">
      <Header
        title="Relatorios"
        subtitle="Visualize e exporte relatorios do sistema"
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
                Relatorios do Sistema
              </p>
              <p className="text-xs text-muted-foreground">
                Gere relatorios de estoque, consumo, ferramentas em reforma e mais.
                Todos os dados podem ser exportados em CSV ou PDF.
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="stock" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="stock" className="gap-2">
              <Archive className="h-4 w-4" />
              Estoque
            </TabsTrigger>
            <TabsTrigger value="low-stock" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Estoque Minimo
            </TabsTrigger>
            <TabsTrigger value="reform" className="gap-2">
              <Wrench className="h-4 w-4" />
              Em Reforma
            </TabsTrigger>
            <TabsTrigger value="consumption" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Consumo
            </TabsTrigger>
          </TabsList>

          {/* Stock Report */}
          <TabsContent value="stock" className="space-y-6">
            {/* Filters */}
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex gap-4 items-end">
                    <div className="grid gap-2">
                      <Label>Armario</Label>
                      <Select value={selectedCabinet} onValueChange={setSelectedCabinet}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os armarios</SelectItem>
                          {cabinets.map((cabinet) => (
                            <SelectItem key={cabinet.id} value={cabinet.id}>
                              {cabinet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Printer className="mr-2 h-4 w-4" />
                      Imprimir
                    </Button>
                    <Button variant="outline">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </Button>
                    <Button>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock by Cabinet */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Estoque por Armario
                </CardTitle>
                <CardDescription>Resumo de estoque em cada armario</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead>Armario</TableHead>
                        <TableHead>Localizacao</TableHead>
                        <TableHead className="text-center">Tipos</TableHead>
                        <TableHead className="text-center">Quantidade Total</TableHead>
                        <TableHead className="text-center">Estoque Minimo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cabinetStats.map((cabinet) => (
                        <TableRow key={cabinet.id}>
                          <TableCell className="font-medium">{cabinet.name}</TableCell>
                          <TableCell className="text-muted-foreground">{cabinet.location}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{cabinet.toolTypes}</Badge>
                          </TableCell>
                          <TableCell className="text-center font-bold">{cabinet.totalQuantity}</TableCell>
                          <TableCell className="text-center">
                            {cabinet.lowStock > 0 ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {cabinet.lowStock}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">0</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Stock */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Estoque Detalhado
                </CardTitle>
                <CardDescription>
                  Lista completa de ferramentas
                  {selectedCabinet !== "all" && ` - ${getCabinetName(selectedCabinet)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                        <TableHead>Codigo</TableHead>
                        <TableHead>Descricao</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Armario</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead className="text-center">Min.</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTools.map((tool) => {
                        const status = getStatusInfo(tool.statusId);
                        const isLowStock = tool.quantity <= tool.minStock;
                        return (
                          <TableRow key={tool.id}>
                            <TableCell className="font-mono font-medium">{tool.code}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{tool.description}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{getTypeName(tool.typeId)}</Badge>
                            </TableCell>
                            <TableCell>{getCabinetName(tool.cabinetId)}</TableCell>
                            <TableCell className="text-center">
                              <span className={isLowStock ? "text-warning font-bold" : "font-medium"}>
                                {tool.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">{tool.minStock}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${getStatusColorClass(status.color)}`} />
                                <span className="text-sm">{status.name}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Low Stock Report */}
          <TabsContent value="low-stock" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Ferramentas Abaixo do Estoque Minimo
                  </CardTitle>
                  <CardDescription>
                    {lowStockTools.length} ferramenta(s) precisam de reposicao
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {lowStockTools.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma ferramenta abaixo do estoque minimo</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead>Codigo</TableHead>
                          <TableHead>Descricao</TableHead>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead className="text-center">Atual</TableHead>
                          <TableHead className="text-center">Minimo</TableHead>
                          <TableHead className="text-center">Falta</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lowStockTools.map((tool) => (
                          <TableRow key={tool.id}>
                            <TableCell className="font-mono font-medium">{tool.code}</TableCell>
                            <TableCell>{tool.description}</TableCell>
                            <TableCell className="text-muted-foreground">{tool.supplier}</TableCell>
                            <TableCell className="text-center text-warning font-bold">{tool.quantity}</TableCell>
                            <TableCell className="text-center">{tool.minStock}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="destructive">
                                {Math.max(0, tool.minStock - tool.quantity)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reform Report */}
          <TabsContent value="reform" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-warning" />
                    Ferramentas em Reforma
                  </CardTitle>
                  <CardDescription>
                    {inReformTools.length} ferramenta(s) em processo de reforma/afiacao
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {inReformTools.length === 0 ? (
                  <div className="text-center py-8">
                    <Wrench className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma ferramenta em reforma</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead>Codigo</TableHead>
                          <TableHead>Descricao</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-center">Quantidade</TableHead>
                          <TableHead>Observacoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inReformTools.map((tool) => (
                          <TableRow key={tool.id}>
                            <TableCell className="font-mono font-medium">{tool.code}</TableCell>
                            <TableCell>{tool.description}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{getTypeName(tool.typeId)}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold">{tool.quantity}</TableCell>
                            <TableCell className="text-muted-foreground">{tool.notes || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consumption Report */}
          <TabsContent value="consumption" className="space-y-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex gap-4 items-end">
                    <div className="grid gap-2">
                      <Label>Data Inicial</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="date"
                          className="pl-9 w-[180px]"
                          value={dateRange.from}
                          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Data Final</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="date"
                          className="pl-9 w-[180px]"
                          value={dateRange.to}
                          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button variant="secondary">Gerar Relatorio</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consumption by Type */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Consumo por Tipo de Ferramenta
                </CardTitle>
                <CardDescription>Distribuicao do estoque por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {typeStats.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Package className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{type.name}</p>
                        <p className="text-2xl font-bold">{type.totalQuantity}</p>
                        <p className="text-xs text-muted-foreground">{type.toolCount} item(ns)</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-lg bg-secondary text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Para visualizar o historico de consumo detalhado, selecione um periodo acima.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    O relatorio mostrara entradas, saidas e saldo por ferramenta no periodo selecionado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
