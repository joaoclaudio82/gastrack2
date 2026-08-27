import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-card rounded-sm shadow-sm border border-border overflow-hidden focus-within:ring-2 focus-within:ring-ring/50 transition-shadow duration-150 hover:shadow-lg min-w-0"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm text-foreground" role="table">
          <thead class="bg-muted/50 border-b border-border" role="rowgroup">
            <ng-content select="[data-table-head]" />
          </thead>

          <tbody [class]="bodyClasses()" role="rowgroup">
            <ng-content select="[data-table-body]" />
          </tbody>
        </table>
      </div>

      <div class="px-4 py-2.5 border-t border-border">
        <ng-content select="[data-table-footer]" />
      </div>
    </div>
  `,
})
export class DataTableComponent {
  readonly hoverable = input<boolean>(true);

  protected readonly bodyClasses = computed(() => {
    const rows = ['divide-y divide-border'];

    if (this.hoverable()) {
      rows.push('[&>tr]:transition-colors', '[&>tr:hover]:bg-muted/50');
    }

    return rows.join(' ');
  });
}
