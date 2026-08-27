import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContractService } from '@core/services/contract.service';
import type { Contract } from '@models/contract.model';
import type { EquipmentKit } from '@models/equipment-kit.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { DatePickerComponent } from '@shared/components/ui/date-picker/date-picker.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { TextareaComponent } from '@shared/components/ui/textarea/textarea.component';

export interface KitInstallResult {
  kitId: number;
  addressId: number;
  installationDate: string | null;
  notes: string | null;
}

@Component({
  selector: 'app-kit-install-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    SelectComponent,
    DatePickerComponent,
    TextareaComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [isOpen]="isOpen()" title="Instalar Kit" size="md" (closed)="onClose()">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        @if (kit()) {
          <div class="rounded-sm border border-border bg-muted/50 p-3 space-y-1">
            <p class="text-sm font-medium">Kit</p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Código:</span>
              {{ kit()?.kitCode }}
            </p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Contrato:</span>
              {{ kit()?.contractNumber }}
            </p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Equipamentos:</span>
              {{ kit()?.equipmentCount }}
            </p>
          </div>
        }

        <app-select
          label="Endereço de Instalação"
          placeholder="Selecione o endereço"
          formControlName="addressId"
          [options]="addressOptions()"
          [required]="true"
          [error]="getFieldError('addressId')"
          hint="Endereços disponíveis da empresa do contrato"
        />
        <p class="text-xs text-muted-foreground">
          Se não houver opções, atualize o contrato para adicionar endereços permitidos.
        </p>

        <app-date-picker
          label="Data de Instalação"
          placeholder="Selecione a data"
          formControlName="installationDate"
          [minDate]="minInstallDate()"
          [maxDate]="maxInstallDate()"
          [hint]="dateHint()"
        />

        <app-textarea
          label="Observações"
          placeholder="Informações adicionais sobre a instalação (opcional)"
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
          Instalar Kit
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class KitInstallModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);

  readonly isOpen = input.required<boolean>();
  readonly kit = input<EquipmentKit | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<KitInstallResult>();
  readonly closed = output();

  readonly form = this.fb.nonNullable.group({
    addressId: [0, [Validators.required, Validators.min(1)]],
    installationDate: [''],
    notes: [''],
  });

  readonly today = new Date();

  /** Contrato do kit — dá a data de início para restringir o date-picker. */
  private readonly contract = signal<Contract | null>(null);

  /** Não permite instalar antes do início do contrato (regra do backend). */
  protected readonly minInstallDate = computed<Date | null>(() => {
    const c = this.contract();
    return c ? parseLocalDate(c.startDate) : null;
  });

  /**
   * Máximo é hoje — salvo quando o contrato começa no futuro: aí a única data válida
   * é o próprio início do contrato, então o teto sobe para não travar o formulário.
   */
  protected readonly maxInstallDate = computed<Date>(() => {
    const min = this.minInstallDate();
    return min && min > this.today ? min : this.today;
  });

  protected readonly dateHint = computed(() => {
    const min = this.minInstallDate();
    if (min && min > this.today) {
      return `Contrato inicia em ${toISO(min)} — instalação a partir dessa data.`;
    }
    return 'Data em que o kit foi instalado (máximo: hoje).';
  });

  /** Endereços do contrato do kit (fluxo contrato -> endereço) */
  protected readonly addressOptions = computed(() =>
    this.contractService.contractAddresses().map((a) => ({
      label: a.name || a.fullAddress,
      value: a.id,
    })),
  );

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        untracked(() => {
          const kitData = this.kit();
          this.contract.set(null);
          if (kitData) {
            this.contractService.getAllowedAddresses(kitData.contractId);
            this.contractService.getById(kitData.contractId).subscribe({
              next: (c) => {
                this.contract.set(c);
                // Contrato futuro: pré-seleciona o início para que exista uma data válida.
                const start = parseLocalDate(c.startDate);
                if (start > this.today) {
                  this.form.controls.installationDate.setValue(toISO(start));
                }
              },
              error: () => {
                // O errorInterceptor cuida do toast.
              },
            });
          }
          this.form.reset({
            addressId: 0,
            installationDate: this.getTodayISO(),
            notes: '',
          });
        });
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['min']) return 'Selecione um endereço';

    return '';
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
      addressId: formValue.addressId,
      installationDate: formValue.installationDate || null,
      notes: formValue.notes || null,
    });
  }

  onClose(): void {
    this.form.reset({
      addressId: 0,
      installationDate: '',
      notes: '',
    });
    this.closed.emit();
  }

  private getTodayISO(): string {
    return toISO(new Date());
  }
}

/** 'YYYY-MM-DD' -> Date no fuso local (evita o -1 dia do parse UTC de `new Date('YYYY-MM-DD')`). */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = (iso.split('T')[0] ?? '').split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

function toISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
