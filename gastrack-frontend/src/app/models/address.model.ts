/**
 * Address entity for company locations
 */
export interface Address {
  id: number;
  companyId: number;
  companyName: string;
  name: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  cityId: number;
  cityName: string;
  stateId: number;
  stateName: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  fullAddress: string;
  active: boolean;
  createdAt: string;
}
//Teste branch
/**
 * Request payload for creating/updating an address
 * Note: companyId is optional - if not provided, backend extracts from JWT token
 * Super admins can provide companyId to create addresses for other companies
 */
export interface AddressRequest {
  companyId?: number;
  name: string;
  street: string;
  number?: string | undefined;
  complement?: string | undefined;
  neighborhood?: string | undefined;
  cityId: number;
  zipCode: string;
  latitude?: number | undefined;
  longitude?: number | undefined;
  contractIds?: number[] | null;
}

/**
 * Address response from API (same as Address entity)
 */
export type AddressResponse = Address;
