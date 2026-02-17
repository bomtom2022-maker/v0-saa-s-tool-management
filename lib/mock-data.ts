// Mock data for demonstration purposes only
// All data is fictional and serves as placeholders for the SaaS structure

export interface Cabinet {
  id: string;
  name: string;
  description: string;
  location: string;
  drawersCount: number;
  totalTools: number;
}

export interface Drawer {
  id: string;
  cabinetId: string;
  number: string;
  positions: string[];
}

export interface ToolType {
  id: string;
  name: string;
  description: string;
  customFields: CustomField[];
  isActive: boolean;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  required: boolean;
}

export interface ToolStatus {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface Tool {
  id: string;
  code: string;
  description: string;
  typeId: string;
  supplier: string;
  statusId: string;
  cabinetId: string;
  drawerId: string;
  position: string;
  quantity: number;
  minStock: number;
  notes: string;
  reformDate?: string; // ISO date string - next scheduled reform
}

export interface Movement {
  id: string;
  type: 'entry' | 'exit' | 'reform_send' | 'reform_return' | 'invoice';
  toolId: string;
  userId: string;
  quantity: number;
  date: string;
  notes: string;
  invoiceNumber?: string;
  supplier?: string;
}

// Placeholder cabinets
export const mockCabinets: Cabinet[] = [
  { id: '1', name: 'Armario Principal', description: 'Armario central de ferramentas', location: 'Galpao 1', drawersCount: 4, totalTools: 245 },
  { id: '2', name: 'Armario Reserva', description: 'Estoque de backup', location: 'Galpao 1', drawersCount: 3, totalTools: 89 },
  { id: '3', name: 'Armario Linha 2', description: 'Ferramentas da linha de producao 2', location: 'Galpao 2', drawersCount: 3, totalTools: 156 },
];

// Placeholder drawers
export const mockDrawers: Drawer[] = [
  // Armario Principal (id: 1)
  { id: 'd1', cabinetId: '1', number: '1', positions: ['A', 'B', 'C', 'D'] },
  { id: 'd2', cabinetId: '1', number: '2', positions: ['A', 'B', 'C', 'D'] },
  { id: 'd3', cabinetId: '1', number: '3', positions: ['A', 'B', 'C'] },
  { id: 'd4', cabinetId: '1', number: '4', positions: ['A', 'B', 'C', 'D', 'E'] },
  // Armario Reserva (id: 2)
  { id: 'd5', cabinetId: '2', number: '1', positions: ['A', 'B', 'C'] },
  { id: 'd6', cabinetId: '2', number: '2', positions: ['A', 'B'] },
  { id: 'd7', cabinetId: '2', number: '3', positions: ['A', 'B', 'C', 'D'] },
  // Armario Linha 2 (id: 3)
  { id: 'd8', cabinetId: '3', number: '1', positions: ['A', 'B', 'C', 'D'] },
  { id: 'd9', cabinetId: '3', number: '2', positions: ['A', 'B', 'C'] },
  { id: 'd10', cabinetId: '3', number: '3', positions: ['A', 'B'] },
];

// Placeholder tool types
export const mockToolTypes: ToolType[] = [
  { id: '1', name: 'Inserto', description: 'Insertos de metal duro', customFields: [], isActive: true },
  { id: '2', name: 'Broca', description: 'Brocas de aco rapido e metal duro', customFields: [], isActive: true },
  { id: '3', name: 'Fresa', description: 'Fresas de topo e esfericas', customFields: [], isActive: true },
  { id: '4', name: 'Macho', description: 'Machos para rosqueamento', customFields: [], isActive: true },
  { id: '5', name: 'Alargador', description: 'Alargadores de precisao', customFields: [], isActive: false },
];

// Placeholder statuses
export const mockStatuses: ToolStatus[] = [
  { id: '1', name: 'Em Estoque', color: 'bg-success', isActive: true },
  { id: '2', name: 'Em Uso', color: 'bg-chart-2', isActive: true },
  { id: '3', name: 'Em Reforma', color: 'bg-warning', isActive: true },
  { id: '4', name: 'Quebrada', color: 'bg-destructive', isActive: true },
  { id: '5', name: 'Descartada', color: 'bg-muted', isActive: false },
];

// Placeholder users
export const mockUsers: User[] = [
  { id: 'eng-processo-1', name: 'Engenharia de Processo', email: 'engenharia.processo@empresa.com', role: 'Administrador', isActive: true },
];

// Placeholder tools
export const mockTools: Tool[] = [
  { id: '1', code: 'INS-001', description: 'Inserto CNMG 120408', typeId: '1', supplier: 'Fornecedor A', statusId: '1', cabinetId: '1', drawerId: 'd1', position: 'A', quantity: 50, minStock: 20, notes: '' },
  { id: '2', code: 'BRO-001', description: 'Broca HSS 10mm', typeId: '2', supplier: 'Fornecedor B', statusId: '1', cabinetId: '1', drawerId: 'd1', position: 'B', quantity: 15, minStock: 5, notes: '' },
  { id: '3', code: 'INS-002', description: 'Inserto WNMG 080408', typeId: '1', supplier: 'Fornecedor A', statusId: '1', cabinetId: '1', drawerId: 'd1', position: 'C', quantity: 30, minStock: 15, notes: '' },
  { id: '4', code: 'BRO-002', description: 'Broca HSS 8mm', typeId: '2', supplier: 'Fornecedor B', statusId: '1', cabinetId: '1', drawerId: 'd2', position: 'A', quantity: 20, minStock: 10, notes: '' },
  { id: '5', code: 'BRO-003', description: 'Broca Metal Duro 6mm', typeId: '2', supplier: 'Fornecedor A', statusId: '2', cabinetId: '1', drawerId: 'd2', position: 'B', quantity: 8, minStock: 5, notes: '', reformDate: '2026-02-01' },
  { id: '6', code: 'FRE-001', description: 'Fresa Topo 12mm', typeId: '3', supplier: 'Fornecedor A', statusId: '1', cabinetId: '1', drawerId: 'd3', position: 'A', quantity: 12, minStock: 5, notes: '' },
  { id: '7', code: 'FRE-002', description: 'Fresa Esferica 8mm', typeId: '3', supplier: 'Fornecedor C', statusId: '1', cabinetId: '1', drawerId: 'd3', position: 'B', quantity: 6, minStock: 3, notes: '' },
  { id: '8', code: 'MAC-001', description: 'Macho M8x1.25', typeId: '4', supplier: 'Fornecedor C', statusId: '3', cabinetId: '1', drawerId: 'd4', position: 'A', quantity: 5, minStock: 10, notes: 'Em afiacao', reformDate: '2026-01-20' },
  { id: '9', code: 'MAC-002', description: 'Macho M10x1.5', typeId: '4', supplier: 'Fornecedor C', statusId: '1', cabinetId: '1', drawerId: 'd4', position: 'B', quantity: 10, minStock: 5, notes: '' },
  // Armario Reserva
  { id: '10', code: 'INS-003', description: 'Inserto DCMT 11T304', typeId: '1', supplier: 'Fornecedor A', statusId: '1', cabinetId: '2', drawerId: 'd5', position: 'A', quantity: 100, minStock: 50, notes: 'Estoque backup' },
  { id: '11', code: 'BRO-004', description: 'Broca HSS 12mm', typeId: '2', supplier: 'Fornecedor B', statusId: '1', cabinetId: '2', drawerId: 'd5', position: 'B', quantity: 25, minStock: 10, notes: '' },
  { id: '12', code: 'FRE-003', description: 'Fresa Topo 16mm', typeId: '3', supplier: 'Fornecedor A', statusId: '1', cabinetId: '2', drawerId: 'd6', position: 'A', quantity: 8, minStock: 4, notes: '' },
  // Armario Linha 2
  { id: '13', code: 'INS-004', description: 'Inserto SNMG 120408', typeId: '1', supplier: 'Fornecedor A', statusId: '1', cabinetId: '3', drawerId: 'd8', position: 'A', quantity: 45, minStock: 20, notes: '' },
  { id: '14', code: 'INS-005', description: 'Inserto TNMG 160408', typeId: '1', supplier: 'Fornecedor A', statusId: '2', cabinetId: '3', drawerId: 'd8', position: 'B', quantity: 35, minStock: 15, notes: '' },
  { id: '15', code: 'BRO-005', description: 'Broca Metal Duro 10mm', typeId: '2', supplier: 'Fornecedor B', statusId: '1', cabinetId: '3', drawerId: 'd9', position: 'A', quantity: 18, minStock: 8, notes: '' },
];

// Placeholder movements
export const mockMovements: Movement[] = [
  { id: '1', type: 'entry', toolId: '1', userId: '1', quantity: 100, date: '2024-01-15T10:30:00', notes: 'Entrada inicial', invoiceNumber: 'NF-12345', supplier: 'Fornecedor A' },
  { id: '2', type: 'exit', toolId: '1', userId: '4', quantity: 10, date: '2024-01-16T14:00:00', notes: 'Producao lote 2024-001' },
  { id: '3', type: 'reform_send', toolId: '4', userId: '2', quantity: 5, date: '2024-01-17T09:00:00', notes: 'Envio para afiacao' },
  { id: '4', type: 'invoice', toolId: '2', userId: '3', quantity: 30, date: '2024-01-18T11:00:00', notes: 'Reposicao estoque', invoiceNumber: 'NF-12350', supplier: 'Fornecedor B' },
];

// Permission profiles
export const mockProfiles = [
  { id: '1', name: 'Administrador', permissions: ['all', 'view', 'edit_tools', 'edit_cabinets', 'edit_types', 'move_stock', 'invoices', 'reform', 'reports', 'manage_users'] },
];
