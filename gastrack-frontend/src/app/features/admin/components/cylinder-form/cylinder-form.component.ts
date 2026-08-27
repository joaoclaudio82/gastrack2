import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Cylinder, CylinderRequest } from '@models/cylinder.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { FormSectionComponent } from '@shared/components/ui/form-section/form-section.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import type { SelectOption } from '@shared/components/ui/select/select.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';
import { SwitchComponent } from '@shared/components/ui/switch/switch.component';

@Component({
  selector: 'app-cylinder-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    FormSectionComponent,
    SwitchComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen()"
      [title]="cylinder() ? 'Editar Cilindro' : 'Novo Cilindro'"
      size="lg"
      (closed)="onClose()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <app-form-section title="Identificação">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!--
              Sem opções de empresa = usuário que só opera a própria (ADMIN): /companies/active
              é SUPER_ADMIN-only. O dono vem de defaultCompanyId; oferecer um seletor com uma
              escolha válida só criaria caminho para o 403.
            -->
            @if (companyOptions().length > 0) {
              <app-select
                label="Empresa"
                placeholder="Selecione a empresa"
                formControlName="companyId"
                [required]="true"
                [options]="companyOptions()"
                [error]="getFieldError('companyId') ?? ''"
              />
            }

            <app-select
              label="Modelo de cilindro"
              placeholder="Selecione o modelo"
              formControlName="cylinderModelId"
              [required]="true"
              [options]="availableModelOptions()"
              [error]="getFieldError('cylinderModelId') ?? ''"
            />

            <app-input
              label="Número de Série"
              placeholder="SN-123456"
              formControlName="serialNumber"
              [required]="true"
              [error]="getFieldError('serialNumber') ?? ''"
            />
          </div>
        </app-form-section>

        <app-form-section title="Vínculo" divider="top">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <app-select
              label="Ponto de Gás"
              placeholder="Sem ponto"
              formControlName="pontoGasId"
              [options]="pontoOptions()"
              [clearable]="true"
              [error]="getFieldError('pontoGasId') ?? ''"
            />

            <app-select
              label="Endereço"
              placeholder="Sem endereço"
              formControlName="addressId"
              [options]="addressOptions()"
              [clearable]="true"
              [error]="getFieldError('addressId') ?? ''"
            />
          </div>

          <div class="mt-4 space-y-1">
            <app-switch label="Válvula aberta (fornecendo gás)" formControlName="connected" />
            <p class="text-xs text-muted-foreground">
              Casco de reserva com a válvula fechada não entra no volume da linha — ele não está na
              pressão que o sensor mede.
            </p>
          </div>
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
          {{ cylinder() ? 'Salvar Alterações' : 'Criar Cilindro' }}
        </app-button>
      </ng-container>
    </app-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CylinderFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input.required<boolean>();
  readonly cylinder = input<Cylinder | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly modelOptions = input<SelectOption[]>([]);
  readonly companyOptions = input<SelectOption[]>([]);
  readonly pontoOptions = input<SelectOption[]>([]);
  readonly addressOptions = input<SelectOption[]>([]);

  /** Gás de cada modelo e de cada linha — usados para não oferecer modelo que o backend recusaria. */
  readonly modelGasTypeById = input<Record<number, string>>({});
  readonly lineGasTypeById = input<Record<number, string | null>>({});

  /** Dono do cilindro quando o usuário não escolhe empresa (ADMIN opera só a sua). */
  readonly defaultCompanyId = input<number | null>(null);
  /** Linha de origem quando o form é aberto a partir de uma linha de gás. */
  readonly defaultPontoGasId = input<number | null>(null);

  readonly submitted = output<CylinderRequest>();
  readonly closed = output();

  readonly form = this.fb.nonNullable.group({
    companyId: [null as number | null, [Validators.required]],
    cylinderModelId: [null as number | null, [Validators.required]],
    serialNumber: ['', [Validators.required, Validators.minLength(3)]],
    pontoGasId: [null as number | null],
    addressId: [null as number | null],
    connected: [true],
  });

  /** Linha escolhida no formulário — dita quais modelos podem ser oferecidos. */
  private readonly selectedPontoGasId = toSignal(this.form.controls.pontoGasId.valueChanges, {
    initialValue: this.form.controls.pontoGasId.value,
  });

  /**
   * Só modelos do gás que a linha já carrega — mesma regra que o modal de troca aplica. Oferecer
   * o resto empurrava o usuário para um 409 no submit (`cannot mix with ...`).
   */
  readonly availableModelOptions = computed<SelectOption[]>(() => {
    const pontoGasId = this.selectedPontoGasId();
    const lineGasType = pontoGasId == null ? null : (this.lineGasTypeById()[pontoGasId] ?? null);
    // Editando o único casco da linha, o gás que se vê é o **dele mesmo**: o backend exclui o
    // cilindro em edição da checagem (`excludingCylinderId`), então trocar o modelo por outro
    // gás é legítimo. Filtrar aqui esconderia a opção e travaria a correção pela UI.
    const editingThisLine = this.cylinder() != null && this.cylinder()?.pontoGasId === pontoGasId;
    if (lineGasType === null || editingThisLine) {
      return this.modelOptions();
    }
    const gasByModel = this.modelGasTypeById();
    return this.modelOptions().filter((option) => gasByModel[Number(option.value)] === lineGasType);
  });

  constructor() {
    // Um modelo de outro gás deixa de ser oferecido quando a linha muda; mantê-lo selecionado
    // levaria o usuário ao 409 do backend com o campo aparentemente válido.
    //
    // A leitura do computed vem ANTES do early-return de propósito: effect só é reagendado por
    // signal lido durante a execução, e a primeira roda com o form vazio (`null`). Saindo antes,
    // ele terminava sem dependência nenhuma e nunca mais era chamado — o guarda inteiro virava
    // código morto, e a suíte passava sem notar.
    effect(() => {
      const offered = this.availableModelOptions();
      const selected = this.form.controls.cylinderModelId.value;
      if (selected == null) return;
      if (!offered.some((option) => Number(option.value) === selected)) {
        this.form.controls.cylinderModelId.setValue(null);
      }
    });

    effect(
      () => {
        // `isOpen` entra como dependência de propósito: sem isso o formulário reabria com os
        // dados do cilindro anterior ao criar vários seguidos (o sinal `cylinder()` não muda).
        if (!this.isOpen()) return;
        const current = this.cylinder();
        if (current) {
          this.form.patchValue({
            companyId: current.companyId,
            cylinderModelId: current.cylinderModelId,
            serialNumber: current.serialNumber,
            pontoGasId: current.pontoGasId,
            addressId: current.addressId,
            connected: current.connected,
          });
        } else {
          this.form.reset({
            companyId: this.defaultCompanyId(),
            cylinderModelId: null,
            serialNumber: '',
            pontoGasId: this.defaultPontoGasId(),
            addressId: null,
            connected: true,
          });
        }
      },
      { allowSignalWrites: true },
    );
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (value.cylinderModelId == null || value.companyId == null) {
      return;
    }
    const payload: CylinderRequest = {
      cylinderModelId: value.cylinderModelId,
      companyId: value.companyId,
      serialNumber: value.serialNumber.trim(),
      pontoGasId: value.pontoGasId ?? null,
      addressId: value.addressId ?? null,
      connected: value.connected,
    };

    this.submitted.emit(payload);
  }

  onClose(): void {
    this.closed.emit();
  }

  getFieldError(controlName: keyof typeof this.form.controls): string | null {
    const control = this.form.get(controlName);
    if (!control || !control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('minlength')) {
      return 'Informe ao menos 3 caracteres';
    }

    return 'Valor inválido';
  }
}
