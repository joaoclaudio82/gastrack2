import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CylinderStatus } from '@models/cylinder.model';

@Component({
  selector: 'app-tank-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      [ngClass]="getBadgeClasses()"
    >
      <svg class="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="6" r="4" fill="currentColor" />
      </svg>
      {{ getStatusLabel() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TankStatusBadgeComponent {
  readonly status = input.required<CylinderStatus>();

  getBadgeClasses(): string {
    const classes: Record<CylinderStatus, string> = {
      [CylinderStatus.FULL]: 'tank-status-full',
      [CylinderStatus.NORMAL]: 'tank-status-normal',
      [CylinderStatus.LOW]: 'tank-status-low',
      [CylinderStatus.CRITICAL]: 'tank-status-critical',
      [CylinderStatus.EMPTY]: 'tank-status-empty',
      [CylinderStatus.UNKNOWN]: 'tank-status-empty',
    };
    return classes[this.status()];
  }

  getStatusLabel(): string {
    const labels: Record<CylinderStatus, string> = {
      [CylinderStatus.FULL]: 'Cheio',
      [CylinderStatus.NORMAL]: 'Normal',
      [CylinderStatus.LOW]: 'Baixo',
      [CylinderStatus.CRITICAL]: 'Crítico',
      [CylinderStatus.EMPTY]: 'Vazio',
      [CylinderStatus.UNKNOWN]: 'Desconhecido',
    };
    return labels[this.status()];
  }
}
