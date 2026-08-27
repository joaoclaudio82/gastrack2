import { ChangeDetectionStrategy, Component, effect, inject, OnInit, output } from '@angular/core';
import { EquipmentService } from '@core/services/equipment.service';
import { NotificationService } from '@core/services/notification.service';
import {
  EquipmentAssignModalComponent,
  type EquipmentBatchAssignResult,
} from '@features/equipment/components/equipment-assign-modal/equipment-assign-modal.component';
import type { Equipment } from '@models/equipment.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { OnboardingStateService } from '../onboarding-state.service';

@Component({
  selector: 'app-onboarding-step-kit-equipments',
  standalone: true,
  imports: [ButtonComponent, EquipmentAssignModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Equipamentos do Kit</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Vincule equipamentos ao kit
        <strong>{{ wizardState.kit()?.kitCode }}</strong>
        usando o mesmo fluxo existente em
        <strong>/equipment/kits</strong>
        .
      </p>
    </div>

    <div class="px-8 py-6 space-y-6">
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
          O onboarding aqui so auxilia o fluxo. A atribuicao continua seguindo a mesma logica do
          detalhe do kit.
        </p>
      </div>

      @if (equipmentService.equipments().length > 0) {
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-700">Equipamentos vinculados</h3>
            <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {{ equipmentService.equipments().length }}
            </span>
          </div>

          <div class="space-y-2">
            @for (equipment of equipmentService.equipments(); track equipment.id) {
              <div class="rounded-lg border border-border p-3">
                <div class="text-sm font-medium text-gray-900">{{ equipment.assetTag }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ equipment.equipmentTypeName }}
                  @if (equipment.serialNumber) {
                    - SN: {{ equipment.serialNumber }}
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <div class="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4">
        <app-equipment-assign-modal
          [useModal]="false"
          [kitId]="wizardState.kit()?.id ?? 0"
          [isLoading]="equipmentService.isLoading()"
          submitLabel="Vincular ao kit"
          (submitted)="onEquipmentAssign($event)"
        />
      </div>

      <div class="flex justify-end pt-2">
        <app-button (buttonClick)="completed.emit()">Avancar</app-button>
      </div>
    </div>
  `,
})
export class StepKitEquipmentsComponent implements OnInit {
  protected readonly wizardState = inject(OnboardingStateService);
  protected readonly equipmentService = inject(EquipmentService);
  private readonly notificationService = inject(NotificationService);

  readonly completed = output();

  constructor() {
    effect(() => {
      this.syncWizardEquipments(this.equipmentService.equipments());
    });
  }

  ngOnInit(): void {
    this.loadKitEquipments();
  }

  protected onEquipmentAssign(result: EquipmentBatchAssignResult): void {
    this.equipmentService
      .assignBatchToKit({ equipmentIds: result.equipmentIds, kitId: result.kitId })
      .subscribe({
        next: (response) => {
          if (response.failureCount === 0) {
            this.notificationService.success(
              `${response.successCount} equipamento${response.successCount > 1 ? 's' : ''} atribuído${response.successCount > 1 ? 's' : ''} ao kit.`,
            );
          } else if (response.successCount === 0) {
            this.notificationService.error(
              'Nenhum equipamento foi atribuído. Verifique se já não estão em uso.',
            );
          } else {
            this.notificationService.warning(
              `${response.successCount} atribuído${response.successCount > 1 ? 's' : ''}, ${response.failureCount} falha${response.failureCount > 1 ? 's' : ''}.`,
            );
          }

          this.loadKitEquipments();
        },
        error: () => {
          // A causa real da API é exibida pelo errorInterceptor.
        },
      });
  }

  private loadKitEquipments(): void {
    const kitId = this.wizardState.kit()?.id;
    if (!kitId) {
      return;
    }

    this.equipmentService.getByKit(kitId, { page: 1, pageSize: 100 });
  }

  private syncWizardEquipments(equipments: Equipment[]): void {
    if (!this.wizardState.kit()) {
      this.wizardState.setEsp32s([]);
      this.wizardState.setExtraEquipments([]);
      return;
    }

    const esp32s = equipments.filter((equipment) =>
      equipment.equipmentTypeName.toUpperCase().includes('ESP32'),
    );
    const extraEquipments = equipments.filter(
      (equipment) => !equipment.equipmentTypeName.toUpperCase().includes('ESP32'),
    );

    this.wizardState.setEsp32s(esp32s);
    this.wizardState.setExtraEquipments(extraEquipments);
  }
}
