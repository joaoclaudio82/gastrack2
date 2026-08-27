import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { ApiService } from '@core/services/api.service';
import { NotificationService } from '@core/services/notification.service';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { CardComponent } from '@shared/components/ui/card/card.component';
import { FormSectionComponent } from '@shared/components/ui/form-section/form-section.component';
import { InputComponent } from '@shared/components/ui/input/input.component';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BreadcrumbComponent,
    ButtonComponent,
    CardComponent,
    FormSectionComponent,
    InputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-foreground">Editar Perfil</h1>
    </div>

    <!-- Edit Form Card -->
    <app-card>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <app-form-section
          title="Informações Pessoais"
          description="Atualize seu nome e sobrenome"
          divider="bottom"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <app-input
              label="Nome"
              placeholder="João"
              formControlName="firstName"
              [error]="getFieldError('firstName')"
              [required]="true"
            />
            <app-input
              label="Sobrenome"
              placeholder="Silva"
              formControlName="lastName"
              [error]="getFieldError('lastName')"
              [required]="true"
            />
          </div>
        </app-form-section>

        <app-form-section
          title="Informações de Contato"
          description="Seu email é usado para login e notificações"
        >
          <app-input
            type="email"
            label="Email"
            placeholder="joao@exemplo.com"
            formControlName="email"
            [error]="getFieldError('email')"
            [required]="true"
          />
        </app-form-section>

        <!-- Action Buttons -->
        <div class="mt-8 flex items-center gap-3">
          <a routerLink="/profile" class="flex-1">
            <app-button variant="outline" [fullWidth]="true">Cancelar</app-button>
          </a>
          <app-button
            type="submit"
            [loading]="isLoading()"
            [disabled]="form.invalid || form.pristine"
            class="flex-1"
          >
            Salvar Alterações
          </app-button>
        </div>
      </form>
    </app-card>
  `,
})
export class ProfileEditComponent {
  private readonly authService = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly isLoading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: [
      this.authService.currentUser()?.firstName ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    lastName: [
      this.authService.currentUser()?.lastName ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    email: [this.authService.currentUser()?.email ?? '', [Validators.required, Validators.email]],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);

    const payload = this.form.getRawValue();

    this.api
      .put<{ firstName: string; lastName: string }>('/users/me', {
        firstName: payload.firstName,
        lastName: payload.lastName,
      })
      .subscribe({
        next: () => {
          const currentUser = this.authService.currentUser();
          if (currentUser) {
            this.authService.updateUser({
              ...currentUser,
              firstName: payload.firstName,
              lastName: payload.lastName,
            });
          }
          this.notificationService.success('Perfil atualizado com sucesso');
          void this.router.navigate(['/profile']);
        },
        error: () => {
          this.notificationService.error('Erro ao atualizar perfil');
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  protected getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return `${this.formatFieldName(field)} is required`;
    if (control.errors['email']) return 'Invalid email address';
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} characters`;

    return '';
  }

  private formatFieldName(field: string): string {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  }
}
