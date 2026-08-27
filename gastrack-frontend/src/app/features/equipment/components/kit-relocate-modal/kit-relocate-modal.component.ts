import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContractService } from '@core/services/contract.service';
import { CONTRACT_STATUS } from '@models/contract.model';
import type { EquipmentKit } from '@models/equipment-kit.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ComboboxComponent } from '@shared/components/ui/combobox/combobox.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { TextareaComponent } from '@shared/components/ui/textarea/textarea.component';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs/operators';

export interface KitRelocateResult {
  kitId: number;
  contractId: number;
  addressId: number;
  notes: string | null;
}

@Component({
  selector: 'app-kit-relocate-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    SelectComponent,
    ComboboxComponent,
    TextareaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [isOpen]="isOpen()" title="Migrar Kit" size="md" (closed)="onClose()">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        @if (kit()) {
          <div class="rounded-sm border border-border bg-muted/50 p-3 space-y-1">
            <p class="text-sm font-medium">Kit</p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Código:</span>
              {{ kit()?.kitCode }}
            </p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Origem:</span>
              {{ kit()?.contractNumber }} – {{ kit()?.addressName || 'Sem endereço' }}
            </p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Equipamentos:</span>
              {{ kit()?.equipmentCount }}
            </p>
          </div>
        }

        <div
          class="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800"
        >
          <svg
            class="mt-0.5 h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <div>
            A migração é sempre
            <strong>dentro da mesma empresa</strong>
            @if (kit()?.companyName) {
              ({{ kit()?.companyName }})
            }
            . Para transferir para
            <strong>outra empresa</strong>
            , remova (desinstale) o kit e reinstale no onboarding da empresa de destino.
          </div>
        </div>

        <app-combobox
          label="Novo Contrato"
          placeholder="Busque o contrato de destino"
          formControlName="contractId"
          [options]="contractOptions()"
          [required]="true"
          [clearable]="false"
          [filterLocally]="true"
          [loading]="isContractLoading()"
          [error]="getFieldError('contractId')"
          hint="Contrato ativo da mesma empresa do kit"
        />

        <app-select
          label="Novo Endereço"
          placeholder="Selecione o endereço de destino"
          formControlName="addressId"
          [options]="addressOptions()"
          [required]="true"
          [error]="getFieldError('addressId')"
          [disabled]="!hasValidContract"
          hint="Endereços da empresa do contrato selecionado"
        />
        <p class="text-xs text-muted-foreground">
          Se nenhum endereço estiver disponível, habilite novos endereços no contrato escolhido.
        </p>

        <app-textarea
          label="Observações"
          placeholder="Informações sobre a migração (opcional)"
          formControlName="notes"
          [rows]="3"
          [error]="getFieldError('notes')"
        />
      </form>

      <ng-container modal-footer>
        <app-button variant="outline" (buttonClick)="onClose()">Cancelar</app-button>
        <app-button
          variant="primary"
          [loading]="isLoading()"
          [disabled]="form.invalid"
          (buttonClick)="onSubmit()"
        >
          Migrar Kit
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class KitRelocateModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);

  readonly isOpen = input.required<boolean>();
  readonly kit = input<EquipmentKit | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<KitRelocateResult>();
  readonly closed = output();

  readonly form = this.fb.nonNullable.group({
    contractId: [0, [Validators.required, Validators.min(1)]],
    addressId: [0, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  readonly contractOptions = this.contractService.contractOptions;
  readonly isContractLoading = this.contractService.isLoading;

  /** Endereços do contrato selecionado (fluxo contrato -> endereço) */
  readonly addressOptions = computed(() =>
    this.contractService.contractAddresses().map((a) => ({
      label: a.name || a.fullAddress,
      value: a.id,
    })),
  );

  constructor() {
    effect(() => {
      const openNow = this.isOpen();
      const kitNow = this.kit();
      if (!openNow || !kitNow) return;
      const kitData = kitNow;
      // side-effects em untracked (o effect só depende de isOpen/kit)
      untracked(() => {
        // Escopo à empresa do kit: migração é sempre same-company (backend bloqueia cross-company).
        this.contractService.getByCompanyAndStatus(kitData.companyId, CONTRACT_STATUS.ACTIVE, {
          page: 1,
          pageSize: 200,
        });
        this.contractService.getAllowedAddresses(kitData.contractId);
        this.form.patchValue({
          contractId: kitData.contractId,
          addressId: kitData.addressId || 0,
          notes: '',
        });
      });
    });

    const contractControl = this.form.get('contractId');
    if (contractControl) {
      contractControl.valueChanges
        .pipe(
          filter((v): v is number => typeof v === 'number' && v > 0),
          distinctUntilChanged(),
          debounceTime(100),
          tap((contractId) => {
            this.contractService.getAllowedAddresses(contractId);
            this.form.patchValue({ addressId: 0 }, { emitEvent: false });
          }),
          takeUntilDestroyed(),
        )
        .subscribe();
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['min']) return 'Selecione uma opção válida';

    return '';
  }

  get hasValidContract(): boolean {
    const contractId = this.form.get('contractId')?.value;
    if (!contractId) return false;
    const contract = this.contractService.contracts().find((c) => c.id === contractId);
    return Boolean(contract?.companyId);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const kitData = this.kit();
    if (!kitData) return;

    const formValue = this.form.getRawValue();
    this.submitted.emit({
      kitId: kitData.id,
      contractId: formValue.contractId,
      addressId: formValue.addressId,
      notes: formValue.notes || null,
    });
  }

  onClose(): void {
    this.form.reset({
      contractId: 0,
      addressId: 0,
      notes: '',
    });
    this.closed.emit();
  }
}
