import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PermissionService } from '@core/auth/services/permission.service';
import { UserRole } from '@models/role.model';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';

type NavGroup = 'OBSERVAR' | 'GERIR' | 'PLATAFORMA';

const GROUP_ORDER: readonly NavGroup[] = ['OBSERVAR', 'GERIR', 'PLATAFORMA'];

/**
 * Rótulos exibidos. O eixo dos grupos é o ALCANCE, não "gerir ou não":
 * GERIR = a operação da própria empresa (tenant); PLATAFORMA = o super-admin
 * administra a plataforma inteira (as empresas + config global). Ver issue de
 * separar o control plane numa área própria.
 */
const GROUP_LABELS: Record<NavGroup, string> = {
  OBSERVAR: 'Monitoramento',
  GERIR: 'Gestão da empresa',
  PLATAFORMA: 'Admin da plataforma',
};

interface NavItem {
  label: string;
  route: string;
  icon: string;
  group: NavGroup;
  roles?: UserRole[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Modern GasTrack Sidebar using design system tokens -->
    <aside
      class="fixed left-0 top-0 z-50 flex h-screen flex-col bg-card border-r border-border shadow-sm transition-all duration-200 ease-in-out"
      [class.-translate-x-full]="collapsed()"
      [class.translate-x-0]="!collapsed()"
      [class.w-16]="collapsed()"
      [class.w-64]="!collapsed()"
      [class.lg:translate-x-0]="true"
      role="navigation"
      aria-label="Navegação principal"
    >
      <!-- Sidebar Header with GasTrack Logo -->
      <div
        class="flex h-16 items-center justify-center border-b border-border"
        [class.px-4]="!collapsed()"
        [class.px-2]="collapsed()"
      >
        <a
          routerLink="/dashboard"
          class="flex items-center gap-3 text-foreground transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
          aria-label="Inteligás - Ir para dashboard"
        >
          @if (!collapsed()) {
            <svg
              class="h-8 w-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <rect x="8" y="2" width="8" height="20" rx="2" />
              <path d="M8 6h8M8 10h8M8 14h8" />
              <circle cx="12" cy="4" r="1" fill="currentColor" />
            </svg>
            <span class="whitespace-nowrap text-xl font-bold tracking-tight">Inteligás</span>
          } @else {
            <div
              class="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-sm font-bold text-primary-foreground shadow-md"
              aria-label="GF"
            >
              GF
            </div>
          }
        </a>
      </div>

      <!-- Navigation Menu with design system colors -->
      <nav
        class="flex-1 space-y-1 overflow-y-auto"
        [class.p-3]="!collapsed()"
        [class.p-2]="collapsed()"
        aria-label="Menu de navegação"
      >
        @for (group of visibleGroups(); track group.name) {
          <div class="pt-2 first:pt-0">
            @if (!collapsed()) {
              <p
                class="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
              >
                {{ group.name }}
              </p>
            } @else if (!$first) {
              <hr class="my-2 border-border" />
            }
            @for (item of group.items; track item.route) {
              <a
                [routerLink]="item.route"
                routerLinkActive="bg-primary text-primary-foreground shadow-md"
                [routerLinkActiveOptions]="{ exact: false }"
                #rla="routerLinkActive"
                class="group flex items-center rounded-sm text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                [class.gap-3]="!collapsed()"
                [class.justify-center]="collapsed()"
                [class.px-3]="!collapsed()"
                [class.px-2]="collapsed()"
                [class.py-3]="!collapsed()"
                [class.py-2]="collapsed()"
                [title]="collapsed() ? item.label : ''"
                [attr.aria-current]="rla.isActive ? 'page' : null"
              >
                <span
                  class="flex h-5 w-5 flex-shrink-0 items-center justify-center [&>svg]:text-current [&>svg]:w-full [&>svg]:h-full"
                  [innerHTML]="item.icon | safeHtml"
                  aria-hidden="true"
                ></span>
                @if (!collapsed()) {
                  <span class="whitespace-nowrap">{{ item.label }}</span>
                }
              </a>
            }
          </div>
        }
      </nav>

      <!-- Sidebar Footer with Collapse Button -->
      <div class="border-t border-border" [class.p-3]="!collapsed()" [class.p-2]="collapsed()">
        <button
          type="button"
          class="flex w-full min-h-[44px] items-center justify-center rounded-sm py-3 text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          [class.px-3]="!collapsed()"
          [class.px-2]="collapsed()"
          (click)="toggleCollapse.emit()"
          [attr.aria-label]="collapsed() ? 'Expandir menu lateral' : 'Recolher menu lateral'"
          [attr.aria-expanded]="!collapsed()"
        >
          <svg
            class="h-5 w-5 transition-transform duration-150"
            [class.rotate-180]="collapsed()"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
    </aside>
  `,
  styles: ``,
})
export class SidebarComponent {
  private readonly permissionService = inject(PermissionService);

  readonly collapsed = input<boolean>(false);
  readonly toggleCollapse = output();

  private readonly navItems: NavItem[] = [
    // OBSERVAR — o dado chegando (USER também vê)
    {
      label: 'Dashboard',
      route: '/dashboard',
      group: 'OBSERVAR',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>',
    },
    {
      label: 'Analytics',
      route: '/analytics',
      group: 'OBSERVAR',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>',
    },
    {
      label: 'Pontos de Gás',
      route: '/admin/gas-points',
      group: 'OBSERVAR',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v6H4z" /><path d="M6 14h12v6H6z" /><circle cx="8" cy="7" r="1" /><circle cx="16" cy="7" r="1" /><path d="M10 14v-4h4v4" /></svg>',
      roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    // GERIR — montar/gerir a própria operação (ADMIN + SUPER_ADMIN)
    // "Cilindros" ficou fora do menu por um tempo: o casco pertence a uma linha, então se
    // chegava nele só pelo "Gerenciar cilindros" no card da linha. Na prática, cadastrar um
    // casco novo obrigava a passar por uma linha que talvez nem exista ainda — o caminho
    // direto voltou. Entrar pela linha continua valendo, e é por onde se instala.
    {
      label: 'Cilindros',
      route: '/admin/cylinders',
      group: 'GERIR',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z" /><path d="M8 5h8v14a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V5z" /><path d="M8 16h8" /></svg>',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Usuários',
      route: '/admin/users',
      group: 'GERIR',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Convites',
      route: '/admin/invitations',
      group: 'GERIR',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Endereços',
      route: '/admin/addresses',
      group: 'GERIR',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Contratos',
      route: '/equipment/contracts',
      group: 'GERIR',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Kits & Instalações',
      route: '/equipment/kits',
      group: 'GERIR',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2" /><polyline points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      label: 'Histórico',
      route: '/equipment/history',
      group: 'GERIR',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    // PLATAFORMA — inventário/catálogo/logs (SUPER_ADMIN)
    {
      label: 'Empresas',
      route: '/admin/companies',
      group: 'PLATAFORMA',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>',
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      label: 'Inventário ESP32',
      route: '/equipment/inventory',
      group: 'PLATAFORMA',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>',
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      label: 'Catálogo de Cilindros',
      route: '/admin/cylinder-models',
      group: 'PLATAFORMA',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="20" rx="2" /><path d="M8 7h8M8 12h8" /><circle cx="12" cy="4" r="0.5" fill="currentColor" /></svg>',
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      label: 'Preços de Gás',
      route: '/admin/gas-prices',
      group: 'PLATAFORMA',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>',
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      label: 'Logs de Ping',
      route: '/equipment/device-logs',
      group: 'PLATAFORMA',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 1l4.2 4.2M1 7l4.2-4.2" /><circle cx="12" cy="12" r="3" /><path d="M4.93 4.93a10 10 0 0 0 0 14.14" /><path d="M7.76 7.76a6 6 0 0 0 0 8.48" /><path d="M16.24 7.76a6 6 0 0 1 0 8.48" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>',
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      label: 'Onboarding',
      route: '/admin/onboarding',
      group: 'PLATAFORMA',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>',
      roles: [UserRole.SUPER_ADMIN],
    },
  ];

  private readonly filteredNavItems = computed(() =>
    this.navItems.filter(
      (item) =>
        !item.roles || item.roles.length === 0 || this.permissionService.hasAnyRole(item.roles),
    ),
  );

  /** Itens visíveis agrupados por papel, na ordem OBSERVAR → GERIR → PLATAFORMA. */
  protected readonly visibleGroups = computed(() => {
    const items = this.filteredNavItems();
    return GROUP_ORDER.map((key) => ({
      name: GROUP_LABELS[key],
      items: items.filter((item) => item.group === key),
    })).filter((group) => group.items.length > 0);
  });
}
