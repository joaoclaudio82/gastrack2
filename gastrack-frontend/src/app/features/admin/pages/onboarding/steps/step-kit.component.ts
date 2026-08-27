import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { EquipmentKitService } from '@core/services/equipment-kit.service';
import { NotificationService } from '@core/services/notification.service';
import type { EquipmentKit, EquipmentKitRequest } from '@models/equipment-kit.model';
import { KIT_STATUS } from '@models/equipment-kit.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { KitFormComponent } from '../../../../equipment/components/kit-form/kit-form.component';
import { OnboardingStateService } from '../onboarding-state.service';

@Component({
  selector: 'app-onboarding-step-kit',
  standalone: true,
  imports: [ButtonComponent, KitFormComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Kit de Equipamento</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Contrato
        <span class="font-medium">{{ contractNumber() }}</span>
        @if (remainingCapacity() !== null) {
          &middot;
          @if (remainingCapacity()! > 0) {
            <span class="text-green-600">{{ remainingCapacity() }} vaga(s) restante(s)</span>
          } @else {
            <span class="text-amber-600">
              cota de kits deste contrato já utilizada — selecione o kit existente para continuar
            </span>
          }
        }
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
          [disabled]="remainingCapacity() === 0"
          [title]="remainingCapacity() === 0 ? 'Cota de kits deste contrato esgotada' : ''"
          [class]="
            mode() === 'new'
              ? 'px-4 py-2 text-sm font-medium rounded-md bg-white shadow-sm text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'
              : 'px-4 py-2 text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500'
          "
        >
          Criar novo
        </button>
      </div>

      @if (mode() === 'existing') {
        <!-- Kit list (PENDING only) -->
        <div class="space-y-3 max-h-80 overflow-y-auto">
          @for (kit of pendingKits(); track kit.id) {
            <label
              class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              [class.border-blue-500]="selectedId() === kit.id"
              [class.bg-blue-50]="selectedId() === kit.id"
            >
              <input
                type="radio"
                [checked]="selectedId() === kit.id"
                (change)="selectKit(kit)"
                class="text-blue-500"
              />
              <div class="flex-1">
                <p class="font-medium text-gray-900">{{ kit.kitCode }}</p>
                <p class="text-sm text-gray-500">
                  Endereco: {{ kit.addressName || 'Nao atribuido' }}
                  @if (kit.notes) {
                    &middot; {{ kit.notes }}
                  }
                </p>
              </div>
            </label>
          } @empty {
            <div class="py-6 text-center space-y-3">
              <p class="text-sm text-gray-500">
                Este contrato não tem kits
                <span class="font-medium">pendentes</span>
                .
                <br />
                Kits que já foram instalados não aparecem nesta tela de onboarding.
              </p>
              <a
                routerLink="/equipment/kits"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Ver todos os kits do contrato
                <svg
                  class="ml-1 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          }
        </div>

        @if (selectedId()) {
          <app-button variant="primary" (buttonClick)="confirmSelection()">
            Confirmar e Avancar
          </app-button>
        }
      } @else {
        <app-kit-form
          [isOpen]="true"
          [useModal]="false"
          [preselectedCompanyId]="companyId()"
          [preselectedCompanyName]="companyName()"
          [preselectedContractId]="contractId()"
          [preselectedAddressId]="addressId()"
          [allowCreateAddress]="false"
          [isLoading]="submitting()"
          [submitLabel]="'Criar Kit e Avançar'"
          (submitted)="createKit($event)"
        />
      }
    </div>
  `,
})
export class StepKitComponent implements OnInit {
  private readonly wizardState = inject(OnboardingStateService);
  private readonly kitService = inject(EquipmentKitService);
  private readonly notification = inject(NotificationService);

  readonly completed = output();

  readonly mode = signal<'existing' | 'new'>('existing');
  readonly selectedId = signal<number | null>(null);
  readonly submitting = signal(false);

  private readonly selectedKit = signal<EquipmentKit | null>(null);

  readonly companyId = computed(() => {
    const companyId = this.wizardState.company()?.id;
    return companyId ? Number(companyId) : null;
  });
  readonly companyName = computed(() => this.wizardState.company()?.name ?? '');
  readonly contractId = computed(() => this.wizardState.contract()?.id ?? null);
  readonly contractNumber = computed(() => this.wizardState.contract()?.contractNumber ?? '');
  readonly addressId = computed(() => this.wizardState.selectedAddress()?.id ?? null);

  readonly remainingCapacity = computed(() => {
    const contract = this.wizardState.contract();
    if (!contract) return null;
    return contract.remainingKitCapacity;
  });

  readonly pendingKits = computed(() => {
    const contractId = this.wizardState.contract()?.id;
    return this.kitService
      .kits()
      .filter((k) => k.status === KIT_STATUS.PENDING && k.contractId === contractId);
  });

  ngOnInit(): void {
    const contract = this.wizardState.contract();
    if (contract) {
      this.kitService.getByContract(contract.id, { page: 1, pageSize: 100 });
    }

    // Restore selection if user navigated back
    const existing = this.wizardState.kit();
    if (existing) {
      this.selectedId.set(existing.id);
      this.selectedKit.set(existing);
    }
  }

  selectKit(kit: EquipmentKit): void {
    this.selectedId.set(kit.id);
    this.selectedKit.set(kit);
  }

  confirmSelection(): void {
    const kit = this.selectedKit();
    if (kit) {
      this.wizardState.setKit(kit);
      this.completed.emit();
    }
  }

  createKit(request: EquipmentKitRequest): void {
    this.submitting.set(true);
    this.kitService.create(request).subscribe({
      next: (kit) => {
        this.submitting.set(false);
        this.notification.success('Kit criado com sucesso!');
        this.wizardState.setKit(kit);
        this.completed.emit();
      },
      error: () => {
        // A causa real da API é exibida pelo errorInterceptor.
        this.submitting.set(false);
      },
    });
  }
}
