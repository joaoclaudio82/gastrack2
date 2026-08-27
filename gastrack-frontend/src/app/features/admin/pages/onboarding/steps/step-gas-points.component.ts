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
import { EquipmentService } from '@core/services/equipment.service';
import { NotificationService } from '@core/services/notification.service';
import { PontoGasService } from '@core/services/ponto-gas.service';
import type { SensorOptionResponse } from '@models/equipment.model';
import type { PontoGasResponse, SensorAssignment } from '@models/ponto-gas.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';
import { OnboardingStateService } from '../onboarding-state.service';

@Component({
  selector: 'app-onboarding-step-gas-points',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Pontos de Gas</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Configure os pontos de gas para o endereco
        <strong>{{ wizardState.selectedAddress()?.name }}</strong>
        . Cada ponto de gas e associado a uma porta de um ESP32.
      </p>
    </div>

    <div class="px-8 py-6 space-y-6">
      <!-- Port overview per ESP32 -->
      @if (wizardState.esp32s().length > 0) {
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-700">Visao geral das portas</h3>
          <div class="grid gap-3 sm:grid-cols-2">
            @for (esp of wizardState.esp32s(); track esp.id) {
              <div class="rounded-lg border border-border p-3">
                <div class="mb-2 flex items-center gap-2">
                  <span class="font-mono text-xs font-semibold text-gray-900">
                    {{ esp.serialNumber ?? esp.assetTag }}
                  </span>
                </div>
                <div class="flex gap-1.5">
                  @for (port of ports; track port) {
                    <div
                      class="flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors"
                      [class.bg-green-100]="isPortUsed(esp.id, port)"
                      [class.text-green-700]="isPortUsed(esp.id, port)"
                      [class.bg-blue-100]="isPortBeingSelected(esp.id, port)"
                      [class.text-blue-700]="isPortBeingSelected(esp.id, port)"
                      [class.ring-2]="isPortBeingSelected(esp.id, port)"
                      [class.ring-blue-400]="isPortBeingSelected(esp.id, port)"
                      [class.bg-gray-100]="
                        !isPortUsed(esp.id, port) && !isPortBeingSelected(esp.id, port)
                      "
                      [class.text-gray-500]="
                        !isPortUsed(esp.id, port) && !isPortBeingSelected(esp.id, port)
                      "
                      [title]="
                        isPortUsed(esp.id, port)
                          ? 'Porta ' + port + ' - Em uso'
                          : isPortBeingSelected(esp.id, port)
                            ? 'Porta ' + port + ' - Selecionada'
                            : 'Porta ' + port + ' - Disponivel'
                      "
                    >
                      {{ port }}
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Existing gas points -->
      @if (wizardState.gasPoints().length > 0) {
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-gray-700">
            Pontos de gas criados ({{ wizardState.gasPoints().length }})
          </h3>
          <div class="space-y-2">
            @for (gp of wizardState.gasPoints(); track gp.id) {
              <div class="flex items-center justify-between rounded-lg border border-border p-3">
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-gray-900">{{ gp.location }}</div>
                  <div class="text-xs text-muted-foreground">
                    @if (gp.equipments.length > 0) {
                      Sensor: {{ gp.equipments[0]?.codigoSensor ?? 'N/A' }} - Porta
                      {{ gp.equipments[0]?.sensorPort }} ({{
                        gp.equipments[0]?.parentSerial ?? 'N/A'
                      }})
                    }
                  </div>
                </div>
                <button
                  type="button"
                  class="ml-2 rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Remover ponto de gas"
                  (click)="removeGasPoint(gp)"
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

      <!-- Add gas point form -->
      <div class="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 space-y-4">
        <h3 class="text-sm font-medium text-gray-700">Adicionar ponto de gas</h3>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <app-input
              label="Localizacao"
              placeholder="Ex: Cozinha, Laboratorio 1, Sala de caldeiras"
              [formControl]="form.controls.location"
              [error]="
                form.controls.location.touched && form.controls.location.invalid
                  ? 'Localizacao e obrigatoria'
                  : ''
              "
            />
          </div>

          <app-select
            label="ESP32"
            placeholder="Selecione o ESP32"
            [options]="espOptions()"
            [formControl]="form.controls.espEquipmentId"
            [error]="
              form.controls.espEquipmentId.touched && form.controls.espEquipmentId.invalid
                ? 'Selecione um ESP32'
                : ''
            "
          />

          <app-select
            label="Porta"
            placeholder="Selecione a porta"
            [options]="availablePortOptions()"
            [formControl]="form.controls.sensorPort"
            [error]="
              form.controls.sensorPort.touched && form.controls.sensorPort.invalid
                ? 'Selecione uma porta'
                : ''
            "
          />
        </div>

        <div class="flex justify-end">
          <app-button
            variant="outline"
            [disabled]="form.invalid"
            [loading]="isCreating()"
            (buttonClick)="addGasPoint()"
          >
            Adicionar
          </app-button>
        </div>
      </div>

      <!-- Advance button -->
      <div class="flex justify-end pt-2">
        <app-button (buttonClick)="completed.emit()">Avancar</app-button>
      </div>
    </div>
  `,
})
export class StepGasPointsComponent implements OnInit {
  protected readonly wizardState = inject(OnboardingStateService);
  private readonly pontoGasService = inject(PontoGasService);
  private readonly equipmentService = inject(EquipmentService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly completed = output();

  protected readonly ports = [1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly isCreating = signal(false);
  protected readonly sensorOptions = signal<SensorOptionResponse[]>([]);

  protected readonly form = new FormGroup({
    location: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    espEquipmentId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    sensorPort: new FormControl<number | null>(null, { validators: [Validators.required] }),
  });

  protected readonly selectedEspId = signal<number | null>(null);
  protected readonly selectedPort = signal<number | null>(null);

  protected readonly espOptions = computed<SelectOption[]>(() =>
    this.wizardState.esp32s().map((esp) => ({
      label: esp.serialNumber ?? esp.assetTag,
      value: esp.id,
    })),
  );

  protected readonly usedPorts = computed(() => {
    const used = new Map<number, Set<number>>();
    // Only count ports used by gas points created in this wizard session
    for (const gp of this.wizardState.gasPoints()) {
      for (const eq of gp.equipments) {
        if (eq.sensorPort !== null && eq.sensorPort !== undefined) {
          const espId = this.findParentEspId(eq.parentSerial);
          if (espId !== null) {
            if (!used.has(espId)) {
              used.set(espId, new Set());
            }
            const espPorts = used.get(espId);
            if (espPorts) {
              espPorts.add(eq.sensorPort);
            }
          }
        }
      }
    }
    // Also count ports from sensor options that were already assigned BEFORE this session
    for (const opt of this.sensorOptions()) {
      if (opt.existingSensorId !== null) {
        if (!used.has(opt.parentEquipmentId)) {
          used.set(opt.parentEquipmentId, new Set());
        }
        const parentPorts = used.get(opt.parentEquipmentId);
        if (parentPorts) {
          parentPorts.add(opt.sensorPort);
        }
      }
    }
    return used;
  });

  protected readonly availablePortOptions = computed<SelectOption[]>(() => {
    const espId = this.selectedEspId();
    if (!espId) return [];

    const usedPortsForEsp = this.usedPorts().get(espId) ?? new Set<number>();
    return this.ports
      .filter((port) => !usedPortsForEsp.has(port))
      .map((port) => ({
        label: `Porta ${port}`,
        value: port,
      }));
  });

  ngOnInit(): void {
    const kitId = this.wizardState.kit()?.id;
    if (kitId) {
      this.equipmentService
        .getSensorOptionsForKit(kitId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (options) => {
            this.sensorOptions.set(options);
          },
        });
    }

    // Sync ESP selection signal and reset port when ESP changes
    this.form.controls.espEquipmentId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((espId) => {
        this.selectedEspId.set(espId);
        this.selectedPort.set(null);
        this.form.controls.sensorPort.reset();
      });

    // Sync port selection signal
    this.form.controls.sensorPort.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((port) => {
        this.selectedPort.set(port);
      });
  }

  protected isPortUsed(espId: number, port: number): boolean {
    return this.usedPorts().get(espId)?.has(port) ?? false;
  }

  protected isPortBeingSelected(espId: number, port: number): boolean {
    return (
      this.selectedEspId() === espId &&
      this.selectedPort() === port &&
      !this.isPortUsed(espId, port)
    );
  }

  protected addGasPoint(): void {
    if (this.form.invalid) return;

    const addressId = this.wizardState.selectedAddress()?.id;
    if (!addressId) {
      this.notificationService.error('Endereco nao encontrado. Volte para a etapa anterior.');
      return;
    }

    const espEquipmentId = this.form.controls.espEquipmentId.value;
    const sensorPort = this.form.controls.sensorPort.value;
    if (espEquipmentId === null || sensorPort === null) return;
    const location = this.form.controls.location.value;

    // Cria o Sensor na porta escolhida e amarra ao ponto (codigoSensor = serial|porta).
    const sensorsToAdd: SensorAssignment[] = [{ parentEquipmentId: espEquipmentId, sensorPort }];

    this.isCreating.set(true);

    this.pontoGasService
      .create({ addressId, location, sensorsToAdd })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result: PontoGasResponse) => {
          this.wizardState.addGasPoint(result);
          this.notificationService.success(`Ponto de gas "${location}" criado com sucesso.`);
          this.form.reset();
          this.isCreating.set(false);
        },
        error: () => {
          // A causa real da API é exibida pelo errorInterceptor.
          this.isCreating.set(false);
        },
      });
  }

  protected removeGasPoint(gp: PontoGasResponse): void {
    this.pontoGasService
      .delete(gp.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.wizardState.removeGasPoint(gp.id);
          this.notificationService.success(`Ponto de gas "${gp.location}" removido.`);
        },
        error: () => {
          // A causa real da API é exibida pelo errorInterceptor.
        },
      });
  }

  private findParentEspId(parentSerial: string | null): number | null {
    if (!parentSerial) return null;
    const esp = this.wizardState
      .esp32s()
      .find((e) => e.serialNumber === parentSerial || e.assetTag === parentSerial);
    return esp?.id ?? null;
  }
}
