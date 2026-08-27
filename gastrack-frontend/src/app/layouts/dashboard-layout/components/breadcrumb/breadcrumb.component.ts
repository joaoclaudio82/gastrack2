import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbService } from './breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (breadcrumbService.breadcrumbs().length > 0) {
      <!-- Modern GasTrack Breadcrumb using design system tokens -->
      <nav class="mb-8" aria-label="Navegação por páginas">
        <ol class="flex flex-wrap items-center gap-2 text-sm">
          <!-- Home Icon Link -->
          <li class="flex items-center">
            <a
              routerLink="/dashboard"
              class="flex items-center rounded-sm p-1 text-muted-foreground transition-colors duration-100 hover:text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Ir para página inicial - Dashboard"
            >
              <svg
                class="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </a>
          </li>

          <!-- Breadcrumb Items -->
          @for (breadcrumb of breadcrumbService.breadcrumbs(); track $index; let last = $last) {
            <li class="flex items-center gap-2">
              <!-- Separator -->
              <svg
                class="h-4 w-4 text-muted-foreground/70"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>

              <!-- Link or Current Page -->
              @if (last) {
                <span class="font-semibold text-foreground" aria-current="page">
                  {{ breadcrumb.label }}
                </span>
              } @else {
                <a
                  [routerLink]="breadcrumb.url"
                  class="rounded-sm px-2 py-1 text-muted-foreground transition-colors duration-100 hover:text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {{ breadcrumb.label }}
                </a>
              }
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styles: ``,
})
export class BreadcrumbComponent {
  protected readonly breadcrumbService = inject(BreadcrumbService);
}
