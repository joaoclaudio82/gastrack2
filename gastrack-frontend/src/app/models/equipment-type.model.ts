import type { SelectOption } from './api-response.model';

/**
 * Equipment Type entity from API
 */
export interface EquipmentType {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly active: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Request payload for creating/updating an equipment type
 */
export interface EquipmentTypeRequest {
  name: string;
  description?: string | null;
}

/**
 * Equipment Type response from API (same as EquipmentType entity)
 */
export type EquipmentTypeResponse = EquipmentType;

/**
 * Helper function to transform EquipmentType to SelectOption
 */
export function equipmentTypeToOption(type: EquipmentType): SelectOption {
  return {
    label: type.name,
    value: type.id,
    disabled: !type.active,
  };
}

/**
 * Simplified equipment type reference for use in other entities
 */
export interface EquipmentTypeReference {
  readonly id: number;
  readonly name: string;
}
