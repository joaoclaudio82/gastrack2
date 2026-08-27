import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/services/auth.service';
import { CompanyService } from '@core/services/company.service';
import { ContractService } from '@core/services/contract.service';
import { PontoGasService } from '@core/services/ponto-gas.service';
import { UserPreferencesService } from '@core/services/user-preferences.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import { CONTRACT_STATUS } from '@models/contract.model';
import type { PontoGasEquipment } from '@models/ponto-gas.model';
import { UserRole } from '@models/role.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { ComboboxComponent } from '@shared/components/ui/combobox/combobox.component';
import { DatePickerComponent } from '@shared/components/ui/date-picker/date-picker.component';
import { EmptyStateComponent } from '@shared/components/ui/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '@shared/components/ui/loading-spinner/loading-spinner.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { AnalyticsStreamingControlsComponent } from '../../components/analytics-streaming-controls/analytics-streaming-controls.component';
import { PressureLineChartComponent } from '../../components/pressure-line-chart/pressure-line-chart.component';
import { PressureStatsComponent } from '../../components/pressure-stats/pressure-stats.component';
import { PressureAlertService } from '../../services/pressure-alert.service';
import { PressureService } from '../../services/pressure.service';

const DEFAULT_TIMELINE_MINUTES = 30;
const TIMELINE_OPTIONS: readonly { label: string; value: number }[] = [
  { label: '5 minutos', value: 5 },
  { label: '15 minutos', value: 15 },
  { label: '30 minutos', value: 30 },
  { label: '60 minutos', value: 60 },
  { label: 'Últimas 24 horas', value: 24 * 60 },
];

@Component({
  selector: 'app-analytics-navigator',
  standalone: true,
  host: { class: 'block w-full' },
  imports: [
    FormsModule,
    BreadcrumbComponent,
    ButtonComponent,
    CardComponent,
    ComboboxComponent,
    DatePickerComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    SelectComponent,
    PressureLineChartComponent,
    PressureStatsComponent,
    AnalyticsStreamingControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-full flex flex-col gap-8">
      <app-breadcrumb />

      <header class="space-y-2 shrink-0">
        <h1 class="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Analytics de Pressão
        </h1>
        <p class="text-base text-muted-foreground">
          Selecione Empresa, Contrato, Endereço e Dispositivo para visualizar as leituras de
          pressão.
        </p>
      </header>

      <!-- Card único: todos os filtros em cascata -->
      <app-card header="Filtros" subheader="Preencha todos os níveis para habilitar o gráfico">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          @if (isSuperAdmin()) {
            <app-combobox
              label="Empresa"
              placeholder="Digite para buscar empresa..."
              [ngModel]="selectedCompanyId()"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="onCompanyChange($event)"
              [options]="companyOptionsForCombobox()"
              [loading]="companyService.isLoading()"
              emptyMessage="Nenhuma empresa encontrada"
            />
          }

          <app-select
            label="Contrato"
            [placeholder]="
              isContractDisabled() ? 'Selecione uma empresa primeiro' : 'Selecione um contrato'
            "
            [ngModel]="selectedContractId()"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="onContractChange($event)"
            [options]="filteredContractOptions()"
            [disabledInput]="isContractDisabled()"
          />

          <app-select
            label="Endereço"
            [placeholder]="
              isAddressDisabled() ? 'Selecione um contrato primeiro' : 'Selecione um endereço'
            "
            [ngModel]="selectedAddressId()"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="onAddressChange($event)"
            [options]="addressOptions()"
            [disabledInput]="isAddressDisabled()"
          />

          <app-select
            label="Sensor"
            [placeholder]="deviceSelectPlaceholder()"
            [ngModel]="selectedDeviceId() ?? ''"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="onDeviceChange($event)"
            [options]="allDeviceOptions()"
            [disabledInput]="isDeviceDisabled()"
          />
        </div>
      </app-card>

      <!-- Gráfico e estatísticas: só quando dispositivo selecionado -->
      @if (selectedDeviceId()) {
        @if (!pressureService.loading() && pressureService.filteredReadings().length > 0) {
          <div class="shrink-0">
            <app-pressure-stats [stats]="pressureService.stats()" />
          </div>
        }

        @if (!pressureService.loading() && pressureService.stats().latestReading) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0 items-stretch">
            <app-card
              header="Última Leitura"
              subheader="Dados mais recentes"
              class="min-w-0 h-full"
            >
              <dl class="grid grid-cols-[auto_1fr] gap-y-3 gap-x-6 text-sm">
                <div class="contents">
                  <dt class="text-muted-foreground">Dispositivo</dt>
                  <dd class="text-right font-mono font-medium">
                    {{ pressureService.stats().latestReading?.deviceId }}
                  </dd>
                </div>
                <div class="contents">
                  <dt class="text-muted-foreground">Pressão</dt>
                  <dd class="text-right font-medium">
                    {{ pressureService.stats().latestReading?.pressureBar?.toFixed(2) }} bar
                  </dd>
                </div>
                <div class="contents">
                  <dt class="text-muted-foreground">Data/Hora</dt>
                  <dd class="text-right font-medium">
                    {{ pressureService.stats().latestReading?.datetime }}
                  </dd>
                </div>
                <div class="contents">
                  <dt class="text-muted-foreground">Total</dt>
                  <dd class="text-right font-medium">
                    {{ pressureService.stats().totalReadings }} leituras
                  </dd>
                </div>
              </dl>
            </app-card>
            <app-card header="Resumo" subheader="Variação de pressão" class="min-w-0 h-full">
              <dl class="grid grid-cols-[auto_1fr] gap-y-3 gap-x-6 text-sm">
                <div class="contents">
                  <dt class="text-muted-foreground">Média</dt>
                  <dd class="text-right font-medium">
                    {{ pressureService.stats().averagePressure.toFixed(2) }} bar
                  </dd>
                </div>
                <div class="contents">
                  <dt class="text-muted-foreground">Máx / Mín</dt>
                  <dd class="text-right font-medium">
                    {{ pressureService.stats().maxPressure.toFixed(2) }} /
                    {{ pressureService.stats().minPressure.toFixed(2) }} bar
                  </dd>
                </div>
                <div class="contents">
                  <dt class="text-muted-foreground">Variação</dt>
                  <dd class="text-right font-medium">
                    {{
                      (
                        pressureService.stats().maxPressure - pressureService.stats().minPressure
                      ).toFixed(2)
                    }}
                    bar
                  </dd>
                </div>
              </dl>
            </app-card>
          </div>
        }

        <app-card>
          <div class="flex items-center justify-between mb-4" card-header>
            <div>
              <h3 class="text-lg font-semibold text-foreground">Histórico de Pressão</h3>
              <p class="text-sm text-muted-foreground">Visualização em tempo real</p>
            </div>
            @if (pressureService.isStreaming()) {
              <div class="flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span
                    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-75"
                  ></span>
                  <span
                    class="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--color-success)]"
                  ></span>
                </span>
                <span
                  class="text-xs font-semibold uppercase tracking-wider text-[var(--color-success-text)]"
                >
                  Ao Vivo
                </span>
              </div>
            }
          </div>
          <div class="space-y-4">
            @if (pressureService.availableDevices().length > 1) {
              <div class="pb-4 border-b border-border">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <app-select
                    label="Trocar sensor"
                    [options]="deviceSelectOptionsForChart()"
                    [ngModel]="pressureService.currentCodigoSensor() ?? ''"
                    (ngModelChange)="onChartDeviceChange($event)"
                    placeholder="Selecione o dispositivo"
                    size="md"
                    class="w-full"
                  />
                  <app-select
                    label="Timeline"
                    [options]="timelineOptions"
                    [ngModel]="selectedTimelineMinutes()"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="onTimelineChange($event)"
                    placeholder="Selecione o período"
                    size="md"
                    class="w-full"
                  />
                  <div class="flex flex-col gap-1.5">
                    <span class="text-sm font-medium text-transparent select-none">Ação</span>
                    <app-button
                      variant="outline"
                      size="md"
                      class="w-full"
                      (buttonClick)="toggleCustomDatePicker()"
                    >
                      <span class="inline-flex items-center justify-center gap-2">
                        <svg
                          class="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Período específico</span>
                      </span>
                    </app-button>
                  </div>
                </div>
                @if (showCustomDatePicker()) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <app-date-picker
                      label="Data inicial"
                      placeholder="Selecione a data inicial"
                      [ngModel]="customStartDate()"
                      [ngModelOptions]="{ standalone: true }"
                      (ngModelChange)="onCustomDateChange('start', $event)"
                    />
                    @if (customStartDate() && !showEndDateInput()) {
                      <div class="flex flex-col gap-1.5">
                        <span class="text-sm font-medium text-transparent select-none">Ação</span>
                        <app-button
                          variant="outline"
                          size="md"
                          class="w-full"
                          (buttonClick)="openEndDateInput()"
                        >
                          <span class="inline-flex items-center justify-center gap-2">
                            <svg
                              class="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                            >
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>Data final</span>
                          </span>
                        </app-button>
                      </div>
                    } @else if (showEndDateInput()) {
                      <app-date-picker
                        label="Data final"
                        placeholder="Selecione a data final"
                        [ngModel]="customEndDate()"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="onCustomDateChange('end', $event)"
                        [minDate]="customStartDateAsDate()"
                      />
                    }
                  </div>
                }
              </div>
            } @else {
              <div class="pb-4 border-b border-border max-w-3xl">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <app-select
                    label="Timeline"
                    [options]="timelineOptions"
                    [ngModel]="selectedTimelineMinutes()"
                    [ngModelOptions]="{ standalone: true }"
                    (ngModelChange)="onTimelineChange($event)"
                    placeholder="Selecione o período"
                    size="md"
                    class="w-full"
                  />
                  <div class="flex flex-col gap-1.5">
                    <span class="text-sm font-medium text-transparent select-none">Ação</span>
                    <app-button
                      variant="outline"
                      size="md"
                      class="w-full"
                      (buttonClick)="toggleCustomDatePicker()"
                    >
                      <span class="inline-flex items-center justify-center gap-2">
                        <svg
                          class="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Período específico</span>
                      </span>
                    </app-button>
                  </div>
                </div>
                @if (showCustomDatePicker()) {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <app-date-picker
                      label="Data inicial"
                      placeholder="Selecione a data inicial"
                      [ngModel]="customStartDate()"
                      [ngModelOptions]="{ standalone: true }"
                      (ngModelChange)="onCustomDateChange('start', $event)"
                    />
                    @if (customStartDate() && !showEndDateInput()) {
                      <div class="flex flex-col gap-1.5">
                        <span class="text-sm font-medium text-transparent select-none">Ação</span>
                        <app-button
                          variant="outline"
                          size="md"
                          class="w-full"
                          (buttonClick)="openEndDateInput()"
                        >
                          <span class="inline-flex items-center justify-center gap-2">
                            <svg
                              class="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              aria-hidden="true"
                            >
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>Data final</span>
                          </span>
                        </app-button>
                      </div>
                    } @else if (showEndDateInput()) {
                      <app-date-picker
                        label="Data final"
                        placeholder="Selecione a data final"
                        [ngModel]="customEndDate()"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="onCustomDateChange('end', $event)"
                        [minDate]="customStartDateAsDate()"
                      />
                    }
                  </div>
                }
              </div>
            }

            @if (pressureService.loading()) {
              <div class="flex justify-center py-20">
                <app-loading-spinner size="lg" />
              </div>
            } @else if (pressureService.error()) {
              <app-empty-state
                icon="error"
                title="Erro ao carregar dados"
                [description]="pressureService.error() ?? 'Erro desconhecido'"
              >
                <app-button variant="primary" class="mt-4" (buttonClick)="retryLoad()">
                  Tentar novamente
                </app-button>
              </app-empty-state>
            } @else if (pressureService.filteredReadings().length === 0) {
              <app-empty-state
                icon="chart"
                title="Nenhuma leitura encontrada"
                description="Não há dados de pressão para este sensor."
              />
            } @else {
              <div class="flex justify-end mb-3">
                <app-analytics-streaming-controls />
              </div>
              <div class="h-[450px] min-h-0">
                <app-pressure-line-chart
                  [historicalData]="pressureService.chartData()"
                  [newReadings]="pressureService.newReadings()"
                  [timelineMinutes]="chartTimelineMinutes()"
                  [refreshIntervalSeconds]="userPreferences.prefs().analyticsRefreshIntervalSeconds"
                  [paused]="userPreferences.prefs().analyticsStreamingPaused"
                  (refreshRequested)="onStreamingRefresh()"
                />
              </div>
            }
          </div>
        </app-card>
      } @else {
        <app-card
          header="Gráfico"
          subheader="Selecione um dispositivo acima para carregar as leituras"
        >
          <app-empty-state
            icon="chart"
            title="Nenhum dispositivo selecionado"
            description="Preencha Empresa, Contrato, Endereço e escolha um Sensor para visualizar o histórico de pressão."
          />
        </app-card>
      }
    </div>
  `,
})
export class AnalyticsNavigatorComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly companyService = inject(CompanyService);
  readonly contractService = inject(ContractService);
  readonly pontoGasService = inject(PontoGasService);
  readonly pressureService = inject(PressureService);
  readonly userPreferences = inject(UserPreferencesService);
  private readonly alertService = inject(PressureAlertService);
  private loadRequestVersion = 0;

  readonly selectedCompanyId = signal<number | null>(null);
  readonly selectedContractId = signal<number>(0);
  readonly selectedAddressId = signal<number>(0);
  readonly selectedDeviceId = signal<string | null>(null);
  readonly selectedTimelineMinutes = signal<number>(DEFAULT_TIMELINE_MINUTES);
  readonly timelineOptions = TIMELINE_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value,
  }));
  readonly showCustomDatePicker = signal(false);
  readonly showEndDateInput = signal(false);
  readonly useCustomRange = signal(false);
  readonly customStartDate = signal<string>('');
  readonly customEndDate = signal<string>('');
  readonly customStartDateAsDate = computed(() => {
    const startStr = this.customStartDate();
    if (!startStr) return null;
    const d = new Date(startStr + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  });
  readonly chartTimelineMinutes = computed(() => {
    const range = this.resolveCustomRange();
    if (!range) return this.selectedTimelineMinutes();
    return Math.max(1, Math.floor((range.endTimestamp - range.startTimestamp) / 60));
  });

  readonly companyOptionsForCombobox = computed(() =>
    this.companyService.activeCompanies().map((o) => ({
      label: o.name,
      value: o.id as string | number,
      disabled: false,
    })),
  );

  readonly effectiveCompanyId = computed(
    () => this.selectedCompanyId() ?? this.authService.currentCompanyId(),
  );

  readonly filteredContractOptions = computed(() => {
    const contracts = this.contractService.contracts();
    const companyId = this.effectiveCompanyId();
    const activeContracts = contracts.filter((c) => c.status === CONTRACT_STATUS.ACTIVE);

    if (!this.isSuperAdmin()) {
      return activeContracts.map((c) => ({
        label: `${c.contractNumber} - ${c.companyName}`,
        value: c.id,
      }));
    }
    if (!companyId) return [];
    return activeContracts
      .filter((c) => c.companyId === companyId)
      .map((c) => ({
        label: `${c.contractNumber} - ${c.companyName}`,
        value: c.id,
      }));
  });

  readonly addressOptions = computed(() =>
    this.contractService.contractAddresses().map((a) => ({
      label: a.name || a.fullAddress,
      value: a.id,
    })),
  );

  readonly gasPointsByAddress = this.pontoGasService.gasPointsByAddress;
  readonly selectedGasPoint = computed(() => {
    const codigoSensor = this.selectedDeviceId();
    if (!codigoSensor) return null;
    return (
      this.gasPointsByAddress().find((p) =>
        (p.equipments ?? []).some((e) => e.codigoSensor === codigoSensor),
      ) ?? null
    );
  });

  /** Opções do select: sensores (equipamentos com codigoSensor) dos pontos do endereço */
  readonly allDeviceOptions = computed(() => {
    const pontos = this.gasPointsByAddress();
    return pontos.flatMap((p) =>
      (p.equipments ?? [])
        .filter((e): e is PontoGasEquipment & { codigoSensor: string } => !!e.codigoSensor)
        .map((e) => ({
          label: `${p.location} - ${e.parentSerial ?? e.assetTag} - Porta ${e.sensorPort ?? '-'}`,
          value: e.codigoSensor,
        })),
    );
  });

  readonly deviceSelectPlaceholder = computed(() => {
    if (!this.selectedAddressId() || this.selectedAddressId() <= 0)
      return 'Selecione um endereço primeiro';
    if (this.pontoGasService.isLoading()) return 'Carregando pontos...';
    const opts = this.allDeviceOptions();
    if (opts.length === 0) return 'Nenhum sensor disponível';
    return 'Selecione o dispositivo';
  });

  readonly isDeviceDisabled = computed(() => {
    if (!this.selectedAddressId() || this.selectedAddressId() <= 0) return true;
    return this.allDeviceOptions().length === 0;
  });

  readonly deviceSelectOptionsForChart = () =>
    this.pressureService.availableDevices().map((d) => ({ label: d.label, value: d.value }));

  constructor() {
    effect(() => {
      this.evaluateCriticalPressureAlert();
    });
    effect(() => {
      if (this.isSuperAdmin()) {
        this.companyService.getActive();
        this.contractService.getAll({ page: 1, pageSize: 200 }, { status: CONTRACT_STATUS.ACTIVE });
      } else {
        const companyId = this.authService.currentCompanyId();
        if (companyId != null) {
          const id = typeof companyId === 'string' ? parseInt(companyId, 10) : companyId;
          if (!isNaN(id)) {
            this.selectedCompanyId.set(id);
            this.contractService.getByCompany(id, { page: 1, pageSize: 200 });
          } else {
            this.contractService.getAll(
              { page: 1, pageSize: 200 },
              { status: CONTRACT_STATUS.ACTIVE },
            );
          }
        } else {
          this.contractService.getAll(
            { page: 1, pageSize: 200 },
            { status: CONTRACT_STATUS.ACTIVE },
          );
        }
      }
    });

    // When device selected: load initial data and start streaming
    effect(() => {
      const codigoSensor = this.selectedDeviceId();
      if (!codigoSensor) {
        this.pressureService.reset();
        return;
      }
      this.pressureService.reset();
      this.pressureService.setDeviceFromCodigoSensor(codigoSensor);
      // Volume e pressão de 100% vêm derivados dos cascos conectados, e thresholds
      // da config do servidor — sem números mágicos deste lado.
      const gasPoint = this.selectedGasPoint();
      this.pressureService.setInternalVolumeLiters(gasPoint?.effectiveCapacityLiters);
      this.pressureService.setFullTankPressureBar(gasPoint?.effectiveFullTankPressureBar);
      this.pressureService.setThresholds(gasPoint?.thresholds);
      this.loadData(codigoSensor);
      this.pressureService.setStreaming(true);
    });

    effect(() => {
      const options = this.allDeviceOptions();
      if (options.length > 0) {
        this.pressureService.setAvailableDevices(options);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.pressureService.setStreaming(false);
    });

    effect(() => {
      const options = this.allDeviceOptions();
      const current = this.selectedDeviceId();
      const single = options[0];
      if (
        options.length === 1 &&
        single &&
        !current &&
        this.selectedAddressId() > 0 &&
        !this.pontoGasService.isLoading()
      ) {
        this.selectedDeviceId.set(
          typeof single.value === 'string' ? single.value : String(single.value),
        );
      }
    });
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole(UserRole.SUPER_ADMIN);
  }

  isContractDisabled(): boolean {
    return this.isSuperAdmin() && !this.effectiveCompanyId();
  }

  isAddressDisabled(): boolean {
    return !this.selectedContractId() || this.selectedContractId() <= 0;
  }

  onCompanyChange(companyId: number | null): void {
    this.selectedCompanyId.set(companyId);
    this.selectedContractId.set(0);
    this.selectedAddressId.set(0);
    this.selectedDeviceId.set(null);
    this.pontoGasService.clearGasPointsByAddress();
    this.pressureService.reset();
  }

  onContractChange(contractId: number): void {
    this.selectedContractId.set(contractId ?? 0);
    this.selectedAddressId.set(0);
    this.selectedDeviceId.set(null);
    this.pontoGasService.clearGasPointsByAddress();
    this.pressureService.reset();
    if (contractId && contractId > 0) {
      this.contractService.getAllowedAddresses(contractId);
      if (this.isSuperAdmin()) {
        const contract = this.contractService.contracts().find((c) => c.id === contractId);
        if (contract) this.selectedCompanyId.set(contract.companyId);
      }
    }
  }

  onAddressChange(addressId: number): void {
    this.selectedAddressId.set(addressId ?? 0);
    this.selectedDeviceId.set(null);
    this.pressureService.reset();
    if (addressId && addressId > 0) {
      this.pontoGasService.getByAddressId(addressId, { page: 1, pageSize: 100 });
    } else {
      this.pontoGasService.clearGasPointsByAddress();
    }
  }

  /** Avalia a leitura ao vivo mais recente e dispara o alerta de pressão crítica (#70). */
  private evaluateCriticalPressureAlert(): void {
    const stats = this.pressureService.stats();
    const reading = stats.latestReading;
    if (!reading) return;
    // Sem nível não há alerta a avaliar: linha sem casco não é linha crítica.
    if (stats.currentPercentage === null) return;
    this.alertService.evaluate({
      deviceId: reading.deviceId,
      sensorId: reading.sensorId ?? null,
      level: stats.tankStatus.level,
      percentage: stats.currentPercentage,
      pressureBar: reading.pressureBar,
      datetime: reading.datetime,
      timestamp: reading.timestamp,
    });
  }

  onDeviceChange(deviceId: string | number | null): void {
    this.alertService.reset();
    if (deviceId == null) {
      this.selectedDeviceId.set(null);
      this.pressureService.reset();
      return;
    }
    const id = typeof deviceId === 'string' ? deviceId : String(deviceId);
    this.selectedDeviceId.set(id);
  }

  onChartDeviceChange(deviceId: string | number | null): void {
    if (deviceId == null) return;
    const id = typeof deviceId === 'string' ? deviceId : String(deviceId);
    this.selectedDeviceId.set(id);
  }

  onTimelineChange(value: string | number | null): void {
    if (value == null) return;
    const minutes = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(minutes) || minutes <= 0) return;
    this.selectedTimelineMinutes.set(minutes);
    this.useCustomRange.set(false);
    const range = this.resolveTimelineRange(minutes);
    this.customStartDate.set(this.toDateInputValue(range.startTimestamp));
    this.customEndDate.set(this.toDateInputValue(range.endTimestamp));
    this.showCustomDatePicker.set(false);
    this.showEndDateInput.set(false);
    const dev = this.selectedDeviceId();
    if (dev) this.loadData(dev);
  }

  toggleCustomDatePicker(): void {
    const nextOpen = !this.showCustomDatePicker();
    this.showCustomDatePicker.set(nextOpen);
    if (!nextOpen) {
      this.useCustomRange.set(false);
      this.showEndDateInput.set(false);
      const dev = this.selectedDeviceId();
      if (dev) this.loadData(dev);
    }
  }

  openEndDateInput(): void {
    this.showEndDateInput.set(true);
  }

  onCustomDateChange(kind: 'start' | 'end', value: string | null): void {
    if (kind === 'start') {
      this.customStartDate.set(value ?? '');
      this.customEndDate.set('');
      this.useCustomRange.set(false);
      this.showEndDateInput.set(false);
    } else {
      this.customEndDate.set(value ?? '');
      this.useCustomRange.set(true);
    }

    const dev = this.selectedDeviceId();
    if (!dev) return;
    if (!this.resolveCustomRange()) return;
    this.loadData(dev);
  }

  /** Called by the streaming chart's onRefresh callback */
  onStreamingRefresh(): void {
    if (document.hidden) return;
    this.pressureService.fetchNewReadings();
  }

  retryLoad(): void {
    const dev = this.selectedDeviceId();
    if (dev) this.loadData(dev);
  }

  private loadData(codigoSensor: string): void {
    const requestVersion = ++this.loadRequestVersion;
    const [devicePart, sensorPart] = codigoSensor.split('|');
    const deviceId = devicePart ?? '';
    const sensorId = sensorPart != null ? parseInt(sensorPart, 10) : undefined;
    const range =
      this.resolveCustomRange() ?? this.resolveTimelineRange(this.selectedTimelineMinutes());
    const { startTimestamp, endTimestamp } = range;
    const rangeMinutes = Math.max(1, Math.floor((endTimestamp - startTimestamp) / 60));
    const limit = this.resolveLimitForTimeline(rangeMinutes);
    const opts: { limit: number; sensorId?: number; startTimestamp: number; endTimestamp: number } =
      {
        limit,
        startTimestamp,
        endTimestamp,
      };
    if (sensorId != null && !isNaN(sensorId)) opts.sensorId = sensorId;
    this.pressureService.fetchReadings(deviceId, opts).subscribe({
      next: () => {
        if (this.shouldAutoPaginate(rangeMinutes)) {
          this.loadRemainingPages(requestVersion);
        }
      },
    });
  }

  private resolveLimitForTimeline(minutes: number): number {
    if (minutes === 0 || minutes >= 30 * 24 * 60) return 500;
    if (minutes >= 24 * 60) return 400;
    return 300;
  }

  private resolveTimelineRange(minutes: number): { startTimestamp: number; endTimestamp: number } {
    const endTimestamp = Math.floor(Date.now() / 1000);
    const safeMinutes = minutes > 0 ? minutes : DEFAULT_TIMELINE_MINUTES;
    return {
      startTimestamp: endTimestamp - safeMinutes * 60,
      endTimestamp,
    };
  }

  private resolveCustomRange(): { startTimestamp: number; endTimestamp: number } | null {
    if (!this.useCustomRange()) return null;
    const startRaw = this.customStartDate();
    const endRaw = this.customEndDate();
    if (!startRaw || !endRaw) return null;

    const startDate = new Date(`${startRaw}T00:00:00`);
    const endDate = new Date(`${endRaw}T23:59:59`);
    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) return null;

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    if (startTimestamp > endTimestamp) return null;

    return { startTimestamp, endTimestamp };
  }

  private toDateInputValue(unixSeconds: number): string {
    const date = new Date(unixSeconds * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private shouldAutoPaginate(minutes: number): boolean {
    return minutes === 0 || minutes >= 24 * 60;
  }

  private loadRemainingPages(requestVersion: number, pageCount = 0): void {
    const MAX_EXTRA_PAGES = 20;
    if (requestVersion !== this.loadRequestVersion) return;
    if (!this.pressureService.hasMore()) return;
    if (pageCount >= MAX_EXTRA_PAGES) return;

    this.pressureService.loadMore().subscribe({
      next: (rows) => {
        if (requestVersion !== this.loadRequestVersion) return;
        if (rows.length === 0) return;
        this.loadRemainingPages(requestVersion, pageCount + 1);
      },
    });
  }
}
