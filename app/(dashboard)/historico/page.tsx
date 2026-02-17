"use client";

import { useState } from "react";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  History,
  Search,
  Filter,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  Wrench,
  FileText,
  RotateCcw,
  Calendar,
  User,
  Package,
  Archive,
} from "lucide-react";
import { type Movement } from "@/lib/mock-data";
import { useDataStore } from "@/lib/data-store";

// Extended mock movements for history display
const extraMovements: Movement[] = [
  { id: "5", type: "exit", toolId: "2", userId: "4", quantity: 5, date: "2024-01-19T08:30:00", notes: "Producao lote 2024-005" },
  { id: "6", type: "entry", toolId: "3", userId: "1", quantity: 20, date: "2024-01-19T14:00:00", notes: "Reposicao", invoiceNumber: "NF-12355", supplier: "Fornecedor A" },
  { id: "7", type: "reform_return", toolId: "4", userId: "2", quantity: 4, date: "2024-01-20T09:00:00", notes: "Retorno afiacao - 1 perdida" },
  { id: "8", type: "exit", toolId: "1", userId: "4", quantity: 15, date: "2024-01-20T11:30:00", notes: "Producao lote 2024-006" },
];

export default function HistoryPage() {
  const { movements: storeMovements, tools, users, cabinets } = useDataStore();
  const extendedMovements = [...storeMovements, ...extraMovements];
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const getMovementType = (type: Movement["type"]) => {
    const types = {
      entry: { label: "Entrada", icon: ArrowDownRight, color: "text-success", bg: "bg-success/10" },
      exit: { label: "Saida", icon: ArrowUpRight, color: "text-destructive", bg: "bg-destructive/10" },
      reform_send: { label: "Envio Reforma", icon: Wrench, color: "text-warning", bg: "bg-warning/10" },
      reform_return: { label: "Retorno Reforma", icon: RotateCcw, color: "text-primary", bg: "bg-primary/10" },
      invoice: { label: "Nota Fiscal", icon: FileText, color: "text-chart-2", bg: "bg-chart-2/10" },
    };
    return types[type];
  };

  const getTool = (toolId: string) => tools.find((t) => t.id === toolId);
  const getUser = (userId: string) => users.find((u) => u.id === userId);
  const getCabinet = (cabinetId: string) => cabinets.find((c) => c.id === cabinetId);

  const filteredMovements = extendedMovements
    .filter((movement) => {
      const tool = getTool(movement.toolId);
      const matchesSearch =
        !searchTerm ||
        tool?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tool?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.notes.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || movement.type === filterType;
      const matchesUser = filterUser === "all" || movement.userId === filterUser;
      const movementDate = new Date(movement.date);
      const matchesDateFrom = !dateFrom || movementDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || movementDate <= new Date(dateTo + "T23:59:59");
      return matchesSearch && matchesType && matchesUser && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterUser("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Historico e Auditoria"
        subtitle="Registro de todas as movimentacoes do sistema"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Historico de Movimentacoes
              </p>
              <p className="text-xs text-muted-foreground">
                Todas as movimentacoes sao registradas com usuario, data/hora, tipo e quantidade.
                Use os filtros para localizar movimentacoes especificas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2 grid gap-2">
                <Label>Busca</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Codigo, descricao ou observacao..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="entry">Entrada</SelectItem>
                    <SelectItem value="exit">Saida</SelectItem>
                    <SelectItem value="invoice">Nota Fiscal</SelectItem>
                    <SelectItem value="reform_send">Envio Reforma</SelectItem>
                    <SelectItem value="reform_return">Retorno Reforma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Usuario</Label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Periodo</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              <Button variant="secondary">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Movements Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registro de Movimentacoes</CardTitle>
                <CardDescription>
                  {filteredMovements.length} registro(s) encontrado(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead>Armario</TableHead>
                    <TableHead className="text-center">Qtd.</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Observacoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Nenhuma movimentacao encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.map((movement) => {
                      const tool = getTool(movement.toolId);
                      const user = getUser(movement.userId);
                      const cabinet = tool ? getCabinet(tool.cabinetId) : null;
                      const typeInfo = getMovementType(movement.type);
                      const TypeIcon = typeInfo.icon;
                      const isPositive = movement.type === "entry" || movement.type === "invoice" || movement.type === "reform_return";

                      return (
                        <TableRow key={movement.id} className="hover:bg-secondary/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm">
                                  {new Date(movement.date).toLocaleDateString("pt-BR")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(movement.date).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeInfo.bg}`}>
                                <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                              </div>
                              <span className="text-sm font-medium">{typeInfo.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-mono text-sm font-medium">{tool?.code}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {tool?.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Archive className="h-4 w-4 text-muted-foreground" />
                              {cabinet?.name || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                              {isPositive ? "+" : "-"}{movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{user?.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              <p className="text-sm truncate">{movement.notes}</p>
                              {movement.invoiceNumber && (
                                <Badge variant="outline" className="mt-1">
                                  {movement.invoiceNumber}
                                </Badge>
                              )}
                            </div>
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

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <ArrowDownRight className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entradas</p>
                  <p className="text-xl font-bold">
                    {extendedMovements.filter((m) => m.type === "entry" || m.type === "invoice").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <ArrowUpRight className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saidas</p>
                  <p className="text-xl font-bold">
                    {extendedMovements.filter((m) => m.type === "exit").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Wrench className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reformas</p>
                  <p className="text-xl font-bold">
                    {extendedMovements.filter((m) => m.type === "reform_send" || m.type === "reform_return").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <FileText className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notas Fiscais</p>
                  <p className="text-xl font-bold">
                    {extendedMovements.filter((m) => m.type === "invoice").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
