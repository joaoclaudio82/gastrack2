import type { Address } from '@models/address.model';
import type { Company } from '@models/company.model';
import type { Contract } from '@models/contract.model';
import type { Cylinder } from '@models/cylinder.model';
import type { EquipmentKit } from '@models/equipment-kit.model';
import type { Equipment } from '@models/equipment.model';
import type { PontoGasResponse } from '@models/ponto-gas.model';

export const ONBOARDING_STEPS = [
  { num: 1, label: 'Empresa' },
  { num: 2, label: 'Endereço' },
  { num: 3, label: 'Contrato' },
  { num: 4, label: 'Kit' },
  { num: 5, label: 'Equipamentos' },
  { num: 6, label: 'Detectar ESP' },
  { num: 7, label: 'Registrar ESP' },
  { num: 8, label: 'Pontos' },
  { num: 9, label: 'Cilindros' },
  { num: 10, label: 'Instalar' },
] as const;

export interface OnboardingState {
  currentStep: number;
  company: Company | null;
  addresses: Address[];
  selectedAddress: Address | null;
  contract: Contract | null;
  kit: EquipmentKit | null;
  esp32s: Equipment[];
  /** Seriais capturados no radar/ping (passo 6) → provisionados no passo 7. */
  capturedSerials: string[];
  gasPoints: PontoGasResponse[];
  /** Cilindros criados por ponto no passo 9. */
  cylinders: Cylinder[];
  extraEquipments: Equipment[];
}

export function createInitialOnboardingState(): OnboardingState {
  return {
    currentStep: 1,
    company: null,
    addresses: [],
    selectedAddress: null,
    contract: null,
    kit: null,
    esp32s: [],
    capturedSerials: [],
    gasPoints: [],
    cylinders: [],
    extraEquipments: [],
  };
}

/**
 * Returns partial state to clear from the given step onward (inclusive).
 * Used when navigating backward or when upstream selections change.
 */
export function clearStateFromStep(step: number): Partial<OnboardingState> {
  const cleared: Partial<OnboardingState> = {};

  if (step <= 9) {
    cleared.cylinders = [];
  }
  if (step <= 8) {
    cleared.gasPoints = [];
  }
  if (step <= 6) {
    cleared.capturedSerials = [];
  }
  if (step <= 5) {
    cleared.esp32s = [];
    cleared.extraEquipments = [];
  }
  if (step <= 4) {
    cleared.kit = null;
  }
  if (step <= 3) {
    cleared.contract = null;
  }
  if (step <= 2) {
    cleared.selectedAddress = null;
  }
  if (step <= 1) {
    cleared.company = null;
    cleared.addresses = [];
  }

  return cleared;
}
