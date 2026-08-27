import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import type { Equipment } from '@models/equipment.model';
import { AlertComponent } from '@shared/components/ui/alert/alert.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';

export type SwapMode = 'esp' | 'sensor';

export type KitSwapResult =
  | { mode: 'esp'; newEspEquipmentId: number; retireOld: boolean }
  | {
      mode: 'sensor';
      oldSensorEquipmentId: number;
      newSensorEquipmentId: number;
      retireOld: boolean;
    };

/** Destino do equipamento que sai: devolver ao estoque (trocado) ou aposentar (defeito). */
const DISPOSITION_OPTIONS: SelectOption[] = [
  { label: 'Devolver ao estoque (ainda funciona)', value: 'stock' },
  { label: 'Aposentar (com defeito)', value: 'retire' },
];

/** True when the equipment is an ESP32 gateway (by type name, mirrors the onboarding steps). */
function isEsp32(e: Equipment): boolean {
  return (e.equipmentTypeName ?? '').toUpperCase().includes('ESP32');
}

/**
 * True quando o equipamento é o tipo lógico "Sensor" — igualdade exata de nome, espelhando
 * o backend (EquipmentType.SENSOR_TYPE_NAME / EquipmentKitServiceImpl.isSensor). NÃO usar
 * "contém sensor": isso reincluiria "Sensor de Pressão"/"Módulo GPS" etc., que não são o
 * sensor lógico trocável.
 */
function isSensor(e: Equipment): boolean {
  return (e.equipmentTypeName ?? '').toUpperCase() === 'SENSOR';
}

function toOption(e: Equipment): SelectOption {
  const serial = e.serialNumber ? ` · ${e.serialNumber}` : '';
  return { label: `${e.assetTag} — ${e.equipmentTypeName}${serial}`, value: e.id };
}

/**
 * Maintenance swap modal. Two modes sharing one shell:
 * - esp: replace the kit's dead ESP32 gateway with one from stock (backend re-points every sensor).
 * - sensor: replace one sensor on the same port/point.
 * The replacement comes from `candidates` (unassigned equipment); the old sensor from `currentEquipments`.
 */
@Component({
  selector: 'app-kit-swap-modal',
  standalone: true,
  imports: [ModalComponent, ButtonComponent, SelectComponent, AlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [isOpen]="isOpen()" [title]="title()" size="md" (closed)="onClose()">
      <div class="space-y-4">
        <div class="rounded-sm border border-border bg-muted/50 p-3 space-y-1">
          <p class="text-sm font-medium">{{ kitCode() }}</p>
          @if (currentEsp(); as esp) {
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Gateway atual:</span>
              {{ esp.assetTag }}{{ esp.serialNumber ? ' · ' + esp.serialNumber : '' }}
            </p>
          }
        </div>

        @if (mode() === 'esp') {
          @if (!currentEsp()) {
            <app-alert variant="warning">
              <p class="text-sm">
                Este kit não tem um ESP ativo — não há gateway para trocar. Adicione um ESP ao kit
                primeiro.
              </p>
            </app-alert>
          }
          <app-alert variant="info">
            <p class="text-sm">
              O ESP de reposição assume o kit; todos os sensores são reapontados para o novo serial
              e as leituras seguem. O ESP atual sai do kit — o destino você escolhe abaixo.
            </p>
          </app-alert>

          @if (newEspOptions().length === 0) {
            <app-alert variant="warning">
              <p class="text-sm">
                Nenhum ESP32 livre no estoque. Cadastre/libere um ESP antes de trocar.
              </p>
            </app-alert>
          } @else {
            <app-select
              label="ESP de reposição"
              placeholder="Selecione um ESP32 do estoque"
              [options]="newEspOptions()"
              (valueChange)="selectedNewEsp.set(asId($event))"
            />
          }
        } @else {
          <app-alert variant="info">
            <p class="text-sm">
              O sensor de reposição assume a mesma porta e o mesmo ponto (mesmo codigoSensor) — o
              stream de leitura não é interrompido.
            </p>
          </app-alert>

          @if (oldSensorOptions().length === 0) {
            <app-alert variant="warning">
              <p class="text-sm">Este kit não tem sensores ativos para trocar.</p>
            </app-alert>
          } @else {
            <app-select
              label="Sensor a trocar"
              placeholder="Selecione o sensor com defeito"
              [options]="oldSensorOptions()"
              (valueChange)="selectedOldSensor.set(asId($event))"
            />
          }

          @if (newSensorOptions().length === 0) {
            <app-alert variant="warning">
              <p class="text-sm">Nenhum sensor livre no estoque.</p>
            </app-alert>
          } @else {
            <app-select
              label="Sensor de reposição"
              placeholder="Selecione um sensor do estoque"
              [options]="newSensorOptions()"
              (valueChange)="selectedNewSensor.set(asId($event))"
            />
          }
        }

        <!-- Destino do equipamento que está saindo (comum aos dois modos) -->
        <app-select
          [label]="mode() === 'esp' ? 'Destino do ESP atual' : 'Destino do sensor atual'"
          placeholder="Devolver ao estoque (padrão)"
          [options]="dispositionOptions"
          hint="Devolver ao estoque mantém o equipamento reutilizável; aposentar revoga a credencial."
          (valueChange)="retireOld.set($event === 'retire')"
        />
      </div>

      <ng-container modal-footer>
        <app-button variant="outline" (buttonClick)="onClose()">Cancelar</app-button>
        <app-button
          variant="primary"
          [loading]="isLoading()"
          [disabled]="!canSubmit()"
          (buttonClick)="onSubmit()"
        >
          {{ mode() === 'esp' ? 'Trocar ESP' : 'Trocar sensor' }}
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class KitSwapModalComponent {
  readonly isOpen = input.required<boolean>();
  readonly mode = input<SwapMode>('esp');
  readonly kitCode = input<string>('');
  /** The kit's current equipments (to find the current ESP / list swappable sensors). */
  readonly currentEquipments = input<Equipment[]>([]);
  /** Unassigned equipment available as replacements. */
  readonly candidates = input<Equipment[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<KitSwapResult>();
  readonly closed = output();

  readonly selectedNewEsp = signal<number | null>(null);
  readonly selectedOldSensor = signal<number | null>(null);
  readonly selectedNewSensor = signal<number | null>(null);
  /** Destino do equipamento que sai: false = devolver ao estoque (padrão), true = aposentar. */
  readonly retireOld = signal(false);
  readonly dispositionOptions = DISPOSITION_OPTIONS;

  readonly title = computed(() =>
    this.mode() === 'esp' ? 'Trocar ESP (gateway)' : 'Trocar sensor',
  );

  readonly currentEsp = computed(
    () => this.currentEquipments().find((e) => isEsp32(e) && e.active) ?? null,
  );
  readonly newEspOptions = computed(() => this.candidates().filter(isEsp32).map(toOption));
  readonly oldSensorOptions = computed(() =>
    this.currentEquipments()
      .filter((e) => isSensor(e) && e.active)
      .map(toOption),
  );
  readonly newSensorOptions = computed(() => this.candidates().filter(isSensor).map(toOption));

  readonly canSubmit = computed(() =>
    this.mode() === 'esp'
      ? // precisa de um ESP atual (pra sair) e um de reposição
        this.currentEsp() !== null && this.selectedNewEsp() !== null
      : this.selectedOldSensor() !== null && this.selectedNewSensor() !== null,
  );

  constructor() {
    // Reset selections whenever the modal (re)opens.
    effect(() => {
      if (this.isOpen()) {
        this.selectedNewEsp.set(null);
        this.selectedOldSensor.set(null);
        this.selectedNewSensor.set(null);
        this.retireOld.set(false);
      }
    });
  }

  /** app-select emits string | number | null; swap needs a numeric id or null. */
  asId(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  onSubmit(): void {
    const retireOld = this.retireOld();
    if (this.mode() === 'esp') {
      const newEspEquipmentId = this.selectedNewEsp();
      if (newEspEquipmentId === null) return;
      this.submitted.emit({ mode: 'esp', newEspEquipmentId, retireOld });
    } else {
      const oldSensorEquipmentId = this.selectedOldSensor();
      const newSensorEquipmentId = this.selectedNewSensor();
      if (oldSensorEquipmentId === null || newSensorEquipmentId === null) return;
      this.submitted.emit({
        mode: 'sensor',
        oldSensorEquipmentId,
        newSensorEquipmentId,
        retireOld,
      });
    }
  }

  onClose(): void {
    this.closed.emit();
  }
}
