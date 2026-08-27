import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Chart } from 'chart.js';
import { PressureLineChartComponent } from './pressure-line-chart.component';

interface ChartWithRealtime {
  chart: Chart<'line'> & {
    options: {
      scales: {
        x: { realtime: { refresh: number; pause: boolean } };
      };
    };
  };
}

// jsdom does not implement HTMLCanvasElement.getContext, so Chart.js cannot fully initialize.
// These tests only run when a real canvas implementation is available (eg. vitest with jsdom
// + the `canvas` npm package, or a browser-based runner). Under the default CI setup they are
// skipped to avoid false-positive passes that never assert anything.
const hasCanvasContext = (() => {
  try {
    const c = document.createElement('canvas');
    return c.getContext('2d') !== null;
  } catch {
    return false;
  }
})();

describe.skipIf(!hasCanvasContext)('PressureLineChartComponent — streaming inputs', () => {
  let fixture: ComponentFixture<PressureLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PressureLineChartComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(PressureLineChartComponent);
    fixture.componentRef.setInput('historicalData', new Map());
    fixture.componentRef.setInput('newReadings', []);
    fixture.componentRef.setInput('refreshIntervalSeconds', 10);
    fixture.componentRef.setInput('paused', false);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function readRealtime(): { refresh: number; pause: boolean } {
    const inst = fixture.componentInstance as unknown as ChartWithRealtime;
    return inst.chart.options.scales.x.realtime;
  }

  it('uses provided refresh interval on init (in ms)', () => {
    expect(readRealtime().refresh).toBe(10_000);
  });

  it('reconfigures chart when refreshIntervalSeconds input changes', async () => {
    fixture.componentRef.setInput('refreshIntervalSeconds', 25);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(readRealtime().refresh).toBe(25_000);
  });

  it('reconfigures pause flag when paused input changes', async () => {
    fixture.componentRef.setInput('paused', true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(readRealtime().pause).toBe(true);
  });
});
