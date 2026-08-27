import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import type { PressureReading } from '@models/pressure-reading.model';
import streamingRegisterables, { StreamingPlugin } from '@robloche/chartjs-plugin-streaming';
import {
  Chart,
  registerables,
  type ChartDataset,
  type Point,
  type ScriptableContext,
} from 'chart.js';
import 'chartjs-adapter-luxon';

Chart.register(...registerables, ...streamingRegisterables, StreamingPlugin);

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

type LineDataset = ChartDataset<'line', Point[]>;

/**
 * Junta pontos novos aos existentes mantendo a ordem cronológica, sem duplicar x.
 *
 * Aba em segundo plano congela o requestAnimationFrame e o refresh do gráfico:
 * as leituras se acumulam no buffer e chegam todas de uma vez quando a aba volta.
 * Anexadas com push puro, entram fora de ordem — o traço volta no tempo e, como a
 * série é preenchida até a origem, o preenchimento desenha uma cunha do canto
 * inferior esquerdo até o último ponto.
 */
export function mergeByTime(existing: Point[], incoming: Point[]): Point[] {
  if (incoming.length === 0) return existing;

  // O tipo Point do Chart.js admite x nulo; aqui todo ponto nasce de um
  // timestamp, então isso nunca acontece — mas sem posição no tempo o ponto não
  // teria como ser ordenado, e ficar de fora é melhor que embaralhar a série.
  const porX = new Map<number, Point>();
  for (const ponto of [...existing, ...incoming]) {
    if (ponto.x != null) porX.set(ponto.x, ponto);
  }

  return [...porX.values()].sort((esquerda, direita) => (esquerda.x ?? 0) - (direita.x ?? 0));
}

/** CSS variable names mapped to design system semantic colors for chart lines. */
const CSS_COLOR_VARS = [
  '--color-primary',
  '--color-info',
  '--color-success',
  '--color-warning',
  '--color-danger',
  '--color-steel-400',
];

const FALLBACK_COLOR: RgbColor = { r: 107, g: 128, b: 155 }; // steel-ish fallback

/** Resolve a CSS color string (oklch, rgb, hex, etc.) to an RgbColor via an off-screen canvas. */
function cssColorToRgb(cssColor: string): RgbColor | null {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return { r: r ?? 0, g: g ?? 0, b: b ?? 0 };
}

/** Read design-system colors from CSS custom properties at runtime. */
function resolveDesignSystemColors(): RgbColor[] {
  const style = getComputedStyle(document.documentElement);
  const colors: RgbColor[] = [];
  for (const varName of CSS_COLOR_VARS) {
    const raw = style.getPropertyValue(varName).trim();
    if (raw) {
      const rgb = cssColorToRgb(raw);
      if (rgb) {
        colors.push(rgb);
        continue;
      }
    }
    colors.push(FALLBACK_COLOR);
  }
  return colors.length > 0 ? colors : [FALLBACK_COLOR];
}

function rgba(color: RgbColor, alpha: number): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function isLastPoint(ctx: ScriptableContext<'line'>): boolean {
  return ctx.dataIndex === ctx.dataset.data.length - 1;
}

@Component({
  selector: 'app-pressure-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative h-full w-full min-h-[400px]">
      <canvas #chartCanvas></canvas>
    </div>
  `,
})
export class PressureLineChartComponent implements AfterViewInit, OnDestroy {
  readonly chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');

  readonly historicalData = input.required<Map<string, PressureReading[]>>();
  readonly newReadings = input<PressureReading[]>([]);
  readonly timelineMinutes = input<number>(30);
  readonly refreshIntervalSeconds = input<number>(5);
  readonly paused = input<boolean>(false);
  readonly refreshRequested = output();

  private chart: Chart<'line', Point[]> | null = null;
  private destroyed = false;
  private seeded = false;
  private pendingReadings: PressureReading[] = [];
  private gradientCache = new Map<number, CanvasGradient>();
  private deviceColorMap = new Map<string, number>();
  private nextColorIndex = 0;
  private resolvedColors: RgbColor[] = [];

  constructor() {
    effect(() => {
      const data = this.historicalData();
      if (!this.chart || this.destroyed || data.size === 0) return;
      // Já semeado: dado novo entra por pendingReadings.
      if (this.seeded) return;
      // Marca ANTES de agendar. Com a aba em segundo plano o rAF congela e o
      // efeito pode rodar de novo antes do callback: dois seedChart enfileirados,
      // e cada um substitui datasets inteiro, apagando o que já entrou ao vivo.
      this.seeded = true;
      requestAnimationFrame(() => {
        if (this.chart && !this.destroyed) {
          this.seedChart(data);
        }
      });
    });

    effect(() => {
      const readings = this.newReadings();
      if (readings.length > 0) {
        this.pendingReadings.push(...readings);
      }
    });

    effect(() => {
      const minutes = this.timelineMinutes();
      this.updateTimelineDuration(minutes);
      const intervalMs = this.refreshIntervalSeconds() * 1000;
      const paused = this.paused();
      if (!this.chart || this.destroyed) return;
      const xScale = this.chart.options.scales?.['x'] as
        | { realtime?: { refresh?: number; pause?: boolean } }
        | undefined;
      if (xScale?.realtime) {
        xScale.realtime.refresh = intervalMs;
        xScale.realtime.pause = paused;
        this.chart.update('none');
      }
    });
  }

  ngAfterViewInit(): void {
    this.resolvedColors = resolveDesignSystemColors();
    this.initChart();
    const data = this.historicalData();
    if (this.chart && data.size > 0) {
      this.seedChart(data);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.pendingReadings = [];
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private getColorIndex(deviceId: string): number {
    let idx = this.deviceColorMap.get(deviceId);
    if (idx == null) {
      idx = this.nextColorIndex;
      this.deviceColorMap.set(deviceId, idx);
      const paletteLen = this.resolvedColors.length || CSS_COLOR_VARS.length;
      this.nextColorIndex = (this.nextColorIndex + 1) % paletteLen;
    }
    return idx;
  }

  private createGradient(
    ctx: CanvasRenderingContext2D,
    color: RgbColor,
    height: number,
  ): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, rgba(color, 0.35));
    gradient.addColorStop(1, rgba(color, 0.02));
    return gradient;
  }

  private initChart(): void {
    const canvas = this.chartCanvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart<'line', Point[]>(ctx, {
      type: 'line',
      data: {
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 300,
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                family: 'IBM Plex Sans, system-ui, sans-serif',
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleFont: {
              family: 'IBM Plex Sans, system-ui, sans-serif',
              size: 13,
              weight: 'bold',
            },
            bodyFont: {
              family: 'IBM Plex Sans, system-ui, sans-serif',
              size: 12,
            },
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return `${context.dataset.label}: ${value !== null ? value.toFixed(2) : 'N/A'} bar`;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'realtime',
            realtime: {
              duration: this.toTimelineDurationMs(this.timelineMinutes()),
              refresh: this.refreshIntervalSeconds() * 1000,
              delay: 2_000,
              frameRate: 30,
              pause: this.paused(),
              onRefresh: (chart: Chart) => {
                if (this.destroyed) return;
                this.drainPendingReadings(chart);
                this.refreshRequested.emit();
              },
            },
            ticks: {
              font: {
                family: 'IBM Plex Sans, system-ui, sans-serif',
                size: 11,
              },
              maxRotation: 0,
            },
            grid: {
              color: 'rgba(107, 114, 128, 0.1)',
            },
          },
          y: {
            display: true,
            min: 0,
            title: {
              display: true,
              text: 'Pressão (bar)',
              font: {
                family: 'IBM Plex Sans, system-ui, sans-serif',
                size: 12,
                weight: 'bold',
              },
            },
            grid: {
              color: 'rgba(107, 114, 128, 0.15)',
            },
            ticks: {
              font: {
                family: 'IBM Plex Sans, system-ui, sans-serif',
                size: 11,
              },
              callback: (value) => `${Number(value).toFixed(2)} bar`,
            },
            grace: '15%',
          },
        },
        elements: {
          point: {
            radius: 0,
            hoverRadius: 6,
            hitRadius: 10,
          },
          line: {
            tension: 0.4,
            borderWidth: 2.5,
          },
        },
      },
    });
  }

  private buildDataset(
    deviceId: string,
    ctx: CanvasRenderingContext2D,
    canvasHeight: number,
    data: Point[],
  ): LineDataset {
    const colorIndex = this.getColorIndex(deviceId);
    const palette = this.resolvedColors.length > 0 ? this.resolvedColors : [FALLBACK_COLOR];
    const color = palette[colorIndex % palette.length] ?? FALLBACK_COLOR;
    const gradient = this.createGradient(ctx, color, canvasHeight);
    this.gradientCache.set(colorIndex, gradient);

    return {
      label: this.formatDeviceId(deviceId),
      data,
      borderColor: rgba(color, 1),
      backgroundColor: gradient,
      fill: true,
      spanGaps: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: (ctx: ScriptableContext<'line'>) => (isLastPoint(ctx) ? 5 : 0),
      pointBackgroundColor: rgba(color, 1),
      pointBorderColor: '#ffffff',
      pointBorderWidth: (ctx: ScriptableContext<'line'>) => (isLastPoint(ctx) ? 3 : 0),
    };
  }

  private seedChart(data: Map<string, PressureReading[]>): void {
    if (this.destroyed || !this.chart?.canvas?.parentNode) return;
    const canvas = this.chartCanvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.deviceColorMap.clear();
    this.nextColorIndex = 0;
    this.gradientCache.clear();

    const datasets: LineDataset[] = [];

    for (const [deviceId, readings] of data.entries()) {
      const sorted = [...readings].sort((a, b) => a.timestamp - b.timestamp);
      const points: Point[] = sorted.map((r) => ({
        x: r.timestamp * 1000,
        y: Math.round(r.pressureBar * 100) / 100,
      }));
      datasets.push(this.buildDataset(deviceId, ctx, canvas.height || 400, points));
    }

    this.chart.data.datasets = datasets;
    this.chart.update('none');
    this.seeded = true;
  }

  private drainPendingReadings(chart: Chart): void {
    if (this.pendingReadings.length === 0) return;

    const kept: PressureReading[] = [];
    const novosPorDataset = new Map<LineDataset, Point[]>();

    for (const reading of this.pendingReadings) {
      const label = this.formatDeviceId(reading.deviceId);
      const dataset = chart.data.datasets.find((ds): ds is LineDataset => ds.label === label);

      if (dataset) {
        const novos = novosPorDataset.get(dataset) ?? [];
        novos.push({
          x: reading.timestamp * 1000,
          y: Math.round(reading.pressureBar * 100) / 100,
        });
        novosPorDataset.set(dataset, novos);
      } else {
        // Leitura de um device sem dataset ainda: fica no buffer para a próxima
        // rodada, quando o seed já tiver criado a série dele.
        kept.push(reading);
      }
    }

    for (const [dataset, novos] of novosPorDataset) {
      dataset.data = mergeByTime(dataset.data, novos);
    }

    this.pendingReadings = kept;
  }

  private formatDeviceId(deviceId: string): string {
    const match = /(\d+)$/.exec(deviceId);
    return match ? `Sensor ${match[1]}` : deviceId;
  }

  private toTimelineDurationMs(minutes: number): number {
    const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 30;
    return safeMinutes * 60 * 1000;
  }

  private updateTimelineDuration(minutes: number): void {
    const xScale = this.chart?.options.scales?.['x'];
    if (xScale?.type !== 'realtime') return;
    const realtime = xScale.realtime;
    if (!realtime) return;

    realtime.duration = this.toTimelineDurationMs(minutes);
    this.chart?.update('none');
  }
}
