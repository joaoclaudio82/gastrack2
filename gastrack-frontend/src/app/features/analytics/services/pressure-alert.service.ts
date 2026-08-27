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
