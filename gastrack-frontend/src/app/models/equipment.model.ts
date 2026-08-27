import type { BadgeVariant } from './badge.types';

/**
 * Equipment condition enum with const assertion for type inference
 */
export const EQUIPMENT_CONDITION = {
  NEW: 'NEW',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  POOR: 'POOR',
  DAMAGED: 'DAMAGED',
  RETIRED: 'RETIRED',
} as const;

export type EquipmentCondition = (typeof EQUIPMENT_CONDITION)[keyof typeof EQUIPMENT_CONDITION];

/**
 * Type guard for EquipmentCondition validation
 */
export function isEquipmentCondition(value: unknown): value is EquipmentCondition {
  return (
    typeof value === 'string' &&
    Object.values(EQUIPMENT_CONDITION).includes(value as EquipmentCondition)
  );
}

/**
 * Labels for UI display
 */
export const EQUIPMENT_CONDITION_LABELS: Readonly<Record<EquipmentCondition, string>> = {
  NEW: 'Novo',
  GOOD: 'Bom',
  FAIR: 'Regular',
  POOR: 'Ruim',
  DAMAGED: 'Danificado',
  RETIRED: 'Aposentado',
};

/**
 * Badge variants for condition display
 */
export const EQUIPMENT_CONDITION_VARIANTS: Readonly<Record<EquipmentCondition, BadgeVariant>> = {
  NEW: 'success',
  GOOD: 'success',
  FAIR: 'default',
  POOR: 'warning',
  DAMAGED: 'destructive',
  RETIRED: 'destructive',
};

/**
 * Equipment entity from API
 */
export interface Equipment {
  readonly id: number;
  readonly equipmentKitId: number | null;
  readonly kitCode: string | null;
  readonly companyId: number | null;
  readonly companyName: string | null;
  readonly equipmentTypeId: number;
  readonly equipmentTypeName: string;
  readonly assetTag: string;
  readonly description: string | null;
  readonly serialNumber: string | null;
  readonly manufacturer: string | null;
  readonly model: string | null;
  readonly purchaseDate: string | null;
  readonly warrantyExpirationDate: string | null;
  readonly condition: EquipmentCondition;
  readonly notes: string | null;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdById: number;
  readonly createdByName: string;
}

/**
 * Helper to check if equipment is assigned to a kit
 */
export function isEquipmentAssigned(equipment: Equipment): boolean {
  return equipment.equipmentKitId !== null;
}

/**
 * Request payload for creating/updating equipment
 */
export interface EquipmentRequest {
  equipmentTypeId: number;
  assetTag: string;
  description?: string | null;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  purchaseDate?: string | null;
  warrantyExpirationDate?: string | null;
  condition: EquipmentCondition;
  notes?: string | null;
}

/**
 * Request for assigning equipment to a kit
 */
export interface EquipmentAssignRequest {
  kitId: number;
}

/**
 * Request for transferring equipment between kits
 */
export interface EquipmentTransferRequest {
  toKitId: number;
  notes?: string | null;
}

/**
 * Request for batch assigning equipment to a kit
 */
export interface EquipmentBatchAssignRequest {
  equipmentIds: number[];
  kitId: number;
}

/**
 * Error detail for a single equipment assignment failure
 */
export interface BatchAssignmentError {
  equipmentId: number;
  errorCode: string;
  message: string;
}

/**
 * Response from batch equipment assignment
 */
export interface EquipmentBatchAssignResponse {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  assigned: Equipment[];
  errors: BatchAssignmentError[];
}

/**
 * Equipment response from API (same as Equipment entity)
 */
export type EquipmentResponse = Equipment;

/**
 * Simplified equipment reference for use in other entities
 */
export interface EquipmentReference {
  readonly id: number;
  readonly assetTag: string;
  readonly equipmentTypeName: string;
}

/**
 * Sensor option for kit (ESP32 + port) selection when assigning sensors to ponto de gás
 */
export interface SensorOptionResponse {
  parentEquipmentId: number;
  parentSerial: string | null;
  parentAssetTag: string;
  sensorPort: number;
  codigoSensor: string;
  label: string;
  existingSensorId: number | null;
}
