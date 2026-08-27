import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EquipmentKitService } from '@core/services/equipment-kit.service';
import type { Equipment } from '@models/equipment.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';

export interface EquipmentTransferResult {
  equipmentId: number;
  toKitId: number;
  notes: string | null;
}

@Component({
  selector: 'app-equipment-transfer-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, ButtonComponent, SelectComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [isOpen]="isOpen()" title="Transferir Equipamento" size="md" (closed)="onClose()">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        @if (equipment()) {
          <div class="rounded-sm border border-border bg-muted/50 p-3 space-y-1">
            <p class="text-sm font-medium">Equipamento</p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Asset Tag:</span>
              {{ equipment()?.assetTag }}
            </p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Tipo:</span>
              {{ equipment()?.equipmentTypeName }}
            </p>
            @if (equipment()?.kitCode) {
              <p class="text-xs text-muted-foreground">
                <span class="font-medium">Kit Atual:</span>
                {{ equipment()?.kitCode }}
              </p>
            }
          </div>
        }

        <app-select
          label="Kit de Destino"
          placeholder="Selecione o kit de destino"
          formControlName="toKitId"
          [options]="kitOptions()"
          [required]="true"
          [error]="getFieldError('toKitId')"
          hint="Selecione o kit para onde o equipamento será transferido"
        />

        <app-input
          label="Observações"
          placeholder="Motivo da transferência (opcional)"
          formControlName="notes"
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
          Transferir
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class EquipmentTransferModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly kitService = inject(EquipmentKitService);

  readonly isOpen = input.required<boolean>();
  readonly equipment = input<Equipment | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<EquipmentTransferResult>();
  readonly closed = output();

  readonly form = this.fb.nonNullable.group({
    toKitId: [0, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  protected readonly kitOptions = computed<SelectOption[]>(() => {
    const currentKitId = this.equipment()?.equipmentKitId;
    // Exclude current kit from options
    return this.kitService.kitOptions().filter((opt) => opt.value !== currentKitId);
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.kitService.getAll({ page: 1, pageSize: 100 });
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['min']) return 'Selecione um kit';

    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const equip = this.equipment();
    if (!equip) return;

    const formValue = this.form.getRawValue();
    this.submitted.emit({
      equipmentId: equip.id,
      toKitId: formValue.toKitId,
      notes: formValue.notes || null,
    });
  }

  onClose(): void {
    this.form.reset({
      toKitId: 0,
      notes: '',
    });
    this.closed.emit();
  }
}
