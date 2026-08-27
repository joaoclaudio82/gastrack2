import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';
import { ToastComponent } from './toast.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container">
      @for (notification of notificationService.notifications(); track notification.id) {
        <app-toast
          [type]="notification.type"
          [message]="notification.message"
          [title]="notification.title ?? ''"
          (dismiss)="notificationService.dismiss(notification.id)"
        />
      }
    </div>
  `,
  styles: `
    .toast-container {
      display: flex;
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 9999;
    }
  `,
})
export class ToastContainerComponent {
  protected readonly notificationService = inject(NotificationService);
}
