import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Forgot Password Content (rendered inside auth-layout card) -->
    <div class="space-y-6">
      @if (!emailSent()) {
        <div>
          <h2 class="text-2xl font-semibold text-foreground">Esqueceu a senha?</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Digite seu email e enviaremos um código de recuperação
          </p>
        </div>

        <!-- Error Alert -->
        @if (error()) {
          <div
            class="p-4 rounded-sm bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3"
          >
            <svg
              class="w-5 h-5 flex-shrink-0 mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ error() }}</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <app-input
            type="email"
            label="Email"
            placeholder="seu@email.com"
            formControlName="email"
            [error]="getFieldError('email')"
            [required]="true"
          />

          <app-button
            type="submit"
            [loading]="isLoading()"
            [disabled]="form.invalid"
            [fullWidth]="true"
          >
            Enviar código de recuperação
          </app-button>
        </form>
      } @else {
        <!-- Success State -->
        <div class="text-center py-4">
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 text-success mb-6"
          >
            <svg
              class="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <h2 class="text-2xl font-semibold text-foreground mb-2">Verifique seu email</h2>
          <p class="text-sm text-muted-foreground mb-4">
            Enviamos um código de recuperação para
            <br />
            <span class="font-medium text-foreground">{{ form.get('email')?.value }}</span>
          </p>

          <app-button [fullWidth]="true" (click)="goToResetPassword()">
            Continuar para redefinir senha
          </app-button>
        </div>
      }

      <!-- Back to sign in link -->
      <p class="text-center text-sm text-muted-foreground pt-4 border-t border-border">
        <a
          routerLink="/auth/login"
          class="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Voltar para login
        </a>
      </p>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly isLoading = signal(false);
  protected readonly emailSent = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);

    const email = this.form.get('email')?.value ?? '';

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.emailSent.set(true);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const errorMessage =
          err && typeof err === 'object' && 'error' in err
            ? (err as { error?: { message?: string } }).error?.message
            : 'Erro ao enviar código de recuperação';
        this.error.set(errorMessage ?? 'Erro ao enviar código de recuperação');
      },
    });
  }

  protected goToResetPassword(): void {
    const email = this.form.get('email')?.value ?? '';
    void this.router.navigate(['/auth/reset-password'], { queryParams: { username: email } });
  }

  protected getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';

    if (control.errors['required']) return 'Email é obrigatório';
    if (control.errors['email']) return 'Email inválido';

    return '';
  }
}
