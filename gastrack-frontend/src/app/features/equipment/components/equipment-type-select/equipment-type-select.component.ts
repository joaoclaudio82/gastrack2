import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EquipmentTypeService } from '@core/services/equipment-type.service';
import {
  ComboboxComponent,
  type ComboboxOption,
} from '@shared/components/ui/combobox/combobox.component';

@Component({
  selector: 'app-equipment-type-select',
  standalone: true,
  imports: [FormsModule, ComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquipmentTypeSelectComponent),
      multi: true,
    },
  ],
  template: `
    <app-combobox
      [label]="label()"
      [placeholder]="placeholder()"
      [hint]="hint()"
      [error]="error()"
      [disabledInput]="disabled()"
      [required]="required()"
      [clearable]="clearable()"
      [options]="options()"
      [loading]="equipmentTypeService.isLoading()"
      [filterLocally]="false"
      [class]="class()"
      emptyMessage="Nenhum tipo encontrado"
      (searchChange)="onSearch($event)"
      (valueChange)="onValueChange($event)"
      (cleared)="onCleared()"
      [ngModel]="value()"
    />
  `,
})
export class EquipmentTypeSelectComponent implements ControlValueAccessor {
  readonly equipmentTypeService = inject(EquipmentTypeService);

  readonly label = input<string>('Tipo de Equipamento');
  readonly placeholder = input<string>('Buscar tipo...');
  readonly hint = input<string>('');
  readonly error = input<string>('');
  readonly disabledInput = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly clearable = input<boolean>(true);
  readonly class = input<string>('');

  readonly valueChange = output<number | null>();
  readonly cleared = output();

  protected readonly value = signal<number | null>(null);
  private readonly disabledFromForm = signal(false);

  protected readonly disabled = computed(() => this.disabledInput() || this.disabledFromForm());

  protected readonly options = computed<ComboboxOption[]>(() => {
    return this.equipmentTypeService.typeOptions().map((opt) => ({
      label: opt.label,
      value: opt.value,
    }));
  });

  private searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Carrega as opções uma vez na montagem. untracked: getActive lê activeTypesSignal
    // (check de cache); sem isso o effect rastreava esse signal e re-executava ao carregar.
    effect(() => {
      untracked(() => {
        this.equipmentTypeService.getActive();
      });
    });
  }

  writeValue(value: number | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledFromForm.set(isDisabled);
  }

  protected onSearch(query: string): void {
    // Debounce search requests
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout);
    }

    this.searchDebounceTimeout = setTimeout(() => {
      this.equipmentTypeService.getActive(query.trim() || undefined);
    }, 300);
  }

  protected onValueChange(value: string | number | null): void {
    const numValue = value !== null ? Number(value) : null;
    this.value.set(numValue);
    this.onChange(numValue);
    this.valueChange.emit(numValue);
    this.onTouched();
  }

  protected onCleared(): void {
    this.cleared.emit();
  }
}
