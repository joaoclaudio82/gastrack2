import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/auth/services/auth.service';
import { AddressService } from '@core/services/address.service';
import { CompanyService } from '@core/services/company.service';
import { ContractService } from '@core/services/contract.service';
import { NotificationService } from '@core/services/notification.service';
import type { AddressRequest } from '@models/address.model';
import { CONTRACT_STATUS, type Contract, type ContractAddress } from '@models/contract.model';
import type { EquipmentKit, EquipmentKitRequest } from '@models/equipment-kit.model';
import { UserRole } from '@models/role.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import {
  ComboboxComponent,
  type ComboboxOption,
} from '@shared/components/ui/combobox/combobox.component';
import { DatePickerComponent } from '@shared/components/ui/date-picker/date-picker.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { AddressFormComponent } from '../../../admin/components/address-form/address-form.component';

@Component({
  selector: 'app-kit-form',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    ButtonComponent,
    SelectComponent,
    ComboboxComponent,
    DatePickerComponent,
    AddressFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (useModal()) {
      <app-modal [isOpen]="isOpen()" [title]="resolvedTitle()" size="lg" (closed)="onClose()">
        <ng-container [ngTemplateOutlet]="formTemplate" />

        <ng-container modal-footer>
          <app-button variant="outline" (buttonClick)="onClose()">Cancelar</app-button>
          <app-button
            variant="primary"
            [loading]="isLoading()"
            [disabled]="form.invalid"
            (buttonClick)="onSubmit()"
          >
            {{ resolvedSubmitLabel() }}
          </app-button>
        </ng-container>
      </app-modal>
    } @else {
      <ng-container [ngTemplateOutlet]="formTemplate" />
    }

    <ng-template #formTemplate>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Company filter (SUPER_ADMIN only, hidden when preselected from contract) -->
        @if (isSuperAdmin() && !preselectedCompanyId()) {
          <app-select
            label="Empresa"
            placeholder="Selecione uma empresa"
            [options]="companyOptions()"
            [ngModel]="selectedCompanyId()"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="onCompanyChange($event)"
            [required]="true"
          />
        }
        @if (isSuperAdmin() && preselectedCompanyId()) {
          <div class="space-y-1.5">
            <span class="text-sm font-medium text-foreground">Empresa</span>
            <p class="text-sm text-muted-foreground">
              {{ preselectedCompanyName() ?? 'Empresa do contrato' }}
            </p>
          </div>
        }

        @if (preselectedContractId()) {
          <div class="space-y-1.5">
            <span class="text-sm font-medium text-foreground">Contrato</span>
            <p class="text-sm text-muted-foreground">
              {{ selectedContractLabel() ?? 'Contrato pré-selecionado' }}
            </p>
          </div>
        } @else {
          <app-combobox
            label="Contrato"
            [placeholder]="
              isContractDisabled() ? 'Selecione uma empresa primeiro' : 'Busque um contrato'
            "
            emptyMessage="Nenhum contrato ativo com vagas disponíveis"
            formControlName="contractId"
            [options]="filteredContractOptions()"
            [required]="true"
            [clearable]="false"
            [filterLocally]="false"
            [loading]="contractService.isLoading()"
            (searchChange)="onContractSearch($event)"
            [disabledInput]="isContractDisabled()"
            [error]="getFieldError('contractId')"
            [hint]="selectedContractHint()"
          />
        }

        <div class="space-y-1.5">
          <span class="text-sm font-medium text-foreground" id="address-label">
            Endereço de Instalação
            <span class="ml-0.5 text-destructive">*</span>
          </span>
          <div class="flex gap-2">
            <div class="flex-1 min-w-0">
              <app-select
                [placeholder]="
                  isAddressDisabled() ? 'Selecione um contrato primeiro' : 'Selecione um endereço'
                "
                formControlName="addressId"
                [options]="filteredAddressOptions()"
                [disabledInput]="isAddressDisabled()"
                [error]="getFieldError('addressId')"
              />
            </div>
            @if (allowCreateAddress()) {
              <app-button
                type="button"
                variant="outline"
                size="md"
                (buttonClick)="openAddressForm()"
                [disabled]="isAddressDisabled()"
                class="h-10 shrink-0"
              >
                <svg
                  class="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span class="sr-only sm:not-sr-only sm:ml-1">Novo</span>
              </app-button>
            }
          </div>
          <p class="text-xs text-muted-foreground">
            Se não houver opções, edite o contrato selecionado para habilitar endereços permitidos.
          </p>
        </div>

        <app-input
          label="Código do Kit"
          placeholder="KIT-001"
          formControlName="kitCode"
          [required]="true"
          [error]="getFieldError('kitCode')"
        />

        <div class="w-full">
          <app-date-picker
            label="Data de Instalação"
            placeholder="Selecione a data"
            formControlName="installationDate"
            [minDate]="contractMinDate()"
            [maxDate]="contractMaxDate()"
            [error]="getFieldError('installationDate')"
            class="w-full [&>div]:w-full [&_button]:w-full"
          />
        </div>

        <app-input
          label="Observações"
          placeholder="Observações sobre o kit"
          formControlName="notes"
          [error]="getFieldError('notes')"
        />
        @if (!useModal()) {
          <div class="flex justify-end">
            <app-button
              variant="primary"
              type="submit"
              [loading]="isLoading()"
              [disabled]="form.invalid"
            >
              {{ resolvedSubmitLabel() }}
            </app-button>
          </div>
        }
      </form>
    </ng-template>

    <!-- Address Form Modal (empresa pré-selecionada quando vinulado ao contrato) -->
    <app-address-form
      [isOpen]="isAddressFormOpen()"
      [address]="null"
      [preselectedCompanyId]="effectiveCompanyId()"
      [preselectedCompanyName]="effectiveCompanyName()"
      [preselectedContractId]="selectedContractId()"
      [isLoading]="addressService.isLoading()"
      (submitted)="onAddressSubmit($event)"
      (closed)="closeAddressForm()"
    />
  `,
})
export class KitFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  readonly contractService = inject(ContractService);
  readonly addressService = inject(AddressService);
  private readonly companyService = inject(CompanyService);
  private readonly notificationService = inject(NotificationService);

  readonly isOpen = input(true);
  readonly kit = input<EquipmentKit | null>(null);
  readonly preselectedCompanyId = input<number | null>(null);
  readonly preselectedCompanyName = input<string | null>(null);
  readonly preselectedContractId = input<number | null>(null);
  readonly preselectedAddressId = input<number | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly useModal = input(true);
  readonly title = input<string | null>(null);
  readonly submitLabel = input<string | null>(null);
  readonly allowCreateAddress = input(true);

  readonly submitted = output<EquipmentKitRequest>();
  readonly closed = output();

  readonly selectedCompanyId = signal<number | null>(null);
  readonly selectedContractId = signal<number | null>(null);
  readonly isAddressFormOpen = signal(false);

  // Company options (SUPER_ADMIN only)
  readonly companyOptions = computed(() => {
    const companies = this.companyService.activeCompanies();
    return companies.map((c) => ({ label: c.name, value: c.id }));
  });

  readonly effectiveCompanyId = computed(
    () => this.selectedCompanyId() ?? this.preselectedCompanyId(),
  );

  readonly effectiveCompanyName = computed(() => {
    const selectedId = this.selectedCompanyId();
    if (selectedId) {
      const company = this.companyService
        .activeCompanies()
        .find((c) => Number(c.id) === selectedId);
      return company?.name ?? null;
    }
    return this.preselectedCompanyName();
  });

  readonly selectedContractLabel = computed(() => {
    const contractId = this.selectedContractId();
    if (!contractId) return null;
    const contract = this.contractService.contracts().find((c) => c.id === contractId);
    return contract ? `${contract.contractNumber} - ${contract.companyName}` : null;
  });

  /** Contrato selecionado no momento (para hint e limites de data). */
  readonly selectedContract = computed<Contract | null>(() => {
    const id = this.selectedContractId();
    if (!id) return null;
    return this.contractService.contracts().find((c) => c.id === id) ?? null;
  });

  /**
   * Contratos ATIVOS e ainda vigentes; contratos sem vaga de kit aparecem desabilitados
   * (não some, para o usuário entender por que não pode escolher). Expirados são omitidos.
   */
  readonly filteredContractOptions = computed<ComboboxOption[]>(() => {
    const contracts = this.contractService.contracts();
    const companyId = this.effectiveCompanyId();
    const today = new Date().toISOString().slice(0, 10);
    const selectedId = this.selectedContractId();

    // O contrato já selecionado (ex.: edição) sempre entra, mesmo expirado/cheio, para
    // não deixar o campo em branco.
    let list = contracts.filter(
      (c) =>
        c.id === selectedId ||
        (c.status === CONTRACT_STATUS.ACTIVE && (!c.endDate || c.endDate >= today)),
    );

    if (this.isSuperAdmin()) {
      if (!companyId) return [];
      list = list.filter((c) => c.id === selectedId || c.companyId === companyId);
    }

    return list.map((c) => this.toContractOption(c));
  });

  private toContractOption(c: Contract): ComboboxOption {
    const full = c.remainingKitCapacity <= 0;
    const parts = [c.contractNumber];
    if (c.endDate) parts.push(`expira ${this.formatBrDate(c.endDate)}`);
    parts.push(full ? 'sem vagas' : `${c.activeKitsCount}/${c.kitQuantity} kits`);
    return { label: parts.join(' · '), value: c.id, disabled: full };
  }

  /** Texto de apoio sob o select de contrato: expiração + vagas de kit restantes. */
  readonly selectedContractHint = computed(() => {
    const c = this.selectedContract();
    if (!c) return '';
    const parts: string[] = [];
    if (c.endDate) parts.push(`Expira em ${this.formatBrDate(c.endDate)}`);
    parts.push(
      c.remainingKitCapacity > 0
        ? `${c.remainingKitCapacity} de ${c.kitQuantity} vagas de kit disponíveis`
        : 'Sem vagas de kit disponíveis neste contrato',
    );
    return parts.join(' · ');
  });

  /** Limita o date-picker ao período de vigência do contrato selecionado. */
  readonly contractMinDate = computed<Date | null>(() => {
    const start = this.selectedContract()?.startDate;
    return start ? new Date(`${start}T00:00:00`) : null;
  });

  readonly contractMaxDate = computed<Date | null>(() => {
    const end = this.selectedContract()?.endDate;
    return end ? new Date(`${end}T00:00:00`) : null;
  });

  /** "2026-05-07" -> "07/05/2026" */
  private formatBrDate(iso: string): string {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return y && m && d ? `${d}/${m}/${y}` : iso;
  }

  /** Endereços do contrato selecionado (fluxo empresa -> contrato -> endereço) */
  readonly filteredAddressOptions = computed(() => {
    const contractId = this.selectedContractId();
    if (!contractId) return [];
    const addresses = this.contractService.contractAddresses();
    if (addresses.length === 0) return [];
    return addresses.map((a: ContractAddress) => ({
      label: a.name || a.fullAddress,
      value: a.id,
    }));
  });

  isContractDisabled(): boolean {
    return this.isSuperAdmin() && !this.effectiveCompanyId();
  }

  isAddressDisabled(): boolean {
    const hasContract = (this.selectedContractId() ?? 0) > 0;
    if (!hasContract) return true;
    return this.isSuperAdmin() && !this.effectiveCompanyId();
  }

  readonly form = this.fb.nonNullable.group({
    contractId: [0, [Validators.required, Validators.min(1)]],
    addressId: [0, [Validators.required, Validators.min(1)]],
    kitCode: ['', [Validators.required, Validators.minLength(3)]],
    installationDate: [''],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const kit = this.kit();
      const preselectedCompanyId = this.preselectedCompanyId();
      const preselectedContractId = this.preselectedContractId();
      const preselectedAddressId = this.preselectedAddressId();

      if (!isOpen) return;
      // Efeitos colaterais (carregar dados / mexer no form) em untracked: o effect deve
      // depender só de isOpen/kit/preselected*, não dos signals lidos dentro de getAll/getActive
      // (ex.: getActive lê activeCompaniesSignal no check de cache -> re-executava o effect em loop).
      untracked(() => {
        this.contractService.getAll({ page: 1, pageSize: 100 });
        if (this.isSuperAdmin()) {
          this.companyService.getActive();
        }

        if (preselectedCompanyId) {
          this.selectedCompanyId.set(preselectedCompanyId);
        }

        if (kit) {
          this.selectedCompanyId.set(kit.companyId);
          this.selectedContractId.set(kit.contractId);
          this.contractService.getAllowedAddresses(kit.contractId);
          this.populateForm(kit);
        } else if (preselectedContractId && preselectedContractId > 0) {
          this.resetForm();
          this.selectedContractId.set(preselectedContractId);
          this.form.patchValue(
            {
              contractId: preselectedContractId,
              addressId: preselectedAddressId ?? 0,
            },
            { emitEvent: false },
          );
          this.contractService.getAllowedAddresses(preselectedContractId);
          this.cdr.markForCheck();
        } else {
          this.resetForm();
        }
      });
    });

    const contractControl = this.form.get('contractId');
    if (contractControl) {
      contractControl.valueChanges
        .pipe(
          filter((value): value is number => typeof value === 'number' && value > 0),
          distinctUntilChanged(),
          debounceTime(100),
          tap((contractId) => {
            this.selectedContractId.set(contractId);
            this.contractService.getAllowedAddresses(contractId);
            if (this.isSuperAdmin()) {
              const contract = this.contractService.contracts().find((c) => c.id === contractId);
              if (contract) this.selectedCompanyId.set(contract.companyId);
            }
            this.form.patchValue({ addressId: 0 }, { emitEvent: false });
          }),
          takeUntilDestroyed(),
        )
        .subscribe();
    }
  }

  private resetForm(): void {
    this.form.reset({
      contractId: 0,
      addressId: 0,
      kitCode: '',
      installationDate: '',
      notes: '',
    });
    if (!this.preselectedCompanyId()) {
      this.selectedCompanyId.set(null);
    }
    this.selectedContractId.set(null);
  }

  resolvedTitle(): string {
    return this.title() ?? (this.kit() ? 'Editar Kit' : 'Novo Kit');
  }

  resolvedSubmitLabel(): string {
    return this.submitLabel() ?? (this.kit() ? 'Salvar' : 'Criar Kit');
  }

  isSuperAdmin(): boolean {
    return this.authService.hasRole(UserRole.SUPER_ADMIN);
  }

  onCompanyChange(companyId: number | null): void {
    this.selectedCompanyId.set(companyId);
    // Reset contract and address selection when company changes
    this.form.patchValue({ contractId: 0, addressId: 0 });
    this.selectedContractId.set(null);
  }

  private contractSearchDebounce: ReturnType<typeof setTimeout> | null = null;

  /** Busca server-side de contratos (debounce). Expiração/vagas seguem como regra de exibição. */
  onContractSearch(query: string): void {
    if (this.contractSearchDebounce) clearTimeout(this.contractSearchDebounce);
    this.contractSearchDebounce = setTimeout(() => {
      this.contractService.getAll({ page: 1, pageSize: 50 }, { search: query.trim() || null });
    }, 300);
  }

  private populateForm(kit: EquipmentKit): void {
    this.selectedContractId.set(kit.contractId);
    this.selectedCompanyId.set(kit.companyId);
    this.form.patchValue({
      contractId: kit.contractId,
      addressId: kit.addressId,
      kitCode: kit.kitCode,
      installationDate: this.extractDatePart(kit.installationDate),
      notes: kit.notes ?? '',
    });
  }

  private extractDatePart(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const parts = dateString.split('T');
    return parts[0] ?? '';
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['minlength']) return 'Mínimo de 3 caracteres';
    if (control.errors['min']) {
      if (fieldName === 'contractId') return 'Selecione um contrato';
      if (fieldName === 'addressId') return 'Selecione um endereço';
      return 'Valor inválido';
    }
    if (control.errors['beforeContract']) return 'Data não pode ser anterior ao início do contrato';
    if (control.errors['afterContract']) return 'Data não pode ser posterior ao fim do contrato';

    return '';
  }

  // Address form methods
  openAddressForm(): void {
    this.isAddressFormOpen.set(true);
  }

  closeAddressForm(): void {
    this.isAddressFormOpen.set(false);
  }

  onAddressSubmit(data: AddressRequest): void {
    this.addressService.create(data).subscribe({
      next: (address) => {
        const contractId = this.form.get('contractId')?.value;
        if (!contractId) {
          this.notificationService.warning(
            'Endereço criado. Selecione um contrato para habilitá-lo.',
          );
          return;
        }
        const contract = this.contractService.contracts().find((c) => c.id === contractId);
        if (!contract) {
          this.notificationService.error('Contrato não encontrado para habilitar o endereço.');
          return;
        }
        const updatedIds = Array.from(new Set([...(contract.allowedAddressIds ?? []), address.id]));
        this.contractService.updateAddresses(contractId, { addressIds: updatedIds }).subscribe({
          next: () => {
            this.notificationService.success('Endereço criado e habilitado no contrato!');
            this.contractService.getAllowedAddresses(contractId);
            this.form.patchValue({ addressId: address.id });
            this.closeAddressForm();
          },
          error: () => {
            this.notificationService.error('Erro ao habilitar o endereço no contrato.');
          },
        });
      },
      error: () => {
        this.notificationService.error('Erro ao criar endereço.');
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    // Validate installation date within contract validity period
    if (formValue.installationDate) {
      const contract = this.contractService.contracts().find((c) => c.id === formValue.contractId);
      if (contract) {
        const installDate = formValue.installationDate;
        if (installDate < contract.startDate) {
          this.form.get('installationDate')?.setErrors({ beforeContract: true });
          this.form.markAllAsTouched();
          return;
        }
        if (contract.endDate && installDate > contract.endDate) {
          this.form.get('installationDate')?.setErrors({ afterContract: true });
          this.form.markAllAsTouched();
          return;
        }
      }
    }

    const request: EquipmentKitRequest = {
      contractId: formValue.contractId,
      addressId: formValue.addressId,
      kitCode: formValue.kitCode,
      installationDate: formValue.installationDate || null,
      notes: formValue.notes || null,
    };

    this.submitted.emit(request);
  }

  onClose(): void {
    this.resetForm();
    this.closed.emit();
  }
}
