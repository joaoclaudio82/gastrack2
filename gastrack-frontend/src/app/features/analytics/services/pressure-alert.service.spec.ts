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

  it('should_notFireAlert_When_alreadyCritical', () => {
    const spy = vi.spyOn(notification, 'error');

    service.evaluate(ctx({ level: 'critical', timestamp: 1 }));
    service.evaluate(ctx({ level: 'critical', timestamp: 2 }));
    service.evaluate(ctx({ level: 'critical', timestamp: 3 }));

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should_suppressAlert_When_cooldownActive', () => {
    const spy = vi.spyOn(notification, 'error');

    service.evaluate(ctx({ level: 'critical', timestamp: 1_000 })); // dispara
    service.evaluate(ctx({ level: 'low', timestamp: 1_100 })); // re-arma transição
    service.evaluate(ctx({ level: 'critical', timestamp: 1_200 })); // dentro do cooldown (200s < 600s)

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should_reArm_When_levelLeavesAndReentersCriticalAfterCooldown', () => {
    const spy = vi.spyOn(notification, 'error');

    service.evaluate(ctx({ level: 'critical', timestamp: 1_000 })); // dispara
    service.evaluate(ctx({ level: 'normal', timestamp: 1_100 })); // sai de crítico
    service.evaluate(ctx({ level: 'critical', timestamp: 1_700 })); // 700s depois (> 600s) → dispara de novo

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should_fireIndependentAlert_When_differentSensor', () => {
    const spy = vi.spyOn(notification, 'error');

    service.evaluate(ctx({ deviceId: 'esp32-1', sensorId: 1, level: 'low', timestamp: 1 }));
    service.evaluate(ctx({ deviceId: 'esp32-1', sensorId: 1, level: 'critical', timestamp: 2 }));
    service.evaluate(ctx({ deviceId: 'esp32-2', sensorId: 3, level: 'critical', timestamp: 3 }));

    expect(spy).toHaveBeenCalledTimes(2);
  });

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

  it('should_notFire_When_levelLowOrNormalOrFull', () => {
    const spy = vi.spyOn(notification, 'error');

    service.evaluate(ctx({ level: 'low', timestamp: 1 }));
    service.evaluate(ctx({ level: 'normal', timestamp: 2 }));
    service.evaluate(ctx({ level: 'full', timestamp: 3 }));

    expect(spy).not.toHaveBeenCalled();
    expect(service.alerts()).toHaveLength(0);
  });
});
