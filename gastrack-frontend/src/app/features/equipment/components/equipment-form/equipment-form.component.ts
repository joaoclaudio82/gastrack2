import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EquipmentTypeService } from '@core/services/equipment-type.service';
import type { Equipment, EquipmentCondition, EquipmentRequest } from '@models/equipment.model';
import { EQUIPMENT_CONDITION, EQUIPMENT_CONDITION_LABELS } from '@models/equipment.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { DatePickerComponent } from '@shared/components/ui/date-picker/date-picker.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';

@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    ButtonComponent,
    SelectComponent,
    DatePickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="equipment() ? 'Editar Equipamento' : 'Novo Equipamento'"
      size="lg"
      (closed)="onClose()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <app-select
            label="Tipo de Equipamento"
            placeholder="Selecione um tipo"
            formControlName="equipmentTypeId"
            [options]="equipmentTypeService.typeOptions()"
            [required]="true"
            [error]="getFieldError('equipmentTypeId')"
          />

          <app-input
            label="Asset Tag"
            placeholder="EQ-2024-001"
            formControlName="assetTag"
            [required]="true"
            [error]="getFieldError('assetTag')"
          />
        </div>

        @if (isEsp32TypeSelected()) {
          <app-input
            label="Número Serial (ESP32)"
            placeholder="Número serial único do ESP32"
            formControlName="serialNumber"
            [required]="true"
            hint="Obrigatório para equipamentos do tipo ESP32"
            [error]="getFieldError('serialNumber')"
          />
        }

        <app-input
          label="Descrição"
          placeholder="Descrição do equipamento"
          formControlName="description"
          [error]="getFieldError('description')"
        />

        <app-select
          label="Condição"
          placeholder="Selecione a condição"
          formControlName="condition"
          [options]="conditionOptions"
          [required]="true"
          [error]="getFieldError('condition')"
        />

        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Fabricante"
            placeholder="Nome do fabricante"
            formControlName="manufacturer"
            [error]="getFieldError('manufacturer')"
          />

          <app-input
            label="Modelo"
            placeholder="Modelo do equipamento"
            formControlName="model"
            [error]="getFieldError('model')"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <app-date-picker
            label="Data de Compra"
            placeholder="Selecione a data"
            formControlName="purchaseDate"
            [error]="getFieldError('purchaseDate')"
          />

          <app-date-picker
            label="Validade da Garantia"
            placeholder="Selecione a data"
            formControlName="warrantyExpirationDate"
            [minDate]="minEndDate()"
            [error]="getFieldError('warrantyExpirationDate')"
          />
        </div>

        <app-input
          label="Observações"
          placeholder="Observações sobre o equipamento"
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
          {{ equipment() ? 'Salvar' : 'Criar Equipamento' }}
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class EquipmentFormComponent {
  private static readonly ESP32_TYPE_NAME = 'ESP32';
  private readonly fb = inject(FormBuilder);
  readonly equipmentTypeService = inject(EquipmentTypeService);

  readonly isOpen = input.required<boolean>();
  readonly equipment = input<Equipment | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly defaultSerialNumber = input<string | null>(null);

  readonly submitted = output<EquipmentRequest>();
  readonly closed = output();

  readonly minEndDate = signal<Date | null>(null);

  readonly conditionOptions: SelectOption[] = Object.entries(EQUIPMENT_CONDITION_LABELS).map(
    ([value, label]) => ({ label, value }),
  );

  readonly form = this.fb.nonNullable.group({
    equipmentTypeId: [0, [Validators.required, Validators.min(1)]],
    assetTag: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    serialNumber: [''],
    manufacturer: [''],
    model: [''],
    purchaseDate: [''],
    warrantyExpirationDate: [''],
    condition: [EQUIPMENT_CONDITION.NEW as EquipmentCondition, [Validators.required]],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const equipment = this.equipment();

      if (isOpen) {
        // Load equipment types for select
        this.equipmentTypeService.getActive();

        // Reset or populate form based on mode
        if (equipment) {
          this.populateForm(equipment);
        } else {
          this.resetForm();
          const serial = this.defaultSerialNumber();
          if (serial) {
            this.form.patchValue({ serialNumber: serial });
          }
        }
        this.updateSerialValidators();
      }
    });

    this.form
      .get('equipmentTypeId')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.updateSerialValidators();
      });

    const purchaseDateControl = this.form.get('purchaseDate');
    if (purchaseDateControl) {
      purchaseDateControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
        if (value) {
          const d = new Date(value + 'T00:00:00');
          this.minEndDate.set(isNaN(d.getTime()) ? null : d);
        } else {
          this.minEndDate.set(null);
        }
      });
    }
  }

  protected isEsp32TypeSelected(): boolean {
    const typeId = this.form.get('equipmentTypeId')?.value;
    const types = this.equipmentTypeService.activeTypes();
    const selectedType = types.find((t) => t.id === typeId);
    return selectedType?.name === EquipmentFormComponent.ESP32_TYPE_NAME;
  }

  private updateSerialValidators(): void {
    const serialControl = this.form.get('serialNumber');
    if (!serialControl) return;

    if (this.isEsp32TypeSelected()) {
      serialControl.setValidators([Validators.required, Validators.minLength(1)]);
    } else {
      serialControl.clearValidators();
    }
    serialControl.updateValueAndValidity();
  }

  private resetForm(): void {
    this.form.reset({
      equipmentTypeId: 0,
      assetTag: '',
      description: '',
      serialNumber: '',
      manufacturer: '',
      model: '',
      purchaseDate: '',
      warrantyExpirationDate: '',
      condition: EQUIPMENT_CONDITION.NEW,
      notes: '',
    });
  }

  private populateForm(equipment: Equipment): void {
    this.form.patchValue({
      equipmentTypeId: equipment.equipmentTypeId,
      assetTag: equipment.assetTag,
      description: equipment.description ?? '',
      serialNumber: equipment.serialNumber ?? '',
      manufacturer: equipment.manufacturer ?? '',
      model: equipment.model ?? '',
      purchaseDate: this.extractDatePart(equipment.purchaseDate),
      warrantyExpirationDate: this.extractDatePart(equipment.warrantyExpirationDate),
      condition: equipment.condition,
      notes: equipment.notes ?? '',
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

    if (control.errors['required']) {
      if (fieldName === 'serialNumber' && this.isEsp32TypeSelected()) {
        return 'Número serial único obrigatório para ESP32';
      }
      return 'Campo obrigatório';
    }
    if (control.errors['minlength']) return 'Mínimo de 3 caracteres';
    if (control.errors['min']) {
      if (fieldName === 'equipmentTypeId') return 'Selecione um tipo';
      return 'Valor inválido';
    }

    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const request: EquipmentRequest = {
      equipmentTypeId: formValue.equipmentTypeId,
      assetTag: formValue.assetTag,
      description: formValue.description || null,
      serialNumber: this.isEsp32TypeSelected() ? formValue.serialNumber || null : null,
      manufacturer: formValue.manufacturer || null,
      model: formValue.model || null,
      purchaseDate: formValue.purchaseDate || null,
      warrantyExpirationDate: formValue.warrantyExpirationDate || null,
      condition: formValue.condition,
      notes: formValue.notes || null,
    };

    this.submitted.emit(request);
  }

  onClose(): void {
    this.resetForm();
    this.closed.emit();
  }
}
