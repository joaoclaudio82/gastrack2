import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GAS_TYPE_LABELS } from '@models/cylinder-model.model';
import { Cylinder } from '@models/cylinder.model';
import { CardComponent } from '@shared/components/ui/card/card.component';

/**
 * Card de IDENTIDADE do cilindro (botijão físico): serial + tipo de gás +
 * volume + capacidade + preço/m³. Pressão/%/status NÃO são do cilindro —
 * vivem no PontoGas (leitura combinada do manifold). Ver Fatia 2c/2d.
 */
@Component({
  selector: 'app-oxygen-tank-card',
  standalone: true,
  imports: [DecimalPipe, CardComponent],
  template: `
    <app-card [hoverable]="true" variant="outline">
      <!-- Header: serial (identidade) + tipo de gás -->
      <div class="flex items-center justify-between mb-4">
        <h3
          class="text-lg font-semibold text-foreground truncate"
          [title]="cylinder().serialNumber"
        >
          {{ cylinder().serialNumber }}
        </h3>
        <span
          class="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
        >
          {{ gasTypeLabel() }}
        </span>
      </div>

      <div class="flex items-center gap-4 mb-4">
        <div
          class="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground"
        >
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 4H15C15.5523 4 16 4.44772 16 5V19C16 19.5523 15.5523 20 15 20H9C8.44772 20 8 19.5523 8 19V5C8 4.44772 8.44772 4 9 4Z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path d="M10 3H14V4H10V3Z" fill="currentColor" />
          </svg>
        </div>
        <div>
          <p class="text-3xl font-bold text-foreground">
            {{ cylinder().waterVolumeLiters | number: '1.0-1' }}
          </p>
          <p class="text-sm text-muted-foreground">L de volume de água</p>
        </div>
      </div>

      <!-- Derivados do modelo -->
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-muted-foreground">Capacidade:</span>
          <span class="font-medium text-foreground">
            {{ cylinder().capacityBar | number: '1.0-1' }} bar
          </span>
        </div>

        <div class="flex justify-between">
          <span class="text-muted-foreground">Preço/m³:</span>
          <span class="font-medium text-foreground">
            {{ cylinder().pricePerM3 | number: '1.2-2' }}
          </span>
        </div>

        <div class="flex justify-between">
          <span class="text-muted-foreground">Situação:</span>
          <span class="font-medium" [class.text-muted-foreground]="!cylinder().active">
            {{ cylinder().active ? 'Ativo' : 'Inativo' }}
          </span>
        </div>
      </div>
    </app-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OxygenTankCardComponent {
  readonly cylinder = input.required<Cylinder>();

  readonly gasTypeLabel = computed(() => GAS_TYPE_LABELS[this.cylinder().gasType] ?? '—');
}
