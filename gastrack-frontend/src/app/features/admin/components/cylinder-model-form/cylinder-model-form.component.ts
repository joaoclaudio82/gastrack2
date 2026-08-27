import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  GAS_TYPE_OPTIONS,
  GasType,
  type CylinderModel,
  type CylinderModelRequest,
} from '@models/cylinder-model.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { FormSectionComponent } from '@shared/components/ui/form-section/form-section.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';

@Component({
  selector: 'app-cylinder-model-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    FormSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="model() ? 'Editar Modelo de Cilindro' : 'Novo Modelo de Cilindro'"
      size="md"
      (closed)="onClose()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <app-form-section>
          <app-input
            label="Código"
            hint="Identificador do modelo (ex.: O2-50L-200BAR)."
            placeholder="O2-50L-200BAR"
            formControlName="codigo"
            [required]="true"
            [error]="getFieldError('codigo')"
          />
        </app-form-section>

        <app-form-section divider="top">
          <app-select
            label="Tipo de gás"
            placeholder="Selecione o tipo de gás"
            formControlName="gasType"
            [required]="true"
            [options]="gasTypeOptions"
            [error]="getFieldError('gasType')"
          />
        </app-form-section>

        <app-form-section divider="top">
          <app-input
            type="number"
            label="Volume de água (L)"
            hint="Volume nominal do casco em litros (placa)."
            placeholder="50"
            formControlName="waterVolumeLiters"
            [required]="true"
            [error]="getFieldError('waterVolumeLiters')"
          />
        </app-form-section>

        <app-form-section divider="top">
          <app-input
            type="number"
            label="Pressão de carga (bar)"
            hint="Pressão do cilindro cheio."
            placeholder="200"
            formControlName="capacityBar"
            [required]="true"
            [error]="getFieldError('capacityBar')"
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
          {{ model() ? 'Salvar' : 'Criar Modelo' }}
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class CylinderModelFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input.required<boolean>();
  readonly model = input<CylinderModel | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<CylinderModelRequest>();
  readonly closed = output();

  readonly gasTypeOptions = GAS_TYPE_OPTIONS;

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.maxLength(60)]],
    gasType: [null as GasType | null, [Validators.required]],
    waterVolumeLiters: [null as number | null, [Validators.required, Validators.min(0.01)]],
    capacityBar: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;
      const model = this.model();
      if (model) {
        this.form.reset({
          codigo: model.codigo,
          gasType: model.gasType,
          waterVolumeLiters: model.waterVolumeLiters,
          capacityBar: model.capacityBar,
        });
      } else {
        this.form.reset({
          codigo: '',
          gasType: null,
          waterVolumeLiters: null,
          capacityBar: null,
        });
      }
    });
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['min']) return 'Informe um valor maior que 0';
    if (control.errors['maxlength']) return 'Máximo de 60 caracteres';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.gasType === null || v.waterVolumeLiters === null || v.capacityBar === null) return;

    const toNumber = (n: number | string): number =>
      typeof n === 'string' ? Number.parseFloat(n) : n;

    this.submitted.emit({
      codigo: v.codigo.trim(),
      gasType: v.gasType,
      waterVolumeLiters: toNumber(v.waterVolumeLiters),
      capacityBar: toNumber(v.capacityBar),
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
