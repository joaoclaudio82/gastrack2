import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PermissionService } from '@core/auth/services/permission.service';
import { CompanyService } from '@core/services/company.service';
import type { CreateInvitationRequest, InvitationRole } from '@models/invitation.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { ComboboxComponent } from '@shared/components/ui/combobox/combobox.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { SelectComponent, type SelectOption } from '@shared/components/ui/select/select.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-invitation-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    InputComponent,
    SelectComponent,
    ComboboxComponent,
    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [isOpen]="isOpen()" [title]="'Convidar Usuário'" size="md" (closed)="onClose()">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <app-input
          label="Email"
          type="email"
          placeholder="email@exemplo.com"
          formControlName="email"
          [required]="true"
          [error]="getFieldError('email')"
        />

        <div class="grid grid-cols-2 gap-4">
          <app-input
            label="Nome"
            placeholder="Nome"
            formControlName="firstName"
            [error]="getFieldError('firstName')"
          />

          <app-input
            label="Sobrenome"
            placeholder="Sobrenome"
            formControlName="lastName"
            [error]="getFieldError('lastName')"
          />
        </div>

        <app-select
          label="Função"
          placeholder="Selecione uma função"
          formControlName="role"
          [required]="true"
          [options]="roleOptions"
          [error]="getFieldError('role')"
        />

        @if (isSuperAdmin()) {
          <app-combobox
            label="Empresa"
            placeholder="Buscar empresa..."
            formControlName="companyId"
            [options]="companySearchOptions()"
            [loading]="companyService.isSearching()"
            [filterLocally]="false"
            emptyMessage="Nenhuma empresa encontrada"
            (searchChange)="onCompanySearch($event)"
            [error]="getFieldError('companyId')"
          />
        }
      </form>

      <ng-container modal-footer>
        <app-button variant="outline" (buttonClick)="onClose()">Cancelar</app-button>
        <app-button
          variant="primary"
          [loading]="isLoading()"
          [disabled]="form.invalid"
          (buttonClick)="onSubmit()"
        >
          Enviar Convite
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class InvitationFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly permissionService = inject(PermissionService);
  readonly companyService = inject(CompanyService);
  private readonly searchSubject = new Subject<string>();

  readonly isOpen = input.required<boolean>();
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<CreateInvitationRequest>();
  readonly closed = output();

  readonly isSuperAdmin = this.permissionService.isSuperAdmin;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
    role: ['USER' as InvitationRole, [Validators.required]],
    companyId: [''],
  });

  readonly roleOptions: SelectOption[] = [
    { label: 'Usuário', value: 'USER' },
    { label: 'Administrador', value: 'ADMIN' },
  ];

  readonly companySearchOptions = this.companyService.searchOptions;

  ngOnInit(): void {
    if (this.isSuperAdmin()) {
      this.companyService.searchActive('');

      this.searchSubject
        .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
        .subscribe((query) => {
          this.companyService.searchActive(query);
        });
    }
  }

  onCompanySearch(query: string): void {
    this.searchSubject.next(query);
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return 'Campo obrigatório';
    if (control.errors['email']) return 'Email inválido';

    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const request: CreateInvitationRequest = {
      email: formValue.email,
      role: formValue.role,
      firstName: formValue.firstName || undefined,
      lastName: formValue.lastName || undefined,
      companyId: formValue.companyId || undefined,
    };

    this.submitted.emit(request);
  }

  onClose(): void {
    this.form.reset({ role: 'USER' });
    this.closed.emit();
  }
}
