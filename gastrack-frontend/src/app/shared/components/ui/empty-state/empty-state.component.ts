import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { cn } from '@shared/lib';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div [class]="containerClasses()">
      @if (icon()) {
        <div
          class="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-muted"
          [innerHTML]="icon()"
        ></div>
      } @else {
        <div class="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-muted">
          <svg
            class="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      }

      <h3 class="text-lg font-semibold text-foreground mb-2">
        {{ title() || 'Nenhum item encontrado' }}
      </h3>

      @if (description()) {
        <p class="text-sm text-muted-foreground max-w-sm mb-6">
          {{ description() }}
        </p>
      }

      @if (action()) {
        <app-button variant="primary" (buttonClick)="onActionClick()">
          {{ action() }}
        </app-button>
      }

      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly icon = input<string>('');
  readonly action = input<string>('');
  readonly class = input<string>('');

  readonly actionClick = output();

  protected readonly containerClasses = (): string =>
    cn('flex flex-col items-center justify-center py-12 px-4 text-center', this.class());

  protected onActionClick(): void {
    this.actionClick.emit();
  }
}
