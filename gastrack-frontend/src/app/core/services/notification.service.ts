import { Injectable, signal } from '@angular/core';
import { generateId } from '@shared/utils/uuid';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string | undefined;
  duration?: number | undefined;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationsSignal = signal<Notification[]>([]);
  readonly notifications = this.notificationsSignal.asReadonly();

  private readonly defaultDuration = 5000;

  success(message: string, title?: string, duration?: number): void {
    this.show({ type: 'success', message, title, duration });
  }

  error(message: string, title?: string, duration?: number): void {
    this.show({ type: 'error', message, title, duration });
  }

  warning(message: string, title?: string, duration?: number): void {
    this.show({ type: 'warning', message, title, duration });
  }

  info(message: string, title?: string, duration?: number): void {
    this.show({ type: 'info', message, title, duration });
  }

  private show(notification: Omit<Notification, 'id'>): void {
    const id = generateId();
    const duration = notification.duration ?? this.defaultDuration;

    this.notificationsSignal.update((notifications) => [...notifications, { ...notification, id }]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  dismiss(id: string): void {
    this.notificationsSignal.update((notifications) => notifications.filter((n) => n.id !== id));
  }

  clearAll(): void {
    this.notificationsSignal.set([]);
  }
}
