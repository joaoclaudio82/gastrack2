import type { GasType } from './cylinder-model.model';

/**
 * Preço de gás versionado (append-only) por (empresa × tipo de gás).
 * Vigente = maior `validFrom`. Alinha com GasPriceResponse do backend.
 */
export interface GasPrice {
  id: number;
  companyId: number;
  gasType: GasType;
  pricePerM3: number;
  currency: string;
  validFrom: string;
  active: boolean;
  createdAt?: string;
}

/**
 * Payload de criação — cada POST cria uma nova versão (nunca edita a anterior).
 * Alinha com GasPriceRequest do backend.
 */
export interface GasPriceRequest {
  companyId: number;
  gasType: GasType;
  pricePerM3: number;
  currency: string;
  validFrom?: string | null;
}

export type GasPriceResponse = GasPrice;
