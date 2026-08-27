import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CompanyService } from '@core/services/company.service';
import { NotificationService } from '@core/services/notification.service';
import type { Company } from '@models/company.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import {
  CompanyFormComponent,
  type CompanyFormSubmitPayload,
} from '../../../components/company-form/company-form.component';
import { OnboardingStateService } from '../onboarding-state.service';

@Component({
  selector: 'app-onboarding-step-company',
  standalone: true,
  imports: [InputComponent, ButtonComponent, CompanyFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Empresa</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Selecione uma empresa existente ou crie uma nova para iniciar o onboarding.
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
          Criar nova
        </button>
      </div>

      @if (mode() === 'existing') {
        <!-- Search -->
        <app-input
          label="Buscar empresa"
          placeholder="Digite o nome ou CNPJ..."
          type="search"
          (valueChange)="searchQuery.set($event)"
        />

        <!-- Company list -->
        <div class="space-y-3 max-h-80 overflow-y-auto">
          @for (company of filteredCompanies(); track company.id) {
            <label
              class="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              [class.border-blue-500]="selectedId() === company.id"
              [class.bg-blue-50]="selectedId() === company.id"
            >
              <input
                type="radio"
                [checked]="selectedId() === company.id"
                (change)="selectCompany(company)"
                class="text-blue-500"
              />
              <div class="flex-1">
                <p class="font-medium text-gray-900">{{ company.name }}</p>
                <p class="text-sm text-gray-500">
                  {{ company.cnpj || 'Sem CNPJ' }} &middot; {{ company.slug }}
                  @if (!company.active) {
                    &middot;
                    <span class="text-red-500">Inativa</span>
                  }
                </p>
              </div>
            </label>
          } @empty {
            <p class="text-sm text-gray-500 text-center py-4">Nenhuma empresa encontrada.</p>
          }
        </div>

        @if (selectedId()) {
          <app-button variant="primary" (buttonClick)="confirmSelection()">
            Confirmar e Avancar
          </app-button>
        }
      } @else {
        <app-company-form
          [isOpen]="true"
          [useModal]="false"
          [showAddresses]="false"
          [isLoading]="submitting()"
          [title]="'Nova Empresa'"
          [submitLabel]="'Criar Empresa e Avançar'"
          (submitted)="createCompany($event)"
        />
      }
    </div>
  `,
})
export class StepCompanyComponent implements OnInit {
  private readonly wizardState = inject(OnboardingStateService);
  private readonly companyService = inject(CompanyService);
  private readonly notification = inject(NotificationService);

  readonly completed = output();

  readonly mode = signal<'existing' | 'new'>('existing');
  readonly searchQuery = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly submitting = signal(false);

  private readonly selectedCompany = signal<Company | null>(null);

  readonly filteredCompanies = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const companies = this.companyService.companies();
    if (!query) return companies;
    return companies.filter(
      (c) => c.name.toLowerCase().includes(query) || c.cnpj?.toLowerCase().includes(query),
    );
  });

  ngOnInit(): void {
    this.companyService.getAll({ page: 1, pageSize: 100 });
    const existing = this.wizardState.company();
    if (existing) {
      this.selectedId.set(existing.id);
      this.selectedCompany.set(existing);
    }
  }

  selectCompany(company: Company): void {
    this.selectedId.set(company.id);
    this.selectedCompany.set(company);
  }

  confirmSelection(): void {
    const company = this.selectedCompany();
    if (company) {
      this.wizardState.setCompany(company);
      this.completed.emit();
    }
  }

  createCompany(payload: CompanyFormSubmitPayload): void {
    this.submitting.set(true);
    this.companyService.create(payload.company).subscribe({
      next: (company) => {
        this.submitting.set(false);
        this.notification.success('Empresa criada com sucesso!');
        this.wizardState.setCompany(company);
        this.completed.emit();
      },
      error: () => {
        // A causa real da API é exibida pelo errorInterceptor.
        this.submitting.set(false);
      },
    });
  }
}
