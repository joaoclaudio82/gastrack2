import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CylinderModelService } from '@core/services/cylinder-model.service';
import { CylinderService } from '@core/services/cylinder.service';
import { NotificationService } from '@core/services/notification.service';
import { GAS_TYPE_LABELS, type CylinderModelRequest } from '@models/cylinder-model.model';
import type { Cylinder } from '@models/cylinder.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';
import { CylinderModelFormComponent } from '../../../components/cylinder-model-form/cylinder-model-form.component';
import { OnboardingStateService } from '../onboarding-state.service';

/**
 * Passo 9 — Cilindros do ponto (spec §4.5 / §5).
 * Para cada ponto de gás, cadastra os botijões: escolhe o modelo do catálogo
 * (/cylinder-models → preenche gás/volume/pressão) + serial do casco →
 * cria o Cylinder ligado ao ponto (POST /cylinders). 1..N por ponto.
 */
@Component({
  selector: 'app-onboarding-step-cylinders',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    CylinderModelFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Cilindros do ponto</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Cadastre os botijões de cada ponto de gás. Escolha o modelo do catálogo (define gás, volume
        e pressão) e informe o serial do casco. Um ponto pode ter 1 ou mais cilindros.
      </p>
    </div>

    <div class="px-8 py-6 space-y-6">
      @if (wizardState.gasPoints().length === 0) {
        <div class="flex flex-col items-center gap-2 py-10 text-center">
          <p class="text-sm text-muted-foreground">
            Nenhum ponto de gás foi criado. Volte e adicione ao menos um ponto.
          </p>
        </div>
      } @else if (modelOptions().length === 0) {
        <div class="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <svg
            class="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p class="text-sm text-amber-700">
            Nenhum modelo de cilindro cadastrado no catálogo. Cadastre modelos em
            <strong>Catálogo → Modelos de cilindro</strong>
            antes de continuar.
          </p>
        </div>
      }

      <!-- Add cylinder form -->
      @if (wizardState.gasPoints().length > 0 && modelOptions().length > 0) {
        <div class="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 space-y-4">
          <h3 class="text-sm font-medium text-gray-700">Adicionar cilindro</h3>

          <div class="grid gap-4 sm:grid-cols-3">
            <app-select
              label="Ponto de gás"
              placeholder="Selecione o ponto"
              [options]="pointOptions()"
              [formControl]="form.controls.pontoGasId"
              [error]="
                form.controls.pontoGasId.touched && form.controls.pontoGasId.invalid
                  ? 'Selecione um ponto'
                  : ''
              "
            />

            <div class="space-y-1">
              <app-select
                label="Modelo / tipo"
                placeholder="Selecione o modelo"
                [options]="modelOptions()"
                [formControl]="form.controls.cylinderModelId"
                [error]="
                  form.controls.cylinderModelId.touched && form.controls.cylinderModelId.invalid
                    ? 'Selecione um modelo'
                    : ''
                "
              />
              <!-- O catálogo é global e só SUPER_ADMIN cria modelo — que é
                   justamente quem chega neste wizard (admin.routes: onboarding é
                   SUPER_ADMIN). Sem isto, faltando o tipo, o cadastro para aqui e
                   obriga a sair para o Catálogo e recomeçar. -->
              <app-button variant="link" size="sm" (buttonClick)="openModelForm()">
                Não achou? Criar novo tipo
              </app-button>
            </div>

            <app-input
              label="Serial do casco"
              placeholder="Ex: BR-2024-00123"
              [formControl]="form.controls.serialNumber"
              [error]="
                form.controls.serialNumber.touched && form.controls.serialNumber.invalid
                  ? 'Serial é obrigatório'
                  : ''
              "
            />
          </div>

          <div class="flex justify-end">
            <app-button
              variant="outline"
              [disabled]="form.invalid"
              [loading]="isCreating()"
              (buttonClick)="addCylinder()"
            >
              Adicionar
            </app-button>
          </div>
        </div>
      }

      <app-cylinder-model-form
        [isOpen]="isModelFormOpen()"
        [isLoading]="isCreatingModel()"
        (submitted)="createModel($event)"
        (closed)="isModelFormOpen.set(false)"
      />

      <!-- Created cylinders grouped per point -->
      @for (gp of wizardState.gasPoints(); track gp.id) {
        <div class="space-y-2">
          <h3 class="text-sm font-medium text-gray-700">
            {{ gp.location }}
            <span class="text-xs text-muted-foreground">
              ({{ cylindersForPoint(gp.id).length }} cilindro(s))
            </span>
          </h3>
          @if (cylindersForPoint(gp.id).length === 0) {
            <p class="text-xs text-muted-foreground">Nenhum cilindro cadastrado neste ponto.</p>
          } @else {
            <div class="space-y-2">
              @for (cyl of cylindersForPoint(gp.id); track cyl.id) {
                <div class="flex items-center justify-between rounded-lg border border-border p-3">
                  <div class="min-w-0">
                    <div class="font-mono text-sm font-medium text-gray-900">
                      {{ cyl.serialNumber }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ gasTypeLabel(cyl.gasType) }} · {{ cyl.waterVolumeLiters }}L ·
                      {{ cyl.capacityBar }} bar
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Advance button -->
      <div class="flex justify-end pt-2">
        <app-button (buttonClick)="completed.emit()">Avançar</app-button>
      </div>
    </div>
  `,
})
export class StepCylindersComponent implements OnInit {
  protected readonly wizardState = inject(OnboardingStateService);
  private readonly cylinderService = inject(CylinderService);
  private readonly cylinderModelService = inject(CylinderModelService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly completed = output();

  protected readonly isCreating = signal(false);

  protected readonly form = new FormGroup({
    pontoGasId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    cylinderModelId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    serialNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
  });

  protected readonly pointOptions = computed<SelectOption[]>(() =>
    this.wizardState.gasPoints().map((gp) => ({ label: gp.location, value: gp.id })),
  );

  protected readonly modelOptions = computed<SelectOption[]>(() =>
    this.cylinderModelService.models().map((m) => ({
      label: `${m.codigo} — ${this.gasTypeLabel(m.gasType)} ${m.waterVolumeLiters}L/${m.capacityBar}bar`,
      value: m.id,
    })),
  );

  protected readonly isModelFormOpen = signal(false);
  protected readonly isCreatingModel = signal(false);

  ngOnInit(): void {
    this.cylinderModelService.getAll({ page: 1, pageSize: 100 });
  }

  protected openModelForm(): void {
    this.isModelFormOpen.set(true);
  }

  /**
   * O modelo criado ja fica selecionado: quem abriu o modal estava no meio do
   * cadastro de um casco, e ter que reabrir o select para achar o que acabou de
   * criar e um passo a toa.
   */
  protected createModel(request: CylinderModelRequest): void {
    this.isCreatingModel.set(true);
    this.cylinderModelService
      .create(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (model) => {
          this.cylinderModelService.getAll({ page: 1, pageSize: 100 });
          this.form.controls.cylinderModelId.setValue(model.id);
          this.notificationService.success(`Tipo "${model.codigo}" criado com sucesso.`);
          this.isModelFormOpen.set(false);
          this.isCreatingModel.set(false);
        },
        error: () => {
          // A causa real da API e exibida pelo errorInterceptor.
          this.isCreatingModel.set(false);
        },
      });
  }

  protected cylindersForPoint(pontoGasId: number): Cylinder[] {
    return this.wizardState.cylinders().filter((c) => c.pontoGasId === pontoGasId);
  }

  protected gasTypeLabel(gasType: Cylinder['gasType']): string {
    return GAS_TYPE_LABELS[gasType] ?? gasType;
  }

  protected addCylinder(): void {
    if (this.form.invalid) return;

    const pontoGasId = this.form.controls.pontoGasId.value;
    const cylinderModelId = this.form.controls.cylinderModelId.value;
    const serialNumber = this.form.controls.serialNumber.value.trim();
    const companyId = this.wizardState.company()?.id;
    if (pontoGasId === null || cylinderModelId === null || companyId == null) return;

    this.isCreating.set(true);
    this.cylinderService
      .create({ cylinderModelId, companyId: Number(companyId), pontoGasId, serialNumber })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cylinder) => {
          this.wizardState.addCylinder(cylinder);
          this.notificationService.success(`Cilindro "${serialNumber}" cadastrado com sucesso.`);
          this.form.reset({ pontoGasId, cylinderModelId: null, serialNumber: '' });
          this.isCreating.set(false);
        },
        error: () => {
          // A causa real da API é exibida pelo errorInterceptor.
          this.isCreating.set(false);
        },
      });
  }
}
