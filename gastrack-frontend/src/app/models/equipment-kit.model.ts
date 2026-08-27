import type { BadgeVariant } from './badge.types';
import type { GasType } from './cylinder-model.model';
import type { CylinderStatus } from './cylinder.model';

/**
 * Kit status enum with const assertion for type inference
 */
export const KIT_STATUS = {
  PENDING: 'PENDING',
  INSTALLED: 'INSTALLED',
  MAINTENANCE: 'MAINTENANCE',
  REMOVED: 'REMOVED',
  DECOMMISSIONED: 'DECOMMISSIONED',
} as const;

export type KitStatus = (typeof KIT_STATUS)[keyof typeof KIT_STATUS];

/**
 * Type guard for KitStatus validation
 */
export function isKitStatus(value: unknown): value is KitStatus {
  return typeof value === 'string' && Object.values(KIT_STATUS).includes(value as KitStatus);
}

/**
 * Labels for UI display
 */
export const KIT_STATUS_LABELS: Readonly<Record<KitStatus, string>> = {
  PENDING: 'Pendente',
  INSTALLED: 'Instalado',
  MAINTENANCE: 'Em Manutenção',
  REMOVED: 'Removido',
  DECOMMISSIONED: 'Descomissionado',
};

/**
 * Badge variants for status display
 */
export const KIT_STATUS_VARIANTS: Readonly<Record<KitStatus, BadgeVariant>> = {
  PENDING: 'default',
  INSTALLED: 'success',
  MAINTENANCE: 'warning',
  REMOVED: 'destructive',
  DECOMMISSIONED: 'destructive',
};

/**
 * Cilindro visível no detalhe do kit (derivado via kit → sensor → ponto → cilindros).
 * Alinha com KitCylinderView do backend (Fatia 3). A leitura de pressão/status
 * vive no PONTO — aqui é só a projeção por cilindro.
 */
export interface KitCylinderView {
  readonly cylinderId: number;
  readonly serialNumber: string;
  readonly gasType: GasType;
  readonly pontoGasName: string | null;
  readonly currentPressureBar: number | null;
  readonly status: CylinderStatus;
}

/**
 * Equipment Kit entity from API
 */
export interface EquipmentKit {
  readonly id: number;
  readonly contractId: number;
  readonly contractNumber: string;
  readonly companyId: number;
  readonly companyName: string;
  readonly addressId: number;
  readonly addressName: string;
  readonly kitCode: string;
  readonly installationDate: string | null;
  readonly status: KitStatus;
  readonly notes: string | null;
  readonly equipmentCount: number;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdById: number;
  readonly createdByName: string;
  /** Presente apenas no detalhe (GET /equipment-kits/{id}). */
  readonly cylinders?: readonly KitCylinderView[];
}

/**
 * Request payload for creating/updating an equipment kit
 */
export interface EquipmentKitRequest {
  contractId: number;
  addressId: number;
  kitCode: string;
  installationDate?: string | null;
  notes?: string | null;
}

/**
 * Status update request
 */
export interface EquipmentKitStatusUpdateRequest {
  status: KitStatus;
}

/**
 * Equipment Kit response from API (same as EquipmentKit entity)
 */
export type EquipmentKitResponse = EquipmentKit;

/**
 * Simplified kit reference for use in other entities
 */
export interface EquipmentKitReference {
  readonly id: number;
  readonly kitCode: string;
}

/**
 * Request for installing a kit at an address
 */
export interface KitInstallRequest {
  addressId: number;
  installationDate?: string | null;
  notes?: string | null;
}

/**
 * Request for uninstalling a kit
 */
export interface KitUninstallRequest {
  uninstallationDate?: string | null;
  reason?: string | null;
  notes?: string | null;
}

/**
 * Request for swapping the kit's ESP32 gateway (maintenance). The replacement is an unassigned
 * ESP32; the backend re-points every sensor's codigoSensor to the new serial.
 */
export interface SwapEspRequest {
  newEspEquipmentId: number;
  /** true = aposentar o ESP atual (defeito). false = devolver ao estoque (reusável). */
  retireOldEsp?: boolean;
  notes?: string | null;
}

/**
 * Request for swapping a single sensor of the kit (maintenance). The replacement takes over the
 * same ESP port, gas point and codigoSensor.
 */
export interface SwapSensorRequest {
  oldSensorEquipmentId: number;
  newSensorEquipmentId: number;
  /** true = aposentar o sensor atual (defeito). false = devolver ao estoque (reusável). */
  retireOldSensor?: boolean;
  notes?: string | null;
}

/**
 * Helper to check if kit can be installed
 */
export function canInstallKit(status: KitStatus): boolean {
  return status === KIT_STATUS.PENDING || status === KIT_STATUS.REMOVED;
}

/**
 * Helper to check if kit can be uninstalled
 */
export function canUninstallKit(status: KitStatus): boolean {
  return status === KIT_STATUS.INSTALLED || status === KIT_STATUS.MAINTENANCE;
}
