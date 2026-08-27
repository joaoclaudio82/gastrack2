import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ConsumptionTrendDirection,
  EstimateConfidenceLevel,
  EstimatedAutonomyState,
  PressureStats,
} from '@models/pressure-reading.model';
import { PressureStatsComponent } from './pressure-stats.component';

/**
 * Acesso tipado aos getters de apresentação `protected` para os testes.
 */
interface PressureStatsInternals {
  comparisonLabel(): string;
  comparisonArrow(): string;
  comparisonTextClasses(): string;
  autonomyValue(): string;
  autonomyConfidenceLabel(): string;
  autonomyStateClasses(): string;
}

function buildStats(overrides: Partial<PressureStats> = {}): PressureStats {
  return {
    totalReadings: 10,
    averagePressure: 50,
    maxPressure: 100,
    minPressure: 10,
    currentLiters: 250,
    currentPercentage: 50,
    averageConsumptionBarPerHour: 1.2,
    consumptionComparison: {
      previousAverageBarPerHour: 1,
      deltaPercentage: 20,
      direction: 'up',
      tooltip: 'tooltip',
    },
    estimatedAutonomy: {
      remainingHours: 5,
      consumptionLitersPerHour: 2,
      confidence: 'high',
      state: 'estimating',
      label: 'Autonomia estimada',
      tooltip: 'tooltip',
    },
    tankStatus: { level: 'normal', label: 'Normal' },
    latestReading: null,
    uniqueDevices: 1,
    ...overrides,
  };
}

describe('PressureStatsComponent', () => {
  let fixture: ComponentFixture<PressureStatsComponent>;
  let component: PressureStatsComponent;
  let internals: PressureStatsInternals;

  function setStats(stats: PressureStats): void {
    fixture.componentRef.setInput('stats', stats);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PressureStatsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(PressureStatsComponent);
    component = fixture.componentInstance;
    internals = component as unknown as PressureStatsInternals;
  });

  function withDirection(direction: ConsumptionTrendDirection): PressureStats {
    return buildStats({
      consumptionComparison: {
        previousAverageBarPerHour: 1,
        deltaPercentage: direction === 'neutral' ? null : 10,
        direction,
        tooltip: 'tooltip',
      },
    });
  }

  function withAutonomyState(
    state: EstimatedAutonomyState,
    confidence: EstimateConfidenceLevel | null = null,
    remainingHours: number | null = null,
  ): PressureStats {
    return buildStats({
      estimatedAutonomy: {
        remainingHours,
        consumptionLitersPerHour: 2,
        confidence,
        state,
        label: 'label',
        tooltip: 'tooltip',
      },
    });
  }

  it('should_return_up_arrow_when_direction_is_up', () => {
    setStats(withDirection('up'));
    expect(internals.comparisonArrow()).toBe('▲');
    expect(internals.comparisonTextClasses()).toBe('text-[var(--color-danger-text)]');
  });

  it('should_return_down_arrow_when_direction_is_down', () => {
    setStats(withDirection('down'));
    expect(internals.comparisonArrow()).toBe('▼');
    expect(internals.comparisonTextClasses()).toBe('text-[var(--color-success-text)]');
  });

  it('should_return_neutral_arrow_when_direction_is_neutral', () => {
    setStats(withDirection('neutral'));
    expect(internals.comparisonArrow()).toBe('■');
    expect(internals.comparisonTextClasses()).toBe('text-muted-foreground');
  });

  it('should_return_empty_comparison_label_when_delta_is_null', () => {
    setStats(withDirection('neutral'));
    expect(internals.comparisonLabel()).toBe('');
  });

  it('should_format_comparison_label_with_accents_when_delta_has_value', () => {
    setStats(withDirection('up'));
    const label = internals.comparisonLabel();
    expect(label).toContain('vs. período anterior');
    expect(label.startsWith('+')).toBe(true);
  });

  it('should_show_estimated_autonomy_hours_when_state_is_estimating', () => {
    setStats(withAutonomyState('estimating', 'high', 5));
    expect(internals.autonomyValue()).toBe('~5.0 h');
    expect(internals.autonomyConfidenceLabel()).toBe('Confiança alta');
    expect(internals.autonomyStateClasses()).toBe('text-[var(--color-success-text)]');
  });

  it('should_show_medium_confidence_label_with_accent_when_estimating_medium', () => {
    setStats(withAutonomyState('estimating', 'medium', 3));
    expect(internals.autonomyConfidenceLabel()).toBe('Confiança média');
    expect(internals.autonomyStateClasses()).toBe('text-[var(--color-info-text)]');
  });

  it('should_show_refilling_state_when_state_is_refilling', () => {
    setStats(withAutonomyState('refilling'));
    expect(internals.autonomyValue()).toBe('Reabastecendo');
    expect(internals.autonomyConfidenceLabel()).toBe('Volume recente em alta');
    expect(internals.autonomyStateClasses()).toBe('text-[var(--color-info-text)]');
  });

  it('should_show_stable_state_when_state_is_stable', () => {
    setStats(withAutonomyState('stable'));
    expect(internals.autonomyValue()).toBe('Sem consumo');
    expect(internals.autonomyConfidenceLabel()).toBe('Taxa recente próxima de zero');
    expect(internals.autonomyStateClasses()).toBe('text-muted-foreground');
  });

  it('should_show_weak_estimate_when_state_is_insufficient', () => {
    setStats(withAutonomyState('insufficient'));
    expect(internals.autonomyValue()).toBe('Estimativa fraca');
    expect(internals.autonomyConfidenceLabel()).toBe('Poucas leituras ou janela curta');
    expect(internals.autonomyStateClasses()).toBe('text-[var(--color-warning-text)]');
  });
});
