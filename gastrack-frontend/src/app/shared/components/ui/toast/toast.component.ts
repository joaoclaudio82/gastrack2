import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { NotificationType } from '@core/services/notification.service';
import { cn } from '@shared/lib';
import { generateId } from '@shared/utils/uuid';

const borderColors: Record<NotificationType, string> = {
  success: 'border-success',
  error: 'border-destructive',
  warning: 'border-warning',
  info: 'border-info',
};

const iconColors: Record<NotificationType, string> = {
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-info',
};

const ringColors: Record<NotificationType, string> = {
  success: 'focus:ring-success',
  error: 'focus:ring-destructive',
  warning: 'focus:ring-warning',
  info: 'focus:ring-info',
};

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="toastClasses()"
      role="alert"
      aria-live="polite"
      [attr.aria-labelledby]="title() ? 'toast-title-' + uniqueId : null"
    >
      <div [class]="iconClasses()" aria-hidden="true">
        @switch (type()) {
          @case ('success') {
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
          }
          @case ('error') {
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          }
          @case ('warning') {
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          }
          @case ('info') {
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          }
        }
      </div>

      <div class="flex flex-col flex-1 gap-0.5 min-w-0">
        @if (title()) {
          <span [id]="'toast-title-' + uniqueId" class="font-semibold text-sm text-card-foreground">
            {{ title() }}
          </span>
        }
        <span class="text-sm text-muted-foreground">
          {{ message() }}
        </span>
      </div>

      <button
        type="button"
        class="flex-shrink-0 p-1 text-muted-foreground transition-colors duration-150 rounded hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2"
        [class]="closeButtonRingClasses()"
        (click)="dismiss.emit()"
        aria-label="Dismiss notification"
      >
        <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
          />
        </svg>
      </button>
    </div>
  `,
  styles: `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .animate-slideIn {
      animation: slideIn 0.2s ease-out;
    }
  `,
})
export class ToastComponent {
  readonly type = input.required<NotificationType>();
  readonly message = input.required<string>();
  readonly title = input<string>('');
  readonly class = input<string>('');

  readonly dismiss = output();

  protected readonly uniqueId = generateId();

  protected readonly toastClasses = computed(() =>
    cn(
      'flex items-start gap-3 w-full max-w-sm p-4 bg-card rounded-sm shadow-lg animate-slideIn border-l-4',
      borderColors[this.type()],
      this.class(),
    ),
  );

  protected readonly iconClasses = computed(() => cn('flex-shrink-0', iconColors[this.type()]));

  protected readonly closeButtonRingClasses = computed(() => ringColors[this.type()]);
}
