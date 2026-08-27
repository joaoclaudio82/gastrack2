import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { AddressService } from '@core/services/address.service';
import { NotificationService } from '@core/services/notification.service';
import type { Address, AddressRequest } from '@models/address.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { AddressFormComponent } from '../../../components/address-form/address-form.component';
import { OnboardingStateService } from '../onboarding-state.service';

@Component({
  selector: 'app-onboarding-step-address',
  standalone: true,
  imports: [ButtonComponent, AddressFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Endereco</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Selecione ou crie um endereco para a empresa
        <span class="font-medium">{{ companyName() }}</span>
        .
      </p>
    </div>
    <div class="px-8 py-6 space-y-6">
      <!-- Toggle buttons -->
      <div class="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          (click)="mode.set('existing')"
          [class]="
            mode() === 'existing'
              ? 'px-4 py-2 text-sm font-medium rounded-md bg-white shadow-sm text-gray-900'
              : 'px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700'
          "
        >
          Selecionar existente
        </button>
        <button
          (click)="mode.set('new')"
          [class]="
            mode() === 'new'
              ? 'px-4 py-2 text-sm font-medium rounded-md bg-white shadow-sm text-gray-900'
              : 'px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700'
          "
        >
          Criar novo
        </button>
      </div>

      @if (mode() === 'existing') {
        <!-- Address list -->
        <div class="space-y-3 max-h-80 overflow-y-auto">
          @for (address of addresses(); track address.id) {
            <label
              class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              [class.border-blue-500]="selectedId() === address.id"
              [class.bg-blue-50]="selectedId() === address.id"
            >
              <input
                type="radio"
                [checked]="selectedId() === address.id"
                (change)="selectAddress(address)"
                class="text-blue-500"
              />
              <div class="flex-1">
                <p class="font-medium text-gray-900">{{ address.name }}</p>
                <p class="text-sm text-gray-500">{{ address.fullAddress }}</p>
              </div>
            </label>
          } @empty {
            <p class="text-sm text-gray-500 text-center py-4">
              Nenhum endereco encontrado para esta empresa.
            </p>
          }
        </div>

        @if (selectedId()) {
          <app-button variant="primary" (buttonClick)="confirmSelection()">
            Confirmar e Avancar
          </app-button>
        }
      } @else {
        <app-address-form
          [isOpen]="true"
          [useModal]="false"
          [showContracts]="false"
          [preselectedCompanyId]="companyId()"
          [preselectedCompanyName]="companyName()"
          [isLoading]="submitting()"
          [title]="'Novo Endereço'"
          [submitLabel]="'Criar Endereço e Avançar'"
          (submitted)="createAddress($event)"
        />
      }
    </div>
  `,
})
export class StepAddressComponent implements OnInit {
  private readonly wizardState = inject(OnboardingStateService);
  private readonly addressService = inject(AddressService);
  private readonly notification = inject(NotificationService);

  readonly completed = output();

  readonly mode = signal<'existing' | 'new'>('existing');
  readonly selectedId = signal<number | null>(null);
  readonly submitting = signal(false);

  private readonly selectedAddress = signal<Address | null>(null);

  readonly companyId = computed(() => {
    const companyId = this.wizardState.company()?.id;
    return companyId ? Number(companyId) : null;
  });
  readonly companyName = computed(() => this.wizardState.company()?.name ?? '');

  readonly addresses = computed(() => this.addressService.companyAddresses());

  constructor() {
    effect(() => {
      this.wizardState.setAddresses(this.addressService.companyAddresses());
    });
  }

  ngOnInit(): void {
    const companyId = this.companyId();
    if (companyId) {
      this.addressService.getByCompany(companyId);
    }
    const existing = this.wizardState.selectedAddress();
    if (existing) {
      this.selectedId.set(existing.id);
      this.selectedAddress.set(existing);
    }
  }

  selectAddress(address: Address): void {
    this.selectedId.set(address.id);
    this.selectedAddress.set(address);
  }

  confirmSelection(): void {
    const address = this.selectedAddress();
    if (address) {
      this.wizardState.setSelectedAddress(address);
      this.completed.emit();
    }
  }

  createAddress(request: AddressRequest): void {
    const companyId = this.companyId();
    if (!companyId) return;
    this.submitting.set(true);
    this.addressService.create({ ...request, companyId }).subscribe({
      next: (address) => {
        this.submitting.set(false);
        this.notification.success('Endereço criado com sucesso!');
        this.addressService.getByCompany(companyId);
        this.wizardState.setAddresses([...this.addresses(), address]);
        this.wizardState.setSelectedAddress(address);
        this.completed.emit();
      },
      error: () => {
        // A causa real da API é exibida pelo errorInterceptor.
        this.submitting.set(false);
      },
    });
  }
}
