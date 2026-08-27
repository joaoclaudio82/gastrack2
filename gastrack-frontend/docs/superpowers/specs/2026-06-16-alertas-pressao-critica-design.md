# Design — Alertas in-app de pressão crítica (#70)

> Issue: `IFCE/gastrack-frontend#70` — [P2][Analytics] Alertas in-app de pressão crítica
> Branch: `feat/analytics-alertas-pressao-critica` (base: `origin/integracao/prs-abertos`, contém o #74)
> Data: 2026-06-16

## Problema

Hoje uma situação de pressão crítica é apenas **cor no card de status** (`pressure-stats`). Não há alerta visível para situações emergenciais. O `NotificationService` existe e é renderizado globalmente (`ToastContainerComponent` montado no `app.ts`), mas não é usado pelo analytics.

**Critério de aceite:** pressão crítica em sensor monitorado gera alerta visível imediato no app.

## Escopo desta entrega

- **Apenas in-app** (banner/toast persistente). Alertas por **email ficam fora** — exigem backend (provider de email rodando server-side 24/7, credencial protegida) e são feature/repositório separados (`gastrack-backend`). Decisão registrada com o time.
- Apenas o nível **`critical`** dispara alerta. `low` continua sendo só cor no card.
- Anti-spam: alerta dispara **uma vez por cruzamento** (edge-triggered) + **cooldown configurável**.
- **Histórico in-app** simples (lista das últimas leituras que dispararam alerta).

## Investigação do threshold

Rastreando as fórmulas do `pressure.service.ts`:

```
liters          = pressureBar × internalVolumeLiters             (:753)
fullScaleLiters = internalVolumeLiters × fullTankPressureBar      (:479)
ratio           = liters / fullScaleLiters                        (:480)
```

O `internalVolumeLiters` se cancela:

```
ratio = (pressureBar × volume) / (volume × fullTankPressureBar) = pressureBar / fullTankPressureBar
```

E `currentPercentage = (pressureBar / fullTankPressureBar) × 100` (`:475`).

**Logo `ratio ≡ currentPercentage / 100`.** Equivalências do nível atual:

| Nível      | ratio     | %        | bar (fullTank=140 default) |
| ---------- | --------- | -------- | -------------------------- |
| `critical` | `< 0.2`   | `< 20%`  | `< 28 bar`                 |
| `low`      | `0.2–0.5` | `20–50%` | `28–70 bar`                |

**Decisão:** reusar `tankStatus.level === 'critical'` como gatilho do alerta. Vantagens:

- Threshold = **20% da capacidade**, **escala automaticamente** por ponto de gás (cada um pode ter `fullTankPressureBar` diferente via `setFullTankPressureBar`). Um piso absoluto fixo em bar seria errado entre pontos de gás distintos.
- **Zero magic number novo** — reusa o cálculo já existente do #74, consistente com a cor do card.

## Arquitetura

Serviço isolado novo — **não** altera `pressure.service.ts` (evita conflito com o #74). A detecção, anti-spam e histórico ficam encapsulados e testáveis isoladamente. A página de analytics apenas conecta um `effect` que observa `stats()` e delega.

```
stats() [computed, já reativo]  ──effect──▶  PressureAlertService.evaluate(ctx)
                                                   │
                          ┌────────────────────────┼─────────────────────────┐
                          ▼                         ▼                         ▼
                  NotificationService.error      alertsSignal            mapas por-sensor
                  (banner persistente, dur=0)    (histórico in-app)      (transição + cooldown)
```

Fluxo reativo já existente: o chart realtime dispara `refreshRequested` → `pressureService.fetchNewReadings()` → `streamedReadingsSignal` → `allReadings` → `filteredReadings` → `stats()` recalcula → `tankStatus.level` reflete o estado atual.

## Componentes

### `PressureAlertService` (`providedIn: 'root'`)

Arquivo: `src/app/features/analytics/services/pressure-alert.service.ts`

**Constantes centralizadas:**

- `CRITICAL_ALERT_LEVEL: TankStatusLevel = 'critical'`
- `DEFAULT_ALERT_COOLDOWN_SECONDS = 600` (10 min) — **configurável** via `setAlertCooldownSeconds(value)` (signal interno, com validação `> 0`)
- `MAX_ALERT_HISTORY = 50`

**Estado por sensor** — chave `sensorKey = `${deviceId}|${sensorId ?? 'all'}``:

- `Map<string, TankStatusLevel>` → último nível visto (detecta **transição**)
- `Map<string, number>` → timestamp (unix s) do último alerta disparado (cooldown)

**`alerts`** — signal readonly de `PressureAlert[]`:

```ts
interface PressureAlert {
  deviceId: string;
  sensorId: number | null;
  level: TankStatusLevel; // sempre 'critical' nesta entrega
  percentage: number;
  pressureBar: number;
  datetime: string; // datetime formatado da leitura
  firedAtTimestamp: number; // ctx.timestamp da leitura
}
```

Cap em `MAX_ALERT_HISTORY` (mais recentes primeiro).

**`evaluate(ctx)`** — `ctx = { deviceId, sensorId, level, percentage, pressureBar, datetime, timestamp }`:

1. `key = sensorKey(deviceId, sensorId)`
2. `prev = lastLevelBySensor.get(key)`
3. `transitioned = level === CRITICAL_ALERT_LEVEL && prev !== CRITICAL_ALERT_LEVEL`
4. Se `transitioned` **e** cooldown expirou (`timestamp - lastAlertTs >= cooldownSeconds`, ou nunca alertou):
   - `notification.error(message, 'Pressão crítica', 0)` (banner persistente)
   - adiciona ao `alertsSignal` (respeitando cap)
   - `lastAlertBySensor.set(key, timestamp)`
5. **Sempre** `lastLevelBySensor.set(key, level)` (re-arma quando sai de crítico)

> Cooldown usa `ctx.timestamp` da própria leitura (não `Date.now()`) → comportamento determinístico e testável.

Mensagem (PT-BR, acentuada):
`Pressão crítica no sensor {deviceId}[ / porta {sensorId}] — {percentage.toFixed(0)}%`

**`reset()`** — limpa os dois mapas e o histórico.

### `PressureAnalyticsComponent` (wiring)

Arquivo: `src/app/features/analytics/pages/pressure-analytics/pressure-analytics.component.ts`

- Injetar `PressureAlertService`.
- No construtor (contexto de injeção), criar:
  ```ts
  effect(
    () => {
      const s = this.pressureService.stats();
      const r = s.latestReading;
      if (!r) return;
      this.alertService.evaluate({
        deviceId: r.deviceId,
        sensorId: r.sensorId ?? null,
        level: s.tankStatus.level,
        percentage: s.currentPercentage,
        pressureBar: r.pressureBar,
        datetime: r.datetime,
        timestamp: r.timestamp,
      });
    },
    { allowSignalWrites: true },
  );
  ```
  Effects criados em contexto de componente **se auto-destroem** no destroy do componente → cancelamento garantido sem subscription manual.
- No fluxo de `reset()` da página (início do `ngOnInit`), chamar `this.alertService.reset()` para começar limpo a cada navegação.

### UI do histórico

Seção "Alertas recentes" no template do `pressure-analytics`, renderizada apenas se `alertService.alerts().length > 0`: lista com sensor, `%`, datetime. OnPush + signals. PT-BR acentuado. O banner crítico em si é o toast persistente global já existente (`ToastContainerComponent`).

## Tratamento de erros / não-regressões

- Não altera `pressure.service.ts` nem `pressure-stats.component.ts` do #74 (soma, não reescreve).
- Sem `any`; sem mutação de estado dentro de `computed` (a mutação ocorre no `effect`/serviço, não em computed).
- `effect` em contexto de componente cobre o cancelamento (sem subscriptions pendentes — anti-padrão apontado no review do #74 não se repete).
- `latestReading` nulo → `evaluate` não é chamado.

## Testes (`should_X_When_Y`)

`pressure-alert.service.spec.ts`:

- `should_fireAlert_when_levelCrossesToCritical`
- `should_notFireAlert_when_alreadyCritical`
- `should_suppressAlert_when_cooldownActive`
- `should_reArm_when_levelLeavesAndReentersCriticalAfterCooldown`
- `should_fireIndependentAlert_when_differentSensor`
- `should_addToHistory_when_alertFires`
- `should_capHistory_when_exceedsMax`
- `should_notFire_when_levelLowOrNormal`
- `should_useConfiguredCooldown_when_setAlertCooldownSecondsCalled`

## Validação local antes do PR

```bash
bun run lint:all
bun run test:ci
```

## PR

- Base: `homologacao` (ou `integracao/prs-abertos` se empilhar antes do #75).
- Corpo com `Closes #70` e os thresholds documentados (crítico = 20% da capacidade, escala por ponto de gás; cooldown default 10 min, configurável).
