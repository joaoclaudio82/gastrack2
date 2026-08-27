import { computed, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { CompanyService } from '@core/services/company.service';
import { ContractService } from '@core/services/contract.service';
import { PontoGasService } from '@core/services/ponto-gas.service';
import { UserPreferencesService } from '@core/services/user-preferences.service';
import { BreadcrumbService } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.service';
import { CONTRACT_STATUS, type Contract } from '@models/contract.model';
import type { PressureStats } from '@models/pressure-reading.model';
import { UserRole } from '@models/role.model';
import { DEFAULT_USER_PREFERENCES } from '@models/user-preferences.model';
import { of } from 'rxjs';
import { PressureService } from '../../services/pressure.service';
import { AnalyticsNavigatorComponent } from './analytics-navigator.component';

const emptyStats: PressureStats = {
  totalReadings: 0,
  averagePressure: 0,
  maxPressure: 0,
  minPressure: 0,
  currentLiters: 0,
  currentPercentage: 0,
  averageConsumptionBarPerHour: 0,
  consumptionComparison: {
    previousAverageBarPerHour: null,
    deltaPercentage: null,
    direction: 'neutral',
    tooltip: '',
  },
  estimatedAutonomy: {
    remainingHours: null,
    consumptionLitersPerHour: null,
    confidence: null,
    state: 'estimating',
    label: '',
    tooltip: '',
  },
  tankStatus: { level: 'normal', label: 'Normal' },
  latestReading: null,
  uniqueDevices: 0,
};

function buildPressureMock() {
  const loading = signal(false);
  const error = signal<string | null>(null);
  const filteredReadingsSignal = signal<unknown[]>([]);
  const statsSignal = signal<PressureStats>(emptyStats);
  const chartDataSignal = signal<unknown[]>([]);
  const newReadings = signal<unknown[]>([]);
  const availableDevices = signal<{ value: string; label: string }[]>([]);
  const currentCodigo = signal<string | null>(null);
  const isStreaming = signal(false);
  const hasMore = signal(false);

  return {
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    filteredReadings: filteredReadingsSignal.asReadonly(),
    stats: computed(() => statsSignal()),
    chartData: computed(() => chartDataSignal()),
    newReadings: newReadings.asReadonly(),
    availableDevices: availableDevices.asReadonly(),
    currentCodigoSensor: currentCodigo.asReadonly(),
    isStreaming: isStreaming.asReadonly(),
    hasMore: hasMore.asReadonly(),
    reset: vi.fn(),
    setDeviceFromCodigoSensor: vi.fn(),
    setStreaming: vi.fn(),
    setAvailableDevices: vi.fn(),
    fetchReadings: vi.fn(() => of(undefined)),
    fetchNewReadings: vi.fn(),
    loadMore: vi.fn(() => of([])),
  };
}

describe('AnalyticsNavigatorComponent', () => {
  let fixture: ComponentFixture<AnalyticsNavigatorComponent>;
  let authHasRole: ReturnType<typeof vi.fn>;
  let companyId: ReturnType<typeof signal<number | null>>;
  let pressureMock: ReturnType<typeof buildPressureMock>;

  async function configure(options: { superAdmin?: boolean; companyIdValue?: number | null } = {}) {
    const { superAdmin = false, companyIdValue = null } = options;
    authHasRole = vi.fn((role: UserRole) => superAdmin && role === UserRole.SUPER_ADMIN);
    companyId = signal<number | null>(companyIdValue);

    const contracts = signal<Contract[]>([
      {
        id: 1,
        companyId: 10,
        companyName: 'Acme',
        contractNumber: 'C-1',
        startDate: '2024-01-01',
        endDate: null,
        kitQuantity: 1,
        allowedAddressIds: [],
        activeKitsCount: 0,
        remainingKitCapacity: 0,
        status: CONTRACT_STATUS.ACTIVE,
        notes: null,
        active: true,
        addressIds: [],
        createdAt: '',
        updatedAt: '',
        createdById: 1,
        createdByName: '',
      },
    ]);

    pressureMock = buildPressureMock();

    const prefs = signal({ ...DEFAULT_USER_PREFERENCES });

    await TestBed.configureTestingModule({
      imports: [AnalyticsNavigatorComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: BreadcrumbService,
          useValue: { breadcrumbs: signal([]).asReadonly() },
        },
        {
          provide: AuthService,
          useValue: {
            hasRole: authHasRole,
            currentCompanyId: computed(() => companyId()),
          },
        },
        {
          provide: CompanyService,
          useValue: {
            activeCompanies: signal<{ id: number; name: string }[]>([]).asReadonly(),
            isLoading: signal(false).asReadonly(),
            getActive: vi.fn(),
          },
        },
        {
          provide: ContractService,
          useValue: {
            contracts: contracts.asReadonly(),
            contractAddresses: signal<{ id: number; name: string; fullAddress: string }[]>(
              [],
            ).asReadonly(),
            getAll: vi.fn(),
            getByCompany: vi.fn(),
            getAllowedAddresses: vi.fn(),
          },
        },
        {
          provide: PontoGasService,
          useValue: {
            gasPointsByAddress: signal<unknown[]>([]).asReadonly(),
            isLoading: signal(false).asReadonly(),
            clearGasPointsByAddress: vi.fn(),
            getByAddressId: vi.fn(),
          },
        },
        {
          provide: UserPreferencesService,
          useValue: {
            prefs: prefs.asReadonly(),
            update: vi.fn(),
          },
        },
        { provide: PressureService, useValue: pressureMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsNavigatorComponent);
  }

  it('should create', async () => {
    await configure({ superAdmin: false });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders analytics page title', async () => {
    await configure({ superAdmin: false });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Analytics de Pressão');
  });

  it('disables contract selection for super admin until a company is effective', async () => {
    await configure({ superAdmin: true, companyIdValue: null });
    fixture.detectChanges();
    expect(fixture.componentInstance.isContractDisabled()).toBe(true);
  });

  it('onCompanyChange clears downstream selection and gas points', async () => {
    await configure({ superAdmin: true });
    const ponto = TestBed.inject(PontoGasService) as unknown as {
      clearGasPointsByAddress: ReturnType<typeof vi.fn>;
    };

    fixture.componentInstance.selectedContractId.set(9);
    fixture.componentInstance.selectedAddressId.set(8);
    fixture.componentInstance.selectedDeviceId.set('dev|1');
    pressureMock.reset.mockClear();
    ponto.clearGasPointsByAddress.mockClear();
    fixture.componentInstance.onCompanyChange(10);

    expect(fixture.componentInstance.selectedContractId()).toBe(0);
    expect(fixture.componentInstance.selectedAddressId()).toBe(0);
    expect(fixture.componentInstance.selectedDeviceId()).toBeNull();
    expect(ponto.clearGasPointsByAddress).toHaveBeenCalled();
    expect(pressureMock.reset).toHaveBeenCalled();
  });
});
