import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ClickOutsideDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Modern GasTrack Header using design system tokens -->
    <header
      class="sticky top-0 z-40 flex h-16 min-h-[64px] items-center justify-between border-b border-border bg-card px-4 sm:px-6 shadow-sm"
    >
      <!-- Left Section: Menu Toggle -->
      <div class="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm p-2 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          (click)="toggleSidebar.emit()"
          aria-label="Alternar menu lateral"
        >
          <svg
            class="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        <!-- GasTrack Logo for mobile -->
        <div class="flex items-center gap-2 md:hidden">
          <svg
            class="h-6 w-6 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <rect x="8" y="2" width="8" height="20" rx="2" />
            <path d="M8 6h8M8 10h8" />
            <circle cx="12" cy="4" r="1" fill="currentColor" />
          </svg>
          <span class="text-lg font-bold text-primary">GasTrack</span>
        </div>
      </div>

      <!-- Right Section: User Menu -->
      <div class="flex items-center">
        <div class="relative" appClickOutside (appClickOutside)="closeDropdown()">
          <button
            type="button"
            class="flex min-h-[44px] items-center gap-2 sm:gap-3 rounded-sm px-2 sm:px-3 py-2 transition-all duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            (click)="toggleDropdown()"
            (keydown.escape)="closeDropdown()"
            [attr.aria-label]="'Menu do usuário ' + authService.userFullName()"
            [attr.aria-expanded]="isDropdownOpen"
            aria-haspopup="true"
          >
            <!-- User Avatar using primary color -->
            <span
              class="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-md ring-2 ring-card"
              [attr.aria-label]="'Avatar de ' + authService.userFullName()"
            >
              {{ authService.userInitial() }}
            </span>
            <span class="hidden text-sm font-medium text-foreground sm:block">
              {{ authService.userFullName() }}
            </span>
            <svg
              class="hidden sm:block h-4 w-4 text-muted-foreground transition-transform duration-150"
              [class.rotate-180]="isDropdownOpen"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <!-- Dropdown Menu using design system tokens -->
          @if (isDropdownOpen) {
            <div
              class="absolute right-0 top-full z-50 mt-2 min-w-[14rem] origin-top-right rounded-sm bg-popover pb-2 px-2 shadow-md ring-1 ring-border animate-in fade-in slide-in-from-top-2 duration-150"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
              tabindex="-1"
              (keydown.escape)="closeDropdown()"
            >
              <!-- User Info -->
              <div class="px-3 pt-3 pb-2 border-b border-border mb-2">
                <p class="text-sm font-semibold text-popover-foreground">
                  {{ authService.userFullName() }}
                </p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {{ authService.currentUser()?.email }}
                </p>
              </div>

              <a
                routerLink="/profile"
                role="menuitem"
                class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-popover-foreground transition-colors duration-100 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                (click)="closeDropdown()"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Perfil</span>
              </a>
              <hr class="my-2 border-border" />
              <button
                type="button"
                role="menuitem"
                class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive transition-colors duration-100 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-inset"
                (click)="logout()"
              >
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sair</span>
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: ``,
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  protected isDropdownOpen = false;

  readonly toggleSidebar = output();

  protected toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  protected closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  protected logout(): void {
    this.closeDropdown();
    this.authService.logout();
  }
}
