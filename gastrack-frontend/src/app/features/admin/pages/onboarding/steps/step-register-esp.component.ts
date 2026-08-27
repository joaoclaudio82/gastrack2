import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EquipmentTypeService } from '@core/services/equipment-type.service';
import { EquipmentService } from '@core/services/equipment.service';
import { NotificationService } from '@core/services/notification.service';
import type { Equipment, EquipmentRequest } from '@models/equipment.model';
import { EQUIPMENT_CONDITION } from '@models/equipment.model';
import { ESP32_EQUIPMENT_TYPE_ID } from '@models/ponto-gas.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { OnboardingStateService } from '../onboarding-state.service';

interface DeviceRegistration {
  readonly serialNumber: string;
  assetTag: string;
  status: 'pending' | 'creating' | 'assigning' | 'done' | 'error';
  equipment: Equipment | null;
  errorMessage: string | null;
}

@Component({
  selector: 'app-onboarding-step-register-esp',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Registrar ESP32s</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Registrando
        <strong>{{ serials().length }}</strong>
        dispositivo(s) no kit
        <strong>{{ wizardState.kit()?.kitCode }}</strong>
        .
      </p>
    </div>

    <div class="px-8 py-6 space-y-4">
      @for (device of devices(); track device.serialNumber) {
        <div
          class="rounded-lg border p-4 space-y-3"
          [class.border-green-300]="device.status === 'done'"
          [class.bg-green-50]="device.status === 'done'"
          [class.border-red-300]="device.status === 'error'"
          [class.bg-red-50]="device.status === 'error'"
          [class.border-border]="device.status !== 'done' && device.status !== 'error'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <svg
                  class="h-4 w-4 text-gray-600"
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
              <div>
                <span class="font-mono text-sm font-semibold text-gray-900">
                  {{ device.serialNumber }}
                </span>
              </div>
            </div>

            <!-- Status indicator -->
            @switch (device.status) {
              @case ('pending') {
                <span class="text-xs text-muted-foreground">Aguardando...</span>
              }
              @case ('creating') {
                <span class="flex items-center gap-1.5 text-xs text-blue-600">
                  <svg
                    class="h-3.5 w-3.5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Criando equipamento...
                </span>
              }
              @case ('assigning') {
                <span class="flex items-center gap-1.5 text-xs text-blue-600">
                  <svg
                    class="h-3.5 w-3.5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Atribuindo ao kit...
                </span>
              }
              @case ('done') {
                <span class="flex items-center gap-1.5 text-xs font-medium text-green-700">
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Registrado com sucesso
                </span>
              }
              @case ('error') {
                <span class="flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  {{ device.errorMessage }}
                </span>
              }
            }
          </div>

          @if (device.status === 'done') {
            <p class="text-xs text-muted-foreground">
              Asset Tag:
              <span class="font-mono">{{ device.assetTag }}</span>
            </p>
          }
        </div>
      }

      <!-- Actions -->
      <div class="flex items-center justify-between pt-4">
        <div class="text-sm text-muted-foreground">
          {{ doneCount() }}/{{ devices().length }} registrado(s)
        </div>
        <div class="flex gap-3">
          @if (!allStarted()) {
            <app-button [loading]="isRegistering()" (buttonClick)="registerAll()">
              Registrar Todos
            </app-button>
          }
          @if (allDone()) {
            <app-button (buttonClick)="completed.emit()">Avancar</app-button>
          }
        </div>
      </div>
    </div>
  `,
})
export class StepRegisterEspComponent implements OnInit {
  protected readonly wizardState = inject(OnboardingStateService);
  private readonly equipmentService = inject(EquipmentService);
  private readonly equipmentTypeService = inject(EquipmentTypeService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly serials = input<string[]>([]);
  readonly completed = output();

  protected readonly devices = signal<DeviceRegistration[]>([]);
  protected readonly isRegistering = signal(false);

  protected readonly doneCount = computed(
    () => this.devices().filter((d) => d.status === 'done').length,
  );

  protected readonly allDone = computed(
    () => this.devices().length > 0 && this.devices().every((d) => d.status === 'done'),
  );

  protected readonly allStarted = computed(
    () => this.devices().length > 0 && this.devices().every((d) => d.status !== 'pending'),
  );

  ngOnInit(): void {
    const serialList = this.serials();
    this.devices.set(
      serialList.map((serial) => ({
        serialNumber: serial,
        assetTag: serial,
        status: 'pending',
        equipment: null,
        errorMessage: null,
      })),
    );

    this.equipmentTypeService.getActive();

    // Auto-start registration
    setTimeout(() => {
      this.registerAll();
    }, 500);
  }

  protected updateAssetTag(serial: string, value: string): void {
    this.devices.update((devices) =>
      devices.map((d) => (d.serialNumber === serial ? { ...d, assetTag: value || serial } : d)),
    );
  }

  protected registerAll(): void {
    this.isRegistering.set(true);
    const kitId = this.wizardState.kit()?.id;
    if (!kitId) {
      this.notificationService.error('Kit nao encontrado. Volte para a etapa anterior.');
      this.isRegistering.set(false);
      return;
    }

    const pendingDevices = this.devices().filter(
      (d) => d.status === 'pending' || d.status === 'error',
    );

    const registrations$ = pendingDevices.map((device) => this.registerDevice(device, kitId));

    if (registrations$.length === 0) {
      this.isRegistering.set(false);
      return;
    }

    forkJoin(registrations$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isRegistering.set(false);
          const failedCount = this.devices().filter((d) => d.status === 'error').length;
          if (failedCount === 0) {
            this.notificationService.success('Todos os ESP32s foram registrados com sucesso!');
          } else {
            this.notificationService.warning(`${failedCount} dispositivo(s) falharam no registro.`);
          }
        },
        error: () => {
          this.isRegistering.set(false);
        },
      });
  }

  private registerDevice(device: DeviceRegistration, kitId: number) {
    this.updateDeviceStatus(device.serialNumber, 'creating', null);

    const esp32TypeId = this.getEsp32TypeId();

    const request: EquipmentRequest = {
      equipmentTypeId: esp32TypeId,
      assetTag: device.assetTag,
      serialNumber: device.serialNumber,
      condition: EQUIPMENT_CONDITION.NEW,
    };

    return this.equipmentService.create(request).pipe(
      switchMap((equipment) => {
        this.updateDeviceStatus(device.serialNumber, 'assigning', null, equipment);
        return this.equipmentService.assignToKit(equipment.id, { kitId });
      }),
      switchMap((assignedEquipment) => {
        this.updateDeviceStatus(device.serialNumber, 'done', null, assignedEquipment);
        this.wizardState.addEsp32(assignedEquipment);
        return of(assignedEquipment);
      }),
      catchError((err: unknown) => {
        let message = 'Erro ao registrar dispositivo';
        if (err && typeof err === 'object') {
          const httpErr = err as {
            error?: { message?: string };
            message?: string;
            status?: number;
          };
          if (httpErr.error?.message) {
            message = httpErr.error.message;
          } else if (httpErr.message) {
            message = httpErr.message;
          }
          console.error('Register ESP error:', httpErr.status, message, err);
        }
        this.updateDeviceStatus(device.serialNumber, 'error', message);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private getEsp32TypeId(): number {
    const types = this.equipmentTypeService.activeTypes();
    const esp32Type = types.find((t) => t.name.toUpperCase().includes('ESP32'));
    return esp32Type?.id ?? ESP32_EQUIPMENT_TYPE_ID;
  }

  private updateDeviceStatus(
    serial: string,
    status: DeviceRegistration['status'],
    errorMessage: string | null,
    equipment?: Equipment,
  ): void {
    this.devices.update((devices) =>
      devices.map((d) => {
        if (d.serialNumber !== serial) return d;
        return {
          ...d,
          status,
          errorMessage,
          equipment: equipment ?? d.equipment,
        };
      }),
    );
  }
}
