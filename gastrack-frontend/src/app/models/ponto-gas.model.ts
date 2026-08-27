import type { GasType } from './cylinder-model.model';
import type { CylinderStatus } from './cylinder.model';

export interface PontoGasEquipment {
  id: number;
  assetTag: string;
  equipmentTypeName: string;
  serialNumber: string | null;
  codigoSensor: string | null;
  sensorPort: number | null;
  parentSerial: string | null;
  active: boolean;
}

/**
 * Ponto de Gás (Gas Point) entity
 * Alinha com PontoGasResponse do backend
 */
/**
 * Faixas de nível (% de enchimento) definidas no servidor.
 * Alinha com PontoGasResponse.ThresholdsView.
 */
export interface LevelThresholds {
  critical: number;
  low: number;
  normal: number;
}

/**
 * Casco do manifold, como aparece sob a linha.
 * Alinha com PontoGasResponse.CylinderView.
 */
export interface LineCylinder {
  id: number;
  serialNumber: string;
  modelCodigo: string | null;
  gasType: GasType | null;
  waterVolumeLiters: number | null;
  capacityBar: number | null;
  /** Fechado = reserva; fica de fora da soma de volume da linha. */
  connected: boolean;
}

export interface PontoGas {
  id: number;
  addressId: number;
  addressName: string;
  location: string;
  /** Soma do volume dos cascos conectados. Nulo quando a linha não tem casco. */
  effectiveCapacityLiters: number | null;
  /** Menor pressão nominal entre os cascos conectados. Nulo quando não há casco. */
  effectiveFullTankPressureBar: number | null;
  thresholds: LevelThresholds;
  /** Cascos do manifold — inclui os fechados, que a UI mostra em cinza. */
  cylinders: LineCylinder[];
  /** Gás disponível em m³ (volume × pressão ÷ 1000). Nulo sem leitura. */
  availableCubicMeters: number | null;
  /** Nível em % (pressão ÷ pressão de cheio). Nulo sem leitura. */
  fillPercentage: number | null;
  gasType: GasType | null;
  currentPressureBar: number | null;
  lastReadingAt: string | null;
  status: CylinderStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  equipments: PontoGasEquipment[];
}

/**
 * ID do tipo de equipamento ESP32 (backend: 351)
 */
export const ESP32_EQUIPMENT_TYPE_ID = 351;

/**
 * Atribuição de (ESP32, porta) para criar/associar um Sensor ao ponto.
 * Alinha com SensorAssignment do backend.
 */
export interface SensorAssignment {
  parentEquipmentId: number;
  sensorPort: number;
}

/**
 * Payload para criação/atualização de Ponto de Gás
 * Alinha com PontoGasRequest do backend.
 */
export interface PontoGasRequest {
  addressId: number;
  location: string;
  sensorEquipmentIds?: number[] | null;
  sensorsToAdd?: SensorAssignment[] | null;
}

/**
 * Resposta da API para Ponto de Gás (igual à entidade)
 */
export type PontoGasResponse = PontoGas;
