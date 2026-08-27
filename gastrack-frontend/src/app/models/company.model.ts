/**
 * Company entity for multi-tenant support
 */
export interface Company {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload for creating/updating a company
 */
export interface CompanyRequest {
  name: string;
  slug: string;
  cnpj: string;
  phone?: string | undefined;
  email?: string | undefined;
}

/**
 * Company response from API (same as Company entity)
 */
export type CompanyResponse = Company;

/**
 * Simplified company reference used in other entities
 */
export interface CompanyReference {
  id: string;
  name: string;
}
