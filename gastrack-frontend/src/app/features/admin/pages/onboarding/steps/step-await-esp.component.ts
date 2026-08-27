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
import { DevicePingLogService } from '@core/services/device-ping-log.service';
import { NotificationService } from '@core/services/notification.service';
import type { DevicePingLog } from '@models/device-ping-log.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { interval, switchMap } from 'rxjs';
import { OnboardingStateService } from '../onboarding-state.service';

interface GroupedDevice {
  readonly serialNumber: string;
  readonly ipAddress: string | null;
  readonly pingedAt: string;
  readonly id: number;
}

@Component({
  selector: 'app-onboarding-step-await-esp',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Detectar ESP32s</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Ligue os dispositivos ESP32 e aguarde a deteccao. Selecione os que deseja registrar no kit
        <strong>{{ wizardState.kit()?.kitCode }}</strong>
        .
      </p>
    </div>

    <div class="px-8 py-6 space-y-6">
      <!-- Pulsing listener indicator -->
      <div class="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <span class="relative flex h-3 w-3">
          <span
            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"
          ></span>
          <span class="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
        </span>
        <span class="text-sm font-medium text-blue-700">Escutando sinais de dispositivos...</span>
        @if (devicePingLogService.isLoading()) {
          <svg
            class="ml-auto h-4 w-4 animate-spin text-blue-500"
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
        }
      </div>

      <!-- Device list -->
      @if (groupedDevices().length === 0) {
        <div class="flex flex-col items-center gap-3 py-12 text-center">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              class="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
              />
            </svg>
          </div>
          <p class="text-sm text-muted-foreground">
            Nenhum dispositivo nao registrado detectado ainda.
          </p>
          <p class="text-xs text-muted-foreground">
            Verifique se os ESP32s estao ligados e conectados a rede.
          </p>
        </div>
      } @else {
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-700">
              {{ groupedDevices().length }} dispositivo(s) detectado(s)
            </span>
            @if (groupedDevices().length > 1) {
              <button
                type="button"
                class="text-xs font-medium text-primary hover:underline"
                (click)="toggleSelectAll()"
              >
                {{ allSelected() ? 'Desmarcar todos' : 'Selecionar todos' }}
              </button>
            }
          </div>

          @for (device of groupedDevices(); track device.serialNumber) {
            <label
              class="flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-accent/50"
              [class.border-primary]="isSelected(device.serialNumber)"
              [class.bg-primary/5]="isSelected(device.serialNumber)"
              [class.border-border]="!isSelected(device.serialNumber)"
            >
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                [checked]="isSelected(device.serialNumber)"
                (change)="toggleDevice(device.serialNumber)"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-semibold text-gray-900">
                    {{ device.serialNumber }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Online
                  </span>
                </div>
                <div class="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                  @if (device.ipAddress) {
                    <span>IP: {{ device.ipAddress }}</span>
                  }
                  <span>Ultimo ping: {{ formatTimestamp(device.pingedAt) }}</span>
                </div>
              </div>
            </label>
          }
        </div>
      }

      <!-- Register button -->
      @if (groupedDevices().length > 0) {
        <div class="flex justify-end pt-2">
          <app-button
            [disabled]="selectedSerials().length === 0"
            (buttonClick)="registerSelected()"
          >
            Registrar Selecionados ({{ selectedSerials().length }})
          </app-button>
        </div>
      }
    </div>
  `,
})
export class StepAwaitEspComponent implements OnInit {
  protected readonly wizardState = inject(OnboardingStateService);
  protected readonly devicePingLogService = inject(DevicePingLogService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly completed = output<string[]>();
  readonly selectedSerials = signal<string[]>([]);

  protected readonly groupedDevices = computed<GroupedDevice[]>(() => {
    const logs = this.devicePingLogService.logs();
    const map = new Map<string, DevicePingLog>();
    for (const log of logs) {
      const existing = map.get(log.serialNumber);
      if (!existing || log.pingedAt > existing.pingedAt) {
        map.set(log.serialNumber, log);
      }
    }
    return Array.from(map.values()).map((log) => ({
      serialNumber: log.serialNumber,
      ipAddress: log.ipAddress,
      pingedAt: log.pingedAt,
      id: log.id,
    }));
  });

  protected readonly allSelected = computed(() => {
    const devices = this.groupedDevices();
    const selected = this.selectedSerials();
    return devices.length > 0 && devices.every((d) => selected.includes(d.serialNumber));
  });

  ngOnInit(): void {
    this.fetchDevices();

    interval(5000)
      .pipe(
        switchMap(() => {
          this.fetchDevices();
          return [];
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected isSelected(serial: string): boolean {
    return this.selectedSerials().includes(serial);
  }

  protected toggleDevice(serial: string): void {
    this.selectedSerials.update((serials) =>
      serials.includes(serial) ? serials.filter((s) => s !== serial) : [...serials, serial],
    );
  }

  protected toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedSerials.set([]);
    } else {
      this.selectedSerials.set(this.groupedDevices().map((d) => d.serialNumber));
    }
  }

  protected registerSelected(): void {
    const serials = this.selectedSerials();
    if (serials.length === 0) {
      this.notificationService.warning('Selecione ao menos um dispositivo.');
      return;
    }
    this.completed.emit(serials);
  }

  protected formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  }

  private fetchDevices(): void {
    this.devicePingLogService.getAll(
      { page: 1, pageSize: 50, sortBy: 'pingedAt', sortOrder: 'desc' },
      { unregistered: true },
    );
  }
}
