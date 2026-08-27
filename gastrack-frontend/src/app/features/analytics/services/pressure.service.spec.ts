import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { getTestBed, TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { ConfigService } from '@core/services/config.service';
import { PressureService } from './pressure.service';

const globalTestBed = globalThis as typeof globalThis & { __pressureServiceTestEnv?: boolean };

if (!globalTestBed.__pressureServiceTestEnv) {
  try {
    getTestBed().initTestEnvironment([BrowserTestingModule], platformBrowserTesting());
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('Cannot set base providers because it has already been called')) {
      throw error;
    }
  }
  globalTestBed.__pressureServiceTestEnv = true;
}

describe('PressureService', () => {
  let service: PressureService;
  let http: HttpTestingController | undefined;
  const baseUrl = 'http://test/api/v1';

  function getHttp(): HttpTestingController {
    if (!http) {
      throw new Error('HttpTestingController not initialized');
    }
    return http;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: baseUrl } },
        PressureService,
      ],
    });

    service = TestBed.inject(PressureService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http?.verify();
  });

  it('loadMore reuses the original historical query range and sensor filter', () => {
    service
      .fetchReadings('DEV-123', {
        startTimestamp: 1_700_000_000,
        endTimestamp: 1_700_086_400,
        limit: 400,
        sensorId: 3,
      })
      .subscribe();

    const initialReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '1700000000' &&
        req.params.get('endTimestamp') === '1700086400',
    );
    expect(initialReq.request.method).toBe('GET');
    expect(initialReq.request.params.get('deviceId')).toBe('DEV-123');
    expect(initialReq.request.params.get('startTimestamp')).toBe('1700000000');
    expect(initialReq.request.params.get('endTimestamp')).toBe('1700086400');
    expect(initialReq.request.params.get('limit')).toBe('400');
    expect(initialReq.request.params.get('sensorId')).toBe('3');
    initialReq.flush({
      data: [],
      pagination: {
        count: 0,
        limit: 400,
        hasMore: true,
        nextCursor: 'cursor-1',
      },
    });

    const comparisonReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '1699913599' &&
        req.params.get('endTimestamp') === '1699999999' &&
        req.params.get('sensorId') === '3',
    );
    comparisonReq.flush({
      data: [],
      pagination: {
        count: 0,
        limit: 400,
        hasMore: false,
        nextCursor: null,
      },
    });

    service.loadMore().subscribe();

    const nextReq = getHttp().expectOne(
      (req) => req.method === 'GET' && req.url === `${baseUrl}/pressure/readings`,
    );
    expect(nextReq.request.method).toBe('GET');
    expect(nextReq.request.params.get('deviceId')).toBe('DEV-123');
    expect(nextReq.request.params.get('startTimestamp')).toBe('1700000000');
    expect(nextReq.request.params.get('endTimestamp')).toBe('1700086400');
    expect(nextReq.request.params.get('sensorId')).toBe('3');
    expect(nextReq.request.params.get('cursor')).toBe('cursor-1');
    expect(nextReq.request.params.get('limit')).toBe('50');
    nextReq.flush({
      data: [],
      pagination: {
        count: 0,
        limit: 50,
        hasMore: false,
        nextCursor: null,
      },
    });
  });

  it('computes average consumption trend against the previous equivalent period', () => {
    service
      .fetchReadings('DEV-123', {
        startTimestamp: 7_200,
        endTimestamp: 10_800,
        limit: 300,
        sensorId: 3,
      })
      .subscribe();

    const currentReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '7200' &&
        req.params.get('endTimestamp') === '10800',
    );
    currentReq.flush({
      data: [
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 03:00:00',
          pressureBar: 90,
          adc: 123,
          timestamp: 10_800,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:30:00',
          pressureBar: 95,
          adc: 123,
          timestamp: 9_000,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:00:00',
          pressureBar: 100,
          adc: 123,
          timestamp: 7_200,
        },
      ],
      pagination: {
        count: 3,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    const previousReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '3599' &&
        req.params.get('endTimestamp') === '7199' &&
        req.params.get('sensorId') === '3',
    );
    previousReq.flush({
      data: [
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 01:59:59',
          pressureBar: 95,
          adc: 123,
          timestamp: 7_199,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 01:30:00',
          pressureBar: 97.5,
          adc: 123,
          timestamp: 5_400,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 00:59:59',
          pressureBar: 100,
          adc: 123,
          timestamp: 3_599,
        },
      ],
      pagination: {
        count: 3,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    expect(service.stats().averageConsumptionBarPerHour).toBeCloseTo(10, 2);
    expect(service.stats().consumptionComparison.previousAverageBarPerHour).toBeCloseTo(5, 2);
    expect(service.stats().consumptionComparison.deltaPercentage).toBeCloseTo(100, 1);
    expect(service.stats().consumptionComparison.direction).toBe('up');
  });

  it('ignores pressure increases when calculating average consumption', () => {
    service
      .fetchReadings('DEV-123', {
        startTimestamp: 7_200,
        endTimestamp: 10_800,
        limit: 300,
      })
      .subscribe();

    const currentReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '7200' &&
        req.params.get('endTimestamp') === '10800',
    );
    currentReq.flush({
      data: [
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 03:00:00',
          pressureBar: 120,
          adc: 123,
          timestamp: 10_800,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:30:00',
          pressureBar: 110,
          adc: 123,
          timestamp: 9_000,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:00:00',
          pressureBar: 100,
          adc: 123,
          timestamp: 7_200,
        },
      ],
      pagination: {
        count: 3,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    const previousReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '3599' &&
        req.params.get('endTimestamp') === '7199',
    );
    previousReq.flush({
      data: [],
      pagination: {
        count: 0,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    expect(service.stats().averageConsumptionBarPerHour).toBe(0);
    expect(service.stats().consumptionComparison.deltaPercentage).toBeNull();
  });

  it('estimates remaining autonomy from the recent moving window', () => {
    // A linha precisa ter volume: autonomia é em litros, e sem casco
    // conectado o serviço não inventa mais um volume padrão.
    service.setInternalVolumeLiters(150);
    service
      .fetchReadings('DEV-123', {
        startTimestamp: 7_200,
        endTimestamp: 10_800,
        limit: 300,
      })
      .subscribe();

    const currentReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '7200' &&
        req.params.get('endTimestamp') === '10800',
    );
    currentReq.flush({
      data: [
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 03:00:00',
          pressureBar: 90,
          adc: 123,
          timestamp: 10_800,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:30:00',
          pressureBar: 95,
          adc: 123,
          timestamp: 9_000,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:00:00',
          pressureBar: 100,
          adc: 123,
          timestamp: 7_200,
        },
      ],
      pagination: {
        count: 3,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    const previousReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '3599' &&
        req.params.get('endTimestamp') === '7199',
    );
    previousReq.flush({
      data: [],
      pagination: {
        count: 0,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    expect(service.stats().estimatedAutonomy.state).toBe('estimating');
    expect(service.stats().estimatedAutonomy.remainingHours).toBeCloseTo(9, 1);
    // 1500 L/h = os mesmos 10 bar/h de queda sobre os 150 L da linha. Antes dava 50
    // porque o serviço caía nos 5 L chumbados quando ninguém informava o volume.
    expect(service.stats().estimatedAutonomy.consumptionLitersPerHour).toBeCloseTo(1500, 1);
    expect(service.stats().estimatedAutonomy.confidence).toBe('low');
  });

  it('marks autonomy as refilling when the recent window trends upward', () => {
    // A linha precisa ter volume: autonomia é em litros, e sem casco
    // conectado o serviço não inventa mais um volume padrão.
    service.setInternalVolumeLiters(150);
    service
      .fetchReadings('DEV-123', {
        startTimestamp: 7_200,
        endTimestamp: 10_800,
        limit: 300,
      })
      .subscribe();

    const currentReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '7200' &&
        req.params.get('endTimestamp') === '10800',
    );
    currentReq.flush({
      data: [
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 03:00:00',
          pressureBar: 90,
          adc: 123,
          timestamp: 10_800,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:30:00',
          pressureBar: 85,
          adc: 123,
          timestamp: 9_000,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:00:00',
          pressureBar: 80,
          adc: 123,
          timestamp: 7_200,
        },
      ],
      pagination: {
        count: 3,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    const previousReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '3599' &&
        req.params.get('endTimestamp') === '7199',
    );
    previousReq.flush({
      data: [],
      pagination: {
        count: 0,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    expect(service.stats().estimatedAutonomy.state).toBe('refilling');
    expect(service.stats().estimatedAutonomy.remainingHours).toBeNull();
  });

  it('marks autonomy as insufficient when there are too few readings', () => {
    service
      .fetchReadings('DEV-123', {
        startTimestamp: 7_200,
        endTimestamp: 10_800,
        limit: 300,
      })
      .subscribe();

    const currentReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '7200' &&
        req.params.get('endTimestamp') === '10800',
    );
    currentReq.flush({
      data: [
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 03:00:00',
          pressureBar: 90,
          adc: 123,
          timestamp: 10_800,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:00:00',
          pressureBar: 100,
          adc: 123,
          timestamp: 7_200,
        },
      ],
      pagination: {
        count: 2,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    const previousReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '3599' &&
        req.params.get('endTimestamp') === '7199',
    );
    previousReq.flush({
      data: [],
      pagination: {
        count: 0,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    expect(service.stats().estimatedAutonomy.state).toBe('insufficient');
    expect(service.stats().estimatedAutonomy.remainingHours).toBeNull();
  });

  it('marks autonomy as stable when there is no recent consumption', () => {
    // A linha precisa ter volume: autonomia é em litros, e sem casco
    // conectado o serviço não inventa mais um volume padrão.
    service.setInternalVolumeLiters(150);
    service
      .fetchReadings('DEV-123', {
        startTimestamp: 7_200,
        endTimestamp: 10_800,
        limit: 300,
      })
      .subscribe();

    const currentReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '7200' &&
        req.params.get('endTimestamp') === '10800',
    );
    currentReq.flush({
      data: [
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 03:00:00',
          pressureBar: 100,
          adc: 123,
          timestamp: 10_800,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:30:00',
          pressureBar: 100,
          adc: 123,
          timestamp: 9_000,
        },
        {
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 02:00:00',
          pressureBar: 100,
          adc: 123,
          timestamp: 7_200,
        },
      ],
      pagination: {
        count: 3,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    const previousReq = getHttp().expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === `${baseUrl}/pressure/readings` &&
        req.params.get('startTimestamp') === '3599' &&
        req.params.get('endTimestamp') === '7199',
    );
    previousReq.flush({
      data: [],
      pagination: {
        count: 0,
        limit: 300,
        hasMore: false,
        nextCursor: null,
      },
    });

    expect(service.stats().estimatedAutonomy.state).toBe('stable');
    expect(service.stats().estimatedAutonomy.remainingHours).toBeNull();
    expect(service.stats().estimatedAutonomy.consumptionLitersPerHour).toBe(0);
  });

  /**
   * As faixas de nível são do servidor. Se o cliente voltar a usar constantes locais,
   * este teste quebra — que é o ponto: a duplicação 20/50/80 x 0.2/0.5/0.8 divergia calada.
   */
  /** Injeta uma série de (segundos, bar) e devolve o controle ao teste. */
  function flushSeries(pontos: [number, number][]): void {
    service
      .fetchReadings('DEV-123', { startTimestamp: 0, endTimestamp: 7_200, limit: 300 })
      .subscribe();

    getHttp()
      .expectOne(
        (req) =>
          req.method === 'GET' &&
          req.url === `${baseUrl}/pressure/readings` &&
          req.params.get('startTimestamp') === '0',
      )
      .flush({
        data: pontos.map(([timestamp, pressureBar]) => ({
          deviceId: 'DEV-123',
          sensorId: 3,
          datetime: '01/01/2026 01:00:00',
          pressureBar,
          adc: 123,
          timestamp,
        })),
        pagination: { count: pontos.length, limit: 300, hasMore: false, nextCursor: null },
      });

    for (const req of getHttp().match(
      (r) => r.method === 'GET' && r.url === `${baseUrl}/pressure/readings`,
    )) {
      req.flush({
        data: [],
        pagination: { count: 0, limit: 300, hasMore: false, nextCursor: null },
      });
    }
  }

  it('ruido de sensor nao infla o consumo medio', () => {
    // Serie que cai 10 bar em 1 h, com ruido de +-0,4 bar entre leituras.
    // Somando cada descida ponto a ponto o ruido virava consumo: dava ordem de
    // grandeza a mais que a queda real. O consumo e a queda liquida do trecho.
    const pontos: [number, number][] = [];
    for (let i = 0; i <= 60; i++) {
      const base = 140 - (10 * i) / 60;
      const ruido = i % 2 === 0 ? 0.4 : -0.4;
      pontos.push([i * 60, base + ruido]);
    }

    flushSeries(pontos);

    expect(service.stats().averageConsumptionBarPerHour).toBeCloseTo(10, 0);
  });

  it('recarga no meio do periodo nao apaga o consumo anterior a ela', () => {
    // Cai de 140 a 120, troca de casco leva a 150, cai de 150 a 130.
    // Sao 20 + 20 = 40 bar consumidos em 2 h => 20 bar/h. Usar so a queda
    // liquida (140 -> 130) daria 5 bar/h e esconderia a recarga.
    flushSeries([
      [0, 140],
      [1_800, 130],
      [3_600, 120],
      [3_660, 150],
      [5_400, 140],
      [7_200, 130],
    ]);

    expect(service.stats().averageConsumptionBarPerHour).toBeCloseTo(20, 0);
  });

  function flushSingleReading(pressureBar: number): void {
    service
      .fetchReadings('DEV-123', { startTimestamp: 0, endTimestamp: 3_600, limit: 300 })
      .subscribe();

    getHttp()
      .expectOne(
        (req) =>
          req.method === 'GET' &&
          req.url === `${baseUrl}/pressure/readings` &&
          req.params.get('startTimestamp') === '0',
      )
      .flush({
        data: [
          {
            deviceId: 'DEV-123',
            sensorId: 3,
            datetime: '01/01/2026 01:00:00',
            pressureBar,
            adc: 123,
            timestamp: 3_600,
          },
        ],
        pagination: { count: 1, limit: 300, hasMore: false, nextCursor: null },
      });

    // A comparação com o período anterior dispara junto; sem dados ela não afeta o nível.
    for (const req of getHttp().match(
      (r) => r.method === 'GET' && r.url === `${baseUrl}/pressure/readings`,
    )) {
      req.flush({
        data: [],
        pagination: { count: 0, limit: 300, hasMore: false, nextCursor: null },
      });
    }
  }

  it('linha sem casco não ganha nível nem litros fabricados', () => {
    // Não informar volume/pressão é o que o navigator faz quando a linha não tem
    // casco conectado: o servidor manda effectiveCapacityLiters/FullTank nulos.
    // Antes o serviço caía em 5 L / 140 bar chumbados e exibia uma porcentagem
    // inventada — o mesmo erro que o backend acabou de perder (CONVENTIONS §8).
    service.setThresholds({ critical: 20, low: 50, normal: 80 });

    flushSingleReading(60);

    expect(service.stats().currentPercentage).toBeNull();
    expect(service.stats().currentLiters).toBeNull();
    expect(service.stats().tankStatus.level).toBe('unknown');
    expect(service.stats().estimatedAutonomy.remainingHours).toBeNull();
  });

  it('uses server thresholds to classify tank level', () => {
    service.setFullTankPressureBar(200);
    service.setInternalVolumeLiters(150);
    service.setThresholds({ critical: 20, low: 50, normal: 80 });

    // 60 bar de 200 = 30% -> acima de critical (20), abaixo de low (50) => "Baixo"
    flushSingleReading(60);

    expect(service.stats().tankStatus.level).toBe('low');
  });

  it('a stricter server threshold changes the classification of the same reading', () => {
    service.setFullTankPressureBar(200);
    service.setInternalVolumeLiters(150);
    // Servidor exigente: 30% agora está abaixo do crítico.
    service.setThresholds({ critical: 40, low: 70, normal: 90 });

    flushSingleReading(60);

    expect(service.stats().tankStatus.level).toBe('critical');
  });

  it('falls back to local defaults when the gas point has no thresholds', () => {
    service.setFullTankPressureBar(200);
    service.setInternalVolumeLiters(150);
    service.setThresholds(null);

    flushSingleReading(180); // 90% -> acima do normal padrão (80)

    expect(service.stats().tankStatus.level).toBe('full');
  });
});
