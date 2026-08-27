import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EquipmentKitService } from '@core/services/equipment-kit.service';
import type { Equipment } from '@models/equipment.model';
import { EQUIPMENT_CONDITION_LABELS } from '@models/equipment.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';

export interface EquipmentKitAssignResult {
  equipmentId: number;
  kitId: number;
}

@Component({
  selector: 'app-equipment-kit-assign-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, ButtonComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [isOpen]="isOpen()"
      title="Atribuir Equipamento a um Kit"
      size="md"
      (closed)="onClose()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        @if (equipment()) {
          <div class="rounded-sm border border-border bg-muted/50 p-3 space-y-1">
            <p class="text-sm font-medium">Equipamento Selecionado</p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Asset Tag:</span>
              {{ equipment()?.assetTag }}
            </p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Tipo:</span>
              {{ equipment()?.equipmentTypeName }}
            </p>
            @if (equipment()?.serialNumber) {
              <p class="text-xs text-muted-foreground">
                <span class="font-medium">Nº Série:</span>
                {{ equipment()?.serialNumber }}
              </p>
            }
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Condição:</span>
              {{ getConditionLabel(equipment()?.condition ?? '') }}
            </p>
          </div>
        }

        <app-select
          label="Kit de Destino"
          placeholder="Selecione um kit"
          formControlName="kitId"
          [options]="kitOptions()"
          [required]="true"
          [error]="getFieldError('kitId')"
          hint="Selecione o kit onde o equipamento será alocado"
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
          Atribuir ao Kit
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class EquipmentKitAssignModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly kitService = inject(EquipmentKitService);

  readonly isOpen = input.required<boolean>();
  readonly equipment = input<Equipment | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<EquipmentKitAssignResult>();
  readonly closed = output();

  readonly form = this.fb.nonNullable.group({
    kitId: [0, [Validators.required, Validators.min(1)]],
  });

  protected readonly kitOptions = (): SelectOption[] => {
    return this.kitService.kitOptions();
  };

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.kitService.getAll({ page: 1, pageSize: 100 });
      }
    });
  }

  protected getConditionLabel(condition: string): string {
    return (
      EQUIPMENT_CONDITION_LABELS[condition as keyof typeof EQUIPMENT_CONDITION_LABELS] ?? condition
    );
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
      kitId: formValue.kitId,
    });
  }

  onClose(): void {
    this.form.reset({
      kitId: 0,
    });
    this.closed.emit();
  }
}
