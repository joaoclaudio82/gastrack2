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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/auth/services/auth.service';
import { AddressService } from '@core/services/address.service';
import { CompanyService } from '@core/services/company.service';
import { ContractService } from '@core/services/contract.service';
import type { Address } from '@models/address.model';
import { CONTRACT_STATUS } from '@models/contract.model';
import type { PontoGas, PontoGasRequest } from '@models/ponto-gas.model';
import { UserRole } from '@models/role.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ComboboxComponent } from '@shared/components/ui/combobox/combobox.component';
import { FormSectionComponent } from '@shared/components/ui/form-section/form-section.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';

@Component({
  selector: 'app-ponto-gas-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    FormSectionComponent,
    ComboboxComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="pontoGas() ? 'Editar Ponto de Gás' : 'Novo Ponto de Gás'"
      size="md"
      (closed)="onClose()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <!--
          ADMIN opera uma empresa só: o campo some e o valor vem do usuário logado.
          Oferecer a lista abriria caminho para escolher outra e tomar 403 do backend.
        -->
        @if (canChooseCompany()) {
          <app-form-section>
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
          </app-form-section>
        }

        <app-form-section divider="top">
          <app-select
            label="Contrato vigente"
            placeholder="{{
              contractOptions().length ? 'Selecione o contrato' : 'Selecione uma empresa primeiro'
            }}"
            formControlName="contractId"
            [required]="true"
            [options]="contractOptions()"
            [error]="getFieldError('contractId')"
            [disabled]="!selectedCompanyId()"
          />
        </app-form-section>

        <app-form-section divider="top">
          <app-select
            label="Endereço"
            hint="Apenas endereços vinculados ao contrato selecionado"
            placeholder="{{
              addressOptions().length ? 'Selecione o endereço' : 'Selecione um contrato primeiro'
            }}"
            formControlName="addressId"
            [required]="true"
            [options]="addressOptions()"
            [error]="getFieldError('addressId')"
            [disabled]="!selectedContractId()"
          />
        </app-form-section>

        <app-form-section divider="top">
          <app-input
            label="Localização física"
            hint="Campo dedicado para informar a localização física do ponto de gás."
            placeholder="Ex: Ponto 1 - Bloco A, térreo, próximo ao elevador de serviço; ou Leito 3, Ala Norte, quarto 305"
            formControlName="location"
            [required]="true"
            [error]="getFieldError('location')"
          />
        </app-form-section>
      </form>

      <ng-container modal-footer>
        <app-button variant="outline" (buttonClick)="onClose()">Cancelar</app-button>
        <app-button
          variant="primary"
          [loading]="isLoading()"
          [disabled]="form.invalid"
          (buttonClick)="onSubmit()"
        >
          {{ pontoGas() ? 'Salvar' : 'Criar Ponto de Gás' }}
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class PontoGasFormComponent {
  private readonly fb = inject(FormBuilder);
  readonly addressService = inject(AddressService);
  readonly companyService = inject(CompanyService);
  readonly contractService = inject(ContractService);
  private readonly authService = inject(AuthService);

  readonly isOpen = input.required<boolean>();
  readonly pontoGas = input<PontoGas | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<PontoGasRequest>();
  readonly closed = output();

  readonly selectedCompanyId = signal<number | null>(null);
  readonly selectedContractId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    companyId: [null as number | null, [Validators.required, Validators.min(1)]],
    contractId: [null as number | null, [Validators.required, Validators.min(1)]],
    addressId: [null as number | null, [Validators.required, Validators.min(1)]],
    location: ['', [Validators.required, Validators.maxLength(255)]],
  });

  /** Só SUPER_ADMIN opera mais de uma empresa — para os demais o campo não existe. */
  readonly canChooseCompany = computed(() => this.authService.hasRole(UserRole.SUPER_ADMIN));

  /** Empresa do usuário: vem do banco via /users/me — o token não a carrega (CONVENTIONS §11). */
  private readonly currentCompanyId = computed<number | null>(() => {
    const parsed = Number(this.authService.currentCompanyId());
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  readonly companyOptionsForCombobox = computed(() =>
    this.companyService.companyOptions().map((o) => ({
      label: o.label,
      value: typeof o.value === 'number' ? o.value : Number(o.value),
      disabled: false,
    })),
  );

  readonly contractOptions = computed(() => {
    const companyId = this.selectedCompanyId();
    const contracts = this.contractService.contracts();
    const filtered = companyId == null ? [] : contracts.filter((c) => c.companyId === companyId);
    return filtered.map((c) => ({
      label: `${c.contractNumber} - ${c.companyName}`,
      value: c.id,
    }));
  });

  readonly addressOptions = computed(() => {
    const contractId = this.selectedContractId();
    if (contractId == null) return [];
    const addresses = this.contractService.contractAddresses();
    if (addresses.length === 0) return [];
    return addresses.map((a) => ({
      label: a.name || a.fullAddress,
      value: a.id,
    }));
  });

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const ponto = this.pontoGas();

      if (isOpen) {
        // /companies/active é SUPER_ADMIN-only; sem o guard, abrir o form como ADMIN
        // dava 403 e o interceptor jogava a página pra /errors/forbidden.
        if (this.authService.hasRole(UserRole.SUPER_ADMIN)) {
          this.companyService.getActive();
        }
        if (ponto) {
          this.addressService.getById(ponto.addressId).subscribe({
            next: (address: Address) => {
              this.form.patchValue({
                companyId: address.companyId,
                contractId: null,
                addressId: address.id,
                location: ponto.location,
              });
              this.selectedCompanyId.set(address.companyId);
              this.selectedContractId.set(null);
              this.contractService.getByCompanyAndStatus(
                address.companyId,
                CONTRACT_STATUS.ACTIVE,
                { page: 1, pageSize: 100 },
              );
            },
          });
        } else {
          this.resetCascade();
          this.form.reset({
            // Sem seletor de empresa, o valor precisa vir pronto — senão o form
            // nunca fica válido (companyId é required).
            companyId: this.canChooseCompany() ? null : this.currentCompanyId(),
            contractId: null,
            addressId: null,
            location: '',
          });
        }
      }
    });

    // Reage à seleção de empresa no combobox (effect não detecta mudança em form control)
    this.form
      .get('companyId')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((companyId) => {
        const value = companyId ?? null;
        this.selectedCompanyId.set(value);
        if (value != null) {
          this.contractService.getByCompanyAndStatus(value, CONTRACT_STATUS.ACTIVE, {
            page: 1,
            pageSize: 100,
          });
        }
        this.form.patchValue({ contractId: null, addressId: null }, { emitEvent: false });
        this.selectedContractId.set(null);
      });

    // Reage à seleção de contrato (effect não detecta mudança em form control)
    this.form
      .get('contractId')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((contractId) => {
        const value = contractId ?? null;
        this.selectedContractId.set(value);
        if (value != null) {
          const contracts = this.contractService.contracts();
          const contract = contracts.find((c) => c.id === value);
          if (contract) {
            this.contractService.getAllowedAddresses(contract.id);
          }
        }
        this.form.patchValue({ addressId: null }, { emitEvent: false });
      });

    // No modo edição, quando os contratos forem carregados, preencher o primeiro contrato da empresa
    effect(() => {
      const ponto = this.pontoGas();
      const contracts = this.contractService.contracts();
      const companyId = this.form.get('companyId')?.value ?? null;
      const contractId = this.form.get('contractId')?.value ?? null;
      if (ponto && contracts.length > 0 && companyId != null && contractId == null) {
        const contract = contracts.find((c) => c.companyId === companyId);
        if (contract) {
          this.form.patchValue({ contractId: contract.id }, { emitEvent: false });
          this.selectedContractId.set(contract.id);
          this.contractService.getAllowedAddresses(contract.id);
        }
      }
    });
  }

  private resetCascade(): void {
    this.selectedCompanyId.set(null);
    this.selectedContractId.set(null);
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['min']) return 'Selecione uma opção';
    if (control.errors['maxlength']) return 'Máximo de 255 caracteres';

    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    if (formValue.addressId === null) return;

    // Sem capacityLiters/fullTankPressureBar: os dois são fallback, só valem
    // para linha sem casco conectado, e a tela mostra os derivados dos cascos
    // (ARCHITECTURE §3). Omitidos, o create aplica 5 L / 140 bar e o update
    // preserva o gravado — o mapper ignora null (CONVENTIONS §1).
    const request: PontoGasRequest = {
      addressId: formValue.addressId,
      location: formValue.location,
    };

    this.submitted.emit(request);
  }

  onClose(): void {
    this.resetCascade();
    this.form.reset({
      companyId: null,
      contractId: null,
      addressId: null,
      location: '',
    });
    this.closed.emit();
  }
}
