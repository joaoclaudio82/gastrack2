import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn, cva, type VariantProps } from '@shared/lib';
import { generateId } from '@shared/utils/uuid';

const textareaVariants = cva(
  'flex w-full rounded-sm border bg-background text-foreground shadow-sm transition-all duration-150 placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary resize-y',
  {
    variants: {
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-4 py-3 text-base',
      },
      state: {
        default: 'border-input hover:border-muted-foreground/50',
        error:
          'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
        disabled: 'cursor-not-allowed bg-muted text-muted-foreground opacity-50',
        readonly: 'cursor-default bg-muted/50',
      },
    },
    defaultVariants: {
      size: 'md',
      state: 'default',
    },
  },
);

type TextareaSize = NonNullable<VariantProps<typeof textareaVariants>['size']>;

@Component({
  selector: 'app-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label()) {
        <label class="text-sm font-medium text-foreground" [for]="textareaId()">
          {{ label() }}
          @if (required()) {
            <span class="ml-0.5 text-destructive" aria-label="required">*</span>
          }
        </label>
      }

      <textarea
        #textareaRef
        [id]="textareaId()"
        [rows]="rows()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [value]="value()"
        [attr.maxlength]="maxLength()"
        [attr.aria-invalid]="error() ? 'true' : 'false'"
        [attr.aria-describedby]="describedBy()"
        [class]="textareaClasses()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      ></textarea>

      <div class="flex items-center justify-between min-h-[18px]">
        <div class="flex-1">
          @if (error()) {
            <span
              [id]="textareaId() + '-error'"
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
            <span [id]="textareaId() + '-hint'" class="text-xs text-muted-foreground">
              {{ hint() }}
            </span>
          }
        </div>

        @if (showCount() && maxLength()) {
          <span [class]="countClasses()">{{ value().length }} / {{ maxLength() }}</span>
        }
      </div>
    </div>
  `,
})
export class TextareaComponent implements ControlValueAccessor, AfterViewInit {
  readonly label = input<string>('');
  readonly placeholder = input<string>('');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabledInput = input<boolean>(false);
  readonly readonly = input<boolean>(false);

  private readonly disabledFromForm = signal(false);
  protected readonly disabled = computed(() => this.disabledInput() || this.disabledFromForm());
  readonly required = input<boolean>(false);
  readonly rows = input<number>(3);
  readonly maxLength = input<number | null>(null);
  readonly autoResize = input<boolean>(false);
  readonly showCount = input<boolean>(false);
  readonly textareaId = input<string>(`textarea-${generateId()}`);
  readonly size = input<TextareaSize>('md');
  readonly class = input<string>('');

  readonly valueChange = output<string>();

  protected readonly value = signal<string>('');
  protected readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaRef');

  protected readonly textareaClasses = computed(() => {
    const state = this.error()
      ? 'error'
      : this.disabled()
        ? 'disabled'
        : this.readonly()
          ? 'readonly'
          : 'default';

    return cn(
      textareaVariants({ size: this.size(), state }),
      this.autoResize() && 'resize-none overflow-hidden',
      this.class(),
    );
  });

  protected readonly countClasses = computed(() => {
    const currentLength = this.value().length;
    const max = this.maxLength();

    if (max && currentLength >= max) {
      return 'text-xs text-destructive';
    } else if (max && currentLength >= max * 0.9) {
      return 'text-xs text-warning';
    }
    return 'text-xs text-muted-foreground';
  });

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.error()) {
      ids.push(`${this.textareaId()}-error`);
    } else if (this.hint()) {
      ids.push(`${this.textareaId()}-hint`);
    }
    return ids.length > 0 ? ids.join(' ') : null;
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    if (this.autoResize()) {
      this.adjustHeight();
    }
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
    if (this.autoResize()) {
      setTimeout(() => {
        this.adjustHeight();
      }, 0);
    }
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

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value.set(target.value);
    this.onChange(target.value);
    this.valueChange.emit(target.value);

    if (this.autoResize()) {
      this.adjustHeight();
    }
  }

  protected onBlur(): void {
    this.onTouched();
  }

  private adjustHeight(): void {
    const textarea = this.textareaRef()?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }
}
