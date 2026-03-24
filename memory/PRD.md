# TMS One - Sistema de Gestão de Ferramentas CNC

## Visão Geral
Sistema SaaS para gestão de ferramentas de corte em usinagem CNC, desenvolvido em Next.js 16 com TypeScript.

## Arquitetura

### Stack Tecnológica
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS 4, Radix UI, Lucide Icons, Recharts
- **Formulários**: React Hook Form + Zod
- **Estado**: Context API (DataStore), SessionStorage para persistência
- **Deployment Original**: Vercel (v0.app)

### Estrutura de Pastas
```
/app/frontend/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Layout do dashboard
│   │   ├── catalogo/       # Catálogo de ferramentas
│   │   ├── configuracao/   # Configurações (armários, tipos, status, etc.)
│   │   ├── historico/      # Histórico de movimentações
│   │   ├── operacoes/      # Operações (entrada, reforma, envio)
│   │   └── relatorios/     # Relatórios
│   └── globals.css         # Estilos globais (tema dark)
├── components/             # Componentes React
│   ├── dashboard/          # Componentes do dashboard
│   └── ui/                 # Componentes UI (shadcn/radix)
├── lib/                    # Lógica core
│   ├── auth.tsx            # Sistema de autenticação
│   ├── data-store.tsx      # Estado global e persistência
│   ├── mock-data.ts        # Dados mock e interfaces TypeScript
│   ├── notifications.tsx   # Sistema de notificações
│   └── utils.ts            # Utilitários
└── hooks/                  # Custom hooks
```

## Módulos e Funcionalidades

### 1. Dashboard (/)
- KPIs: Total ferramentas, valor estoque, armários ativos, estoque mínimo, em reforma
- Movimentações recentes
- Visão geral de armários
- Status das ferramentas

### 2. Catálogo (/catalogo)
- CRUD completo de ferramentas
- Busca e filtros por tipo/status
- Seleção cascata: Armário → Gaveta → Posição
- Ajuste rápido de quantidade (entrada/saída)
- Tags de preço (novo vs reforma)
- Código com sufixo "R" para ferramentas reformadas

### 3. Configurações (/configuracao)
- **Armários**: Gestão de armários (normais e de reforma A-R/B-R)
- **Gavetas**: Posições por gaveta
- **Tipos**: Tipos de ferramenta (Inserto, Broca, Fresa, Macho, etc.)
- **Status**: Estados (Em Estoque, Em Uso, Em Reforma, Quebrada)
- **Fornecedores**: Cadastro com CNPJ, contato, telefone, email
- **Usuários**: Gestão de usuários e perfis

### 4. Operações (/operacoes)

#### 4.1 Entrada (/operacoes/entrada)
- **Retorno de Reforma**: Recebe ferramentas reformadas
  - Busca ferramentas com reforma pendente
  - Transforma código (ex: INS-001 → INS-001R)
  - Destino automático para armário de reformadas
  - Baixa na NF de envio
- **Ferramenta Nova**: Entrada de unidades novas
  - Registro com NF
  - Atualiza estoque existente

#### 4.2 Fila de Reforma (/operacoes/reforma)
- **Fila de Envio**: Adiciona ferramentas à fila
  - Seleção de fornecedor
  - Consolidação automática por ferramenta+fornecedor
  - Preview do código pós-reforma (sufixo R)
- **Em Reforma**: Acompanhamento
  - KPIs: Total, Aguardando, Atrasadas, Retornadas
  - Filtros por status e fornecedor
  - Detalhes completos de cada envio

#### 4.3 Enviar para Reforma (/operacoes/enviar-reforma)
- Seleção de itens da fila
- Validação: não permite múltiplos fornecedores
- Dados do envio: NF, Romaneio, Data retorno estimado
- Confirmação com lista detalhada

### 5. Histórico (/historico)
- Todas as movimentações registradas
- Filtros e busca

### 6. Relatórios (/relatorios)
- Exportação PDF/Excel
- Gráficos e análises

## Interfaces TypeScript Principais

```typescript
interface Tool {
  id: string;
  code: string;              // Código interno (sufixo R = reformada)
  description: string;
  typeId: string;
  supplier: string;
  statusId: string;
  cabinetId: string;
  drawerId: string;
  position: string;
  quantity: number;
  minStock: number;
  unitValue?: number;        // Preço nova
  reformUnitValue?: number;  // Preço reforma
  reformDate?: string;
  reformCount?: number;
}

interface Movement {
  id: string;
  type: 'entry' | 'exit' | 'reform_send' | 'reform_return' | 'invoice';
  toolId: string;
  userId: string;
  quantity: number;
  date: string;
  notes: string;
  invoiceNumber?: string;
  packingListNumber?: string;
  supplier?: string;
  estimatedReturn?: string;
  actualReturnDate?: string;
}

interface ReformQueueItem {
  id: string;
  toolId: string;
  quantity: number;
  supplierId: string;
  supplierName: string;
  notes: string;
  addedAt: string;
  addedBy: string;
}
```

## Fluxo de Reforma

1. **Adicionar à Fila** (Reforma → Fila de Envio)
   - Seleciona ferramenta + fornecedor + quantidade
   - Vai para fila de envio

2. **Enviar** (Enviar para Reforma)
   - Seleciona itens da fila
   - Preenche NF, romaneio, data retorno
   - Cria movement `reform_send`
   - Remove da fila

3. **Retornar** (Entrada → Retorno de Reforma)
   - Seleciona ferramenta com reforma pendente
   - Transforma código para sufixo "R"
   - Cria movement `reform_return`
   - Ferramenta vai para armário A-R ou B-R

## Git
- **Repositório**: https://github.com/bomtom2022-maker/v0-saa-s-tool-management
- **Branch**: main
- **Remote**: origin

## Status
- ✅ Clonado e configurado no ambiente Emergent
- ✅ Build Next.js realizado
- ✅ Frontend rodando na porta 3000
- ✅ Git intacto para push futuro

## Próximos Passos Sugeridos
- [ ] Integrar com banco de dados real (MongoDB)
- [ ] Implementar autenticação real
- [ ] APIs backend para persistência
- [ ] Relatórios com gráficos Recharts
- [ ] Importação/Exportação CSV/Excel
