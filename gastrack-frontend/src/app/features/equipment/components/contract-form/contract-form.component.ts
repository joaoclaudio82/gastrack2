import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { AddressService } from '@core/services/address.service';
import { CompanyService } from '@core/services/company.service';
import { NotificationService } from '@core/services/notification.service';
import type { AddressRequest } from '@models/address.model';
import type { Contract, ContractRequest } from '@models/contract.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ComboboxComponent } from '@shared/components/ui/combobox/combobox.component';
import { DatePickerComponent } from '@shared/components/ui/date-picker/date-picker.component';
import { FormSectionComponent } from '@shared/components/ui/form-section/form-section.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { MultiSelectComponent } from '@shared/components/ui/multi-select/multi-select.component';
import { distinctUntilChanged } from 'rxjs/operators';
import { AddressFormComponent } from '../../../admin/components/address-form/address-form.component';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    ButtonComponent,
    ComboboxComponent,
    DatePickerComponent,
    MultiSelectComponent,
    AddressFormComponent,
    FormSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (useModal()) {
      <app-modal [isOpen]="isOpen()" [title]="resolvedTitle()" size="md" (closed)="onClose()">
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
        @if (preselectedCompanyId()) {
          <app-form-section title="Empresa">
            <p class="text-sm text-foreground py-1">
              {{ preselectedCompanyName() ?? selectedCompanyName() ?? 'Empresa pré-selecionada' }}
            </p>
          </app-form-section>
        } @else {
          <app-combobox
            label="Empresa"
            placeholder="Digite para buscar empresa..."
            formControlName="companyId"
            [options]="companyOptionsForCombobox()"
            [required]="true"
            [error]="getFieldError('companyId')"
            [loading]="companyService.isLoading()"
            emptyMessage="Nenhuma empresa encontrada"
          />
        }

        <div class="grid grid-cols-2 gap-4">
          <app-date-picker
            label="Data de Início"
            placeholder="Selecione a data"
            formControlName="startDate"
            [minDate]="minStartDate()"
            [required]="true"
            [error]="getFieldError('startDate')"
          />

          <app-date-picker
            label="Data de Fim"
            placeholder="Selecione a data"
            formControlName="endDate"
            [minDate]="minEndDate()"
            [error]="endDateError()"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-foreground">
              Endereços permitidos
              <span class="ml-0.5 text-destructive">*</span>
            </span>
            <button
              type="button"
              class="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="!canSelectAddresses()"
              (click)="openAddressForm()"
            >
              <svg
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Criar novo endereço
            </button>
          </div>
          <app-multi-select
            addMoreLabel="Adicionar endereço"
            emptyMessage="Nenhum endereço encontrado para a empresa selecionada"
            hint="Somente esses endereços poderão receber kits deste contrato"
            [options]="addressOptions()"
            [(value)]="selectedAddressIds"
            [disabled]="!canSelectAddresses()"
            [error]="addressesError()"
            (itemAdded)="markAddressesTouched()"
            (itemRemoved)="markAddressesTouched()"
          />
        </div>

        <app-input
          label="Quantidade de Kits"
          type="number"
          placeholder="0"
          formControlName="kitQuantity"
          [required]="true"
          [error]="getFieldError('kitQuantity')"
        />

        <app-input
          label="Observações"
          placeholder="Observações sobre o contrato"
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

    <!-- Address Form Modal -->
    <app-address-form
      [isOpen]="isAddressFormOpen()"
      [address]="null"
      [preselectedCompanyId]="selectedCompanyId()"
      [preselectedCompanyName]="selectedCompanyName()"
      [isLoading]="addressService.isLoading()"
      (submitted)="onAddressSubmit($event)"
      (closed)="closeAddressForm()"
    />
  `,
})
export class ContractFormComponent {
  private readonly fb = inject(FormBuilder);
  readonly companyService = inject(CompanyService);
  readonly addressService = inject(AddressService);
  private readonly notificationService = inject(NotificationService);

  readonly isOpen = input(true);
  readonly contract = input<Contract | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly useModal = input(true);
  readonly title = input<string | null>(null);
  readonly submitLabel = input<string | null>(null);
  readonly preselectedCompanyId = input<number | null>(null);
  readonly preselectedCompanyName = input<string | null>(null);

  readonly submitted = output<ContractRequest>();
  readonly closed = output();

  readonly selectedAddressIds = signal<number[]>([]);
  readonly selectedCompanyId = signal<number | null>(null);
  readonly addressesTouched = signal(false);
  readonly isAddressFormOpen = signal(false);
  readonly minEndDate = signal<Date | null>(null);

  readonly minStartDate = computed(() => {
    if (this.contract()) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  readonly companyOptionsForCombobox = computed(() =>
    this.companyService.companyOptions().map((o) => ({
      label: o.label,
      value: o.value as string | number,
      disabled: false,
    })),
  );

  readonly selectedCompanyName = computed(() => {
    const companyId = this.selectedCompanyId();
    if (!companyId) return null;
    const option = this.companyService.companyOptions().find((o) => Number(o.value) === companyId);
    return option?.label ?? null;
  });

  /** Endereços da empresa selecionada (fluxo empresa -> endereço) */
  readonly addressOptions = computed(() =>
    this.addressService.companyAddresses().map((address) => ({
      label: address.name || address.fullAddress,
      value: address.id,
      description: address.fullAddress,
    })),
  );

  readonly form = this.fb.nonNullable.group(
    {
      companyId: [null as number | null, [Validators.required, Validators.min(1)]],
      startDate: ['', [Validators.required]],
      endDate: [''],
      kitQuantity: [1, [Validators.required, Validators.min(1)]],
      notes: [''],
    },
    { validators: [ContractFormComponent.endDateAfterStartDate] },
  );

  private static endDateAfterStartDate(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (!start || !end) return null;
    return end < start ? { endDateBeforeStart: true } : null;
  }

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const contract = this.contract();
      const preselectedCompanyId = this.preselectedCompanyId();

      if (isOpen) {
        // Load companies for select
        this.companyService.getActive();
        this.addressesTouched.set(false);
        if (contract) {
          this.addressService.getByCompany(contract.companyId);
          this.populateForm(contract);
          this.addressService.getByCompany(contract.companyId);
        } else if (preselectedCompanyId && preselectedCompanyId > 0) {
          this.resetForm();
          this.form.patchValue({ companyId: preselectedCompanyId }, { emitEvent: false });
          this.handleCompanyChange(preselectedCompanyId);
        } else {
          this.resetForm();
        }
      } else {
        this.selectedAddressIds.set([]);
        this.addressesTouched.set(false);
      }
    });

    const companyControl = this.form.get('companyId');
    if (companyControl) {
      companyControl.valueChanges
        .pipe(distinctUntilChanged(), takeUntilDestroyed())
        .subscribe((value) => {
          const companyId =
            typeof value === 'number' ? value : value != null ? Number(value) : null;
          this.handleCompanyChange(companyId);
        });
    }

    const startDateControl = this.form.get('startDate');
    if (startDateControl) {
      startDateControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
        if (value) {
          const d = new Date(value + 'T00:00:00');
          this.minEndDate.set(isNaN(d.getTime()) ? null : d);
        } else {
          this.minEndDate.set(null);
        }
      });
    }
  }

  private resetForm(): void {
    this.form.reset({
      companyId: null,
      startDate: '',
      endDate: '',
      kitQuantity: 1,
      notes: '',
    });
    this.selectedCompanyId.set(null);
    this.selectedAddressIds.set([]);
    this.addressesTouched.set(false);
  }

  private populateForm(contract: Contract): void {
    const startDateValue = this.extractDatePart(contract.startDate);
    const endDateValue = this.extractDatePart(contract.endDate);

    this.form.patchValue({
      companyId: contract.companyId,
      startDate: startDateValue,
      endDate: endDateValue,
      kitQuantity: contract.kitQuantity,
      notes: contract.notes ?? '',
    });
    this.selectedAddressIds.set(contract.allowedAddressIds ?? []);
    this.addressesTouched.set(false);
  }

  resolvedTitle(): string {
    return this.title() ?? (this.contract() ? 'Editar Contrato' : 'Novo Contrato');
  }

  resolvedSubmitLabel(): string {
    return this.submitLabel() ?? (this.contract() ? 'Salvar' : 'Criar Contrato');
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
    if (control.errors['min']) {
      if (fieldName === 'companyId') return 'Selecione uma empresa';
      return 'Valor mínimo é 1';
    }

    return '';
  }

  endDateError(): string {
    const fieldError = this.getFieldError('endDate');
    if (fieldError) return fieldError;
    const endControl = this.form.get('endDate');
    if (!endControl?.touched) return '';
    if (this.form.errors?.['endDateBeforeStart']) return 'Data fim deve ser após a data de início';
    return '';
  }

  addressesError(): string {
    if (!this.addressesTouched()) return '';
    if (!this.canSelectAddresses()) return 'Selecione uma empresa para listar os endereços';
    if (this.selectedAddressIds().length === 0) return 'Selecione pelo menos um endereço';
    return '';
  }

  markAddressesTouched(): void {
    this.addressesTouched.set(true);
  }

  canSelectAddresses(): boolean {
    const companyId = this.form.get('companyId')?.value;
    return typeof companyId === 'number' && companyId > 0;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const companyId = formValue.companyId;
    if (companyId == null || companyId < 1) return;
    if (this.selectedAddressIds().length === 0) {
      this.addressesTouched.set(true);
      return;
    }

    const request: ContractRequest = {
      companyId,
      allowedAddressIds: this.selectedAddressIds(),
      addressIds: this.selectedAddressIds().length > 0 ? this.selectedAddressIds() : null,
      startDate: formValue.startDate,
      endDate: formValue.endDate || null,
      kitQuantity: formValue.kitQuantity,
      notes: formValue.notes || null,
    };

    this.submitted.emit(request);
  }

  openAddressForm(): void {
    this.isAddressFormOpen.set(true);
  }

  closeAddressForm(): void {
    this.isAddressFormOpen.set(false);
  }

  onAddressSubmit(data: AddressRequest): void {
    this.addressService.create(data).subscribe({
      next: (address) => {
        this.notificationService.success('Endereço criado com sucesso!');
        this.closeAddressForm();
        const companyId = this.selectedCompanyId();
        if (companyId) {
          this.addressService.getByCompany(companyId);
        }
        this.selectedAddressIds.set([...this.selectedAddressIds(), address.id]);
      },
      error: () => {
        this.notificationService.error('Erro ao criar endereço.');
      },
    });
  }

  onClose(): void {
    this.resetForm();
    this.closed.emit();
  }

  private handleCompanyChange(companyId: number | null): void {
    this.selectedCompanyId.set(companyId && companyId > 0 ? companyId : null);
    if (!companyId || companyId < 1) {
      this.selectedAddressIds.set([]);
      this.addressesTouched.set(false);
      return;
    }
    this.addressService.getByCompany(companyId);
    this.selectedAddressIds.set([]);
    this.addressesTouched.set(false);
  }
}
