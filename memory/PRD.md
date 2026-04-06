# TMS One - Sistema de Gestão de Ferramentas CNC

## Problema Original
Clone e configurar o repositório: https://github.com/bomtom2022-maker/v0-saa-s-tool-management
- Aplicação SaaS Tool Management construída com Next.js/TypeScript
- Criar módulo 'Reporte de Quebra de Turno'
- Migrar estrutura de mock data para banco Supabase PostgreSQL
- Corrigir bugs de UI relacionados a gavetas, posições e formulários
- Recriar "Armário Insertos" com ferramentas baseadas em Excel do usuário

## Arquitetura

### Stack Tecnológica
- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Estilização**: Tailwind CSS 4 + shadcn/ui
- **Banco de Dados**: Supabase PostgreSQL (externo)
- **Estado**: Context API (DataStore pattern com fallback para mock)

### Estrutura de Diretórios
```
/app/frontend/
├── app/(dashboard)/     # Rotas autenticadas
│   ├── catalogo/        # Catálogo de ferramentas
│   ├── configuracao/    # Armários, Tipos, Status, Fornecedores
│   ├── operacoes/       # Entrada e Reforma
│   ├── historico/       # Histórico de movimentações
│   ├── relatorios/      # Relatórios
│   └── quebras/         # Reporte de Quebra de Turno
├── components/          # Componentes UI (shadcn)
├── database/            # SQL schemas e seeds
├── lib/
│   ├── data-store.tsx   # Context API global (Supabase)
│   ├── supabase.ts      # Cliente Supabase
│   ├── supabase-api.ts  # Funções API Supabase
│   └── mock-data.ts     # Fallback local
```

### Schema do Banco (Supabase)
- `tools`: Ferramentas (code, description, type_id, status_id, supplier_id, cabinet_id, drawer_id, position, quantity, min_stock)
- `cabinets`: Armários (name, location, is_reform_cabinet)
- `drawers`: Gavetas (cabinet_id, code, name, positions)
- `tool_types`: Tipos de ferramenta (code, name)
- `tool_statuses`: Status (code, name, color)
- `suppliers`: Fornecedores (name, code)
- `movements`: Movimentações de estoque
- `break_reports` / `break_report_items`: Relatórios de quebra

## O Que Foi Implementado

### Data: 06/04/2026

#### Funcionalidades Core
- ✅ Página `/quebras` (Reporte de Quebra de Turno) com exportação CSV
- ✅ Integração completa com Supabase PostgreSQL
- ✅ Schema SQL completo (`/app/frontend/database/schema.sql`)
- ✅ DataStore Context migrando de mock para Supabase
- ✅ Sidebar reestruturado com categorias fechadas por padrão

#### Bugs Corrigidos
- ✅ Páginas `/configuracao/tipos` e `/configuracao/armarios` não abriam
- ✅ Sobreposição de texto nas gavetas e posições
- ✅ Dropdown cascata (Armário -> Gaveta -> Posição)
- ✅ Criação de ferramentas falhava (INSERT vs UPDATE)

#### Dados Importados (Excel do Usuário)
- ✅ **Armário Insertos**: 19 gavetas, 82 ferramentas, 1.897 peças
  - Gavetas 1-6 (G1-G6): 27 ferramentas
  - Gavetas 7-19: 55 ferramentas
- ✅ **Armário Brocas**: 30 gavetas (33-62), 109 ferramentas, 682 peças
  - Brocas, alargadores, escareadores, fresas
- ✅ **24 fornecedores** cadastrados:
  - SUMITOMO, TUNGALOY, SANDVIK, MARKVISION, KENNAMETAL, BIGTOOLS
  - MAPAL, DIAMANPAR, HANNA, QUALITEC, CONTINENTAL FERRAMENTAS
  - SECO, REANTOOLS, SULVIDIAS, AFIASANT, GUHRING, NIPO-TEC
  - OSG, WMTOOLS, WALTER, GUHRING/WALTER
- ✅ **Total Geral**: 192 ferramentas, 2.629 peças em estoque

## Backlog Priorizado

### P0 - Alta Prioridade
- [ ] **Sistema de Autenticação/Login** - Usuário solicitou login para cada pessoa reportar via sua página específica

### P1 - Média Prioridade
- [ ] Implementar upload de logo da empresa funcional
- [ ] Melhorar validação de formulários

### P2 - Baixa Prioridade
- [ ] Relatórios avançados com gráficos
- [ ] Exportação de dados em mais formatos
- [ ] Notificações push para estoque baixo

## Credenciais e Configuração

### Supabase
- URL: `https://ssokcnqpegurvdrdkmcw.supabase.co`
- Anon Key: Configurado em `/app/frontend/.env`
- Service Role Key: Configurado em `/app/frontend/.env`

### Variáveis de Ambiente
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Arquivos Importantes
- `/app/frontend/database/schema.sql` - Schema completo
- `/app/frontend/database/seed-tools-part2.sql` - Seed das ferramentas
- `/app/frontend/lib/data-store.tsx` - Context API principal
- `/app/frontend/lib/supabase-api.ts` - Funções de API

## Notas Técnicas
- App usa Supabase diretamente do frontend (sem backend FastAPI)
- Fallback para mock-data.ts se conexão Supabase falhar
- Hot reload habilitado via yarn dev
