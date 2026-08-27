import { CommonModule, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PressureStats, TankStatusLevel } from '@models/pressure-reading.model';
import { TooltipDirective } from '@shared/directives';

/**
 * Component displaying pressure statistics in a grid of cards.
 */
@Component({
  selector: 'app-pressure-stats',
  standalone: true,
  imports: [CommonModule, DecimalPipe, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-6 sm:gap-8 lg:gap-8">
      <!-- Total Readings -->
      <article
        class="bg-card rounded-sm border border-border p-6 shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/30 min-w-0"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-sm bg-[var(--color-info-bg)] text-[var(--color-info-text)] ring-1 ring-[var(--color-info)]/30"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
        </div>
        <p class="text-2xl font-bold text-foreground tabular-nums">{{ stats().totalReadings }}</p>
        <p class="text-sm font-medium text-muted-foreground mt-2">Total de Leituras</p>
      </article>

      <!-- Average Pressure -->
      <article
        class="bg-card rounded-sm border border-border p-6 shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/30 min-w-0"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-sm bg-primary/10 text-primary ring-1 ring-primary/30"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3a9 9 0 1 0 9 9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </div>
        </div>
        <p class="text-2xl font-bold text-foreground tabular-nums">
          {{ stats().averagePressure | number: '1.2-2' }}
          <span class="text-lg font-normal text-muted-foreground">bar</span>
        </p>
        <p class="text-sm font-medium text-muted-foreground mt-2">Pressão Média</p>
      </article>

      <!-- Tank Status -->
      <article
        class="bg-card rounded-sm border border-border p-6 shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/30 min-w-0"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-sm ring-1"
            [ngClass]="statusClass(stats().tankStatus.level)"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 20h16" />
              <path d="M6 20v-6" />
              <path d="M10 20v-9" />
              <path d="M14 20v-4" />
              <path d="M18 20v-12" />
            </svg>
          </div>
        </div>
        <p class="text-2xl font-bold text-foreground tabular-nums">
          {{ stats().tankStatus.label }}
        </p>
        <p class="text-sm font-medium text-muted-foreground mt-2">Status do Tanque</p>
      </article>

      <!-- Current Tank Percentage -->
      <article
        class="bg-card rounded-sm border border-border p-6 shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/30 min-w-0"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-sm bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] ring-1 ring-[var(--color-warning)]/30"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
        </div>
        <p class="text-2xl font-bold text-foreground tabular-nums">
          @if (stats().currentPercentage === null) {
            <!-- Sem casco não há 100% de referência: travessão, não 0,00% -->
            —
          } @else {
            {{ stats().currentPercentage | number: '1.2-2' }}
            <span class="text-lg font-normal text-muted-foreground">%</span>
          }
        </p>
        <p class="text-sm font-medium text-muted-foreground mt-2">
          Porcentagem Atual do Tanque (última leitura)
        </p>
      </article>

      <!-- Average Consumption -->
      <article
        class="bg-card rounded-sm border border-border p-6 shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/30 min-w-0"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-sm bg-secondary text-secondary-foreground ring-1 ring-border"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>

          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            [appTooltip]="stats().consumptionComparison.tooltip"
            tooltipPosition="top"
            aria-label="Explicação da comparação de consumo"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </button>
        </div>

        <p class="text-2xl font-bold text-foreground tabular-nums">
          {{ stats().averageConsumptionBarPerHour | number: '1.2-2' }}
          <span class="text-lg font-normal text-muted-foreground">bar/h</span>
        </p>
        <p class="text-sm font-medium text-muted-foreground mt-2">Consumo Médio do Período</p>
        @if (comparisonLabel()) {
          <p
            class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
            [ngClass]="comparisonTextClasses()"
          >
            <span aria-hidden="true">{{ comparisonArrow() }}</span>
            {{ comparisonLabel() }}
          </p>
        } @else {
          <p class="mt-3 text-sm text-muted-foreground">Sem base anterior comparável</p>
        }
      </article>

      <!-- Estimated Autonomy -->
      <article
        class="bg-card rounded-sm border border-border p-6 shadow-sm transition-all duration-150 hover:shadow-md hover:border-primary/30 min-w-0"
      >
        <div class="flex items-center justify-between mb-4">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-sm bg-[var(--color-success-bg)] text-[var(--color-success-text)] ring-1 ring-[var(--color-success)]/30"
          >
            <svg
              class="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>

          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            [appTooltip]="stats().estimatedAutonomy.tooltip"
            tooltipPosition="top"
            aria-label="Explicação da autonomia estimada"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </button>
        </div>

        <p class="text-2xl font-bold text-foreground tabular-nums">
          {{ autonomyValue() }}
        </p>
        <p class="text-sm font-medium text-muted-foreground mt-2">Autonomia Estimada</p>
        <p class="mt-3 text-sm" [ngClass]="autonomyStateClasses()">
          {{ autonomyConfidenceLabel() }}
        </p>
      </article>
    </div>
  `,
})
export class PressureStatsComponent {
  readonly stats = input.required<PressureStats>();
  protected readonly statusClasses: Record<TankStatusLevel, string> = {
    full: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] ring-[var(--color-success)]/30',
    normal: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)] ring-[var(--color-info)]/30',
    low: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] ring-[var(--color-warning)]/30',
    critical:
      'bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] ring-[var(--color-danger)]/30',
    unknown: 'bg-muted text-muted-foreground ring-border',
  };

  protected statusClass(level: TankStatusLevel): string {
    return this.statusClasses[level] ?? this.statusClasses.critical;
  }

  protected comparisonLabel(): string {
    const delta = this.stats().consumptionComparison.deltaPercentage;
    if (delta == null || !Number.isFinite(delta)) {
      return '';
    }
    const signal = delta >= 0 ? '+' : '-';
    return `${signal}${Math.abs(delta).toFixed(1)}% vs. período anterior`;
  }

  protected comparisonArrow(): string {
    const direction = this.stats().consumptionComparison.direction;
    if (direction === 'up') return '▲';
    if (direction === 'down') return '▼';
    return '■';
  }

  protected comparisonTextClasses(): string {
    const direction = this.stats().consumptionComparison.direction;
    if (direction === 'up') {
      return 'text-[var(--color-danger-text)]';
    }
    if (direction === 'down') {
      return 'text-[var(--color-success-text)]';
    }
    return 'text-muted-foreground';
  }

  protected autonomyValue(): string {
    const autonomy = this.stats().estimatedAutonomy;
    if (autonomy.state === 'estimating' && autonomy.remainingHours != null) {
      return `~${autonomy.remainingHours.toFixed(1)} h`;
    }
    if (autonomy.state === 'refilling') {
      return 'Reabastecendo';
    }
    if (autonomy.state === 'stable') {
      return 'Sem consumo';
    }
    return 'Estimativa fraca';
  }

  protected autonomyConfidenceLabel(): string {
    const autonomy = this.stats().estimatedAutonomy;
    if (autonomy.state === 'estimating') {
      return `Confiança ${this.confidenceLabel(autonomy.confidence)}`;
    }
    if (autonomy.state === 'refilling') {
      return 'Volume recente em alta';
    }
    if (autonomy.state === 'stable') {
      return 'Taxa recente próxima de zero';
    }
    return 'Poucas leituras ou janela curta';
  }

  protected autonomyStateClasses(): string {
    const autonomy = this.stats().estimatedAutonomy;
    if (autonomy.state === 'estimating') {
      if (autonomy.confidence === 'high') return 'text-[var(--color-success-text)]';
      if (autonomy.confidence === 'medium') return 'text-[var(--color-info-text)]';
      return 'text-[var(--color-warning-text)]';
    }
    if (autonomy.state === 'refilling') {
      return 'text-[var(--color-info-text)]';
    }
    if (autonomy.state === 'stable') {
      return 'text-muted-foreground';
    }
    return 'text-[var(--color-warning-text)]';
  }

  private confidenceLabel(confidence: 'low' | 'medium' | 'high' | null): string {
    if (confidence === 'high') return 'alta';
    if (confidence === 'medium') return 'média';
    return 'baixa';
  }
}
