import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Address } from '@models/address.model';
import type { Company } from '@models/company.model';
import type { Contract } from '@models/contract.model';
import { CONTRACT_STATUS } from '@models/contract.model';
import { CylinderStatus } from '@models/cylinder.model';
import type { EquipmentKit } from '@models/equipment-kit.model';
import { KIT_STATUS } from '@models/equipment-kit.model';
import type { Equipment } from '@models/equipment.model';
import { EQUIPMENT_CONDITION } from '@models/equipment.model';
import type { PontoGasResponse } from '@models/ponto-gas.model';
import { OnboardingStateService } from './onboarding-state.service';
import { clearStateFromStep } from './onboarding.model';

const mockCompany = (id: string): Company => ({
  id,
  name: `Company ${id}`,
  slug: `company-${id}`,
  active: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
});

const mockAddress = (id: number): Address => ({
  id,
  companyId: 1,
  companyName: 'Company 1',
  name: `Address ${String(id)}`,
  street: 'Rua Teste',
  cityId: 1,
  cityName: 'City',
  stateId: 1,
  stateName: 'State',
  zipCode: '00000-000',
  fullAddress: 'Rua Teste, City',
  active: true,
  createdAt: '2024-01-01',
});

const mockContract = (id: number): Contract => ({
  id,
  companyId: 1,
  companyName: 'Company 1',
  contractNumber: `CTR-${String(id)}`,
  startDate: '2024-01-01',
  endDate: null,
  kitQuantity: 5,
  allowedAddressIds: [1],
  activeKitsCount: 0,
  remainingKitCapacity: 5,
  status: CONTRACT_STATUS.ACTIVE,
  notes: null,
  active: true,
  addressIds: [1],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  createdById: 1,
  createdByName: 'Admin',
});

const mockKit = (id: number): EquipmentKit => ({
  id,
  contractId: 1,
  contractNumber: 'CTR-1',
  companyId: 1,
  companyName: 'Company 1',
  addressId: 1,
  addressName: 'Address 1',
  kitCode: `KIT-${String(id)}`,
  installationDate: null,
  status: KIT_STATUS.PENDING,
  notes: null,
  equipmentCount: 0,
  active: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  createdById: 1,
  createdByName: 'Admin',
});

const mockEquipment = (id: number, typeName: string): Equipment => ({
  id,
  equipmentKitId: 1,
  kitCode: 'KIT-1',
  companyId: 1,
  companyName: 'Company 1',
  equipmentTypeId: 1,
  equipmentTypeName: typeName,
  assetTag: `TAG-${String(id)}`,
  description: null,
  serialNumber: null,
  manufacturer: null,
  model: null,
  purchaseDate: null,
  warrantyExpirationDate: null,
  condition: EQUIPMENT_CONDITION.NEW,
  notes: null,
  active: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  createdById: 1,
  createdByName: 'Admin',
});

const mockGasPoint = (id: number): PontoGasResponse => ({
  id,
  addressId: 1,
  addressName: 'Address 1',
  location: `Point ${String(id)}`,
  effectiveCapacityLiters: 100,
  effectiveFullTankPressureBar: 200,
  thresholds: { critical: 20, low: 50, normal: 80 },
  cylinders: [],
  availableCubicMeters: null,
  fillPercentage: null,
  gasType: null,
  currentPressureBar: null,
  lastReadingAt: null,
  status: CylinderStatus.UNKNOWN,
  active: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  equipments: [],
});

describe('clearStateFromStep', () => {
  it('should_ClearContractAndDownstream_When_StepIs3', () => {
    expect(clearStateFromStep(3)).toEqual({
      cylinders: [],
      gasPoints: [],
      capturedSerials: [],
      esp32s: [],
      extraEquipments: [],
      kit: null,
      contract: null,
    });
  });

  it('should_ClearSelectedAddressAndDownstream_When_StepIs2', () => {
    expect(clearStateFromStep(2)).toEqual({
      cylinders: [],
      gasPoints: [],
      capturedSerials: [],
      esp32s: [],
      extraEquipments: [],
      kit: null,
      contract: null,
      selectedAddress: null,
    });
  });

  it('should_ClearCompanyAndAllDownstream_When_StepIs1', () => {
    expect(clearStateFromStep(1)).toEqual({
      cylinders: [],
      gasPoints: [],
      capturedSerials: [],
      esp32s: [],
      extraEquipments: [],
      kit: null,
      contract: null,
      selectedAddress: null,
      company: null,
      addresses: [],
    });
  });
});

describe('OnboardingStateService', () => {
  let service: OnboardingStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), OnboardingStateService],
    });
    service = TestBed.inject(OnboardingStateService);
  });

  function populateFullState(): void {
    service.setCompany(mockCompany('1'));
    service.setAddresses([mockAddress(1)]);
    service.setSelectedAddress(mockAddress(1));
    service.setContract(mockContract(1));
    service.setKit(mockKit(1));
    service.setExtraEquipments([mockEquipment(2, 'Regulador')]);
    service.addGasPoint(mockGasPoint(1));
    for (let step = service.currentStep(); step < 6; step++) {
      service.nextStep();
    }
    // ESP definido após passar do passo 5 → navegação linear normal.
    // O pulo das etapas de ESP (kit que já tem ESP) é coberto nos testes dedicados.
    service.setEsp32s([mockEquipment(1, 'ESP32 Sensor')]);
  }

  it('should_ClearContractAndDownstream_When_GoToStep3FromStep6', () => {
    populateFullState();
    expect(service.currentStep()).toBe(6);

    service.goToStep(3);

    expect(service.currentStep()).toBe(3);
    expect(service.company()?.id).toBe('1');
    expect(service.selectedAddress()?.id).toBe(1);
    expect(service.contract()).toBeNull();
    expect(service.kit()).toBeNull();
    expect(service.esp32s()).toEqual([]);
    expect(service.extraEquipments()).toEqual([]);
    expect(service.gasPoints()).toEqual([]);
  });

  it('should_ClearSelectedAddressAndDownstream_When_GoToStep2FromStep4', () => {
    populateFullState();
    service.nextStep();
    expect(service.currentStep()).toBe(7);

    service.goToStep(2);

    expect(service.currentStep()).toBe(2);
    expect(service.company()?.id).toBe('1');
    expect(service.addresses()).toHaveLength(1);
    expect(service.selectedAddress()).toBeNull();
    expect(service.contract()).toBeNull();
    expect(service.kit()).toBeNull();
    expect(service.gasPoints()).toEqual([]);
  });

  it('should_KeepCompany_When_GoToStep3FromLaterStep', () => {
    populateFullState();

    service.goToStep(3);

    expect(service.company()?.name).toBe('Company 1');
    expect(service.addresses()).toHaveLength(1);
  });

  it('should_NotClearState_When_NextStep', () => {
    service.setCompany(mockCompany('1'));
    service.setContract(mockContract(1));
    service.setKit(mockKit(1));
    service.nextStep();
    service.nextStep();

    expect(service.currentStep()).toBe(3);
    expect(service.company()?.id).toBe('1');
    expect(service.contract()?.id).toBe(1);
    expect(service.kit()?.id).toBe(1);
  });

  it('should_ClearKitAndDownstream_When_SetContractWithDifferentId', () => {
    service.setCompany(mockCompany('1'));
    service.setSelectedAddress(mockAddress(1));
    service.setContract(mockContract(1));
    service.setKit(mockKit(1));
    service.setEsp32s([mockEquipment(1, 'ESP32 Sensor')]);
    service.addGasPoint(mockGasPoint(1));

    service.setContract(mockContract(2));

    expect(service.contract()?.id).toBe(2);
    expect(service.kit()).toBeNull();
    expect(service.esp32s()).toEqual([]);
    expect(service.gasPoints()).toEqual([]);
  });

  it('should_ClearDownstream_When_SetCompanyWithDifferentId', () => {
    service.setCompany(mockCompany('1'));
    service.setSelectedAddress(mockAddress(1));
    service.setContract(mockContract(1));
    service.setKit(mockKit(1));

    service.setCompany(mockCompany('2'));

    expect(service.company()?.id).toBe('2');
    expect(service.selectedAddress()).toBeNull();
    expect(service.contract()).toBeNull();
    expect(service.kit()).toBeNull();
  });

  it('should_ClearContractAndDownstream_When_PrevStepFromStep4ToStep3', () => {
    populateFullState();
    service.nextStep();

    service.prevStep();

    expect(service.currentStep()).toBe(6);
    service.prevStep();
    expect(service.currentStep()).toBe(5);
    service.prevStep();
    expect(service.currentStep()).toBe(4);
    service.prevStep();
    expect(service.currentStep()).toBe(3);
    expect(service.contract()).toBeNull();
    expect(service.kit()).toBeNull();
  });

  it('should_SkipEspSteps_When_KitAlreadyHasEsp32', () => {
    service.setKit(mockKit(1));
    service.setEsp32s([mockEquipment(1, 'ESP32 Sensor')]);
    for (let step = service.currentStep(); step < 5; step++) {
      service.nextStep();
    }
    expect(service.currentStep()).toBe(5);
    expect(service.kitHasEsp()).toBe(true);

    service.nextStep();

    expect(service.currentStep()).toBe(8); // pulou Detectar (6) e Registrar ESP (7)
  });

  it('should_SkipBackOverEspSteps_When_KitAlreadyHasEsp32', () => {
    service.setKit(mockKit(1));
    service.setEsp32s([mockEquipment(1, 'ESP32 Sensor')]);
    for (let step = service.currentStep(); step < 5; step++) {
      service.nextStep();
    }
    service.nextStep(); // 5 -> 8
    expect(service.currentStep()).toBe(8);

    service.prevStep();

    expect(service.currentStep()).toBe(5); // voltou pulando 7 e 6
  });

  it('should_NotNavigate_When_GoToStepAheadOfCurrent', () => {
    service.setCompany(mockCompany('1'));
    service.nextStep();

    service.goToStep(5);

    expect(service.currentStep()).toBe(2);
  });
});
