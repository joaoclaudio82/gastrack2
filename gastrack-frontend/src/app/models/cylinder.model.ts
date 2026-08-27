import type { GasType } from './cylinder-model.model';

/**
 * Status de carga — vive no PONTO de gás (leitura combinada do manifold),
 * não no cilindro individual. Mantido aqui por ser o enum compartilhado
 * com o backend (`CylinderStatus`).
 */
export enum CylinderStatus {
  FULL = 'FULL',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
  CRITICAL = 'CRITICAL',
  EMPTY = 'EMPTY',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Cilindro = botijão físico. Carrega IDENTIDADE (serial) e os derivados do
 * modelo (tipo de gás, volume, capacidade, preço/m³). A leitura de
 * pressão/%/status NÃO é do cilindro — vive no PontoGas.
 * Alinha com CylinderResponse do backend (Fatia 2c).
 */
export interface Cylinder {
  id: number;
  serialNumber: string;
  cylinderModelId: number;
  companyId: number | null;
  companyName: string | null;
  pontoGasId: number | null;
  addressId: number | null;
  gasType: GasType;
  waterVolumeLiters: number;
  capacityBar: number;
  pricePerM3: number;
  /** Válvula aberta no manifold — só cilindro conectado entra no volume da linha. */
  connected: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CylinderRequest {
  cylinderModelId: number;
  companyId: number;
  pontoGasId?: number | null;
  addressId?: number | null;
  serialNumber: string;
  connected?: boolean;
}

export interface CylinderFilters {
  searchTerm: string;
  addressId: number | null;
  companyId?: number | null;
  /** Filtra os cascos de uma linha — usado ao chegar pelo card do ponto de gás. */
  pontoGasId?: number | null;
}
