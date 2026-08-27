import type { BadgeVariant } from './badge.types';

/**
 * Contract status enum with const assertion for type inference
 */
export const CONTRACT_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type ContractStatus = (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];

/**
 * Type guard for ContractStatus validation
 */
export function isContractStatus(value: unknown): value is ContractStatus {
  return (
    typeof value === 'string' && Object.values(CONTRACT_STATUS).includes(value as ContractStatus)
  );
}

/**
 * Retorna os endereços permitidos do contrato com o endereço informado garantidamente
 * presente, sem duplicar (preserva a ordem original e acrescenta ao final, se ausente).
 */
export function withAllowedAddress(
  allowedAddressIds: readonly number[],
  addressId: number,
): number[] {
  return Array.from(new Set([...allowedAddressIds, addressId]));
}

/**
 * Labels for UI display
 */
export const CONTRACT_STATUS_LABELS: Readonly<Record<ContractStatus, string>> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

/**
 * Badge variants for status display
 */
export const CONTRACT_STATUS_VARIANTS: Readonly<Record<ContractStatus, BadgeVariant>> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  EXPIRED: 'destructive',
  CANCELLED: 'destructive',
};

/**
 * Contract entity from API
 */
export interface Contract {
  readonly id: number;
  readonly companyId: number;
  readonly companyName: string;
  readonly contractNumber: string;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly kitQuantity: number;
  readonly allowedAddressIds: number[];
  readonly activeKitsCount: number;
  readonly remainingKitCapacity: number;
  readonly status: ContractStatus;
  readonly notes: string | null;
  readonly active: boolean;
  readonly addressIds: readonly number[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdById: number;
  readonly createdByName: string;
}

/**
 * Request payload for creating/updating a contract
 */
export interface ContractRequest {
  companyId: number;
  /** Endereços permitidos para kits (multi-select principal). */
  allowedAddressIds: number[];
  startDate: string;
  endDate?: string | null;
  kitQuantity: number;
  notes?: string | null;
  /** Endereços vinculados ao contrato (opcional). */
  addressIds?: number[] | null;
}

/**
 * Status update request
 */
export interface ContractStatusUpdateRequest {
  status: ContractStatus;
}

/**
 * Contract response from API (same as Contract entity)
 */
export type ContractResponse = Contract;

/**
 * Contract address DTO returned by the API
 */
export interface ContractAddress {
  readonly id: number;
  readonly name: string;
  readonly fullAddress: string;
  readonly active: boolean;
}

export interface ContractAddressesUpdateRequest {
  addressIds: number[];
}

/**
 * Simplified contract reference for use in other entities
 */
export interface ContractReference {
  readonly id: number;
  readonly contractNumber: string;
}
