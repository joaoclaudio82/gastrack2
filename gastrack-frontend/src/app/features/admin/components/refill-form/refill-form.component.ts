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
import type { PontoGas } from '@models/ponto-gas.model';
import type { RefillRequest } from '@models/refill.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import type { SelectOption } from '@shared/components/ui/select/select.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';

/**
 * "Troquei um botijão" — registra a troca de UM casco do banco.
 *
 * O campo "botijão que saiu" é obrigatório quando a linha já tem cilindros: com um
 * sensor medindo a saída combinada, o sistema não deduz qual foi trocado, e aposentar
 * todos derrubaria o volume de um banco de 3 x 50 L para 50 L.
 */
@Component({
  selector: 'app-refill-form',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, InputComponent, SelectComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="'Trocar botijão — ' + (pontoGas()?.location ?? '')"
      size="md"
      (closed)="closed.emit()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <p class="text-sm text-muted-foreground">Registre qual casco saiu e qual entrou.</p>

        @if (outgoingOptions().length > 0) {
          <app-select
            label="Botijão que saiu"
            placeholder="Selecione o casco"
            formControlName="outgoingCylinderId"
            [required]="true"
            [options]="outgoingOptions()"
            [error]="getFieldError('outgoingCylinderId') ?? ''"
          />
        } @else {
          <p
            class="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
          >
            Esta linha ainda não tem cilindro cadastrado — este será o primeiro.
          </p>
        }

        <app-input
          label="Serial do botijão novo"
          placeholder="BOT-…"
          formControlName="serialNumber"
          [required]="true"
          [error]="getFieldError('serialNumber') ?? ''"
        />

        <app-select
          label="Modelo"
          placeholder="Selecione o modelo"
          formControlName="cylinderModelId"
          [required]="true"
          [options]="modelOptions()"
          [error]="getFieldError('cylinderModelId') ?? ''"
        />

        @if (pontoGas(); as line) {
          <div
            class="flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-sm text-muted-foreground"
          >
            <span aria-hidden="true">&Sigma;</span>
            <span>
              A linha continua com
              <b class="font-mono text-foreground">{{ line.effectiveCapacityLiters }} L</b>
              — só o serial muda.
            </span>
          </div>
        }

        <div class="flex justify-end gap-2 pt-2">
          <app-button variant="outline" type="button" (buttonClick)="closed.emit()">
            Cancelar
          </app-button>
          <app-button variant="primary" type="submit" [loading]="isLoading()">
            Registrar troca
          </app-button>
        </div>
      </form>
    </app-modal>
  `,
})
export class RefillFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input.required<boolean>();
  readonly pontoGas = input<PontoGas | null>(null);
  readonly modelOptions = input.required<SelectOption[]>();
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<RefillRequest>();
  readonly closed = output();

  protected readonly form = this.fb.nonNullable.group({
    outgoingCylinderId: [null as number | null],
    serialNumber: ['', [Validators.required, Validators.maxLength(100)]],
    cylinderModelId: [null as number | null, [Validators.required]],
  });

  /** Só cascos ativos da linha podem ser o "que saiu". */
  protected readonly outgoingOptions = computed<SelectOption[]>(() =>
    (this.pontoGas()?.cylinders ?? []).map((cylinder) => ({
      value: cylinder.id,
      label: `${cylinder.serialNumber} · ${cylinder.modelCodigo ?? 'sem modelo'}`,
    })),
  );

  constructor() {
    effect(() => {
      const line = this.pontoGas();
      const hasCylinders = (line?.cylinders ?? []).length > 0;

      // Quem saiu só é exigível quando existe casco na linha (primeira carga é exceção).
      const outgoing = this.form.controls.outgoingCylinderId;
      if (hasCylinders) {
        outgoing.setValidators([Validators.required]);
      } else {
        outgoing.clearValidators();
      }
      outgoing.updateValueAndValidity({ emitEvent: false });

      if (this.isOpen()) {
        this.form.reset({
          outgoingCylinderId: null,
          serialNumber: '',
          // Troca é quase sempre igual por igual: herda o modelo do primeiro casco.
          cylinderModelId: null,
        });
      }
    });
  }

  protected getFieldError(
    field: 'outgoingCylinderId' | 'serialNumber' | 'cylinderModelId',
  ): string | null {
    const control = this.form.controls[field];
    if (!control.touched || control.valid) {
      return null;
    }
    if (control.hasError('required')) {
      return field === 'outgoingCylinderId' ? 'Informe qual botijão saiu' : 'Campo obrigatório';
    }
    if (control.hasError('maxlength')) {
      return 'Máximo de 100 caracteres';
    }
    return null;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (value.cylinderModelId === null) {
      return;
    }

    this.submitted.emit({
      serialNumber: value.serialNumber,
      cylinderModelId: value.cylinderModelId,
      outgoingCylinderId: value.outgoingCylinderId,
    });
  }
}
