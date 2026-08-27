import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '@core/services/api.service';
import type { LevelThresholds } from '@models/ponto-gas.model';
import {
  ConsumptionComparison,
  EstimatedAutonomy,
  PaginatedPressureResponse,
  PressureFilters,
  PressureReading,
  PressureStats,
  TankStatus,
  TankStatusLevel,
} from '@models/pressure-reading.model';
import {
  catchError,
  EMPTY,
  expand,
  finalize,
  map,
  Observable,
  of,
  reduce,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';

export interface PressureReadingsParams {
  startTimestamp?: number;
  endTimestamp?: number;
  limit?: number;
  cursor?: string;
  sensorId?: number;
}

interface HistoricalQueryContext {
  deviceId: string;
  startTimestamp?: number;
  endTimestamp?: number;
  limit?: number;
  sensorId?: number;
}

@Injectable({ providedIn: 'root' })
export class PressureService {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  /** Teto de páginas paginadas em fetchAllReadingsForRange para evitar N+ ilimitado. */
  private static readonly MAX_RANGE_PAGES = 20;
  /** Teto de leituras acumuladas na paginação para evitar crescimento descontrolado. */
  private static readonly MAX_RANGE_READINGS = 5000;
  /**
   * Usado só até a linha responder. As faixas reais vêm do servidor via
   * PontoGas.thresholds — antes estavam duplicadas aqui como 0.2/0.5/0.8, e divergiriam
   * em silêncio de CylinderThresholdsConfiguration se um dos lados mudasse.
   */
  private static readonly DEFAULT_THRESHOLDS: LevelThresholds = {
    critical: 20,
    low: 50,
    normal: 80,
  };
  private static readonly AUTONOMY_WINDOW_SIZE = 12;
  private static readonly AUTONOMY_MIN_READINGS = 3;
  private static readonly AUTONOMY_MIN_SPAN_SECONDS = 15 * 60;
  private static readonly AUTONOMY_REFILL_THRESHOLD_LITERS = 1;
  /**
   * Subida de pressão que conta como recarga, não como ruído. Bem acima de
   * qualquer oscilação de sensor e bem abaixo de qualquer troca de casco real.
   * ponytail: limiar fixo; deveria vir do servidor junto dos thresholds de nível
   * (CONVENTIONS §8) se algum dia a fórmula de consumo mudar de dono.
   */
  private static readonly REFILL_RISE_THRESHOLD_BAR = 5;
  private static readonly AUTONOMY_STABLE_THRESHOLD_LITERS_PER_HOUR = 0.1;

  // === Signals: historical data (from fetchReadings, initial load only) ===
  private readonly historicalReadingsSignal = signal<PressureReading[]>([]);

  // === Signals: streamed data (from fetchNewReadings, append only) ===
  private readonly streamedReadingsSignal = signal<PressureReading[]>([]);

  // === Signals: chart streaming channel (push to chart, never triggers re-seed) ===
  private readonly newReadingsSignal = signal<PressureReading[]>([]);

  // === Signals: UI state ===
  private readonly loadingSignal = signal(false);
  private readonly loadingMoreSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly filtersSignal = signal<PressureFilters>({ limit: 300 });
  private readonly nextCursorSignal = signal<string | null>(null);
  private readonly hasMoreSignal = signal(false);
  private readonly deviceIdSignal = signal<string | null>(null);
  private readonly currentCodigoSensorSignal = signal<string | null>(null);
  private readonly availableDevicesSignal = signal<{ value: string; label: string }[]>([]);
  private readonly lastTimestampSignal = signal<number | null>(null);
  private readonly isStreamingSignal = signal(false);
  private readonly lastHistoricalQuerySignal = signal<HistoricalQueryContext | null>(null);
  /**
   * Volume e pressão de 100% da linha, derivados dos cascos conectados pelo servidor.
   * `null` quando a linha não tem casco: sem default local: ter 5 L / 140 bar chumbados
   * aqui fabricava nível para linha sem cilindro, e duplicava número de negócio que só
   * o backend deve definir (CONVENTIONS §8).
   */
  private readonly internalVolumeLitersSignal = signal<number | null>(null);
  private readonly fullTankPressureBarSignal = signal<number | null>(null);
  private readonly thresholdsSignal = signal<LevelThresholds>(PressureService.DEFAULT_THRESHOLDS);
  private readonly previousPeriodAverageConsumptionSignal = signal<number | null>(null);
  private comparisonRequestVersion = 0;

  /**
   * Gatilho de comparação com período anterior. Cada emissão cancela a
   * paginação in-flight anterior via switchMap, evitando requisições órfãs ao
   * trocar de device/período.
   */
  private readonly comparisonTrigger$ = new Subject<{
    deviceId: string;
    params: PressureReadingsParams;
    requestVersion: number;
  }>();

  constructor() {
    this.comparisonTrigger$
      .pipe(
        switchMap(({ deviceId, params, requestVersion }) =>
          this.fetchAllReadingsForRange(deviceId, params).pipe(
            map((readings) => ({ readings, requestVersion })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ readings, requestVersion }) => {
        if (requestVersion !== this.comparisonRequestVersion) {
          return;
        }
        this.previousPeriodAverageConsumptionSignal.set(
          readings.length > 1 ? this.calculateAverageConsumptionBarPerHour(readings) : null,
        );
      });
  }

  // === Public readonly signals ===
  readonly loading = this.loadingSignal.asReadonly();
  readonly loadingMore = this.loadingMoreSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly nextCursor = this.nextCursorSignal.asReadonly();
  readonly hasMore = this.hasMoreSignal.asReadonly();
  readonly deviceId = this.deviceIdSignal.asReadonly();
  readonly currentCodigoSensor = this.currentCodigoSensorSignal.asReadonly();
  readonly availableDevices = this.availableDevicesSignal.asReadonly();
  readonly isStreaming = this.isStreamingSignal.asReadonly();

  /** New readings for chart push — only consumed by chart component */
  readonly newReadings = this.newReadingsSignal.asReadonly();

  /**
   * All readings (historical + streamed) for stats/cards.
   * This does NOT feed the chart — chart uses chartData (historical only) + newReadings (push).
   */
  readonly allReadings = computed(() => {
    const historical = this.historicalReadingsSignal();
    const streamed = this.streamedReadingsSignal();
    if (streamed.length === 0) return historical;
    return [...streamed, ...historical];
  });

  /** For backwards compat — same as allReadings */
  readonly readings = this.allReadings;

  readonly filteredReadings = computed(() => {
    const readings = this.allReadings();
    const filters = this.filtersSignal();

    if (!filters.startDate && !filters.endDate) {
      return readings;
    }

    return readings.filter((reading) => {
      const readingDate = this.parseDate(reading.datetime);
      if (filters.startDate && readingDate < filters.startDate) {
        return false;
      }
      if (filters.endDate && readingDate > filters.endDate) {
        return false;
      }
      return true;
    });
  });

  readonly stats = computed<PressureStats>(() => {
    const readings = this.filteredReadings();
    const currentAverageConsumption = this.calculateAverageConsumptionBarPerHour(readings);
    const consumptionComparison = this.buildConsumptionComparison(currentAverageConsumption);
    const estimatedAutonomy = this.buildEstimatedAutonomy(readings);

    if (readings.length === 0) {
      return {
        totalReadings: 0,
        averagePressure: 0,
        maxPressure: 0,
        minPressure: 0,
        currentLiters: null,
        currentPercentage: null,
        averageConsumptionBarPerHour: 0,
        consumptionComparison,
        estimatedAutonomy,
        tankStatus: this.calculateTankStatus(null),
        latestReading: null,
        uniqueDevices: 0,
      };
    }

    const pressures = readings.map((r) => r.pressureBar);
    const sum = pressures.reduce((a, b) => a + b, 0);
    const uniqueDevices = new Set(readings.map((r) => r.deviceId)).size;
    const latestReading = readings[0] ?? null;
    const currentLiters = this.calculateCurrentLiters(latestReading?.pressureBar);
    const currentPercentage = this.calculateCurrentPercentage(latestReading?.pressureBar);

    return {
      totalReadings: readings.length,
      averagePressure: sum / readings.length,
      maxPressure: Math.max(...pressures),
      minPressure: Math.min(...pressures),
      currentLiters,
      currentPercentage,
      averageConsumptionBarPerHour: currentAverageConsumption,
      consumptionComparison,
      estimatedAutonomy,
      tankStatus: this.calculateTankStatus(currentLiters),
      latestReading,
      uniqueDevices,
    };
  });

  /**
   * Chart seed data — uses ONLY historical readings (from fetchReadings).
   * Streamed readings go to the chart via newReadings → pendingReadings → push.
   * This separation prevents re-seeding when new readings arrive.
   */
  readonly chartData = computed(() => {
    const readings = this.historicalReadingsSignal();
    const filters = this.filtersSignal();

    let filtered = readings;
    if (filters.startDate || filters.endDate) {
      filtered = readings.filter((reading) => {
        const readingDate = this.parseDate(reading.datetime);
        if (filters.startDate && readingDate < filters.startDate) return false;
        if (filters.endDate && readingDate > filters.endDate) return false;
        return true;
      });
    }

    const deviceGroups = new Map<string, PressureReading[]>();
    filtered.forEach((reading) => {
      const group = deviceGroups.get(reading.deviceId) ?? [];
      group.push(reading);
      deviceGroups.set(reading.deviceId, group);
    });
    deviceGroups.forEach((group) => {
      group.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    });
    return deviceGroups;
  });

  /**
   * Initial/full data load. Sets historicalReadingsSignal (triggers chart seed).
   * Clears streamedReadingsSignal to avoid stale data mixing.
   */
  fetchReadings(
    deviceId: string,
    opts?: PressureReadingsParams & { isLoadMore?: boolean; isSilent?: boolean },
  ): Observable<PressureReading[]> {
    const isLoadMore = opts?.isLoadMore ?? false;
    const isSilent = opts?.isSilent ?? false;
    if (!isSilent) {
      if (isLoadMore) {
        this.loadingMoreSignal.set(true);
      } else {
        this.loadingSignal.set(true);
      }
    }
    this.errorSignal.set(null);
    if (!isLoadMore) {
      this.deviceIdSignal.set(deviceId);
      const comparisonVersion = ++this.comparisonRequestVersion;
      this.previousPeriodAverageConsumptionSignal.set(null);
      const historicalQuery: HistoricalQueryContext = { deviceId };
      if (opts?.startTimestamp != null) {
        historicalQuery.startTimestamp = opts.startTimestamp;
      }
      if (opts?.endTimestamp != null) {
        historicalQuery.endTimestamp = opts.endTimestamp;
      }
      if (opts?.limit != null) {
        historicalQuery.limit = Math.min(opts.limit, 500);
      }
      if (opts?.sensorId != null) {
        historicalQuery.sensorId = opts.sensorId;
      }
      this.lastHistoricalQuerySignal.set(historicalQuery);
      if (opts?.startTimestamp != null && opts?.endTimestamp != null) {
        this.loadPreviousPeriodComparison(historicalQuery, comparisonVersion);
      }
    }

    const params: Record<string, string> = { deviceId };
    if (opts?.startTimestamp != null) {
      params['startTimestamp'] = String(opts.startTimestamp);
    }
    if (opts?.endTimestamp != null) {
      params['endTimestamp'] = String(opts.endTimestamp);
    }
    if (opts?.limit != null) {
      params['limit'] = String(Math.min(opts.limit, 500));
    }
    if (opts?.cursor) {
      params['cursor'] = opts.cursor;
    }
    if (opts?.sensorId != null) {
      params['sensorId'] = String(opts.sensorId);
    }

    return this.api.get<PaginatedPressureResponse>('/pressure/readings', params).pipe(
      tap((response) => {
        const isAppend = Boolean(opts?.cursor);
        if (isAppend) {
          this.historicalReadingsSignal.update((prev) => [...prev, ...response.data]);
        } else {
          this.historicalReadingsSignal.set(response.data);
          this.streamedReadingsSignal.set([]);
          if (response.data.length > 0) {
            const maxTs = Math.max(...response.data.map((r) => r.timestamp));
            this.lastTimestampSignal.set(maxTs);
          }
        }
        this.nextCursorSignal.set(response.pagination.nextCursor);
        this.hasMoreSignal.set(response.pagination.hasMore);
      }),
      map((response) => response.data),
      catchError((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Erro ao carregar leituras de pressão';
        this.errorSignal.set(message);
        return of([]);
      }),
      finalize(() => {
        if (!isSilent) {
          if (isLoadMore) {
            this.loadingMoreSignal.set(false);
          } else {
            this.loadingSignal.set(false);
          }
        }
      }),
    );
  }

  private fetchingNew = false;

  /**
   * Incremental fetch for streaming. Only updates:
   * - newReadingsSignal (chart push channel)
   * - streamedReadingsSignal (stats/cards)
   * - lastTimestampSignal (cursor for next fetch)
   *
   * Does NOT touch historicalReadingsSignal, so chartData doesn't recalculate
   * and the chart never re-seeds.
   */
  fetchNewReadings(): void {
    if (this.fetchingNew) return;
    const deviceId = this.deviceIdSignal();
    const lastTs = this.lastTimestampSignal();
    const filters = this.filtersSignal();
    if (!deviceId || lastTs == null) return;

    this.fetchingNew = true;

    const params: Record<string, string> = {
      deviceId,
      startTimestamp: String(lastTs + 1),
      limit: '50',
    };
    if (filters.sensorId != null) {
      params['sensorId'] = String(filters.sensorId);
    }

    this.api.get<PaginatedPressureResponse>('/pressure/readings', params).subscribe({
      next: (response) => {
        if (response.data.length > 0) {
          const maxTs = Math.max(...response.data.map((r) => r.timestamp));
          this.lastTimestampSignal.set(maxTs);

          // Channel 1: push to chart (newReadingsSignal → pendingReadings → dataset.push)
          this.newReadingsSignal.set(response.data);

          // Channel 2: append to streamed readings (stats/cards only, NOT chart seed)
          this.streamedReadingsSignal.update((prev) => [...response.data, ...prev]);
        }
        this.fetchingNew = false;
      },
      error: () => {
        this.fetchingNew = false;
      },
    });
  }

  loadMore(): Observable<PressureReading[]> {
    const lastQuery = this.lastHistoricalQuerySignal();
    const cursor = this.nextCursorSignal();
    if (!lastQuery || !cursor) {
      return of([]);
    }
    const opts: PressureReadingsParams & { isLoadMore?: boolean } = {
      cursor,
      limit: 50,
      isLoadMore: true,
    };
    if (lastQuery.startTimestamp != null) {
      opts.startTimestamp = lastQuery.startTimestamp;
    }
    if (lastQuery.endTimestamp != null) {
      opts.endTimestamp = lastQuery.endTimestamp;
    }
    if (lastQuery.sensorId != null) {
      opts.sensorId = lastQuery.sensorId;
    }
    return this.fetchReadings(lastQuery.deviceId, opts);
  }

  setDeviceId(deviceId: string): void {
    this.deviceIdSignal.set(deviceId);
    this.currentCodigoSensorSignal.set(deviceId);
  }

  setDeviceFromCodigoSensor(codigoSensor: string): void {
    const [devicePart, sensorPart] = codigoSensor.split('|');
    const deviceId = devicePart ?? '';
    const parsed = sensorPart != null ? parseInt(sensorPart, 10) : NaN;
    const sensorId: number | null = !isNaN(parsed) ? parsed : null;
    this.deviceIdSignal.set(deviceId);
    this.currentCodigoSensorSignal.set(codigoSensor);
    this.setFilters({ sensorId });
  }

  setAvailableDevices(devices: { value: string; label: string }[]): void {
    this.availableDevicesSignal.set(devices);
  }

  setStreaming(active: boolean): void {
    this.isStreamingSignal.set(active);
  }

  setInternalVolumeLiters(value?: number | null): void {
    const parsed = value ?? NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      this.internalVolumeLitersSignal.set(null);
      return;
    }
    this.internalVolumeLitersSignal.set(parsed);
  }

  setFullTankPressureBar(value?: number | null): void {
    const parsed = value ?? NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      this.fullTankPressureBarSignal.set(null);
      return;
    }
    this.fullTankPressureBarSignal.set(parsed);
  }

  /** Faixas de nível vindas do servidor; sem elas o cliente cairia num default local. */
  setThresholds(value?: LevelThresholds | null): void {
    this.thresholdsSignal.set(value ?? PressureService.DEFAULT_THRESHOLDS);
  }

  setFilters(filters: Partial<PressureFilters>): void {
    this.filtersSignal.update((current) => ({
      ...current,
      ...filters,
    }));
  }

  clearFilters(): void {
    this.filtersSignal.update((f) => ({ ...f, startDate: undefined, endDate: undefined }));
  }

  reset(): void {
    this.historicalReadingsSignal.set([]);
    this.streamedReadingsSignal.set([]);
    this.newReadingsSignal.set([]);
    this.errorSignal.set(null);
    this.nextCursorSignal.set(null);
    this.hasMoreSignal.set(false);
    this.deviceIdSignal.set(null);
    this.currentCodigoSensorSignal.set(null);
    this.availableDevicesSignal.set([]);
    this.filtersSignal.set({ limit: 300 });
    this.lastTimestampSignal.set(null);
    this.isStreamingSignal.set(false);
    this.lastHistoricalQuerySignal.set(null);
    this.previousPeriodAverageConsumptionSignal.set(null);
    this.comparisonRequestVersion++;
    this.internalVolumeLitersSignal.set(null);
    this.fullTankPressureBarSignal.set(null);
    this.thresholdsSignal.set(PressureService.DEFAULT_THRESHOLDS);
  }

  dateToUnixSeconds(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  private parseDate(datetime: string): Date {
    const parts = datetime.split(' ');
    const datePart = parts[0] ?? '';
    const timePart = parts[1] ?? '';
    const dateComponents = datePart.split('/').map(Number);
    const timeComponents = timePart.split(':').map(Number);
    const day = dateComponents[0] ?? 1;
    const month = dateComponents[1] ?? 1;
    const year = dateComponents[2] ?? 2000;
    const hours = timeComponents[0] ?? 0;
    const minutes = timeComponents[1] ?? 0;
    const seconds = timeComponents[2] ?? 0;
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  private calculateCurrentLiters(pressureBar?: number | null): number | null {
    if (pressureBar == null || Number.isNaN(pressureBar)) {
      return null;
    }
    const liters = this.convertPressureBarToLiters(pressureBar);
    if (liters == null || !Number.isFinite(liters)) {
      return null;
    }
    return Math.max(0, liters);
  }

  private calculateCurrentPercentage(pressureBar?: number | null): number | null {
    if (pressureBar == null || Number.isNaN(pressureBar)) {
      return null;
    }
    const fullTankPressureBar = this.fullTankPressureBarSignal();
    if (
      fullTankPressureBar == null ||
      !Number.isFinite(fullTankPressureBar) ||
      fullTankPressureBar <= 0
    ) {
      return null;
    }
    return Math.max(0, Math.min(100, (Math.max(0, pressureBar) / fullTankPressureBar) * 100));
  }

  private calculateTankStatus(liters: number | null): TankStatus {
    const volume = this.internalVolumeLitersSignal();
    const fullTank = this.fullTankPressureBarSignal();
    if (liters == null || volume == null || fullTank == null) {
      // Sem casco não há escala: nível é desconhecido, não crítico.
      return this.buildTankStatus('unknown', 'Sem cilindro');
    }
    const fullScaleLiters = volume * fullTank;
    const fillPercentage =
      fullScaleLiters > 0 ? Math.min(100, (liters / fullScaleLiters) * 100) : 0;
    const { critical, low, normal } = this.thresholdsSignal();

    if (fillPercentage >= normal) return this.buildTankStatus('full', 'Cheio');
    if (fillPercentage >= low) return this.buildTankStatus('normal', 'Normal');
    if (fillPercentage >= critical) return this.buildTankStatus('low', 'Baixo');
    return this.buildTankStatus('critical', 'Crítico');
  }

  private buildTankStatus(level: TankStatusLevel, label: string): TankStatus {
    return { level, label };
  }

  private buildEstimatedAutonomy(readings: PressureReading[]): EstimatedAutonomy {
    const windowReadings = this.getAutonomyWindowReadings(readings);
    if (windowReadings.length < PressureService.AUTONOMY_MIN_READINGS) {
      return {
        remainingHours: null,
        consumptionLitersPerHour: null,
        confidence: null,
        state: 'insufficient',
        label: 'Estimativa fraca',
        tooltip: 'São necessárias pelo menos 3 leituras recentes para estimar a autonomia.',
      };
    }

    const firstReading = windowReadings[0];
    const lastReading = windowReadings[windowReadings.length - 1];
    if (!firstReading || !lastReading) {
      return {
        remainingHours: null,
        consumptionLitersPerHour: null,
        confidence: null,
        state: 'insufficient',
        label: 'Estimativa fraca',
        tooltip: 'Não foi possível consolidar a janela de leituras para estimar a autonomia.',
      };
    }

    const durationSeconds = lastReading.timestamp - firstReading.timestamp;
    if (durationSeconds < PressureService.AUTONOMY_MIN_SPAN_SECONDS) {
      return {
        remainingHours: null,
        consumptionLitersPerHour: null,
        confidence: null,
        state: 'insufficient',
        label: 'Estimativa fraca',
        tooltip:
          'A janela recente ainda cobre pouco tempo. Aguarde mais leituras para melhorar a estimativa.',
      };
    }

    const litersSeries = windowReadings
      .map((reading) => this.convertPressureBarToLiters(reading.pressureBar))
      .filter((liters): liters is number => liters != null);
    if (litersSeries.length === 0) {
      // Sem volume de casco não dá para converter bar em litros: a autonomia,
      // que é em litros, fica indisponível em vez de sair de um volume chutado.
      return {
        remainingHours: null,
        consumptionLitersPerHour: null,
        confidence: null,
        state: 'insufficient',
        label: 'Sem cilindro',
        tooltip: 'A linha não tem cilindro conectado, então não há volume para estimar autonomia.',
      };
    }
    const currentLiters = litersSeries[litersSeries.length - 1] ?? 0;
    const firstLiters = litersSeries[0] ?? 0;
    const netDeltaLiters = currentLiters - firstLiters;
    const consumptionLitersPerHour = this.calculateAverageConsumptionLitersPerHour(windowReadings);
    const confidence = this.calculateAutonomyConfidence(windowReadings.length, durationSeconds);

    if (netDeltaLiters > PressureService.AUTONOMY_REFILL_THRESHOLD_LITERS) {
      return {
        remainingHours: null,
        consumptionLitersPerHour: null,
        confidence,
        state: 'refilling',
        label: 'Reabastecendo',
        tooltip:
          'As leituras recentes indicam aumento no volume estimado, então a autonomia fica temporariamente indisponível.',
      };
    }

    if (
      !Number.isFinite(consumptionLitersPerHour) ||
      consumptionLitersPerHour <= PressureService.AUTONOMY_STABLE_THRESHOLD_LITERS_PER_HOUR
    ) {
      return {
        remainingHours: null,
        consumptionLitersPerHour: Math.max(0, consumptionLitersPerHour),
        confidence,
        state: 'stable',
        label: 'Sem consumo',
        tooltip:
          'A janela recente não mostrou consumo suficiente para projetar horas restantes com confiança.',
      };
    }

    const remainingHours = currentLiters / consumptionLitersPerHour;
    if (!Number.isFinite(remainingHours) || remainingHours < 0) {
      return {
        remainingHours: null,
        consumptionLitersPerHour,
        confidence,
        state: 'insufficient',
        label: 'Estimativa fraca',
        tooltip: 'Não foi possível calcular uma autonomia plausível com as leituras atuais.',
      };
    }

    return {
      remainingHours,
      consumptionLitersPerHour,
      confidence,
      state: 'estimating',
      label: 'Autonomia estimada',
      tooltip:
        `Estimativa baseada nas últimas ${windowReadings.length} leituras ` +
        `(${(durationSeconds / 3600).toFixed(1)} h de janela) e em uma taxa média de ${consumptionLitersPerHour.toFixed(2)} L/h.`,
    };
  }

  private loadPreviousPeriodComparison(
    query: HistoricalQueryContext,
    requestVersion: number,
  ): void {
    const { startTimestamp, endTimestamp } = query;
    if (startTimestamp == null || endTimestamp == null) {
      this.previousPeriodAverageConsumptionSignal.set(null);
      return;
    }

    const previousRange = this.buildPreviousEquivalentRange(startTimestamp, endTimestamp);

    const comparisonParams: PressureReadingsParams = {
      startTimestamp: previousRange.startTimestamp,
      endTimestamp: previousRange.endTimestamp,
      limit: Math.min(query.limit ?? 300, 500),
    };
    if (query.sensorId != null) {
      comparisonParams.sensorId = query.sensorId;
    }

    this.comparisonTrigger$.next({
      deviceId: query.deviceId,
      params: comparisonParams,
      requestVersion,
    });
  }

  private fetchAllReadingsForRange(
    deviceId: string,
    opts: PressureReadingsParams,
  ): Observable<PressureReading[]> {
    const buildParams = (cursor?: string): Record<string, string> => {
      const params: Record<string, string> = {
        deviceId,
        limit: String(Math.min(opts.limit ?? 300, 500)),
      };
      if (opts.startTimestamp != null) {
        params['startTimestamp'] = String(opts.startTimestamp);
      }
      if (opts.endTimestamp != null) {
        params['endTimestamp'] = String(opts.endTimestamp);
      }
      if (opts.sensorId != null) {
        params['sensorId'] = String(opts.sensorId);
      }
      if (cursor) {
        params['cursor'] = cursor;
      }
      return params;
    };

    let pageCount = 0;
    let accumulatedReadings = 0;

    return this.api.get<PaginatedPressureResponse>('/pressure/readings', buildParams()).pipe(
      expand((response) => {
        pageCount++;
        accumulatedReadings += response.data.length;
        const reachedPageCap = pageCount >= PressureService.MAX_RANGE_PAGES;
        const reachedReadingCap = accumulatedReadings >= PressureService.MAX_RANGE_READINGS;
        const nextCursor = response.pagination.nextCursor;
        if (!response.pagination.hasMore || !nextCursor || reachedPageCap || reachedReadingCap) {
          return EMPTY;
        }
        return this.api.get<PaginatedPressureResponse>(
          '/pressure/readings',
          buildParams(nextCursor),
        );
      }),
      // Salvaguarda extra: nunca emitir mais páginas do que o teto.
      take(PressureService.MAX_RANGE_PAGES),
      map((response) => response.data),
      reduce((all, batch) => [...all, ...batch], [] as PressureReading[]),
      map((all) => all.slice(0, PressureService.MAX_RANGE_READINGS)),
      catchError(() => of([])),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  private buildPreviousEquivalentRange(
    startTimestamp: number,
    endTimestamp: number,
  ): { startTimestamp: number; endTimestamp: number } {
    const durationSeconds = Math.max(1, endTimestamp - startTimestamp + 1);
    const previousEndTimestamp = startTimestamp - 1;
    return {
      startTimestamp: previousEndTimestamp - durationSeconds + 1,
      endTimestamp: previousEndTimestamp,
    };
  }

  private calculateAverageConsumptionBarPerHour(readings: PressureReading[]): number {
    if (readings.length < 2) {
      return 0;
    }

    const chronological = [...readings]
      .filter(
        (reading) => Number.isFinite(reading.timestamp) && Number.isFinite(reading.pressureBar),
      )
      .sort((left, right) => left.timestamp - right.timestamp);

    if (chronological.length < 2) {
      return 0;
    }

    const firstTimestamp = chronological[0]?.timestamp ?? 0;
    const lastTimestamp = chronological[chronological.length - 1]?.timestamp ?? 0;
    const durationHours = (lastTimestamp - firstTimestamp) / 3600;
    if (!Number.isFinite(durationHours) || durationHours <= 0) {
      return 0;
    }

    const consumedBar = PressureService.totalConsumedBar(
      chronological.map((reading) => reading.pressureBar),
    );

    const averageConsumption = consumedBar / durationHours;
    return Number.isFinite(averageConsumption) ? averageConsumption : 0;
  }

  /**
   * Pressão consumida numa série: soma da queda LÍQUIDA de cada trecho, cortando
   * onde houve recarga.
   *
   * Somar cada descida ponto a ponto contava o ruído do sensor como consumo — e
   * quanto mais rápida a amostragem, mais inflado o número: numa série real de 5s
   * caindo 7,8 bar em uma hora, a soma ponto a ponto dava 85 bar/h, 11x a queda
   * real. Dentro de um trecho a oscilação se cancela; a quebra por recarga é o que
   * impede a queda líquida de esconder um casco trocado no meio do período.
   */
  private static totalConsumedBar(pressures: number[]): number {
    if (pressures.length < 2) {
      return 0;
    }

    let total = 0;
    let segmentStart = pressures[0] ?? 0;
    let previous = segmentStart;

    for (let index = 1; index < pressures.length; index++) {
      const current = pressures[index] ?? 0;
      if (current - previous > PressureService.REFILL_RISE_THRESHOLD_BAR) {
        total += Math.max(0, segmentStart - previous);
        segmentStart = current;
      }
      previous = current;
    }

    return total + Math.max(0, segmentStart - previous);
  }

  private calculateAverageConsumptionLitersPerHour(readings: PressureReading[]): number {
    if (readings.length < 2) {
      return 0;
    }

    const durationHours =
      ((readings[readings.length - 1]?.timestamp ?? 0) - (readings[0]?.timestamp ?? 0)) / 3600;
    if (!Number.isFinite(durationHours) || durationHours <= 0) {
      return 0;
    }

    // A segmentação roda em bar, que é onde o ruído vive fisicamente, e só depois
    // converte para litros. Segmentar em litros faria o mesmo ruído virar dezenas
    // de litros e quebrar trecho a cada oscilação.
    const volume = this.internalVolumeLitersSignal();
    if (volume == null) {
      return 0;
    }

    const consumedBar = PressureService.totalConsumedBar(
      [...readings]
        .sort((left, right) => left.timestamp - right.timestamp)
        .map((reading) => reading.pressureBar),
    );

    const consumption = (consumedBar * volume) / durationHours;
    return Number.isFinite(consumption) ? consumption : 0;
  }

  private getAutonomyWindowReadings(readings: PressureReading[]): PressureReading[] {
    return [...readings]
      .filter(
        (reading) => Number.isFinite(reading.timestamp) && Number.isFinite(reading.pressureBar),
      )
      .sort((left, right) => left.timestamp - right.timestamp)
      .slice(-PressureService.AUTONOMY_WINDOW_SIZE);
  }

  private calculateAutonomyConfidence(
    readingCount: number,
    durationSeconds: number,
  ): 'low' | 'medium' | 'high' {
    if (readingCount >= 8 && durationSeconds >= 3 * 3600) {
      return 'high';
    }
    if (readingCount >= 5 && durationSeconds >= 3600) {
      return 'medium';
    }
    return 'low';
  }

  private convertPressureBarToLiters(pressureBar: number): number | null {
    // Manometer-style readings are gauge pressure, so V_tank * P_gauge
    // gives the free-gas equivalent volume available at ambient pressure.
    const volume = this.internalVolumeLitersSignal();
    if (volume == null) {
      return null;
    }
    return Math.max(0, pressureBar) * volume;
  }

  private buildConsumptionComparison(currentAverageBarPerHour: number): ConsumptionComparison {
    const previousAverageBarPerHour = this.previousPeriodAverageConsumptionSignal();
    const currentFormatted = `${currentAverageBarPerHour.toFixed(2)} bar/h`;

    if (
      previousAverageBarPerHour == null ||
      !Number.isFinite(previousAverageBarPerHour) ||
      previousAverageBarPerHour <= 0
    ) {
      return {
        previousAverageBarPerHour,
        deltaPercentage: null,
        direction: 'neutral',
        tooltip: `Consumo médio do período atual: ${currentFormatted}. Sem base válida do período anterior equivalente para comparar.`,
      };
    }

    const deltaPercentage =
      ((currentAverageBarPerHour - previousAverageBarPerHour) / previousAverageBarPerHour) * 100;
    const safeDeltaPercentage = Number.isFinite(deltaPercentage) ? deltaPercentage : null;
    const direction =
      safeDeltaPercentage == null || Math.abs(safeDeltaPercentage) < 0.005
        ? 'neutral'
        : safeDeltaPercentage > 0
          ? 'up'
          : 'down';

    return {
      previousAverageBarPerHour,
      deltaPercentage: safeDeltaPercentage,
      direction,
      tooltip:
        `Comparação com o período anterior equivalente. ` +
        `Atual: ${currentFormatted}. ` +
        `Anterior: ${previousAverageBarPerHour.toFixed(2)} bar/h.`,
    };
  }
}
