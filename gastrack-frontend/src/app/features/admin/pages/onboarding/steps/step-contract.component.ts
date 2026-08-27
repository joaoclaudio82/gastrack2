import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { AddressService } from '@core/services/address.service';
import { ContractService } from '@core/services/contract.service';
import { NotificationService } from '@core/services/notification.service';
import type { Contract, ContractRequest } from '@models/contract.model';
import {
  CONTRACT_STATUS,
  CONTRACT_STATUS_LABELS,
  withAllowedAddress,
} from '@models/contract.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { catchError, type Observable, of, switchMap, tap } from 'rxjs';
import { ContractFormComponent } from '../../../../equipment/components/contract-form/contract-form.component';
import { OnboardingStateService } from '../onboarding-state.service';

@Component({
  selector: 'app-onboarding-step-contract',
  standalone: true,
  imports: [DatePipe, ButtonComponent, ContractFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Contrato</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Selecione um contrato ou crie um novo para a empresa
        <span class="font-medium">{{ companyName() }}</span>
        .
      </p>
    </div>
    <div class="px-8 py-6 space-y-6">
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
        <div class="space-y-3 max-h-80 overflow-y-auto">
          @for (contract of contracts(); track contract.id) {
            <label
              class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              [class.border-blue-500]="selectedId() === contract.id"
              [class.bg-blue-50]="selectedId() === contract.id"
            >
              <input
                type="radio"
                [checked]="selectedId() === contract.id"
                (change)="selectContract(contract)"
                class="text-blue-500"
              />
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <p class="font-medium text-gray-900">{{ contract.contractNumber }}</p>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full font-medium"
                    [class]="getStatusClasses(contract.status)"
                  >
                    {{ getStatusLabel(contract.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-500">
                  {{ contract.startDate | date: 'dd/MM/yyyy' }} -
                  {{ contract.endDate ? (contract.endDate | date: 'dd/MM/yyyy') : 'Sem prazo' }}
                  &middot; Kits: {{ contract.activeKitsCount }}/{{ contract.kitQuantity }}
                  @if (contract.remainingKitCapacity > 0) {
                    &middot;
                    <span class="text-green-600">{{ contract.remainingKitCapacity }} vaga(s)</span>
                  } @else {
                    &middot;
                    <span class="text-red-500">Sem vagas</span>
                  }
                </p>
              </div>
            </label>
          } @empty {
            <p class="text-sm text-gray-500 text-center py-4">
              Nenhum contrato encontrado para esta empresa.
            </p>
          }
        </div>

        @if (selectedId()) {
          @if (isDraftSelected()) {
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [checked]="activateOnSelect()"
                  (change)="activateOnSelect.set(!activateOnSelect())"
                  class="rounded text-blue-500"
                />
                <span class="text-sm text-amber-800">
                  Ativar este contrato agora (necessario para criar kits)
                </span>
              </label>
            </div>
          }
          <app-button variant="primary" [loading]="submitting()" (buttonClick)="confirmSelection()">
            {{
              isDraftSelected() && activateOnSelect() ? 'Ativar e Avancar' : 'Confirmar e Avancar'
            }}
          </app-button>
        }
      } @else {
        <app-contract-form
          [isOpen]="true"
          [useModal]="false"
          [preselectedCompanyId]="companyId()"
          [preselectedCompanyName]="companyName()"
          [isLoading]="submitting()"
          [submitLabel]="'Criar Contrato e Avançar'"
          (submitted)="createContract($event)"
        />
      }
    </div>
  `,
})
export class StepContractComponent implements OnInit {
  private readonly wizardState = inject(OnboardingStateService);
  private readonly contractService = inject(ContractService);
  private readonly addressService = inject(AddressService);
  private readonly notification = inject(NotificationService);

  readonly completed = output();

  readonly mode = signal<'existing' | 'new'>('existing');
  readonly selectedId = signal<number | null>(null);
  readonly submitting = signal(false);
  readonly activateOnSelect = signal(true);

  private readonly selectedContract = signal<Contract | null>(null);

  readonly companyId = computed(() => {
    const companyId = this.wizardState.company()?.id;
    return companyId ? Number(companyId) : null;
  });
  readonly companyName = computed(() => this.wizardState.company()?.name ?? '');

  readonly contracts = computed(() => this.contractService.contracts());

  readonly isDraftSelected = computed(() => {
    const contract = this.selectedContract();
    return contract?.status === CONTRACT_STATUS.DRAFT;
  });

  ngOnInit(): void {
    const companyId = this.companyId();
    if (companyId) {
      this.contractService.getByCompany(companyId);
      this.addressService.getByCompany(companyId);
    }
    const existing = this.wizardState.contract();
    if (existing) {
      this.selectedId.set(existing.id);
      this.selectedContract.set(existing);
    }
  }

  selectContract(contract: Contract): void {
    this.selectedId.set(contract.id);
    this.selectedContract.set(contract);
  }

  confirmSelection(): void {
    const contract = this.selectedContract();
    if (!contract) return;

    if (this.isDraftSelected() && this.activateOnSelect()) {
      this.submitting.set(true);
      this.contractService.updateStatus(contract.id, { status: CONTRACT_STATUS.ACTIVE }).subscribe({
        next: (activated) => {
          this.notification.success('Contrato ativado com sucesso!');
          this.finalizeContract(activated);
        },
        error: () => {
          // A causa real da API é exibida pelo errorInterceptor.
          this.submitting.set(false);
        },
      });
    } else {
      this.finalizeContract(contract);
    }
  }

  createContract(request: ContractRequest): void {
    this.submitting.set(true);
    this.contractService
      .create(request)
      .pipe(
        switchMap((contract) =>
          contract.status === CONTRACT_STATUS.DRAFT
            ? this.contractService
                .updateStatus(contract.id, { status: CONTRACT_STATUS.ACTIVE })
                .pipe(catchError(() => of(contract)))
            : of(contract),
        ),
      )
      .subscribe({
        next: (contract) => {
          this.notification.success('Contrato criado com sucesso!');
          this.finalizeContract(contract);
        },
        error: () => {
          // A causa real da API é exibida pelo errorInterceptor.
          this.submitting.set(false);
        },
      });
  }

  /**
   * Finaliza a seleção/criação do contrato garantindo que o endereço escolhido no passo
   * anterior esteja habilitado no contrato antes de avançar. Em caso de falha ao habilitar,
   * mantém o usuário neste passo (a causa real é exibida pelo errorInterceptor).
   */
  private finalizeContract(contract: Contract): void {
    this.submitting.set(true);
    this.ensureAddressEnabled(contract).subscribe({
      next: (resolved) => {
        this.submitting.set(false);
        this.wizardState.setContract(resolved);
        this.completed.emit();
      },
      error: () => {
        this.submitting.set(false);
      },
    });
  }

  /**
   * Garante que o `selectedAddress` do wizard esteja em `allowedAddressIds` do contrato.
   * Se já estiver (ou não houver endereço selecionado), segue sem chamada extra. Caso
   * contrário, habilita o endereço no contrato (PUT) e emite o contrato atualizado.
   */
  private ensureAddressEnabled(contract: Contract): Observable<Contract> {
    const address = this.wizardState.selectedAddress();
    if (!address || contract.allowedAddressIds.includes(address.id)) {
      return of(contract);
    }
    return this.contractService
      .updateAddresses(contract.id, {
        addressIds: withAllowedAddress(contract.allowedAddressIds, address.id),
      })
      .pipe(
        tap(() => {
          this.notification.success(`Endereço "${address.name}" habilitado no contrato.`);
        }),
      );
  }

  protected getStatusLabel(status: string): string {
    return CONTRACT_STATUS_LABELS[status as keyof typeof CONTRACT_STATUS_LABELS] ?? status;
  }

  protected getStatusClasses(status: string): string {
    switch (status) {
      case CONTRACT_STATUS.ACTIVE:
        return 'bg-green-100 text-green-700';
      case CONTRACT_STATUS.DRAFT:
        return 'bg-gray-100 text-gray-600';
      case CONTRACT_STATUS.SUSPENDED:
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  }
}
