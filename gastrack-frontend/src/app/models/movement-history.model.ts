/**
 * Movement operation enum with const assertion for type inference
 */
export const MOVEMENT_OPERATION = {
  // Equipment operations
  CREATED: 'CREATED',
  ASSIGNED_TO_KIT: 'ASSIGNED_TO_KIT',
  REMOVED_FROM_KIT: 'REMOVED_FROM_KIT',
  TRANSFERRED: 'TRANSFERRED',
  CONDITION_CHANGED: 'CONDITION_CHANGED',
  DEACTIVATED: 'DEACTIVATED',
  REACTIVATED: 'REACTIVATED',
  // Kit operations
  KIT_CREATED: 'KIT_CREATED',
  KIT_INSTALLED: 'KIT_INSTALLED',
  KIT_MAINTENANCE_START: 'KIT_MAINTENANCE_START',
  KIT_MAINTENANCE_END: 'KIT_MAINTENANCE_END',
  KIT_REMOVED: 'KIT_REMOVED',
  KIT_DECOMMISSIONED: 'KIT_DECOMMISSIONED',
} as const;

export type MovementOperation = (typeof MOVEMENT_OPERATION)[keyof typeof MOVEMENT_OPERATION];

/**
 * Type guard for MovementOperation validation
 */
export function isMovementOperation(value: unknown): value is MovementOperation {
  return (
    typeof value === 'string' &&
    Object.values(MOVEMENT_OPERATION).includes(value as MovementOperation)
  );
}

/**
 * Labels for UI display
 */
export const MOVEMENT_OPERATION_LABELS: Readonly<Record<MovementOperation, string>> = {
  CREATED: 'Equipamento criado',
  ASSIGNED_TO_KIT: 'Atribuído ao kit',
  REMOVED_FROM_KIT: 'Removido do kit',
  TRANSFERRED: 'Transferido',
  CONDITION_CHANGED: 'Condição alterada',
  DEACTIVATED: 'Desativado',
  REACTIVATED: 'Reativado',
  KIT_CREATED: 'Kit criado',
  KIT_INSTALLED: 'Kit instalado',
  KIT_MAINTENANCE_START: 'Manutenção iniciada',
  KIT_MAINTENANCE_END: 'Manutenção finalizada',
  KIT_REMOVED: 'Kit removido',
  KIT_DECOMMISSIONED: 'Kit descomissionado',
};

/**
 * Icons for timeline display (Lucide icon names)
 */
export const MOVEMENT_OPERATION_ICONS: Readonly<Record<MovementOperation, string>> = {
  CREATED: 'plus-circle',
  ASSIGNED_TO_KIT: 'link',
  REMOVED_FROM_KIT: 'unlink',
  TRANSFERRED: 'arrow-right-left',
  CONDITION_CHANGED: 'settings',
  DEACTIVATED: 'x-circle',
  REACTIVATED: 'check-circle',
  KIT_CREATED: 'package-plus',
  KIT_INSTALLED: 'check-square',
  KIT_MAINTENANCE_START: 'wrench',
  KIT_MAINTENANCE_END: 'check',
  KIT_REMOVED: 'package-minus',
  KIT_DECOMMISSIONED: 'trash-2',
};

/**
 * Movement History entity from API
 */
export interface MovementHistory {
  readonly id: number;
  readonly equipmentId: number | null;
  readonly equipmentAssetTag: string | null;
  readonly equipmentKitId: number | null;
  readonly kitCode: string | null;
  readonly userId: number;
  readonly userName: string;
  readonly operation: MovementOperation;
  readonly operationAt: string;
  readonly fromKitId: number | null;
  readonly fromKitCode: string | null;
  readonly toKitId: number | null;
  readonly toKitCode: string | null;
  readonly notes: string | null;
}

/**
 * Check if the operation is an equipment operation
 */
export function isEquipmentOperation(operation: MovementOperation): boolean {
  return !operation.startsWith('KIT_');
}

/**
 * Check if the operation is a kit operation
 */
export function isKitOperation(operation: MovementOperation): boolean {
  return operation.startsWith('KIT_');
}
