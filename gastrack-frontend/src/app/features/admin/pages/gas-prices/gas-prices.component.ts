import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompanyService } from '@core/services/company.service';
import { GasPriceService } from '@core/services/gas-price.service';
import { NotificationService } from '@core/services/notification.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import { GAS_TYPE_LABELS, GAS_TYPE_OPTIONS, GasType } from '@models/cylinder-model.model';
import type { GasPrice } from '@models/gas-price.model';
import { BadgeComponent } from '@shared/components/ui/badge/badge.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ComboboxComponent } from '@shared/components/ui/combobox/combobox.component';
import { EmptyStateComponent } from '@shared/components/ui/empty-state/empty-state.component';
import { FormSectionComponent } from '@shared/components/ui/form-section/form-section.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { TableLoadingStateComponent } from '@shared/components/ui/table-loading-state/table-loading-state.component';

interface GasPriceGroup {
  gasType: GasType;
  label: string;
  current: GasPrice;
  history: GasPrice[];
}

@Component({
  selector: 'app-gas-prices',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    BadgeComponent,
    ButtonComponent,
    BreadcrumbComponent,
    ComboboxComponent,
    EmptyStateComponent,
    TableLoadingStateComponent,
    ModalComponent,
    SelectComponent,
    InputComponent,
    FormSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="py-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Preços de Gás</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Preço por m³ versionado por empresa e tipo de gás. Cada novo preço cria uma versão; o
            vigente é o de maior data de início.
          </p>
        </div>
        <app-button
          variant="primary"
          class="flex-shrink-0 whitespace-nowrap"
          [disabled]="selectedCompanyId() === null"
          (buttonClick)="openForm()"
        >
          Novo Preço
        </app-button>
      </div>

      <div class="max-w-sm">
        <app-combobox
          label="Empresa"
          placeholder="Selecione a empresa"
          [options]="companyOptions()"
          [ngModel]="selectedCompanyId()"
          [ngModelOptions]="{ standalone: true }"
          (ngModelChange)="onCompanyChange($event)"
          [loading]="companyService.isLoading()"
          emptyMessage="Nenhuma empresa encontrada"
          [clearable]="true"
        />
      </div>

      @if (selectedCompanyId() === null) {
        <app-empty-state
          title="Selecione uma empresa"
          description="Escolha a empresa para ver e cadastrar preços de gás."
        />
      } @else if (service.isLoading() && service.prices().length === 0) {
        <app-table-loading-state text="Carregando preços" hint="Buscando versões de preço." />
      } @else if (groups().length === 0) {
        <app-empty-state
          title="Nenhum preço cadastrado"
          description="Cadastre o primeiro preço de gás para esta empresa."
          action="Novo Preço"
          (actionClick)="openForm()"
        />
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (group of groups(); track group.gasType) {
            <div class="rounded-lg border border-border bg-card p-4 space-y-3">
              <div class="flex items-center justify-between">
                <h2 class="text-base font-semibold text-foreground">{{ group.label }}</h2>
                <app-badge variant="success">Vigente</app-badge>
              </div>
              <p class="text-2xl font-bold text-foreground">
                {{ group.current.pricePerM3 }}
                <span class="text-sm font-normal text-muted-foreground">
                  {{ group.current.currency }} / m³
                </span>
              </p>
              <p class="text-xs text-muted-foreground">
                Desde {{ group.current.validFrom | date: 'dd/MM/yyyy' }}
              </p>

              @if (group.history.length > 0) {
                <div class="pt-2 border-t border-border">
                  <p class="text-xs font-medium text-muted-foreground mb-1">Histórico</p>
                  <ul class="space-y-1">
                    @for (price of group.history; track price.id) {
                      <li class="flex justify-between text-xs text-muted-foreground">
                        <span>{{ price.pricePerM3 }} {{ price.currency }}/m³</span>
                        <span>{{ price.validFrom | date: 'dd/MM/yyyy' }}</span>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <app-modal [isOpen]="isFormOpen()" title="Novo Preço de Gás" size="md" (closed)="closeForm()">
      <div class="space-y-6">
        <app-form-section>
          <app-select
            label="Tipo de gás"
            placeholder="Selecione o tipo de gás"
            [options]="gasTypeOptions"
            [ngModel]="formGasType()"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="formGasType.set($any($event))"
            [required]="true"
          />
        </app-form-section>
        <app-form-section divider="top">
          <app-input
            type="number"
            label="Preço por m³"
            placeholder="0.00"
            [ngModel]="formPrice()"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="formPrice.set($event)"
            [required]="true"
          />
        </app-form-section>
        <app-form-section divider="top">
          <app-input
            label="Moeda"
            placeholder="BRL"
            [ngModel]="formCurrency()"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="formCurrency.set($event)"
            [required]="true"
          />
        </app-form-section>
        <app-form-section divider="top">
          <app-input
            type="date"
            label="Vigente a partir de"
            hint="Opcional. Em branco assume a data atual."
            [ngModel]="formValidFrom()"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="formValidFrom.set($event)"
          />
        </app-form-section>
      </div>

      <ng-container modal-footer>
        <app-button variant="outline" (buttonClick)="closeForm()">Cancelar</app-button>
        <app-button
          variant="primary"
          [loading]="service.isLoading()"
          [disabled]="!canSubmit()"
          (buttonClick)="submit()"
        >
          Salvar Preço
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class GasPricesComponent implements OnInit {
  readonly service = inject(GasPriceService);
  readonly companyService = inject(CompanyService);
  private readonly notification = inject(NotificationService);

  readonly gasTypeOptions = GAS_TYPE_OPTIONS;

  readonly selectedCompanyId = signal<number | null>(null);
  readonly isFormOpen = signal(false);

  readonly formGasType = signal<GasType | null>(null);
  readonly formPrice = signal<number | string | null>(null);
  readonly formCurrency = signal<string>('BRL');
  readonly formValidFrom = signal<string | null>(null);

  readonly companyOptions = computed(() =>
    this.companyService.activeCompanies().map((c) => ({ label: c.name, value: c.id })),
  );

  /** Agrupa por tipo de gás; vigente = maior validFrom, resto vira histórico. */
  readonly groups = computed<GasPriceGroup[]>(() => {
    const byType = new Map<GasType, GasPrice[]>();
    for (const price of this.service.prices()) {
      const list = byType.get(price.gasType) ?? [];
      list.push(price);
      byType.set(price.gasType, list);
    }
    const result: GasPriceGroup[] = [];
    for (const [gasType, list] of byType) {
      const sorted = [...list].sort(
        (a, b) => new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime(),
      );
      const current = sorted[0];
      if (!current) continue;
      result.push({
        gasType,
        label: GAS_TYPE_LABELS[gasType] ?? gasType,
        current,
        history: sorted.slice(1),
      });
    }
    return result.sort((a, b) => a.label.localeCompare(b.label));
  });

  readonly canSubmit = computed(() => {
    const price = this.formPrice();
    const parsed = typeof price === 'string' ? Number.parseFloat(price) : price;
    return (
      this.selectedCompanyId() !== null &&
      this.formGasType() !== null &&
      parsed !== null &&
      Number.isFinite(parsed) &&
      parsed > 0 &&
      this.formCurrency().trim().length > 0
    );
  });

  ngOnInit(): void {
    this.companyService.getActive();
  }

  onCompanyChange(value: string | number | null): void {
    if (value === null || value === '') {
      this.selectedCompanyId.set(null);
      this.service.clear();
      return;
    }
    const id = Number(value);
    if (!Number.isFinite(id)) return;
    this.selectedCompanyId.set(id);
    this.service.getByCompany(id);
  }

  openForm(): void {
    this.formGasType.set(null);
    this.formPrice.set(null);
    this.formCurrency.set('BRL');
    this.formValidFrom.set(null);
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
  }

  submit(): void {
    const companyId = this.selectedCompanyId();
    const gasType = this.formGasType();
    if (companyId === null || gasType === null || !this.canSubmit()) return;

    const rawPrice = this.formPrice();
    const pricePerM3 = typeof rawPrice === 'string' ? Number.parseFloat(rawPrice) : (rawPrice ?? 0);
    const validFrom = this.formValidFrom();

    this.service
      .create({
        companyId,
        gasType,
        pricePerM3,
        currency: this.formCurrency().trim(),
        // O date-picker devolve só a data ("2026-07-24"); o backend espera LocalDateTime,
        // então enviamos o início do dia. Em branco, o backend assume "agora".
        ...(validFrom
          ? { validFrom: validFrom.includes('T') ? validFrom : `${validFrom}T00:00:00` }
          : {}),
      })
      .subscribe({
        next: () => {
          this.notification.success('Novo preço cadastrado com sucesso!');
          this.closeForm();
          this.service.getByCompany(companyId);
        },
        error: () => {
          this.notification.error('Erro ao cadastrar o preço de gás.');
        },
      });
  }
}
