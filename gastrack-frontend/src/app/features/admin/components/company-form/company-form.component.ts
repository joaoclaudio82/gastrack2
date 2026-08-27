import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddressService } from '@core/services/address.service';
import { GeographicService } from '@core/services/geographic.service';
import type { Address, AddressRequest } from '@models/address.model';
import type { Company, CompanyRequest } from '@models/company.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import {
  cnpj,
  optionalAddressGroup,
  phoneNumber,
  strictEmail,
} from '@shared/validators/custom-validators';
import { AddressFieldsComponent } from '../address-fields/address-fields.component';

export interface CompanyFormSubmitPayload {
  company: CompanyRequest;
  addresses: ({ id?: number } & Partial<AddressRequest>)[];
  removedAddressIds: number[];
}

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    ButtonComponent,
    AddressFieldsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (useModal()) {
      <app-modal [isOpen]="isOpen()" [title]="resolvedTitle()" size="lg" (closed)="onClose()">
        <ng-container [ngTemplateOutlet]="formTemplate" />

        <ng-container modal-footer>
          <app-button variant="outline" (buttonClick)="onClose()">Cancelar</app-button>
          <app-button
            variant="primary"
            [loading]="isLoading()"
            [disabled]="form.invalid"
            (buttonClick)="onSubmit()"
          >
            {{ resolvedSubmitLabel() }}
          </app-button>
        </ng-container>
      </app-modal>
    } @else {
      <ng-container [ngTemplateOutlet]="formTemplate" />
    }

    <ng-template #formTemplate>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-foreground">Dados da Empresa</h3>
          <app-input
            label="Nome da Empresa"
            placeholder="Nome da empresa"
            formControlName="name"
            [required]="true"
            [error]="getFieldError('name')"
          />

          <app-input
            label="Slug (URL)"
            placeholder="nome-da-empresa"
            formControlName="slug"
            [required]="true"
            hint="Identificador único usado em URLs (apenas letras minúsculas, números e hífens)"
            [error]="getFieldError('slug')"
          />

          <app-input
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            formControlName="cnpj"
            [required]="true"
            [error]="getFieldError('cnpj')"
          />

          <app-input
            label="Telefone"
            type="tel"
            placeholder="(00) 0000-0000"
            formControlName="phone"
            [error]="getFieldError('phone')"
          />

          <app-input
            label="Email"
            type="email"
            placeholder="contato@empresa.com"
            formControlName="email"
            [error]="getFieldError('email')"
          />
        </div>

        @if (showAddresses()) {
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium text-foreground">Endereços</h3>
              <app-button type="button" variant="outline" size="sm" (buttonClick)="addAddress()">
                Adicionar endereço
              </app-button>
            </div>

            <div formArrayName="addresses" class="space-y-4">
              @for (addr of addresses.controls; track $index) {
                <div [formGroupName]="$index">
                  <app-address-fields
                    [index]="$index"
                    [showRemoveButton]="addresses.length > 1"
                    (remove)="removeAddress($index)"
                  />
                </div>
              }
              @if (addresses.length === 0) {
                <p class="text-sm text-muted-foreground py-2">
                  Nenhum endereço adicionado. Clique em "Adicionar endereço" para incluir.
                </p>
              }
            </div>
          </div>
        }

        @if (!useModal()) {
          <div class="flex justify-end">
            <app-button
              variant="primary"
              type="submit"
              [loading]="isLoading()"
              [disabled]="form.invalid"
            >
              {{ resolvedSubmitLabel() }}
            </app-button>
          </div>
        }
      </form>
    </ng-template>
  `,
})
export class CompanyFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly addressService = inject(AddressService);
  private readonly geoService = inject(GeographicService);

  readonly isOpen = input(true);
  readonly company = input<Company | null>(null);
  readonly isLoading = input<boolean>(false);
  readonly useModal = input(true);
  readonly showAddresses = input(true);
  readonly title = input<string | null>(null);
  readonly submitLabel = input<string | null>(null);

  readonly submitted = output<CompanyFormSubmitPayload>();
  readonly closed = output();

  private readonly removedAddressIds = signal<number[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    cnpj: ['', [Validators.required, cnpj()]],
    phone: ['', [phoneNumber()]],
    email: ['', [strictEmail()]],
    addresses: this.fb.array<FormGroup>([]),
  });

  get addresses(): FormArray {
    return this.form.get('addresses') as FormArray;
  }

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const company = this.company();
      const showAddresses = this.showAddresses();

      if (isOpen) {
        if (company) {
          this.populateForm(company);
          if (showAddresses) {
            this.geoService.getStatesByCountry(1);
            this.loadAddresses(company);
          } else {
            this.resetAddresses();
          }
        } else {
          this.form.reset();
          this.resetAddresses();
          if (showAddresses) {
            this.geoService.getStatesByCountry(1);
          }
        }
      }
    });

    this.form.get('name')?.valueChanges.subscribe((name) => {
      if (!this.company() && name) {
        const slug = this.generateSlug(name);
        this.form.patchValue({ slug }, { emitEvent: false });
      }
    });
  }

  private loadAddresses(company: Company): void {
    this.removedAddressIds.set([]);
    const companyId = Number(company.id);
    this.addressService.getAddressesByCompany(companyId).subscribe({
      next: (addresses) => {
        this.addresses.clear();
        for (const addr of addresses) {
          this.addresses.push(this.createAddressGroup(addr));
        }
        if (this.addresses.length === 0) {
          this.addAddress();
        }
      },
      error: () => {
        this.addresses.clear();
        this.addAddress();
      },
    });
  }

  private createAddressGroup(addr?: Address): FormGroup {
    const group = this.fb.group(
      {
        id: [addr?.id ?? undefined],
        name: [addr?.name ?? ''],
        street: [addr?.street ?? ''],
        number: [addr?.number ?? ''],
        complement: [addr?.complement ?? ''],
        neighborhood: [addr?.neighborhood ?? ''],
        stateId: [addr?.stateId ?? (null as number | null)],
        cityId: [addr?.cityId ?? (null as number | null)],
        zipCode: [addr?.zipCode ?? ''],
      },
      { validators: [optionalAddressGroup()] },
    );
    if (addr?.stateId) {
      this.geoService.getCitiesByState(addr.stateId);
    }
    return group;
  }

  private createEmptyAddressGroup(): FormGroup {
    return this.createAddressGroup();
  }

  addAddress(): void {
    this.addresses.push(this.createEmptyAddressGroup());
  }

  removeAddress(index: number): void {
    const group = this.addresses.at(index) as FormGroup;
    const id = group?.get('id')?.value as number | undefined;
    if (id != null) {
      this.removedAddressIds.update((ids) => [...ids, id]);
    }
    this.addresses.removeAt(index);
  }

  private resetAddresses(): void {
    this.addresses.clear();
    this.removedAddressIds.set([]);
  }

  private populateForm(company: Company): void {
    this.form.patchValue({
      name: company.name,
      slug: company.slug,
      cnpj: company.cnpj ?? '',
      phone: company.phone ?? '',
      email: company.email ?? '',
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  resolvedTitle(): string {
    return this.title() ?? (this.company() ? 'Editar Empresa' : 'Nova Empresa');
  }

  resolvedSubmitLabel(): string {
    return this.submitLabel() ?? (this.company() ? 'Salvar' : 'Criar Empresa');
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['minlength']) return 'Mínimo de 2 caracteres';
    if (control.errors['pattern']) return 'Use apenas letras minúsculas, números e hífens';
    if (control.errors['cnpj']) return 'CNPJ inválido';
    if (control.errors['phoneNumber']) return 'Telefone inválido';
    if (control.errors['email'] || control.errors['strictEmail'])
      return 'Email inválido (ex: usuario@dominio.com)';

    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const trimmedEmail = formValue.email.trim();
    const companyRequest: CompanyRequest = {
      name: formValue.name,
      slug: formValue.slug,
      cnpj: formValue.cnpj,
      phone: formValue.phone?.trim() || undefined,
      email: trimmedEmail || undefined,
    };

    const addressPayloads: ({ id?: number } & Partial<AddressRequest>)[] = [];
    for (const ctrl of this.addresses.controls) {
      const g = ctrl as FormGroup;
      const v = g.getRawValue();
      addressPayloads.push({
        id: v.id,
        name: v.name,
        street: v.street,
        number: v.number ?? undefined,
        complement: v.complement ?? undefined,
        neighborhood: v.neighborhood ?? undefined,
        cityId: v.cityId,
        zipCode: v.zipCode,
      });
    }

    this.submitted.emit({
      company: companyRequest,
      addresses: addressPayloads,
      removedAddressIds: this.removedAddressIds(),
    });
  }

  onClose(): void {
    this.form.reset({ addresses: this.fb.array([]) });
    this.removedAddressIds.set([]);
    this.geoService.clearCities();
    this.closed.emit();
  }
}
