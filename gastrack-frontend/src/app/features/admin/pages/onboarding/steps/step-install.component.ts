import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EquipmentKitService } from '@core/services/equipment-kit.service';
import { NotificationService } from '@core/services/notification.service';
import type { KitInstallRequest } from '@models/equipment-kit.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';
import { extractApiErrorMessage } from '@shared/utils';
import { OnboardingStateService } from '../onboarding-state.service';

@Component({
  selector: 'app-onboarding-step-install',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-8 py-6 border-b border-gray-100">
      <h2 class="text-xl font-semibold text-gray-900">Revisao e Instalacao</h2>
      <p class="text-sm text-muted-foreground mt-1">
        Revise todas as informacoes e confirme a instalacao do kit.
      </p>
    </div>

    <div class="px-8 py-6 space-y-6">
      <!-- Summary cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Company -->
        <div class="rounded-lg border border-border p-4">
          <div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Empresa
          </div>
          <div class="mt-1 text-sm font-semibold text-gray-900">
            {{ wizardState.company()?.name ?? '-' }}
          </div>
        </div>
        <!-- Contract -->
        <div class="rounded-lg border border-border p-4">
          <div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Contrato
          </div>
          <div class="mt-1 text-sm font-semibold text-gray-900">
            {{ wizardState.contract()?.contractNumber ?? '-' }}
          </div>
        </div>
        <!-- Kit -->
        <div class="rounded-lg border border-border p-4">
          <div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Kit</div>
          <div class="mt-1 text-sm font-semibold text-gray-900">
            {{ wizardState.kit()?.kitCode ?? '-' }}
          </div>
        </div>
        <!-- Gas Points -->
        <div class="rounded-lg border border-border p-4">
          <div class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pontos de Gas
          </div>
          <div class="mt-1 text-sm font-semibold text-gray-900">
            {{ wizardState.gasPoints().length }}
          </div>
        </div>
      </div>

      <!-- Equipment table -->
      <div class="space-y-3">
        <h3 class="text-sm font-medium text-gray-700">
          Equipamentos no kit ({{ totalEquipments() }})
        </h3>
        <div class="overflow-hidden rounded-lg border border-border">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-gray-50">
                <th
                  class="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Asset Tag
                </th>
                <th
                  class="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Tipo
                </th>
                <th
                  class="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Serial
                </th>
                <th
                  class="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Condicao
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (eq of allEquipments(); track eq.id) {
                <tr class="hover:bg-accent/50">
                  <td class="px-4 py-2.5 font-medium text-gray-900">{{ eq.assetTag }}</td>
                  <td class="px-4 py-2.5 text-muted-foreground">{{ eq.equipmentTypeName }}</td>
                  <td class="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {{ eq.serialNumber ?? '-' }}
                  </td>
                  <td class="px-4 py-2.5">
                    <span
                      class="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                    >
                      {{ eq.condition }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-6 text-center text-muted-foreground">
                    Nenhum equipamento no kit.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Installation config -->
      <div class="rounded-lg border border-border p-4 space-y-4">
        <h3 class="text-sm font-medium text-gray-700">Configuracao da instalacao</h3>

        <div class="grid gap-4 sm:grid-cols-2">
          <app-select
            label="Endereco de instalacao"
            placeholder="Selecione o endereco"
            [options]="addressOptions()"
            [formControl]="form.controls.addressId"
            [error]="
              form.controls.addressId.touched && form.controls.addressId.invalid
                ? 'Endereco e obrigatorio'
                : ''
            "
          />

          <app-input
            label="Data de instalacao"
            type="date"
            [formControl]="form.controls.installationDate"
            [error]="
              form.controls.installationDate.touched && form.controls.installationDate.invalid
                ? 'Data e obrigatoria'
                : ''
            "
          />
        </div>
      </div>

      <!-- Error message -->
      @if (installError()) {
        <div class="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <svg
            class="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p class="text-sm text-red-700">{{ installError() }}</p>
        </div>
      }

      <!-- Confirm button -->
      <div class="flex justify-end pt-2">
        <app-button
          [disabled]="form.invalid"
          [loading]="isInstalling()"
          (buttonClick)="confirmInstallation()"
        >
          Confirmar Instalacao
        </app-button>
      </div>
    </div>
  `,
})
export class StepInstallComponent implements OnInit {
  protected readonly wizardState = inject(OnboardingStateService);
  private readonly equipmentKitService = inject(EquipmentKitService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly completed = output();

  protected readonly isInstalling = signal(false);
  protected readonly installError = signal<string | null>(null);

  protected readonly form = new FormGroup({
    addressId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    installationDate: new FormControl(this.getTodayISO(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected readonly allEquipments = computed(() => [
    ...this.wizardState.esp32s(),
    ...this.wizardState.extraEquipments(),
  ]);

  protected readonly totalEquipments = computed(() => this.allEquipments().length);

  protected readonly addressOptions = computed<SelectOption[]>(() => {
    const addresses = this.wizardState.addresses();
    const contract = this.wizardState.contract();
    if (!contract || !addresses.length) return [];

    const allowedIds = new Set(contract.allowedAddressIds ?? contract.addressIds ?? []);
    const filtered =
      allowedIds.size > 0 ? addresses.filter((a) => allowedIds.has(a.id)) : addresses;

    return filtered.map((a) => ({
      label: `${a.name} - ${a.fullAddress}`,
      value: a.id,
    }));
  });

  ngOnInit(): void {
    // Pre-select the address if one was already selected
    const selectedAddress = this.wizardState.selectedAddress();
    if (selectedAddress) {
      this.form.controls.addressId.setValue(selectedAddress.id);
    }
  }

  protected confirmInstallation(): void {
    if (this.form.invalid) return;

    const kitId = this.wizardState.kit()?.id;
    if (!kitId) {
      this.notificationService.error('Kit não encontrado.');
      return;
    }

    const addressId = this.form.controls.addressId.value;
    if (addressId === null) return;
    const installationDate = this.form.controls.installationDate.value;

    const request: KitInstallRequest = {
      addressId,
      installationDate: installationDate || null,
    };

    this.isInstalling.set(true);
    this.installError.set(null);

    this.equipmentKitService
      .installKit(kitId, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isInstalling.set(false);
          this.notificationService.success('Kit instalado com sucesso!');
          this.completed.emit();
        },
        error: (err: unknown) => {
          this.isInstalling.set(false);
          // Exibe a causa real inline; o toast fica a cargo do errorInterceptor.
          this.installError.set(
            extractApiErrorMessage(err) ?? 'Erro ao instalar o kit. Tente novamente.',
          );
        },
      });
  }

  private getTodayISO(): string {
    return new Date().toISOString().split('T')[0] ?? '';
  }
}
