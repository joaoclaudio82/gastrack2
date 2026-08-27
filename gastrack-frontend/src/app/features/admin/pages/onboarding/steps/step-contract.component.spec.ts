import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddressService } from '@core/services/address.service';
import { ContractService } from '@core/services/contract.service';
import { NotificationService } from '@core/services/notification.service';
import type { Address } from '@models/address.model';
import type { Company } from '@models/company.model';
import type { Contract, ContractRequest } from '@models/contract.model';
import { CONTRACT_STATUS } from '@models/contract.model';
import { of, throwError } from 'rxjs';
import { OnboardingStateService } from '../onboarding-state.service';
import { StepContractComponent } from './step-contract.component';

const mockCompany: Company = {
  id: '1',
  name: 'Company 1',
  slug: 'company-1',
  active: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

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

const mockContract = (overrides: Partial<Contract> = {}): Contract => ({
  id: 1,
  companyId: 1,
  companyName: 'Company 1',
  contractNumber: 'CTR-1',
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
  ...overrides,
});

interface ContractServiceStub {
  contracts: ReturnType<typeof signal<Contract[]>>;
  getByCompany: ReturnType<typeof vi.fn>;
  updateStatus: ReturnType<typeof vi.fn>;
  updateAddresses: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
}

describe('StepContractComponent', () => {
  let fixture: ComponentFixture<StepContractComponent>;
  let component: StepContractComponent;
  let wizardState: OnboardingStateService;
  let contractStub: ContractServiceStub;
  let notification: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let completedCount: number;

  function setup(): void {
    contractStub = {
      contracts: signal<Contract[]>([]),
      getByCompany: vi.fn(),
      updateStatus: vi.fn(() => of(mockContract())),
      updateAddresses: vi.fn(() => of(mockContract())),
      create: vi.fn(() => of(mockContract())),
    };
    notification = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [StepContractComponent],
      providers: [
        provideZonelessChangeDetection(),
        OnboardingStateService,
        { provide: ContractService, useValue: contractStub },
        { provide: AddressService, useValue: { getByCompany: vi.fn() } },
        { provide: NotificationService, useValue: notification },
      ],
    });

    wizardState = TestBed.inject(OnboardingStateService);
    wizardState.setCompany(mockCompany);

    fixture = TestBed.createComponent(StepContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    completedCount = 0;
    component.completed.subscribe(() => {
      completedCount += 1;
    });
  }

  beforeEach(() => {
    setup();
  });

  it('should_Advance_When_AddressAlreadyAllowed', () => {
    wizardState.setSelectedAddress(mockAddress(1));
    const contract = mockContract({ allowedAddressIds: [1] });
    component.selectContract(contract);

    component.confirmSelection();

    expect(contractStub.updateAddresses).not.toHaveBeenCalled();
    expect(completedCount).toBe(1);
    expect(wizardState.contract()?.id).toBe(contract.id);
  });

  it('should_EnableAddressAndAdvance_When_AddressNotAllowed', () => {
    wizardState.setSelectedAddress(mockAddress(9));
    const updated = mockContract({ allowedAddressIds: [1, 9] });
    contractStub.updateAddresses.mockReturnValue(of(updated));
    const contract = mockContract({ allowedAddressIds: [1] });
    component.selectContract(contract);

    component.confirmSelection();

    expect(contractStub.updateAddresses).toHaveBeenCalledWith(1, { addressIds: [1, 9] });
    expect(notification.success).toHaveBeenCalled();
    expect(completedCount).toBe(1);
    expect(wizardState.contract()?.allowedAddressIds).toEqual([1, 9]);
  });

  it('should_NotAdvance_When_EnableAddressFails', () => {
    wizardState.setSelectedAddress(mockAddress(9));
    contractStub.updateAddresses.mockReturnValue(
      throwError(() => new Error('Address is not enabled for this contract')),
    );
    const contract = mockContract({ allowedAddressIds: [1] });
    component.selectContract(contract);

    component.confirmSelection();

    expect(contractStub.updateAddresses).toHaveBeenCalled();
    expect(completedCount).toBe(0);
    expect(component.submitting()).toBe(false);
  });

  it('should_EnableAddressAfterActivation_When_DraftContract', () => {
    wizardState.setSelectedAddress(mockAddress(9));
    const activated = mockContract({ status: CONTRACT_STATUS.ACTIVE, allowedAddressIds: [1] });
    const enabled = mockContract({ status: CONTRACT_STATUS.ACTIVE, allowedAddressIds: [1, 9] });
    contractStub.updateStatus.mockReturnValue(of(activated));
    contractStub.updateAddresses.mockReturnValue(of(enabled));
    const draft = mockContract({ status: CONTRACT_STATUS.DRAFT, allowedAddressIds: [1] });
    component.selectContract(draft);

    component.confirmSelection();

    expect(contractStub.updateStatus).toHaveBeenCalledWith(1, { status: CONTRACT_STATUS.ACTIVE });
    expect(contractStub.updateAddresses).toHaveBeenCalledWith(1, { addressIds: [1, 9] });
    expect(completedCount).toBe(1);
    expect(wizardState.contract()?.allowedAddressIds).toEqual([1, 9]);
  });

  it('should_EnableAddress_When_CreatingNewContract', () => {
    wizardState.setSelectedAddress(mockAddress(9));
    const created = mockContract({ status: CONTRACT_STATUS.ACTIVE, allowedAddressIds: [1] });
    const enabled = mockContract({ status: CONTRACT_STATUS.ACTIVE, allowedAddressIds: [1, 9] });
    contractStub.create.mockReturnValue(of(created));
    contractStub.updateAddresses.mockReturnValue(of(enabled));

    const request: ContractRequest = {
      companyId: 1,
      allowedAddressIds: [1],
      startDate: '2024-01-01',
      kitQuantity: 5,
    };
    component.createContract(request);

    expect(contractStub.create).toHaveBeenCalledWith(request);
    expect(contractStub.updateAddresses).toHaveBeenCalledWith(1, { addressIds: [1, 9] });
    expect(completedCount).toBe(1);
  });

  it('should_NotEnableAddress_When_NewContractAlreadyAllowsAddress', () => {
    wizardState.setSelectedAddress(mockAddress(1));
    const created = mockContract({ status: CONTRACT_STATUS.ACTIVE, allowedAddressIds: [1] });
    contractStub.create.mockReturnValue(of(created));

    const request: ContractRequest = {
      companyId: 1,
      allowedAddressIds: [1],
      startDate: '2024-01-01',
      kitQuantity: 5,
    };
    component.createContract(request);

    expect(contractStub.updateAddresses).not.toHaveBeenCalled();
    expect(completedCount).toBe(1);
  });
});
