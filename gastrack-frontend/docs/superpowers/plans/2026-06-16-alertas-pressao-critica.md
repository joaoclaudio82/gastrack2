# Alertas in-app de pressão crítica (#70) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disparar um alerta in-app visível e persistente quando a leitura ao vivo de um sensor cruzar para pressão crítica, sem spam e com histórico das ocorrências.

**Architecture:** Serviço isolado `PressureAlertService` (`providedIn: 'root'`) encapsula detecção de transição para `critical`, anti-spam (edge-trigger + cooldown configurável) e histórico (signal). A `PressureAnalyticsComponent` conecta um `effect` que observa `pressureService.stats()` e delega ao serviço. Não altera `pressure.service.ts` (evita conflito com o #74). Banner usa o `NotificationService` já renderizado globalmente pelo `ToastContainerComponent`, com `duration: 0` (persistente).

**Tech Stack:** Angular 21 (standalone, signals, OnPush), TypeScript, Vitest (`@angular/build:unit-test`), `bun` para scripts.

**Threshold (definido no spec):** alerta dispara quando `tankStatus.level === 'critical'` — que é matematicamente `pressureBar / fullTankPressureBar < 0.2`, ou seja **< 20% da capacidade**, escalando por ponto de gás. Zero magic number novo. Cooldown default 10 min, configurável.

---

## File Structure

- **Create:** `src/app/features/analytics/services/pressure-alert.service.ts` — serviço de detecção/anti-spam/histórico + tipos `PressureAlertContext` e `PressureAlert`.
- **Create:** `src/app/features/analytics/services/pressure-alert.service.spec.ts` — testes do serviço.
- **Modify:** `src/app/features/analytics/pages/pressure-analytics/pressure-analytics.component.ts` — injetar serviço, `effect` de wiring, `reset()` no `ngOnInit`, seção UI "Alertas recentes" no template.

Tipos canônicos usados em todo o plano:

```ts
// pressure-alert.service.ts
import { TankStatusLevel } from '@models/pressure-reading.model';

export interface PressureAlertContext {
  deviceId: string;
  sensorId: number | null;
  level: TankStatusLevel;
  percentage: number;
  pressureBar: number;
  datetime: string;
  timestamp: number; // unix seconds (vem da leitura → cooldown determinístico)
}

export interface PressureAlert {
  deviceId: string;
  sensorId: number | null;
  level: TankStatusLevel;
  percentage: number;
  pressureBar: number;
  datetime: string;
  firedAtTimestamp: number;
}
```

---

## Task 1: PressureAlertService — disparo na transição para crítico

**Files:**

- Create: `src/app/features/analytics/services/pressure-alert.service.ts`
- Test: `src/app/features/analytics/services/pressure-alert.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Crie `src/app/features/analytics/services/pressure-alert.service.spec.ts`:

```ts
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationService } from '@core/services/notification.service';
import { TankStatusLevel } from '@models/pressure-reading.model';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PressureAlertContext, PressureAlertService } from './pressure-alert.service';

describe('PressureAlertService', () => {
  let service: PressureAlertService;
  let notification: NotificationService;

  function ctx(overrides: Partial<PressureAlertContext> = {}): PressureAlertContext {
    return {
      deviceId: 'esp32-1',
      sensorId: 1,
      level: 'critical' as TankStatusLevel,
      percentage: 12,
      pressureBar: 16.8,
      datetime: '16/06/2026 10:00:00',
      timestamp: 1_000,
      ...overrides,
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), NotificationService, PressureAlertService],
    });
    service = TestBed.inject(PressureAlertService);
    notification = TestBed.inject(NotificationService);
  });

  it('should_fireAlert_When_levelCrossesToCritical', () => {
    const spy = vi.spyOn(notification, 'error');

    service.evaluate(ctx({ level: 'low', timestamp: 1 }));
    service.evaluate(ctx({ level: 'critical', timestamp: 2 }));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      'Pressão crítica no sensor esp32-1 / porta 1 — 12%',
      'Pressão crítica',
      0,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test:ci -- pressure-alert`
Expected: FAIL — `Cannot find module './pressure-alert.service'`.

- [ ] **Step 3: Write minimal implementation**

Crie `src/app/features/analytics/services/pressure-alert.service.ts`:

```ts
import { inject, Injectable, signal } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';
import { TankStatusLevel } from '@models/pressure-reading.model';

export interface PressureAlertContext {
  deviceId: string;
  sensorId: number | null;
  level: TankStatusLevel;
  percentage: number;
  pressureBar: number;
  datetime: string;
  timestamp: number;
}

export interface PressureAlert {
  deviceId: string;
  sensorId: number | null;
  level: TankStatusLevel;
  percentage: number;
  pressureBar: number;
  datetime: string;
  firedAtTimestamp: number;
}

@Injectable({ providedIn: 'root' })
export class PressureAlertService {
  private readonly notification = inject(NotificationService);

  private static readonly CRITICAL_ALERT_LEVEL: TankStatusLevel = 'critical';
  private static readonly DEFAULT_ALERT_COOLDOWN_SECONDS = 600;
  private static readonly MAX_ALERT_HISTORY = 50;

  private readonly cooldownSecondsSignal = signal(
    PressureAlertService.DEFAULT_ALERT_COOLDOWN_SECONDS,
  );
  private readonly alertsSignal = signal<PressureAlert[]>([]);
  readonly alerts = this.alertsSignal.asReadonly();

  private readonly lastLevelBySensor = new Map<string, TankStatusLevel>();
  private readonly lastAlertTimestampBySensor = new Map<string, number>();

  evaluate(ctx: PressureAlertContext): void {
    const key = this.sensorKey(ctx.deviceId, ctx.sensorId);
    const previousLevel = this.lastLevelBySensor.get(key);
    const isCritical = ctx.level === PressureAlertService.CRITICAL_ALERT_LEVEL;
    const transitioned = isCritical && previousLevel !== PressureAlertService.CRITICAL_ALERT_LEVEL;

    if (transitioned && this.cooldownElapsed(key, ctx.timestamp)) {
      this.fireAlert(ctx);
      this.lastAlertTimestampBySensor.set(key, ctx.timestamp);
    }

    this.lastLevelBySensor.set(key, ctx.level);
  }

  private cooldownElapsed(key: string, timestamp: number): boolean {
    const last = this.lastAlertTimestampBySensor.get(key);
    if (last == null) return true;
    return timestamp - last >= this.cooldownSecondsSignal();
  }

  private fireAlert(ctx: PressureAlertContext): void {
    this.notification.error(this.buildMessage(ctx), 'Pressão crítica', 0);
    const alert: PressureAlert = {
      deviceId: ctx.deviceId,
      sensorId: ctx.sensorId,
      level: ctx.level,
      percentage: ctx.percentage,
      pressureBar: ctx.pressureBar,
      datetime: ctx.datetime,
      firedAtTimestamp: ctx.timestamp,
    };
    this.alertsSignal.update((alerts) =>
      [alert, ...alerts].slice(0, PressureAlertService.MAX_ALERT_HISTORY),
    );
  }

  private buildMessage(ctx: PressureAlertContext): string {
    const sensorPart = ctx.sensorId != null ? ` / porta ${ctx.sensorId}` : '';
    return `Pressão crítica no sensor ${ctx.deviceId}${sensorPart} — ${Math.round(ctx.percentage)}%`;
  }

  private sensorKey(deviceId: string, sensorId: number | null): string {
    return `${deviceId}|${sensorId ?? 'all'}`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test:ci -- pressure-alert`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/analytics/services/pressure-alert.service.ts src/app/features/analytics/services/pressure-alert.service.spec.ts
git commit -m "feat(analytics): PressureAlertService dispara alerta na transicao para critico (#70)"
```

---

## Task 2: Não re-alertar enquanto já está crítico

**Files:**

- Test: `src/app/features/analytics/services/pressure-alert.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Adicione dentro do `describe`:

```ts
it('should_notFireAlert_When_alreadyCritical', () => {
  const spy = vi.spyOn(notification, 'error');

  service.evaluate(ctx({ level: 'critical', timestamp: 1 }));
  service.evaluate(ctx({ level: 'critical', timestamp: 2 }));
  service.evaluate(ctx({ level: 'critical', timestamp: 3 }));

  expect(spy).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test**

Run: `bun run test:ci -- pressure-alert`
Expected: PASS (a lógica de transição da Task 1 já garante isso — este teste trava a regressão).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/analytics/services/pressure-alert.service.spec.ts
git commit -m "test(analytics): trava re-alerta enquanto permanece critico (#70)"
```

---

## Task 3: Cooldown suprime re-alerta dentro da janela

**Files:**

- Test: `src/app/features/analytics/services/pressure-alert.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Cooldown default = 600s. Sai de crítico (re-arma) e volta dentro da janela → suprimido.

```ts
it('should_suppressAlert_When_cooldownActive', () => {
  const spy = vi.spyOn(notification, 'error');

  service.evaluate(ctx({ level: 'critical', timestamp: 1_000 })); // dispara
  service.evaluate(ctx({ level: 'low', timestamp: 1_100 })); // re-arma transição
  service.evaluate(ctx({ level: 'critical', timestamp: 1_200 })); // dentro do cooldown (200s < 600s)

  expect(spy).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run test**

Run: `bun run test:ci -- pressure-alert`
Expected: PASS (o `cooldownElapsed` da Task 1 já implementa isso; teste trava a regressão).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/analytics/services/pressure-alert.service.spec.ts
git commit -m "test(analytics): cooldown suprime re-alerta na janela (#70)"
```

---

## Task 4: Re-arma após sair de crítico e cooldown expirar

**Files:**

- Test: `src/app/features/analytics/services/pressure-alert.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('should_reArm_When_levelLeavesAndReentersCriticalAfterCooldown', () => {
  const spy = vi.spyOn(notification, 'error');

  service.evaluate(ctx({ level: 'critical', timestamp: 1_000 })); // dispara
  service.evaluate(ctx({ level: 'normal', timestamp: 1_100 })); // sai de crítico
  service.evaluate(ctx({ level: 'critical', timestamp: 1_700 })); // 700s depois (> 600s) → dispara de novo

  expect(spy).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run test**

Run: `bun run test:ci -- pressure-alert`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/analytics/services/pressure-alert.service.spec.ts
git commit -m "test(analytics): re-arma alerta apos sair de critico e cooldown expirar (#70)"
```

---

## Task 5: Alertas independentes por sensor

**Files:**

- Test: `src/app/features/analytics/services/pressure-alert.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('should_fireIndependentAlert_When_differentSensor', () => {
  const spy = vi.spyOn(notification, 'error');

  service.evaluate(ctx({ deviceId: 'esp32-1', sensorId: 1, level: 'low', timestamp: 1 }));
  service.evaluate(ctx({ deviceId: 'esp32-1', sensorId: 1, level: 'critical', timestamp: 2 }));
  service.evaluate(ctx({ deviceId: 'esp32-2', sensorId: 3, level: 'critical', timestamp: 3 }));

  expect(spy).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run test**

Run: `bun run test:ci -- pressure-alert`
Expected: PASS (a chave `deviceId|sensorId` isola o estado; teste trava a regressão).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/analytics/services/pressure-alert.service.spec.ts
git commit -m "test(analytics): alertas independentes por sensor (#70)"
```

---

## Task 6: Histórico de alertas (lista + cap)

**Files:**

- Test: `src/app/features/analytics/services/pressure-alert.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('should_addToHistory_When_alertFires', () => {
  service.evaluate(ctx({ level: 'low', timestamp: 1 }));
  service.evaluate(ctx({ level: 'critical', percentage: 12, pressureBar: 16.8, timestamp: 2 }));

  const alerts = service.alerts();
  expect(alerts).toHaveLength(1);
  expect(alerts[0]).toMatchObject({
    deviceId: 'esp32-1',
    sensorId: 1,
    level: 'critical',
    percentage: 12,
    firedAtTimestamp: 2,
  });
});

it('should_capHistory_When_exceedsMax', () => {
  for (let i = 0; i < 60; i++) {
    const sensorId = i + 1; // sensor distinto → cada um dispara uma vez
    service.evaluate(ctx({ sensorId, level: 'low', timestamp: i * 10 }));
    service.evaluate(ctx({ sensorId, level: 'critical', timestamp: i * 10 + 1 }));
  }

  expect(service.alerts()).toHaveLength(50);
});
```

- [ ] **Step 2: Run test**

Run: `bun run test:ci -- pressure-alert`
Expected: PASS (a Task 1 já adiciona ao histórico com `.slice(0, 50)`; estes testes travam a regressão).

- [ ] **Step 3: Commit**

```bash
git add src/app/features/analytics/services/pressure-alert.service.spec.ts
git commit -m "test(analytics): historico de alertas com cap de 50 (#70)"
```

---

## Task 7: Cooldown configurável + reset

**Files:**

- Modify: `src/app/features/analytics/services/pressure-alert.service.ts`
- Test: `src/app/features/analytics/services/pressure-alert.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('should_useConfiguredCooldown_When_setAlertCooldownSecondsCalled', () => {
  const spy = vi.spyOn(notification, 'error');
  service.setAlertCooldownSeconds(60);

  service.evaluate(ctx({ level: 'critical', timestamp: 1_000 })); // dispara
  service.evaluate(ctx({ level: 'low', timestamp: 1_010 }));
  service.evaluate(ctx({ level: 'critical', timestamp: 1_070 })); // 70s depois (> 60s) → dispara

  expect(spy).toHaveBeenCalledTimes(2);
});

it('should_fallBackToDefaultCooldown_When_invalidValue', () => {
  const spy = vi.spyOn(notification, 'error');
  service.setAlertCooldownSeconds(0); // inválido → mantém 600s

  service.evaluate(ctx({ level: 'critical', timestamp: 1_000 }));
  service.evaluate(ctx({ level: 'low', timestamp: 1_010 }));
  service.evaluate(ctx({ level: 'critical', timestamp: 1_100 })); // 100s < 600s → suprime

  expect(spy).toHaveBeenCalledTimes(1);
});

it('should_clearStateAndHistory_When_reset', () => {
  const spy = vi.spyOn(notification, 'error');
  service.evaluate(ctx({ level: 'critical', timestamp: 1 }));
  expect(service.alerts()).toHaveLength(1);

  service.reset();

  expect(service.alerts()).toHaveLength(0);
  // após reset, sem nível anterior, uma leitura crítica volta a disparar
  service.evaluate(ctx({ level: 'critical', timestamp: 2 }));
  expect(spy).toHaveBeenCalledTimes(2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test:ci -- pressure-alert`
Expected: FAIL — `service.setAlertCooldownSeconds is not a function` / `service.reset is not a function`.

- [ ] **Step 3: Add the methods**

Em `pressure-alert.service.ts`, adicione (logo após `evaluate`):

```ts
  setAlertCooldownSeconds(value?: number | null): void {
    const parsed = value ?? NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      this.cooldownSecondsSignal.set(PressureAlertService.DEFAULT_ALERT_COOLDOWN_SECONDS);
      return;
    }
    this.cooldownSecondsSignal.set(parsed);
  }

  reset(): void {
    this.lastLevelBySensor.clear();
    this.lastAlertTimestampBySensor.clear();
    this.alertsSignal.set([]);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test:ci -- pressure-alert`
Expected: PASS (todos os testes do serviço).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/analytics/services/pressure-alert.service.ts src/app/features/analytics/services/pressure-alert.service.spec.ts
git commit -m "feat(analytics): cooldown configuravel e reset no PressureAlertService (#70)"
```

---

## Task 8: Não disparar em low/normal/full

**Files:**

- Test: `src/app/features/analytics/services/pressure-alert.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('should_notFire_When_levelLowOrNormalOrFull', () => {
  const spy = vi.spyOn(notification, 'error');

  service.evaluate(ctx({ level: 'low', timestamp: 1 }));
  service.evaluate(ctx({ level: 'normal', timestamp: 2 }));
  service.evaluate(ctx({ level: 'full', timestamp: 3 }));

  expect(spy).not.toHaveBeenCalled();
  expect(service.alerts()).toHaveLength(0);
});
```

- [ ] **Step 2: Run test**

Run: `bun run test:ci -- pressure-alert`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/analytics/services/pressure-alert.service.spec.ts
git commit -m "test(analytics): nao dispara em low/normal/full (#70)"
```

---

## Task 9: Wiring na PressureAnalyticsComponent (effect + reset)

**Files:**

- Modify: `src/app/features/analytics/pages/pressure-analytics/pressure-analytics.component.ts`

Contexto atual (verificado): a classe injeta `pressureService` e `userPreferences` via `inject()`; `ngOnInit` chama `this.pressureService.reset()` em `:283`. Imports de `@angular/core` na linha 1 incluem `inject`, `Component`, etc. (adicionar `effect`).

- [ ] **Step 1: Importar `effect` e o serviço**

No topo do arquivo, garanta que `effect` esteja no import de `@angular/core` (adicione à lista existente). Adicione o import do serviço junto aos demais imports do componente:

```ts
import { effect } from '@angular/core'; // adicionar à lista de imports de @angular/core já existente
import { PressureAlertService } from '../../services/pressure-alert.service';
```

- [ ] **Step 2: Injetar o serviço e criar o effect no construtor**

Logo após a linha `protected readonly userPreferences = inject(UserPreferencesService);` (`:260`), adicione a injeção:

```ts
  private readonly alertService = inject(PressureAlertService);
```

E adicione um `constructor` (a classe hoje não tem um) logo antes do `ngOnInit`:

```ts
  constructor() {
    effect(() => {
      const stats = this.pressureService.stats();
      const reading = stats.latestReading;
      if (!reading) return;
      this.alertService.evaluate({
        deviceId: reading.deviceId,
        sensorId: reading.sensorId ?? null,
        level: stats.tankStatus.level,
        percentage: stats.currentPercentage,
        pressureBar: reading.pressureBar,
        datetime: reading.datetime,
        timestamp: reading.timestamp,
      });
    });
  }
```

> O `effect` criado em contexto de componente é destruído automaticamente no destroy do componente — cancelamento garantido, sem subscription manual. No Angular 21 a escrita de signals dentro de effects é permitida por padrão (não precisa de `allowSignalWrites`).

- [ ] **Step 3: Resetar o estado de alertas junto ao reset da página**

Em `ngOnInit`, logo após `this.pressureService.reset();` (`:283`), adicione:

```ts
this.alertService.reset();
```

- [ ] **Step 4: Verificar compilação e specs existentes**

Run: `bun run lint:tsc:all`
Expected: sem erros.

Run: `bun run test:ci -- pressure-analytics`
Expected: PASS (specs existentes da página continuam verdes).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/analytics/pages/pressure-analytics/pressure-analytics.component.ts
git commit -m "feat(analytics): conecta deteccao de pressao critica ao stream da pagina (#70)"
```

---

## Task 10: UI — seção "Alertas recentes"

**Files:**

- Modify: `src/app/features/analytics/pages/pressure-analytics/pressure-analytics.component.ts`

Contexto: o template é inline (`template:` na linha ~85+). A lista usa o signal `alertService.alerts()`. Como `alertService` é `private`, exponha um getter `protected` para o template.

- [ ] **Step 1: Expor os alertas para o template**

Após a injeção `private readonly alertService = inject(PressureAlertService);` (Task 9), adicione:

```ts
  protected readonly alerts = this.alertService.alerts;
```

- [ ] **Step 2: Adicionar a seção no template**

No template inline, logo após o bloco `<app-pressure-stats [stats]="pressureService.stats()" />` (`:85`), adicione:

```html
@if (alerts().length > 0) {
<section
  class="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4"
  data-testid="recent-alerts"
  aria-label="Alertas recentes de pressão crítica"
>
  <h3 class="mb-2 text-sm font-semibold text-destructive">Alertas recentes</h3>
  <ul class="flex flex-col gap-1">
    @for (alert of alerts(); track alert.firedAtTimestamp + '-' + alert.deviceId + '-' +
    alert.sensorId) {
    <li class="flex flex-wrap items-center gap-x-2 text-sm text-foreground">
      <span class="font-medium">{{ alert.deviceId }}</span>
      @if (alert.sensorId !== null) {
      <span class="text-muted-foreground">/ porta {{ alert.sensorId }}</span>
      }
      <span class="font-semibold text-destructive">{{ alert.percentage.toFixed(0) }}%</span>
      <span class="text-muted-foreground">— {{ alert.datetime }}</span>
    </li>
    }
  </ul>
</section>
}
```

> Classes seguem o padrão Tailwind/tokens já usado no projeto (`text-destructive`, `text-muted-foreground`, `bg-destructive/5`). Se algum token não existir no tema, troque por equivalente já presente no template do mesmo arquivo (ex.: `text-red-600`).

- [ ] **Step 3: Verificar compilação e specs**

Run: `bun run lint:tsc:all`
Expected: sem erros.

Run: `bun run test:ci -- pressure-analytics`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/analytics/pages/pressure-analytics/pressure-analytics.component.ts
git commit -m "feat(analytics): lista in-app de alertas recentes de pressao critica (#70)"
```

---

## Task 11: Validação final completa

- [ ] **Step 1: Lint completo**

Run: `bun run lint:all`
Expected: sem erros (tsc app+spec, eslint, stylelint, prettier).

- [ ] **Step 2: Suíte de testes completa**

Run: `bun run test:ci`
Expected: todos verdes, incluindo os novos `pressure-alert.service.spec.ts` e os specs existentes do analytics.

- [ ] **Step 3: Commit de ajustes (se o lint/format alterou algo)**

```bash
git add -A
git commit -m "chore(analytics): ajustes de lint/format dos alertas de pressao (#70)"
```

---

## Self-Review (preenchido)

**Spec coverage:**

- Thresholds (crítico) → Task 1 (level === 'critical', constante `CRITICAL_ALERT_LEVEL`). ✅
- Toast/banner persistente ao cruzar threshold → Task 1 (`notification.error(..., 0)`). ✅
- Anti-spam debounce/cooldown por sensor → Tasks 2–5, 7 (edge-trigger + cooldown configurável por `sensorKey`). ✅
- Registro de alertas (lista simples) → Tasks 6, 10 (signal `alerts` + UI). ✅
- Detecção no stream ao vivo → Task 9 (`effect` sobre `stats()`). ✅
- Não conflitar com #74 / cancelamento → serviço isolado; `effect` auto-destruído (Task 9). ✅

**Placeholder scan:** nenhum TBD/TODO; todo passo tem código/comando concretos. ✅

**Type consistency:** `PressureAlertContext`/`PressureAlert` definidos uma vez (topo) e usados consistentemente; `evaluate`, `setAlertCooldownSeconds`, `reset`, `alerts` com assinaturas estáveis em todas as tasks. ✅
