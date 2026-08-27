import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type DividerPosition = 'none' | 'top' | 'bottom';

@Component({
  selector: 'app-form-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="sectionClasses()">
      @if (divider() === 'top') {
        <div class="border-t border-border mb-6"></div>
      }

      @if (title() || description()) {
        <header class="mb-4 space-y-1.5">
          @if (title()) {
            <h2 class="text-lg font-semibold text-foreground tracking-tight">{{ title() }}</h2>
          }
          @if (description()) {
            <p class="text-sm text-muted-foreground">{{ description() }}</p>
          }
        </header>
      }

      <div class="space-y-4">
        <ng-content />
      </div>

      @if (divider() === 'bottom') {
        <div class="border-t border-border mt-6"></div>
      }
    </section>
  `,
})
export class FormSectionComponent {
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly divider = input<DividerPosition>('none');
  readonly spacing = input<'default' | 'compact'>('default');

  protected readonly sectionClasses = computed(() => {
    return this.spacing() === 'compact' ? 'py-3 space-y-3' : 'py-4 space-y-4';
  });
}
