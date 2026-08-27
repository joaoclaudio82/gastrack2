/**
 * Tipo de gás comprimido — espelha o enum `GasType` do backend.
 * Escopo: apenas gases comprimidos (pressão como proxy de carga; GLP fora).
 */
export enum GasType {
  O2 = 'O2',
  N2 = 'N2',
  CO2 = 'CO2',
  GN = 'GN',
  AR_COMP = 'AR_COMP',
}

export const GAS_TYPE_LABELS: Record<GasType, string> = {
  [GasType.O2]: 'O₂ (Oxigênio)',
  [GasType.N2]: 'N₂ (Nitrogênio)',
  [GasType.CO2]: 'CO₂ (Dióxido de carbono)',
  [GasType.GN]: 'GN (Gás natural)',
  [GasType.AR_COMP]: 'Ar comprimido',
};

export const GAS_TYPE_OPTIONS = Object.values(GasType).map((value) => ({
  label: GAS_TYPE_LABELS[value],
  value,
}));

/**
 * Catálogo de modelos de cilindro (tipo, não a unidade física).
 * Alinha com CylinderModelResponse do backend.
 */
export interface CylinderModel {
  id: number;
  codigo: string;
  gasType: GasType;
  waterVolumeLiters: number;
  capacityBar: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payload de criação/atualização — alinha com CylinderModelRequest do backend.
 */
export interface CylinderModelRequest {
  codigo: string;
  gasType: GasType;
  waterVolumeLiters: number;
  capacityBar: number;
  active?: boolean;
}

export type CylinderModelResponse = CylinderModel;
