import { Injectable, computed, signal } from '@angular/core';
import type { Address } from '@models/address.model';
import type { Company } from '@models/company.model';
import type { Contract } from '@models/contract.model';
import type { Cylinder } from '@models/cylinder.model';
import type { EquipmentKit } from '@models/equipment-kit.model';
import type { Equipment } from '@models/equipment.model';
import type { PontoGasResponse } from '@models/ponto-gas.model';
import {
  type OnboardingState,
  ONBOARDING_STEPS,
  clearStateFromStep,
  createInitialOnboardingState,
} from './onboarding.model';

@Injectable()
export class OnboardingStateService {
  private readonly stateSignal = signal<OnboardingState>(createInitialOnboardingState());

  readonly state = this.stateSignal.asReadonly();
  readonly currentStep = computed(() => this.stateSignal().currentStep);
  readonly company = computed(() => this.stateSignal().company);
  readonly addresses = computed(() => this.stateSignal().addresses);
  readonly selectedAddress = computed(() => this.stateSignal().selectedAddress);
  readonly contract = computed(() => this.stateSignal().contract);
  readonly kit = computed(() => this.stateSignal().kit);
  readonly esp32s = computed(() => this.stateSignal().esp32s);
  readonly capturedSerials = computed(() => this.stateSignal().capturedSerials);
  readonly gasPoints = computed(() => this.stateSignal().gasPoints);
  readonly cylinders = computed(() => this.stateSignal().cylinders);
  readonly extraEquipments = computed(() => this.stateSignal().extraEquipments);
  readonly steps = ONBOARDING_STEPS;
  readonly totalSteps = ONBOARDING_STEPS.length;
  readonly progressPercent = computed(
    () => ((this.currentStep() - 1) / (this.totalSteps - 1)) * 100,
  );
  readonly canGoBack = computed(() => this.currentStep() > 1);
  readonly isLastStep = computed(() => this.currentStep() === this.totalSteps);
  /**
   * Kit selecionado já tem um ESP32 (regra kit = 1 ESP) → as etapas Detectar (6) e
   * Registrar ESP (7) não se aplicam e são puladas na navegação.
   */
  readonly kitHasEsp = computed(() => this.stateSignal().esp32s.length > 0);

  nextStep(): void {
    this.stateSignal.update((s) => {
      let next = Math.min(s.currentStep + 1, this.totalSteps);
      if (s.currentStep === 5 && s.esp32s.length > 0) {
        next = 8; // pula Detectar/Registrar ESP
      }
      return { ...s, currentStep: next };
    });
  }

  prevStep(): void {
    const s = this.stateSignal();
    const target = s.currentStep === 8 && s.esp32s.length > 0 ? 5 : s.currentStep - 1;
    this.navigateToStep(Math.max(target, 1));
  }

  goToStep(step: number): void {
    this.navigateToStep(step);
  }

  private navigateToStep(target: number): void {
    this.stateSignal.update((s) => {
      if (target < 1 || target > this.totalSteps || target > s.currentStep) {
        return s;
      }
      if (target === s.currentStep) {
        return s;
      }
      return {
        ...s,
        currentStep: target,
        ...clearStateFromStep(target),
      };
    });
  }

  setCompany(company: Company): void {
    this.stateSignal.update((s) => {
      const changed = s.company?.id !== company.id;
      return {
        ...s,
        ...(changed ? clearStateFromStep(2) : {}),
        company,
      };
    });
  }

  setAddresses(addresses: Address[]): void {
    this.stateSignal.update((s) => ({ ...s, addresses }));
  }

  setSelectedAddress(address: Address): void {
    this.stateSignal.update((s) => {
      const changed = s.selectedAddress?.id !== address.id;
      return {
        ...s,
        ...(changed ? clearStateFromStep(3) : {}),
        selectedAddress: address,
      };
    });
  }

  setContract(contract: Contract): void {
    this.stateSignal.update((s) => {
      const changed = s.contract?.id !== contract.id;
      return {
        ...s,
        ...(changed ? clearStateFromStep(4) : {}),
        contract,
      };
    });
  }

  setKit(kit: EquipmentKit): void {
    this.stateSignal.update((s) => ({ ...s, kit }));
  }

  addEsp32(equipment: Equipment): void {
    this.stateSignal.update((s) => ({
      ...s,
      esp32s: [...s.esp32s, equipment],
    }));
  }

  setEsp32s(esp32s: Equipment[]): void {
    this.stateSignal.update((s) => ({ ...s, esp32s }));
  }

  setCapturedSerials(capturedSerials: string[]): void {
    this.stateSignal.update((s) => ({ ...s, capturedSerials }));
  }

  addCylinder(cylinder: Cylinder): void {
    this.stateSignal.update((s) => ({ ...s, cylinders: [...s.cylinders, cylinder] }));
  }

  addGasPoint(gasPoint: PontoGasResponse): void {
    this.stateSignal.update((s) => ({
      ...s,
      gasPoints: [...s.gasPoints, gasPoint],
    }));
  }

  removeGasPoint(id: number): void {
    this.stateSignal.update((s) => ({
      ...s,
      gasPoints: s.gasPoints.filter((gp) => gp.id !== id),
    }));
  }

  addExtraEquipment(equipment: Equipment): void {
    this.stateSignal.update((s) => ({
      ...s,
      extraEquipments: [...s.extraEquipments, equipment],
    }));
  }

  setExtraEquipments(extraEquipments: Equipment[]): void {
    this.stateSignal.update((s) => ({ ...s, extraEquipments }));
  }

  removeExtraEquipment(id: number): void {
    this.stateSignal.update((s) => ({
      ...s,
      extraEquipments: s.extraEquipments.filter((e) => e.id !== id),
    }));
  }

  reset(): void {
    this.stateSignal.set(createInitialOnboardingState());
  }
}
