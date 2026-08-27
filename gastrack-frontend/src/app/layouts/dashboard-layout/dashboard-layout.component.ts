import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Modern GasTrack Dashboard Layout using design system -->
    <div class="flex min-h-screen bg-background">
      <!-- Mobile Overlay Backdrop (only show on mobile when sidebar is open) -->
      @if (!isSidebarCollapsed()) {
        <div
          class="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden"
          (click)="toggleSidebar()"
          aria-hidden="true"
        ></div>
      }

      <!-- Sidebar Component (hidden on mobile by default, shown as overlay when toggled) -->
      <app-sidebar [collapsed]="isSidebarCollapsed()" (toggleCollapse)="toggleSidebar()" />

      <!-- Main Content Area with proper responsive spacing -->
      <div
        class="flex flex-1 flex-col min-w-0 transition-all duration-200 ease-in-out"
        [class.lg:ml-16]="isSidebarCollapsed()"
        [class.lg:ml-64]="!isSidebarCollapsed()"
      >
        <!-- Header Component -->
        <app-header (toggleSidebar)="toggleSidebar()" />

        <!-- Page Content with responsive padding and proper overflow handling -->
        <main
          id="main-content"
          tabindex="-1"
          class="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-none"
          role="main"
        >
          <div class="mx-auto max-w-7xl w-full">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `,
  styles: ``,
})
export class DashboardLayoutComponent {
  private readonly platformId = inject(PLATFORM_ID);

  // Initialize based on screen size
  // Mobile: collapsed=true (hidden by default)
  // Desktop: collapsed=false (expanded by default)
  protected readonly isSidebarCollapsed = signal(this.getInitialCollapsedState());

  private getInitialCollapsedState(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      // On mobile (< 1024px), start collapsed (hidden)
      return window.innerWidth < 1024;
    }
    // SSR: default to collapsed
    return true;
  }

  protected toggleSidebar(): void {
    this.isSidebarCollapsed.update((collapsed) => !collapsed);
  }
}
