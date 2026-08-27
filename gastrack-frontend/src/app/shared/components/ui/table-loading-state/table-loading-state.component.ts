import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-table-loading-state',
  standalone: true,
  imports: [LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center justify-center py-12 px-4 text-center gap-2 text-muted-foreground"
    >
      <app-loading-spinner size="lg" variant="primary" [text]="text()" />
      @if (hint()) {
        <p class="text-sm">{{ hint() }}</p>
      }
    </div>
  `,
})
export class TableLoadingStateComponent {
  readonly text = input<string>('Carregando dados');
  readonly hint = input<string>('Carregando os registros desta tabela.');
}
