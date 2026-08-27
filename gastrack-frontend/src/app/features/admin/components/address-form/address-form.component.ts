import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PermissionService } from '@core/auth/services/permission.service';
import { CepService } from '@core/services/cep.service';
import { CompanyService } from '@core/services/company.service';
import { ContractService } from '@core/services/contract.service';
import { GeographicService } from '@core/services/geographic.service';
import type { Address, AddressRequest } from '@models/address.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ComboboxComponent } from '@shared/components/ui/combobox/combobox.component';
import { FormSectionComponent } from '@shared/components/ui/form-section/form-section.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { cep } from '@shared/validators/custom-validators';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
    ComboboxComponent,
    ButtonComponent,
    FormSectionComponent,
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
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        @if (isSuperAdmin() && !preselectedCompanyId()) {
          <app-form-section>
            <app-combobox
              label="Empresa"
              placeholder="Digite para buscar empresa..."
              formControlName="companyId"
              [required]="true"
              [options]="companyOptionsForCombobox()"
              [loading]="companyService.isLoading()"
              [error]="getFieldError('companyId')"
              emptyMessage="Nenhuma empresa encontrada"
            />
          </app-form-section>
        }
        @if (isSuperAdmin() && preselectedCompanyId()) {
          <app-form-section title="Empresa">
            <p class="text-sm text-foreground py-1">
              {{ preselectedCompanyName() ?? 'Empresa pré-selecionada' }}
            </p>
          </app-form-section>
        }

        @if (showContracts()) {
          <app-form-section title="Contratos (opcional)" divider="top">
            <div
              class="max-h-48 overflow-auto rounded-xl border border-border bg-background p-2 space-y-2"
            >
              @if (isContractSelectionDisabled()) {
                <div class="px-2 py-2 text-sm text-muted-foreground">
                  Selecione uma empresa para listar os contratos.
                </div>
              } @else if (contractSelectOptions().length === 0) {
                <div class="px-2 py-2 text-sm text-muted-foreground">
                  Nenhum contrato encontrado para a empresa selecionada.
                </div>
              } @else {
                @for (opt of contractSelectOptions(); track opt.value) {
                  <label class="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      class="h-4 w-4 accent-primary"
                      [checked]="isContractChecked(opt.value)"
                      (change)="toggleContract(opt.value)"
                    />
                    <span class="truncate">{{ opt.label }}</span>
                  </label>
                }
              }
            </div>
            @if (getFieldError('contractIds')) {
              <span class="text-xs text-destructive">{{ getFieldError('contractIds') }}</span>
            }
          </app-form-section>
        }

        <app-form-section title="Identificação" [divider]="isSuperAdmin() ? 'top' : 'none'">
          <app-input
            label="Nome do Endereço"
            placeholder="Ex: Matriz, Filial Centro, Depósito"
            formControlName="name"
            [required]="true"
            [error]="getFieldError('name')"
          />
        </app-form-section>

        <app-form-section title="Localização" divider="top">
          <app-input
            label="CEP"
            placeholder="00000-000"
            formControlName="zipCode"
            [required]="true"
            [error]="getFieldError('zipCode')"
            hint="Digite o CEP para preencher automaticamente Bairro, Rua, Cidade e Estado"
          />

          <div class="grid grid-cols-2 gap-4">
            <app-select
              label="Estado"
              placeholder="Selecione o estado"
              formControlName="stateId"
              [required]="true"
              [options]="geoService.stateOptions()"
              [error]="getFieldError('stateId')"
            />

            <app-select
              label="Cidade"
              placeholder="Selecione a cidade"
              formControlName="cityId"
              [required]="true"
              [options]="geoService.cityOptions()"
              [error]="getFieldError('cityId')"
            />
          </div>

          <app-input
            label="Bairro"
            placeholder="Preenchido automaticamente pelo CEP"
            formControlName="neighborhood"
            [error]="getFieldError('neighborhood')"
          />

          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <app-input
                label="Rua/Logradouro"
                placeholder="Preenchido automaticamente pelo CEP"
                formControlName="street"
                [required]="true"
                [error]="getFieldError('street')"
              />
            </div>

            <app-input
              label="Número"
              placeholder="Nº"
              formControlName="number"
              [error]="getFieldError('number')"
            />
          </div>

          <app-input
            label="Complemento"
            placeholder="Apto, Sala, Bloco..."
            formControlName="complement"
            [error]="getFieldError('complement')"
          />
        </app-form-section>

        <!-- Coordenadas removidas a pedido do usuário -->
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
  `,
})
export class AddressFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly permissionService = inject(PermissionService);
  private readonly cepService = inject(CepService);
  readonly companyService = inject(CompanyService);
  readonly contractService = inject(ContractService);
  readonly geoService = inject(GeographicService);

  readonly isOpen = input(true);
  readonly address = input<Address | null>(null);
  readonly preselectedCompanyId = input<number | null>(null);
  readonly preselectedCompanyName = input<string | null>(null);
  readonly preselectedContractId = input<number | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly useModal = input(true);
  readonly showContracts = input(true);
  readonly title = input<string | null>(null);
  readonly submitLabel = input<string | null>(null);

  readonly submitted = output<AddressRequest>();
  readonly closed = output();

  readonly isSuperAdmin = this.permissionService.isSuperAdmin;
  private readonly pendingCepCityName = signal<string | null>(null);
  private readonly pendingCepStateAbbreviation = signal<string | null>(null);
  private lastSearchedCep: string | null = null;

  readonly contractSelectOptions = computed(() => {
    // Para SUPER_ADMIN, só lista contratos após selecionar empresa.
    if (this.isSuperAdmin() && this.isContractSelectionDisabled()) {
      return [];
    }

    const resolvedCompanyId =
      this.preselectedCompanyId() ?? this.form.get('companyId')?.value ?? null;
    const contracts = this.contractService.contracts();
    const filtered =
      this.isSuperAdmin() && resolvedCompanyId != null
        ? contracts.filter((c) => c.companyId === resolvedCompanyId)
        : contracts;

    return filtered.map((c) => ({
      label: c.contractNumber,
      value: c.id,
    }));
  });

  readonly companyOptionsForCombobox = computed(() =>
    this.companyService.companyOptions().map((o) => ({
      label: o.label,
      value: o.value as string | number,
      disabled: false,
    })),
  );

  readonly form = this.fb.nonNullable.group({
    companyId: [null as number | null],
    name: ['', [Validators.required, Validators.minLength(2)]],
    contractIds: [[] as number[]],
    street: ['', [Validators.required]],
    number: [''],
    complement: [''],
    neighborhood: [''],
    stateId: [null as number | null, [Validators.required]],
    cityId: [null as number | null, [Validators.required]],
    zipCode: ['', [Validators.required, cep()]],
  });

  constructor() {
    effect(() => {
      const address = this.address();
      const preselectedCompanyId = this.preselectedCompanyId();
      const preselectedContractId = this.preselectedContractId();
      const isOpen = this.isOpen();
      const showContracts = this.showContracts();

      if (isOpen) {
        if (this.isSuperAdmin() && !preselectedCompanyId) {
          this.companyService.getActive();
        }
        if (address) {
          this.populateForm(address);
          if (showContracts) {
            this.contractService.getByCompany(address.companyId, { page: 1, pageSize: 100 });
          }
        } else if (preselectedCompanyId) {
          this.form.patchValue({ companyId: preselectedCompanyId }, { emitEvent: false });
          if (showContracts) {
            this.contractService.getByCompany(preselectedCompanyId, { page: 1, pageSize: 100 });
          }
        }
        if (!address && preselectedContractId && showContracts) {
          this.form.patchValue({ contractIds: [preselectedContractId] }, { emitEvent: false });
        }
      }
    });

    effect(() => {
      const pendingStateAbbreviation = this.pendingCepStateAbbreviation();
      const states = this.geoService.states();
      if (!pendingStateAbbreviation || states.length === 0) {
        return;
      }

      const state = states.find(
        (s) =>
          s.abbreviation?.toUpperCase().trim() === pendingStateAbbreviation.toUpperCase().trim(),
      );
      if (!state) {
        return;
      }

      this.form.patchValue({ stateId: state.id });
      this.geoService.getCitiesByState(state.id);
      this.pendingCepStateAbbreviation.set(null);
      this.cdr.markForCheck();
    });

    effect(() => {
      const pendingCity = this.pendingCepCityName();
      const cities = this.geoService.cities();
      if (pendingCity && cities.length > 0) {
        const city = cities.find(
          (c) => c.name.toLowerCase().trim() === pendingCity.toLowerCase().trim(),
        );
        if (city) {
          this.form.patchValue({ cityId: city.id });
          this.cdr.markForCheck();
        }
        this.pendingCepCityName.set(null);
      }
    });

    // Load contracts when company changes (super admin)
    this.form.get('companyId')?.valueChanges.subscribe((companyId) => {
      if (!this.isSuperAdmin() || !this.showContracts()) return;
      // Reset contract selection when company changes
      this.form.patchValue({ contractIds: [] }, { emitEvent: false });
      if (companyId) {
        this.contractService.getByCompany(companyId, { page: 1, pageSize: 100 });
      }
    });

    this.form.get('zipCode')?.valueChanges.subscribe((value) => {
      const digitsOnly = (value ?? '').replace(/\D/g, '');
      if (digitsOnly.length !== 8) {
        this.lastSearchedCep = null;
        return;
      }
      if (digitsOnly === this.lastSearchedCep) {
        return;
      }
      this.lastSearchedCep = digitsOnly;
      this.searchCep(digitsOnly);
    });

    // Subscribe to state changes to load cities
    this.form.get('stateId')?.valueChanges.subscribe((stateId) => {
      const cityControl = this.form.get('cityId');

      if (stateId) {
        // Enable city select and load cities
        cityControl?.enable({ emitEvent: false });
        this.geoService.getCitiesByState(stateId);

        // Reset city when state changes (only if not editing)
        if (!this.address()) {
          this.form.patchValue({ cityId: null }, { emitEvent: false });
        }
      } else {
        // Disable city select and clear options
        cityControl?.disable({ emitEvent: false });
        this.form.patchValue({ cityId: null }, { emitEvent: false });
        this.geoService.clearCities();
      }
    });

    this.form.get('cityId')?.disable({ emitEvent: false });
  }

  protected isContractChecked(value: string | number | null): boolean {
    if (value == null) return false;
    const id = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(id) || id <= 0) return false;
    return (this.form.get('contractIds')?.value ?? []).includes(id);
  }

  protected toggleContract(value: string | number | null): void {
    if (this.isContractSelectionDisabled()) return;
    if (value == null) return;
    const id = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(id) || id <= 0) return;
    const current = this.form.get('contractIds')?.value ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.form.patchValue({ contractIds: next });
  }

  protected isContractSelectionDisabled(): boolean {
    const preselectedCompanyId = this.preselectedCompanyId();
    const companyId = this.form.get('companyId')?.value ?? null;
    const resolvedCompanyId = preselectedCompanyId ?? companyId;
    if (!this.isSuperAdmin()) return false;
    return resolvedCompanyId == null || resolvedCompanyId <= 0;
  }

  private searchCep(zipCodeValue?: string): void {
    const zipCode = zipCodeValue ?? this.form.get('zipCode')?.value ?? '';
    if (zipCode.replace(/\D/g, '').length !== 8) return;

    this.cepService.fetch(zipCode).subscribe((result) => {
      if (!result) return;

      const patch: Record<string, string> = {
        street: result.street,
        neighborhood: result.neighborhood,
        zipCode: result.zipCode,
      };
      if (result.complement) {
        patch['complement'] = result.complement;
      }
      this.form.patchValue(patch, { emitEvent: false });
      this.cdr.markForCheck();

      const states = this.geoService.states();
      const state = states.find(
        (s) =>
          s.abbreviation?.toUpperCase().trim() === result.stateAbbreviation.toUpperCase().trim(),
      );
      if (state) {
        this.form.patchValue({ stateId: state.id });
        this.geoService.getCitiesByState(state.id);
        this.pendingCepCityName.set(result.cityName);
        this.pendingCepStateAbbreviation.set(null);
        this.cdr.markForCheck();
      } else {
        this.pendingCepStateAbbreviation.set(result.stateAbbreviation);
        this.pendingCepCityName.set(result.cityName);
      }
    });
  }

  ngOnInit(): void {
    // Load states for Brazil (countryId = 1)
    this.geoService.getStatesByCountry(1);

    // Load active companies for super admin
    if (this.isSuperAdmin()) {
      this.companyService.getActive();
    }
  }

  private populateForm(address: Address): void {
    // Enable city control first if state exists
    if (address.stateId) {
      this.form.get('cityId')?.enable({ emitEvent: false });
      this.geoService.getCitiesByState(address.stateId);
    }

    this.form.patchValue({
      companyId: address.companyId ?? null,
      name: address.name,
      contractIds: [],
      street: address.street,
      number: address.number ?? '',
      complement: address.complement ?? '',
      neighborhood: address.neighborhood ?? '',
      stateId: address.stateId,
      cityId: address.cityId,
      zipCode: address.zipCode,
    });
  }

  resolvedTitle(): string {
    return this.title() ?? (this.address() ? 'Editar Endereço' : 'Novo Endereço');
  }

  resolvedSubmitLabel(): string {
    return this.submitLabel() ?? (this.address() ? 'Salvar' : 'Criar Endereço');
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['minlength']) return 'Mínimo de 2 caracteres';
    if (control.errors['cep']) return 'CEP inválido';

    return '';
  }

  onSubmit(): void {
    const preselected = this.preselectedCompanyId();
    const formCompanyId = this.form.value.companyId;

    if (this.isSuperAdmin() && !preselected && !formCompanyId) {
      this.form.get('companyId')?.markAsTouched();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    // cityId is validated as required, so it will always have a value here
    const cityId = formValue.cityId;
    if (cityId === null) {
      return;
    }

    const request: AddressRequest = {
      name: formValue.name,
      street: formValue.street,
      number: formValue.number || undefined,
      complement: formValue.complement || undefined,
      neighborhood: formValue.neighborhood || undefined,
      cityId,
      zipCode: formValue.zipCode,
      contractIds: (formValue.contractIds ?? []).filter((x) => typeof x === 'number' && x > 0),
    };

    if (this.isSuperAdmin()) {
      const companyId = preselected ?? formValue.companyId;
      if (companyId != null) {
        request.companyId = companyId;
      }
    }

    this.submitted.emit(request);
  }

  onClose(): void {
    this.form.reset();
    this.geoService.clearCities();
    this.closed.emit();
  }
}
