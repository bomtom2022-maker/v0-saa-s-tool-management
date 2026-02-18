"use client";

import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Shield,
  Mail,
  Eye,
  Package,
  Settings2,
  ArrowRightLeft,
  FileText,
  Check,
  Lock,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const allPermissions = [
  { id: "view", name: "Visualizar", description: "Ver dados do sistema", category: "Geral" },
  { id: "edit_tools", name: "Editar Ferramentas", description: "Criar e editar cadastro de ferramentas", category: "Catalogo" },
  { id: "edit_cabinets", name: "Editar Armarios", description: "Configurar armarios e gavetas", category: "Configuracao" },
  { id: "edit_types", name: "Editar Tipos", description: "Gerenciar tipos de ferramentas", category: "Configuracao" },
  { id: "move_stock", name: "Movimentar Estoque", description: "Realizar entradas e saidas", category: "Operacoes" },
  { id: "invoices", name: "Notas Fiscais", description: "Registrar recebimento de NF", category: "Operacoes" },
  { id: "reform", name: "Reforma", description: "Enviar e receber ferramentas de reforma", category: "Operacoes" },
  { id: "reports", name: "Relatorios", description: "Gerar e exportar relatorios", category: "Relatorios" },
  { id: "manage_users", name: "Gerenciar Usuarios", description: "Criar e editar usuarios", category: "Administracao" },
];

function getCategoryIcon(category: string) {
  switch (category) {
    case "Catalogo":
      return <Package className="h-4 w-4" />;
    case "Configuracao":
      return <Settings2 className="h-4 w-4" />;
    case "Operacoes":
      return <ArrowRightLeft className="h-4 w-4" />;
    case "Relatorios":
      return <FileText className="h-4 w-4" />;
    case "Administracao":
      return <Shield className="h-4 w-4" />;
    default:
      return <Eye className="h-4 w-4" />;
  }
}

export default function UsersPage() {
  const { user, hasPermission } = useAuth();

  return (
    <div className="min-h-screen">
      <Header
        title="Usuario e Permissoes"
        subtitle="Visualize o usuario ativo e suas permissoes no sistema"
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Acesso Unico
              </p>
              <p className="text-xs text-muted-foreground">
                O sistema possui um unico usuario com acesso total. O login sera ativado futuramente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Usuario Ativo
            </CardTitle>
            <CardDescription>Dados do usuario com acesso ao sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 shrink-0">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{user?.name}</p>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Shield className="mr-1 h-3 w-3" />
                    {user?.role}
                  </Badge>
                  <Badge variant="outline" className="border-green-500/50 text-green-500">
                    Ativo
                  </Badge>
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    Acesso Total
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Permissoes
            </CardTitle>
            <CardDescription>Todas as permissoes habilitadas para este usuario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {["Geral", "Catalogo", "Configuracao", "Operacoes", "Relatorios", "Administracao"].map(
                (category) => {
                  const perms = allPermissions.filter((p) => p.category === category);
                  if (perms.length === 0) return null;
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-3">
                        {getCategoryIcon(category)}
                        <h4 className="text-sm font-semibold text-foreground">
                          {category}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {perms.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center gap-3 rounded-lg border border-border p-3 bg-secondary/30"
                          >
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 shrink-0">
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{permission.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
