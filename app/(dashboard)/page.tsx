"use client";

import { Header } from "@/components/dashboard/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Archive,
  AlertTriangle,
  Wrench,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";
import { useDataStore } from "@/lib/data-store";
import { PriceTag } from "@/components/dashboard/price-tag";
import { ToolCodeDisplay } from "@/components/dashboard/tool-code-display";

export default function DashboardPage() {
  const { cabinets, tools, movements, statuses } = useDataStore();


  // Calculate stats dynamically from live tools data
  const totalTools = tools.reduce((acc, t) => acc + t.quantity, 0);
  const totalValue = tools.reduce((acc, t) => acc + (t.unitValue || 0) * t.quantity, 0);
  const lowStockTools = tools.filter((t) => t.quantity <= t.minStock).length;

  // Calculate in-reform from movements (reform_send without matching reform_return)
  const reformSends = movements.filter(m => m.type === "reform_send");
  const reformReturns = movements.filter(m => m.type === "reform_return");
  const reformSendQty = reformSends.reduce((acc, m) => acc + m.quantity, 0);
  const reformReturnQty = reformReturns.reduce((acc, m) => acc + m.quantity, 0);
  const inReformCount = Math.max(0, reformSendQty - reformReturnQty);

  // Calculate tools per cabinet dynamically
  const toolsPerCabinet = (cabinetId: string) =>
    tools.filter((t) => t.cabinetId === cabinetId).reduce((acc, t) => acc + t.quantity, 0);

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Visao geral do sistema de gestao de ferramentas"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total de Ferramentas"
            value={totalTools}
            subtitle="Em todos os armarios"
            icon={Package}
          />
          <StatsCard
            title="Valor do Estoque"
            value={`R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            subtitle="Valor total das ferramentas"
            icon={DollarSign}
          />
          <StatsCard
            title="Armarios Ativos"
            value={cabinets.length}
            subtitle="Configurados no sistema"
            icon={Archive}
          />
          <StatsCard
            title="Estoque Minimo"
            value={lowStockTools}
            subtitle="Ferramentas abaixo do limite"
            icon={AlertTriangle}
            className={lowStockTools > 0 ? "border-warning/50" : ""}
          />
          <StatsCard
            title="Em Reforma"
            value={inReformCount}
            subtitle={`${reformSends.length} envios registrados`}
            icon={Wrench}
          />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Movimentacoes Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements.slice(0, 5).map((movement) => {
                  const tool = tools.find((t) => t.id === movement.toolId);
                  const isEntry =
                    movement.type === "entry" || movement.type === "invoice" || movement.type === "reform_return";
                  
                  return (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isEntry ? "bg-success/10" : "bg-destructive/10"
                          }`}
                        >
                          {isEntry ? (
                            <ArrowDownRight className="h-4 w-4 text-success" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-medium text-foreground">
                              {tool?.code ? <ToolCodeDisplay code={tool.code} className="font-medium" /> : "Ferramenta"}{" - "}{tool?.description || "Descricao"}
                            </p>
                            <PriceTag value={tool?.unitValue} reformValue={tool?.reformUnitValue} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {movement.notes}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            isEntry ? "text-success" : "text-destructive"
                          }`}
                        >
                          {isEntry ? "+" : "-"}{movement.quantity} un.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(movement.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Cabinet Overview */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Archive className="h-5 w-5 text-primary" />
                Armarios do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cabinets.map((cabinet) => (
                  <div
                    key={cabinet.id}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {cabinet.name}
                        </p>
                        {cabinet.isReformOnly && (
                          <span className="inline-flex items-center rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-medium text-sky-400 border border-sky-500/30">
                            Reformadas
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cabinet.location} - {cabinet.drawersCount} gavetas
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {toolsPerCabinet(cabinet.id)}
                      </p>
                      <p className="text-xs text-muted-foreground">ferramentas</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Overview */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Status das Ferramentas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {statuses
                  .filter((s) => s.isActive)
                  .map((status) => {
                    const count = tools.filter(
                      (t) => t.statusId === status.id
                    ).length;
                    return (
                      <div
                        key={status.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-4"
                      >
                        <div className={`h-3 w-3 rounded-full ${status.color}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {status.name}
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {count}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
}
