import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { cn } from '@shared/lib';

export interface TimelineItem {
  id: number | string;
  title: string;
  description?: string | undefined;
  date: string;
  icon?: TimelineIcon | undefined;
  variant?: TimelineVariant | undefined;
  metadata?: Record<string, string> | undefined;
}

export type TimelineIcon =
  | 'plus'
  | 'link'
  | 'unlink'
  | 'transfer'
  | 'settings'
  | 'x'
  | 'check'
  | 'package'
  | 'wrench'
  | 'trash';

export type TimelineVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info';

const VARIANT_COLORS: Record<TimelineVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-[var(--color-success)] text-white',
  warning: 'bg-[var(--color-warning)] text-white',
  destructive: 'bg-destructive text-destructive-foreground',
  info: 'bg-[var(--color-info)] text-white',
};

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" [class]="class()">
      @for (item of items(); track item.id; let last = $last) {
        <div class="relative flex gap-4 pb-8" [class.pb-0]="last">
          <!-- Timeline line -->
          @if (!last) {
            <div
              class="absolute left-5 top-10 h-[calc(100%-2.5rem)] w-px bg-border"
              aria-hidden="true"
            ></div>
          }

          <!-- Icon -->
          <div
            class="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            [class]="getIconClasses(item.variant)"
          >
            @switch (item.icon) {
              @case ('plus') {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              }
              @case ('link') {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              }
              @case ('unlink') {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"
                  />
                  <path
                    d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"
                  />
                  <line x1="8" y1="2" x2="8" y2="5" />
                  <line x1="2" y1="8" x2="5" y2="8" />
                  <line x1="16" y1="19" x2="16" y2="22" />
                  <line x1="19" y1="16" x2="22" y2="16" />
                </svg>
              }
              @case ('transfer') {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="m16 3 4 4-4 4" />
                  <path d="M20 7H4" />
                  <path d="m8 21-4-4 4-4" />
                  <path d="M4 17h16" />
                </svg>
              }
              @case ('settings') {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                  />
                </svg>
              }
              @case ('x') {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              }
              @case ('check') {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="9 12 12 15 16 10" />
                </svg>
              }
              @case ('package') {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="m16 16 2 2 4-4" />
                  <path
                    d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"
                  />
                  <path d="m7.5 4.27 9 5.15" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                </svg>
              }
              @case ('wrench') {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
                  />
                </svg>
              }
              @case ('trash') {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              }
              @default {
                <svg
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
              }
            }
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 pt-1">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-medium text-foreground truncate">{{ item.title }}</p>
                @if (item.description) {
                  <p class="mt-0.5 text-sm text-muted-foreground">{{ item.description }}</p>
                }
              </div>
              <time class="text-xs text-muted-foreground whitespace-nowrap">
                {{ item.date | date: 'dd/MM/yyyy HH:mm' }}
              </time>
            </div>

            @if (item.metadata && hasMetadata(item.metadata)) {
              <div class="mt-2 flex flex-wrap gap-2">
                @for (entry of getMetadataEntries(item.metadata); track entry.key) {
                  <span
                    class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                  >
                    <span class="font-medium text-muted-foreground">{{ entry.key }}:</span>
                    <span class="text-foreground">{{ entry.value }}</span>
                  </span>
                }
              </div>
            }
          </div>
        </div>
      }

      @if (items().length === 0) {
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <svg
            class="h-12 w-12 text-muted-foreground/50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p class="mt-2 text-sm text-muted-foreground">{{ emptyMessage() }}</p>
        </div>
      }
    </div>
  `,
})
export class TimelineComponent {
  readonly items = input<TimelineItem[]>([]);
  readonly class = input<string>('');
  readonly emptyMessage = input<string>('Nenhum histórico disponível');

  protected getIconClasses(variant: TimelineVariant = 'default'): string {
    return cn(VARIANT_COLORS[variant]);
  }

  protected hasMetadata(metadata: Record<string, string>): boolean {
    return Object.keys(metadata).length > 0;
  }

  protected getMetadataEntries(metadata: Record<string, string>): { key: string; value: string }[] {
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }
}
