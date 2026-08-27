import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { ControlContainer, ReactiveFormsModule } from '@angular/forms';
import { CepService } from '@core/services/cep.service';
import { GeographicService } from '@core/services/geographic.service';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent } from '@shared/components/ui/select/select.component';

@Component({
  selector: 'app-address-fields',
  standalone: true,
  imports: [ReactiveFormsModule, InputComponent, SelectComponent, ButtonComponent],
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],
  host: {
    class: 'block',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4 rounded-sm border border-border bg-muted/30 p-4">
      <app-input
        label="Nome do Endereço"
        placeholder="Ex: Matriz, Filial Centro, Depósito"
        formControlName="name"
        [required]="showRequiredLabels()"
        [error]="getFieldError('name')"
      />

      <app-input
        label="CEP"
        placeholder="00000-000"
        formControlName="zipCode"
        [required]="showRequiredLabels()"
        [error]="getFieldError('zipCode')"
        hint="Digite o CEP para preencher automaticamente Bairro, Rua, Cidade e Estado"
      />

      <div class="grid grid-cols-2 gap-4">
        <app-select
          label="Estado"
          placeholder="Selecione o estado"
          formControlName="stateId"
          [required]="showRequiredLabels()"
          [options]="geoService.stateOptions()"
          [error]="getFieldError('stateId')"
        />

        <app-select
          label="Cidade"
          placeholder="Selecione a cidade"
          formControlName="cityId"
          [required]="showRequiredLabels()"
          [options]="cityOptions()"
          [error]="getFieldError('cityId')"
        />
      </div>

      <app-input
        label="Bairro"
        placeholder="Preenchido automaticamente pelo CEP"
        formControlName="neighborhood"
        [error]="getFieldError('neighborhood')"
      />

      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2">
          <app-input
            label="Rua/Logradouro"
            placeholder="Preenchido automaticamente pelo CEP"
            formControlName="street"
            [required]="showRequiredLabels()"
            [error]="getFieldError('street')"
          />
        </div>

        <app-input
          label="Número"
          placeholder="Nº"
          formControlName="number"
          [error]="getFieldError('number')"
        />
      </div>

      <app-input
        label="Complemento"
        placeholder="Apto, Sala, Bloco..."
        formControlName="complement"
        [error]="getFieldError('complement')"
      />

      @if (showRemoveButton()) {
        <div class="pt-2">
          <app-button type="button" variant="outline" size="sm" (buttonClick)="remove.emit()">
            Remover endereço
          </app-button>
        </div>
      }
    </div>
  `,
})
export class AddressFieldsComponent implements OnInit {
  private readonly parentContainer = inject(ControlContainer);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly cepService = inject(CepService);
  readonly geoService = inject(GeographicService);

  readonly index = input.required<number>();
  readonly showRemoveButton = input<boolean>(true);
  readonly showRequiredLabels = input<boolean>(true);

  readonly remove = output();

  private readonly pendingCepCityName = signal<string | null>(null);
  private readonly stateIdSignal = signal<number | null>(null);
  private lastSearchedCep: string | null = null;

  private get formGroup() {
    return this.parentContainer.control;
  }

  readonly cityOptions = computed(() => {
    this.geoService.citiesLoadedForState();
    const stateId = this.stateIdSignal();
    return this.geoService.getCityOptionsForState(stateId);
  });

  constructor() {
    this.setupPendingCityEffect();
    this.setupCityOptionsEffect();
  }

  ngOnInit(): void {
    this.setupStateAndCityReactivity();
  }

  private setupStateAndCityReactivity(): void {
    const stateControl = this.formGroup?.get('stateId');
    if (!stateControl) return;

    stateControl.valueChanges.subscribe((stateId: number | null) => {
      this.stateIdSignal.set(stateId);
      const cityControl = this.formGroup?.get('cityId');
      if (stateId) {
        cityControl?.enable({ emitEvent: false });
        this.geoService.getCitiesByState(stateId);
        cityControl?.patchValue(null, { emitEvent: false });
      } else {
        cityControl?.disable({ emitEvent: false });
        cityControl?.patchValue(null, { emitEvent: false });
      }
    });

    const initialStateId = stateControl.value;
    if (initialStateId) {
      this.stateIdSignal.set(initialStateId);
      this.geoService.getCitiesByState(initialStateId);
    }

    this.formGroup?.get('zipCode')?.valueChanges.subscribe((value) => {
      const digitsOnly = String(value ?? '').replace(/\D/g, '');
      if (digitsOnly.length !== 8) {
        this.lastSearchedCep = null;
        return;
      }
      if (digitsOnly === this.lastSearchedCep) {
        return;
      }
      this.lastSearchedCep = digitsOnly;
      this.searchCep(digitsOnly);
    });

    this.formGroup?.get('cityId')?.disable({ emitEvent: false });
  }

  private setupCityOptionsEffect(): void {
    effect(() => {
      const loadedFor = this.geoService.citiesLoadedForState();
      const myStateId = this.stateIdSignal();
      if (loadedFor === myStateId && myStateId != null) {
        this.cdr.markForCheck();
      }
    });
  }

  private setupPendingCityEffect(): void {
    effect(() => {
      this.geoService.citiesLoadedForState();
      const pending = this.pendingCepCityName();
      if (!pending) return;

      const stateId = this.stateIdSignal();
      if (!stateId) return;

      const cities = this.geoService.getCityOptionsForState(stateId);
      if (cities.length === 0) return;

      const normalize = (value?: string | null) =>
        (value ?? '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();
      const normalizedPending = normalize(pending);
      const city = cities.find((c) => normalize(c.label).includes(normalizedPending));
      if (city) {
        this.formGroup?.get('cityId')?.patchValue(city.value, {
          emitEvent: false,
        });
        this.pendingCepCityName.set(null);
      }
    });
  }

  private searchCep(zipCodeValue?: string): void {
    const zipCode = zipCodeValue ?? this.formGroup?.get('zipCode')?.value ?? '';
    if (String(zipCode).replace(/\D/g, '').length !== 8) return;

    this.cepService.fetch(zipCode).subscribe((result) => {
      if (!result) return;

      const patch: Record<string, string> = {
        street: result.street,
        neighborhood: result.neighborhood,
        zipCode: result.zipCode,
      };
      if (result.complement) {
        patch['complement'] = result.complement;
      }
      this.formGroup?.patchValue(patch, { emitEvent: false });

      const states = this.geoService.states();
      const normalize = (value?: string | null) => (value ?? '').toUpperCase();
      const targetAbbreviation = normalize(result.stateAbbreviation);
      const state = states.find(
        (s) =>
          normalize(s.abbreviation) === targetAbbreviation ||
          normalize(s.code) === targetAbbreviation,
      );
      if (state) {
        this.formGroup?.patchValue({ stateId: state.id });
        this.geoService.getCitiesByState(state.id);
        this.pendingCepCityName.set(result.cityName);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.formGroup?.get(fieldName);
    const parent = this.formGroup;
    const parentError = parent?.errors?.['optionalAddressIncomplete'] as
      | { field: string }
      | undefined;

    if (parentError?.field === fieldName && (parent?.dirty || parent?.touched)) {
      if (fieldName === 'name') return 'Mínimo de 2 caracteres';
      if (fieldName === 'zipCode') return 'CEP inválido';
      return 'Campo obrigatório';
    }

    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['minlength']) return 'Mínimo de 2 caracteres';
    if (control.errors['cep']) return 'CEP inválido';

    return '';
  }
}
