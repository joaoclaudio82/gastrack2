import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  input,
  viewChild,
} from '@angular/core';
import { PopoverComponent } from '../popover/popover.component';

/** Ícones disponíveis para os itens do menu (registro fechado, estilo lucide). */
export type ActionMenuIcon = 'view' | 'edit' | 'transfer' | 'delete' | 'add' | 'toggle';

export interface ActionMenuItem {
  readonly label: string;
  readonly action: () => void;
  readonly icon?: ActionMenuIcon;
  readonly variant?: 'default' | 'destructive';
  /** Quando true, o item aparece desabilitado (ex.: ação não permitida no estado atual). */
  readonly disabled?: boolean;
}

type MenuRow = { separator: true } | { separator: false; item: ActionMenuItem };

/**
 * Menu de ações "kebab" (⋮) para linhas de tabela — padrão shadcn/ui DropdownMenu:
 * gatilho ghost, painel com ícones, separador antes de ações destrutivas e destrutivo em vermelho.
 * Envolve o app-popover. O clique no gatilho não borbulha até a linha (stopPropagation no host),
 * então convive com tabelas de linha clicável (ex.: kits) sem disparar a navegação por engano.
 */
@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [PopoverComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-popover
      side="bottom"
      align="end"
      class="min-w-[12rem] rounded-xl border-border/60 bg-popover/95 p-1.5 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.22)] backdrop-blur-md"
    >
      <span
        popover-trigger
        class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        [attr.aria-label]="ariaLabel()"
        [attr.title]="ariaLabel()"
      >
        <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </span>

      <div role="menu">
        @for (row of rows(); track $index) {
          @if (row.separator) {
            <div class="-mx-1 my-1 h-px bg-border" role="separator"></div>
          } @else {
            <button
              type="button"
              role="menuitem"
              [disabled]="row.item.disabled"
              class="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-accent/70 focus-visible:bg-accent/70 disabled:pointer-events-none disabled:opacity-50"
              [class.text-destructive]="row.item.variant === 'destructive'"
              [class.hover:bg-destructive/10]="row.item.variant === 'destructive'"
              [class.text-foreground]="row.item.variant !== 'destructive'"
              (click)="run(row.item)"
            >
              @if (row.item.icon; as icon) {
                <svg
                  class="h-4 w-4 shrink-0"
                  [class.text-muted-foreground]="row.item.variant !== 'destructive'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  @switch (icon) {
                    @case ('view') {
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    }
                    @case ('edit') {
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                    }
                    @case ('transfer') {
                      <path d="m16 3 4 4-4 4" />
                      <path d="M20 7H4" />
                      <path d="m8 21-4-4 4-4" />
                      <path d="M4 17h16" />
                    }
                    @case ('add') {
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    }
                    @case ('toggle') {
                      <circle cx="12" cy="12" r="9" />
                      <path d="m9 12 2 2 4-4" />
                    }
                    @case ('delete') {
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    }
                  }
                </svg>
              }
              {{ row.item.label }}
            </button>
          }
        }
      </div>
    </app-popover>
  `,
})
export class ActionMenuComponent {
  readonly items = input<ActionMenuItem[]>([]);
  readonly ariaLabel = input<string>('Abrir menu de ações');

  private readonly popover = viewChild.required(PopoverComponent);

  /** Insere um separador antes do primeiro item destrutivo (padrão de mercado). */
  protected readonly rows = computed<MenuRow[]>(() => {
    const items = this.items();
    const out: MenuRow[] = [];
    items.forEach((item, i) => {
      const prev = items[i - 1];
      if (item.variant === 'destructive' && prev && prev.variant !== 'destructive') {
        out.push({ separator: true });
      }
      out.push({ separator: false, item });
    });
    return out;
  });

  @HostListener('click', ['$event'])
  protected onHostClick(event: MouseEvent): void {
    // Abrir o menu não pode disparar o (click) da linha da tabela (ex.: kits -> detalhe).
    event.stopPropagation();
  }

  protected run(item: ActionMenuItem): void {
    if (item.disabled) return;
    this.popover().close();
    item.action();
  }
}
