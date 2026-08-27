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
import { EquipmentTypeService } from '@core/services/equipment-type.service';
import { EquipmentService } from '@core/services/equipment.service';
import { NotificationService } from '@core/services/notification.service';
import type { Equipment, EquipmentRequest } from '@models/equipment.model';
import {
  EQUIPMENT_CONDITION,
  EQUIPMENT_CONDITION_LABELS,
  type EquipmentCondition,
} from '@models/equipment.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';
import { switchMap } from 'rxjs';
import { OnboardingStateService } from '../onboarding-state.service';

@Component({
  selector: 'app-onboarding-step-equipment',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Equipamentos Adicionais</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Adicione outros equipamentos ao kit
        <strong>{{ wizardState.kit()?.kitCode }}</strong>
        , como valvulas, reguladores ou detectores.
      </p>
    </div>

    <div class="px-8 py-6 space-y-6">
      <!-- Info box -->
      <div class="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <svg
          class="mt-0.5 h-5 w-5 shrink-0 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <p class="text-sm text-blue-700">
          Esta etapa e opcional. Os ESP32s e sensores ja foram registrados nas etapas anteriores.
          Aqui voce pode adicionar equipamentos complementares como valvulas, reguladores, etc.
        </p>
      </div>

      <!-- Current equipment in kit (readonly) -->
      @if (wizardState.esp32s().length > 0) {
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-700">ESP32s no kit</h3>
          <div class="space-y-1">
            @for (esp of wizardState.esp32s(); track esp.id) {
              <div class="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
                <div class="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
                  <svg
                    class="h-3.5 w-3.5 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium text-gray-900">{{ esp.assetTag }}</span>
                  <span class="ml-2 text-xs text-muted-foreground">
                    {{ esp.equipmentTypeName }}
                  </span>
                </div>
                <span class="font-mono text-xs text-muted-foreground">{{ esp.serialNumber }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Extra equipment list -->
      @if (wizardState.extraEquipments().length > 0) {
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-700">
            Equipamentos adicionais ({{ wizardState.extraEquipments().length }})
          </h3>
          <div class="space-y-2">
            @for (eq of wizardState.extraEquipments(); track eq.id) {
              <div class="flex items-center justify-between rounded-lg border border-border p-3">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900">{{ eq.assetTag }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ eq.equipmentTypeName }}
                    @if (eq.manufacturer) {
                      - {{ eq.manufacturer }}
                    }
                    @if (eq.model) {
                      {{ eq.model }}
                    }
                  </div>
                </div>
                <button
                  type="button"
                  class="ml-2 rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Remover equipamento"
                  (click)="removeEquipment(eq)"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Add equipment form -->
      <div class="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 space-y-4">
        <h3 class="text-sm font-medium text-gray-700">Novo equipamento</h3>

        <div class="grid gap-4 sm:grid-cols-2">
          <app-select
            label="Tipo"
            placeholder="Selecione o tipo"
            [options]="filteredTypeOptions()"
            [formControl]="form.controls.equipmentTypeId"
            [error]="
              form.controls.equipmentTypeId.touched && form.controls.equipmentTypeId.invalid
                ? 'Tipo e obrigatorio'
                : ''
            "
          />

          <app-input
            label="Asset Tag"
            placeholder="Identificador do equipamento"
            [formControl]="form.controls.assetTag"
            [required]="true"
            [error]="
              form.controls.assetTag.touched && form.controls.assetTag.invalid
                ? 'Asset Tag e obrigatorio'
                : ''
            "
          />

          <app-input
            label="Fabricante"
            placeholder="Ex: Honeywell, Dräger"
            [formControl]="form.controls.manufacturer"
          />

          <app-input label="Modelo" placeholder="Ex: XCD" [formControl]="form.controls.model" />

          <app-select
            label="Condicao"
            placeholder="Selecione a condicao"
            [options]="conditionOptions"
            [formControl]="form.controls.condition"
          />

          <app-input
            label="Descricao"
            placeholder="Descricao opcional"
            [formControl]="form.controls.description"
          />
        </div>

        <div class="flex justify-end">
          <app-button
            variant="outline"
            [disabled]="form.invalid"
            [loading]="isCreating()"
            (buttonClick)="addEquipment()"
          >
            Adicionar
          </app-button>
        </div>
      </div>

      <!-- Advance button -->
      <div class="flex justify-end pt-2">
        <app-button (buttonClick)="completed.emit()">Avancar para Revisao</app-button>
      </div>
    </div>
  `,
})
export class StepEquipmentComponent implements OnInit {
  protected readonly wizardState = inject(OnboardingStateService);
  private readonly equipmentService = inject(EquipmentService);
  private readonly equipmentTypeService = inject(EquipmentTypeService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly completed = output();

  protected readonly isCreating = signal(false);

  protected readonly form = new FormGroup({
    equipmentTypeId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    assetTag: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    manufacturer: new FormControl('', { nonNullable: true }),
    model: new FormControl('', { nonNullable: true }),
    condition: new FormControl<EquipmentCondition>(EQUIPMENT_CONDITION.NEW, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', { nonNullable: true }),
  });

  protected readonly conditionOptions: SelectOption[] = Object.entries(
    EQUIPMENT_CONDITION_LABELS,
  ).map(([value, label]) => ({ label, value }));

  private readonly excludedTypeNames = new Set(['ESP32', 'SENSOR', 'Sensor']);

  protected readonly filteredTypeOptions = computed<SelectOption[]>(() =>
    this.equipmentTypeService
      .typeOptions()
      .filter(
        (opt) =>
          !this.excludedTypeNames.has(opt.label.toUpperCase()) &&
          !opt.label.toUpperCase().includes('ESP32') &&
          !opt.label.toUpperCase().includes('SENSOR'),
      ),
  );

  ngOnInit(): void {
    this.equipmentTypeService.getActive();
  }

  protected addEquipment(): void {
    if (this.form.invalid) return;

    const kitId = this.wizardState.kit()?.id;
    if (!kitId) {
      this.notificationService.error('Kit nao encontrado. Volte para a etapa anterior.');
      return;
    }

    const values = this.form.getRawValue();
    const request: EquipmentRequest = {
      equipmentTypeId: values.equipmentTypeId ?? 0,
      assetTag: values.assetTag,
      condition: values.condition,
      manufacturer: values.manufacturer || null,
      model: values.model || null,
      description: values.description || null,
    };

    this.isCreating.set(true);

    this.equipmentService
      .create(request)
      .pipe(
        switchMap((equipment) => this.equipmentService.assignToKit(equipment.id, { kitId })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (equipment: Equipment) => {
          this.wizardState.addExtraEquipment(equipment);
          this.notificationService.success(
            `Equipamento "${equipment.assetTag}" adicionado ao kit.`,
          );
          this.form.reset({ condition: EQUIPMENT_CONDITION.NEW });
          this.isCreating.set(false);
        },
        error: () => {
          // A causa real da API é exibida pelo errorInterceptor.
          this.isCreating.set(false);
        },
      });
  }

  protected removeEquipment(eq: Equipment): void {
    this.equipmentService
      .removeFromKit(eq.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.wizardState.removeExtraEquipment(eq.id);
          this.notificationService.success(`Equipamento "${eq.assetTag}" removido do kit.`);
        },
        error: () => {
          // A causa real da API é exibida pelo errorInterceptor.
        },
      });
  }
}
