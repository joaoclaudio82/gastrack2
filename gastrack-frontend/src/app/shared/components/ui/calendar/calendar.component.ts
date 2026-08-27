import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '@shared/lib';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

@Component({
  selector: 'app-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CalendarComponent),
      multi: true,
    },
  ],
  template: `
    <div class="p-2 space-y-2">
      <!-- Header with month/year navigation -->
      <div class="flex items-center justify-between gap-1">
        <!-- Month Navigation -->
        <div class="flex items-center">
          <button
            type="button"
            [class]="navBtnClass"
            [disabled]="!canGoPreviousMonth()"
            (click)="previousMonth()"
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <svg
              class="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div class="relative flex items-center">
            <select
              [class]="selectClass"
              (change)="setMonth($event)"
              title="Selecionar mês"
              aria-label="Selecionar mês"
            >
              @for (m of monthsList; track $index) {
                <option
                  [value]="$index"
                  [selected]="$index === month()"
                  [disabled]="isMonthDisabled($index)"
                  class="text-foreground bg-background"
                >
                  {{ m }}
                </option>
              }
            </select>
            <svg
              class="h-3 w-3 pointer-events-none absolute right-0.5 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          <button
            type="button"
            [class]="navBtnClass"
            [disabled]="!canGoNextMonth()"
            (click)="nextMonth()"
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <svg
              class="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <!-- Year Navigation -->
        <div class="flex items-center">
          <button
            type="button"
            [class]="navBtnClass"
            [disabled]="!canGoPreviousYear()"
            (click)="previousYear()"
            title="Ano anterior"
            aria-label="Ano anterior"
          >
            <svg
              class="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div class="relative flex items-center">
            <select
              [class]="selectClass"
              (change)="setYear($event)"
              title="Selecionar ano"
              aria-label="Selecionar ano"
            >
              @for (y of yearsList(); track y) {
                <option [value]="y" [selected]="y === year()" class="text-foreground bg-background">
                  {{ y }}
                </option>
              }
            </select>
            <svg
              class="h-3 w-3 pointer-events-none absolute right-0.5 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          <button
            type="button"
            [class]="navBtnClass"
            [disabled]="!canGoNextYear()"
            (click)="nextYear()"
            title="Próximo ano"
            aria-label="Próximo ano"
          >
            <svg
              class="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Weekday headers -->
      <div class="grid grid-cols-7">
        @for (weekday of weekdays; track weekday) {
          <div
            class="text-center text-[10px] font-medium text-muted-foreground h-6 flex items-center justify-center"
          >
            {{ weekday }}
          </div>
        }
      </div>

      <!-- Day grid -->
      <div class="grid grid-cols-7">
        @for (day of days(); track trackDay($index, day)) {
          <button
            type="button"
            [disabled]="day.isDisabled"
            [class]="getDayClasses(day)"
            (click)="selectDate(day)"
          >
            {{ day.day }}
          </button>
        }
      </div>

      <!-- Footer with Today and Clear buttons -->
      <div class="flex justify-center gap-3 pt-1.5 border-t border-border">
        <button
          type="button"
          class="text-[10px] text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1.5 py-0.5"
          (click)="goToToday()"
        >
          Hoje
        </button>
        @if (selectedDate() && showClearButton()) {
          <button
            type="button"
            class="text-[10px] text-muted-foreground hover:text-destructive hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1.5 py-0.5"
            (click)="clearSelection()"
          >
            Limpar
          </button>
        }
      </div>
    </div>
  `,
})
export class CalendarComponent implements ControlValueAccessor {
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);
  readonly disabledDates = input<Date[]>([]);
  readonly showClearButton = input<boolean>(true);

  readonly dateSelected = output<Date>();
  readonly dateCleared = output();

  protected readonly weekdays = WEEKDAYS;
  protected readonly navBtnClass =
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-6 w-6';
  protected readonly selectClass =
    'text-xs font-medium bg-transparent hover:bg-accent rounded cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none py-1 pl-1 pr-4 text-foreground text-center';

  private readonly viewDate = signal(new Date());
  protected readonly selectedDate = signal<Date | null>(null);

  protected readonly month = computed(() => this.viewDate().getMonth());
  protected readonly year = computed(() => this.viewDate().getFullYear());
  protected readonly monthName = computed(() => MONTHS[this.month()]);

  protected readonly monthsList = MONTHS;

  // Computed puro: deriva de minDate/maxDate/year. O próprio computed memoiza,
  // dispensando cache manual de instância.
  protected readonly yearsList = computed<number[]>(() => {
    const currentYear = new Date().getFullYear();
    let minYear = this.minDate()?.getFullYear() ?? currentYear - 50;
    let maxYear = this.maxDate()?.getFullYear() ?? currentYear + 50;

    const viewYear = this.year();
    if (viewYear < minYear) minYear = viewYear;
    if (viewYear > maxYear) maxYear = viewYear;

    const years: number[] = [];
    for (let i = minYear; i <= maxYear; i++) {
      years.push(i);
    }
    return years;
  });

  protected readonly days = computed(() => this.generateCalendarDays());

  protected readonly canGoPreviousMonth = computed(() => {
    const min = this.minDate();
    if (!min) return true;
    const current = this.viewDate();
    return (
      current.getFullYear() > min.getFullYear() ||
      (current.getFullYear() === min.getFullYear() && current.getMonth() > min.getMonth())
    );
  });

  protected readonly canGoNextMonth = computed(() => {
    const max = this.maxDate();
    if (!max) return true;
    const current = this.viewDate();
    return (
      current.getFullYear() < max.getFullYear() ||
      (current.getFullYear() === max.getFullYear() && current.getMonth() < max.getMonth())
    );
  });

  protected readonly canGoPreviousYear = computed(() => {
    const min = this.minDate();
    if (!min) return true;
    const current = this.viewDate();
    return current.getFullYear() > min.getFullYear();
  });

  protected readonly canGoNextYear = computed(() => {
    const max = this.maxDate();
    if (!max) return true;
    const current = this.viewDate();
    return current.getFullYear() < max.getFullYear();
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    if (value) {
      const date = new Date(value + 'T00:00:00');
      if (!isNaN(date.getTime())) {
        this.selectedDate.set(date);
        this.viewDate.set(new Date(date));
      }
    } else {
      this.selectedDate.set(null);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  protected previousMonth(): void {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  protected previousYear(): void {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear() - 1, current.getMonth(), 1));
  }

  protected nextYear(): void {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear() + 1, current.getMonth(), 1));
  }

  protected setMonth(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newMonth = parseInt(target.value, 10);
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), newMonth, 1));
  }

  protected setYear(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newYear = parseInt(target.value, 10);
    const current = this.viewDate();
    this.viewDate.set(new Date(newYear, current.getMonth(), 1));
  }

  protected isMonthDisabled(monthIndex: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    const currentYear = this.year();

    if (min?.getFullYear() === currentYear && monthIndex < min.getMonth()) return true;
    if (max?.getFullYear() === currentYear && monthIndex > max.getMonth()) return true;
    return false;
  }

  protected goToToday(): void {
    const today = this.startOfDay(new Date());
    this.viewDate.set(today);
    if (this.isDateDisabled(today)) return;
    this.selectDateValue(today);
  }

  protected clearSelection(): void {
    this.selectedDate.set(null);
    this.onChange('');
    this.onTouched();
    this.dateCleared.emit();
  }

  protected selectDate(day: CalendarDay): void {
    if (day.isDisabled) return;
    this.selectDateValue(day.date);
  }

  private selectDateValue(date: Date): void {
    this.selectedDate.set(date);
    const isoDate = this.formatDateToISO(date);
    this.onChange(isoDate);
    this.onTouched();
    this.dateSelected.emit(date);
  }

  protected trackDay(_index: number, day: CalendarDay): string {
    return day.date.toISOString();
  }

  protected getDayClasses(day: CalendarDay): string {
    const baseClasses =
      'inline-flex items-center justify-center rounded text-xs h-7 w-7 p-0 font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1';

    return cn(
      baseClasses,
      !day.isCurrentMonth && 'text-muted-foreground/50',
      day.isCurrentMonth &&
        !day.isSelected &&
        !day.isToday &&
        'hover:bg-accent hover:text-accent-foreground',
      day.isToday && !day.isSelected && 'bg-accent text-accent-foreground',
      day.isSelected &&
        'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
      day.isDisabled && 'opacity-50 cursor-not-allowed',
    );
  }

  private generateCalendarDays(): CalendarDay[] {
    const year = this.year();
    const month = this.month();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      days.push(this.createCalendarDay(date, false, today));
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(this.createCalendarDay(date, true, today));
    }

    // Next month days (fill to complete 6 rows = 42 days)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push(this.createCalendarDay(date, false, today));
    }

    return days;
  }

  private createCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const selected = this.selectedDate();
    return {
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday: this.isSameDay(date, today),
      isSelected: selected ? this.isSameDay(date, selected) : false,
      isDisabled: this.isDateDisabled(date),
    };
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private isDateDisabled(date: Date): boolean {
    const minDate = this.minDate();
    const maxDate = this.maxDate();
    const disabledDates = this.disabledDates();

    // Compara por início do dia: minDate/maxDate podem vir com hora (ex.: new Date()),
    // o que desabilitaria indevidamente o próprio dia de hoje.
    if (minDate && date < this.startOfDay(minDate)) return true;
    if (maxDate && date > this.startOfDay(maxDate)) return true;
    if (disabledDates.some((d) => this.isSameDay(date, d))) return true;

    return false;
  }

  private startOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private formatDateToISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
