import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { EquipmentService } from '@core/services/equipment.service';
import { NotificationService } from '@core/services/notification.service';
import type { Equipment, EquipmentRequest } from '@models/equipment.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import {
  MultiSelectComponent,
  type MultiSelectOption,
} from '@shared/components/ui/multi-select/multi-select.component';
import { EquipmentFormComponent } from '../equipment-form/equipment-form.component';

export interface EquipmentBatchAssignResult {
  equipmentIds: number[];
  kitId: number;
}

@Component({
  selector: 'app-equipment-assign-modal',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ModalComponent,
    ButtonComponent,
    MultiSelectComponent,
    EquipmentFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #assignContent>
      <div class="space-y-4">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-foreground">
              Equipamentos
              <span class="ml-0.5 text-destructive">*</span>
            </span>
            <app-button type="button" variant="ghost" size="sm" (buttonClick)="openEquipmentForm()">
              <svg
                class="w-4 h-4 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Novo Equipamento
            </app-button>
          </div>

          <app-multi-select
            [options]="equipmentOptions()"
            [(value)]="selectedIds"
            addMoreLabel="Adicionar equipamento"
            emptyMessage="Nenhum equipamento disponível"
            hint="Selecione os equipamentos que deseja atribuir ao kit"
            [hideSelected]="true"
          />
        </div>

        @if (selectedEquipments().length > 0) {
          <div class="rounded-sm border border-border bg-muted/50 p-3 space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium">Resumo da Seleção</p>
              <span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {{ selectedEquipments().length }}
                {{ selectedEquipments().length === 1 ? 'equipamento' : 'equipamentos' }}
              </span>
            </div>
            <div class="max-h-40 overflow-y-auto space-y-1.5">
              @for (equipment of selectedEquipments(); track equipment.id) {
                <div
                  class="flex items-center justify-between text-xs text-muted-foreground bg-background rounded-md px-2 py-1.5"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="font-medium text-foreground truncate">
                      {{ equipment.assetTag }}
                    </span>
                    <span class="truncate">{{ equipment.equipmentTypeName }}</span>
                  </div>
                  @if (equipment.serialNumber) {
                    <span class="text-muted-foreground/70 truncate ml-2">
                      SN: {{ equipment.serialNumber }}
                    </span>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </ng-template>

    @if (useModal()) {
      <app-modal [isOpen]="isOpen()" [title]="resolvedTitle()" size="md" (closed)="onClose()">
        <ng-container [ngTemplateOutlet]="assignContent" />

        <ng-container modal-footer>
          <app-button variant="outline" (buttonClick)="onClose()">Cancelar</app-button>
          <app-button
            variant="primary"
            [loading]="isLoading()"
            [disabled]="selectedIds().length === 0"
            (buttonClick)="onSubmit()"
          >
            {{ resolvedSubmitLabel() }}
            {{ selectedIds().length > 0 ? '(' + selectedIds().length + ')' : '' }}
          </app-button>
        </ng-container>
      </app-modal>
    } @else {
      <div class="space-y-4">
        <ng-container [ngTemplateOutlet]="assignContent" />

        <div class="flex justify-end">
          <app-button
            variant="primary"
            [loading]="isLoading()"
            [disabled]="selectedIds().length === 0"
            (buttonClick)="onSubmit()"
          >
            {{ resolvedSubmitLabel() }}
            {{ selectedIds().length > 0 ? '(' + selectedIds().length + ')' : '' }}
          </app-button>
        </div>
      </div>
    }

    <!-- Equipment Form Modal -->
    <app-equipment-form
      [isOpen]="isEquipmentFormOpen()"
      [equipment]="null"
      [isLoading]="isCreatingEquipment()"
      (submitted)="onEquipmentSubmit($event)"
      (closed)="closeEquipmentForm()"
    />
  `,
})
export class EquipmentAssignModalComponent {
  private readonly equipmentService = inject(EquipmentService);
  private readonly notificationService = inject(NotificationService);

  readonly isOpen = input(true);
  readonly kitId = input.required<number>();
  readonly isLoading = input<boolean>(false);
  readonly useModal = input(true);
  readonly title = input<string>('');
  readonly submitLabel = input<string>('');

  readonly submitted = output<EquipmentBatchAssignResult>();
  readonly closed = output();

  readonly isEquipmentFormOpen = signal(false);
  readonly isCreatingEquipment = signal(false);
  readonly selectedIds = signal<number[]>([]);

  protected readonly equipmentOptions = computed<MultiSelectOption[]>(() => {
    return this.equipmentService.unassignedEquipments().map((e) => ({
      label: `${e.assetTag} - ${e.equipmentTypeName}`,
      value: e.id,
      description: e.serialNumber ? `SN: ${e.serialNumber}` : undefined,
    }));
  });

  protected readonly selectedEquipments = computed<Equipment[]>(() => {
    const ids = new Set(this.selectedIds());
    return this.equipmentService.unassignedEquipments().filter((e) => ids.has(e.id));
  });

  constructor() {
    // Reset state and reload data when modal opens
    effect(() => {
      const shouldLoad = this.useModal() ? this.isOpen() : true;
      if (shouldLoad) {
        this.selectedIds.set([]);
        this.equipmentService.getUnassigned({ page: 1, pageSize: 100 });
      }
    });
  }

  protected resolvedTitle(): string {
    return this.title().trim() || 'Atribuir Equipamentos ao Kit';
  }

  protected resolvedSubmitLabel(): string {
    return this.submitLabel().trim() || 'Atribuir';
  }

  openEquipmentForm(): void {
    this.isEquipmentFormOpen.set(true);
  }

  closeEquipmentForm(): void {
    this.isEquipmentFormOpen.set(false);
  }

  onEquipmentSubmit(data: EquipmentRequest): void {
    this.isCreatingEquipment.set(true);
    this.equipmentService.create(data).subscribe({
      next: (equipment) => {
        this.notificationService.success('Equipamento criado com sucesso!');
        this.closeEquipmentForm();
        this.isCreatingEquipment.set(false);
        this.equipmentService.getUnassigned({ page: 1, pageSize: 100 });
        this.selectedIds.update((ids) => [...ids, equipment.id]);
      },
      error: () => {
        this.notificationService.error('Erro ao criar equipamento.');
        this.isCreatingEquipment.set(false);
      },
    });
  }

  onSubmit(): void {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    this.selectedIds.set([]);
    this.submitted.emit({
      equipmentIds: ids,
      kitId: this.kitId(),
    });
  }

  onClose(): void {
    this.selectedIds.set([]);
    this.closed.emit();
  }
}
