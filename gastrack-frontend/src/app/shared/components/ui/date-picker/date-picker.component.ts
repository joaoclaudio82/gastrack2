import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, cva, type VariantProps } from '@shared/lib';
import { generateId } from '@shared/utils/uuid';
import { CalendarComponent } from '../calendar/calendar.component';

const datePickerTriggerVariants = cva(
  'relative flex w-full items-center justify-between rounded-sm border bg-background text-foreground shadow-sm transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm gap-2',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-4 text-base gap-3',
      },
      state: {
        default: 'border-input hover:border-muted-foreground/50',
        error:
          'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
        disabled: 'cursor-not-allowed bg-muted text-muted-foreground',
        open: 'border-primary ring-2 ring-ring/50',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  },
);

type DatePickerSize = NonNullable<VariantProps<typeof datePickerTriggerVariants>['size']>;

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [FormsModule, CalendarComponent, CdkOverlayOrigin, CdkConnectedOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="relative flex flex-col gap-1.5" [class]="class()">
      @if (label()) {
        <label class="text-sm font-medium text-foreground" [for]="inputId()">
          {{ label() }}
          @if (required()) {
            <span class="ml-0.5 text-destructive" aria-label="required">*</span>
          }
        </label>
      }

      <div class="relative" #container>
        <!-- Trigger Button -->
        <button
          type="button"
          cdkOverlayOrigin
          #trigger="cdkOverlayOrigin"
          [id]="inputId()"
          [disabled]="disabled()"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-haspopup]="'dialog'"
          [attr.aria-invalid]="error() ? 'true' : 'false'"
          [attr.aria-describedby]="describedBy()"
          [class]="triggerClasses()"
          (click)="toggle()"
          (keydown)="onKeydown($event)"
        >
          <span [class.text-muted-foreground]="!value()">
            {{ displayValue() }}
          </span>
          <div class="flex items-center gap-1">
            @if (value() && clearable() && !disabled()) {
              <button
                type="button"
                class="p-1 min-h-6 min-w-6 rounded hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                (click)="clearValue($event)"
                aria-label="Limpar data"
              >
                <svg
                  class="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            }
            <svg
              class="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        </button>

        <!-- Calendar Popover (CDK Overlay) -->
        <ng-template
          cdkConnectedOverlay
          [cdkConnectedOverlayOrigin]="trigger"
          [cdkConnectedOverlayOpen]="isOpen()"
          [cdkConnectedOverlayHasBackdrop]="true"
          [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
          [cdkConnectedOverlayPositions]="overlayPositions"
          [cdkConnectedOverlayFlexibleDimensions]="true"
          [cdkConnectedOverlayPush]="true"
          (backdropClick)="close()"
        >
          <div
            class="rounded-sm border border-border bg-popover shadow-lg animate-in"
            role="dialog"
            aria-modal="true"
            [attr.aria-label]="'Selecionar data'"
          >
            <app-calendar
              [ngModel]="value()"
              [minDate]="minDate()"
              [maxDate]="maxDate()"
              [disabledDates]="disabledDates()"
              [showClearButton]="clearable()"
              (dateSelected)="onDateSelected($event)"
              (dateCleared)="onDateCleared()"
            />
          </div>
        </ng-template>
      </div>

      <div class="min-h-[18px]">
        @if (error()) {
          <span
            [id]="inputId() + '-error'"
            class="text-xs text-destructive flex items-center gap-1"
            role="alert"
          >
            <svg
              class="h-3.5 w-3.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            {{ error() }}
          </span>
        } @else if (hint()) {
          <span [id]="inputId() + '-hint'" class="text-xs text-muted-foreground">
            {{ hint() }}
          </span>
        }
      </div>
    </div>
  `,
  styles: `
    @keyframes fade-in-0 {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes zoom-in-95 {
      from {
        transform: scale(0.95);
      }
      to {
        transform: scale(1);
      }
    }
    @keyframes slide-in-from-top-2 {
      from {
        transform: translateY(-8px);
      }
      to {
        transform: translateY(0);
      }
    }
    .animate-in {
      animation:
        fade-in-0 150ms ease-out,
        zoom-in-95 150ms ease-out,
        slide-in-from-top-2 150ms ease-out;
    }
  `,
})
export class DatePickerComponent implements ControlValueAccessor {
  readonly label = input<string>('');
  readonly placeholder = input<string>('Selecione uma data');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabledInput = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly clearable = input<boolean>(true);
  readonly inputId = input<string>(`datepicker-${generateId()}`);
  readonly size = input<DatePickerSize>('md');
  readonly class = input<string>('');
  readonly dateFormat = input<string>('dd/MM/yyyy');

  // Calendar constraints
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly disabledDates = input<Date[]>([]);

  readonly valueChange = output<string>();
  readonly cleared = output();

  protected readonly value = signal<string>('');
  protected readonly isOpen = signal(false);
  private readonly disabledFromForm = signal(false);

  protected readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
    { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
  ];

  protected readonly disabled = computed(() => this.disabledInput() || this.disabledFromForm());

  protected readonly displayValue = computed(() => {
    const val = this.value();
    if (!val) return this.placeholder();
    return this.formatDisplayDate(val);
  });

  protected readonly triggerClasses = computed(() => {
    let state: 'default' | 'error' | 'disabled' | 'open' = 'default';
    if (this.error()) state = 'error';
    else if (this.disabled()) state = 'disabled';
    else if (this.isOpen()) state = 'open';

    return cn(datePickerTriggerVariants({ size: this.size(), state }));
  });

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.error()) {
      ids.push(`${this.inputId()}-error`);
    } else if (this.hint()) {
      ids.push(`${this.inputId()}-hint`);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledFromForm.set(isDisabled);
  }

  protected toggle(): void {
    if (this.disabled()) return;

    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  protected open(): void {
    if (this.disabled()) return;
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.onTouched();
  }

  protected onDateSelected(date: Date): void {
    const isoDate = this.formatDateToISO(date);
    this.value.set(isoDate);
    this.onChange(isoDate);
    this.valueChange.emit(isoDate);
    this.close();
  }

  protected clearValue(event: MouseEvent): void {
    event.stopPropagation();
    this.value.set('');
    this.onChange('');
    this.valueChange.emit('');
    this.cleared.emit();
    this.onTouched();
  }

  protected onDateCleared(): void {
    this.value.set('');
    this.onChange('');
    this.valueChange.emit('');
    this.cleared.emit();
    this.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.toggle();
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  private formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDisplayDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day) return isoDate;

    const format = this.dateFormat();

    return format
      .replace('dd', day)
      .replace('MM', month)
      .replace('yyyy', year)
      .replace('yy', year.slice(-2));
  }
}
