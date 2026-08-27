import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';

@Component({
  selector: 'app-confirm-account',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Confirm Account Content (rendered inside auth-layout card) -->
    <div class="space-y-6 sm:space-y-8">
      <div class="text-center sm:text-left">
        <h2 class="text-2xl sm:text-3xl font-semibold text-foreground">Confirmar conta</h2>
        <p class="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          Digite o código de verificação enviado para seu email
        </p>
      </div>

      <!-- Success Alert -->
      @if (success()) {
        <div
          class="p-3 sm:p-4 rounded-sm bg-success/20 border border-success/30 text-success text-sm flex items-start gap-3"
        >
          <svg
            class="w-5 h-5 flex-shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>Conta confirmada com sucesso! Redirecionando para login...</span>
        </div>
      }

      <!-- Error Alert -->
      @if (error()) {
        <div
          class="p-3 sm:p-4 rounded-sm bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-3"
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

      <!-- Resend Success Alert -->
      @if (resendSuccess()) {
        <div
          class="p-3 sm:p-4 rounded-sm bg-primary/10 border border-primary/30 text-primary text-sm flex items-start gap-3"
        >
          <svg
            class="w-5 h-5 flex-shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
          <span>Código reenviado! Verifique seu email.</span>
        </div>
      }

      <!-- Confirm Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5 sm:space-y-6">
        <app-input
          type="email"
          label="Email"
          placeholder="seu@email.com"
          formControlName="username"
          [error]="getFieldError('username')"
          [required]="true"
          size="lg"
        />

        <app-input
          type="text"
          label="Código de verificação"
          placeholder="123456"
          formControlName="confirmationCode"
          [error]="getFieldError('confirmationCode')"
          [required]="true"
          size="lg"
          hint="Código de 6 dígitos enviado para seu email"
        />

        <!-- Submit Button -->
        <div class="pt-2 sm:pt-4">
          <app-button
            type="submit"
            [loading]="isLoading()"
            [disabled]="form.invalid"
            [fullWidth]="true"
            size="lg"
          >
            Confirmar conta
          </app-button>
        </div>
      </form>

      <!-- Resend code section -->
      <div class="text-center pt-4 border-t border-border">
        <p class="text-sm text-muted-foreground mb-3">Não recebeu o código?</p>
        <button
          type="button"
          (click)="onResendCode()"
          [disabled]="isResending() || !form.get('username')?.valid"
          class="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          @if (isResending()) {
            Reenviando...
          } @else {
            Reenviar código
          }
        </button>
      </div>

      <!-- Back to login link -->
      <p class="text-center text-sm text-muted-foreground">
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
export class ConfirmAccountComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly isLoading = signal(false);
  protected readonly isResending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);
  protected readonly resendSuccess = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.email]],
    confirmationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  ngOnInit(): void {
    const usernameFromQuery = this.route.snapshot.queryParams['username'] ?? '';
    if (usernameFromQuery) {
      this.form.patchValue({ username: usernameFromQuery });
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.error.set(null);
    this.resendSuccess.set(false);

    const { username, confirmationCode } = this.form.getRawValue();

    this.authService.confirmAccount({ username, confirmationCode }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.success.set(true);
        setTimeout(() => {
          void this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        const errorMessage =
          err && typeof err === 'object' && 'error' in err
            ? (err as { error?: { message?: string } }).error?.message
            : 'Erro ao confirmar conta';
        this.error.set(errorMessage ?? 'Erro ao confirmar conta');
      },
    });
  }

  protected onResendCode(): void {
    const username = this.form.get('username')?.value;
    if (!username) return;

    this.isResending.set(true);
    this.error.set(null);
    this.resendSuccess.set(false);

    this.authService.resendConfirmationCode(username).subscribe({
      next: () => {
        this.isResending.set(false);
        this.resendSuccess.set(true);
        setTimeout(() => {
          this.resendSuccess.set(false);
        }, 5000);
      },
      error: (err: unknown) => {
        this.isResending.set(false);
        const errorMessage =
          err && typeof err === 'object' && 'error' in err
            ? (err as { error?: { message?: string } }).error?.message
            : 'Erro ao reenviar código';
        this.error.set(errorMessage ?? 'Erro ao reenviar código');
      },
    });
  }

  protected getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';

    const fieldLabels: Record<string, string> = {
      username: 'Email',
      confirmationCode: 'Código',
    };
    const label = fieldLabels[field] ?? field;

    if (control.errors['required']) return `${label} é obrigatório`;
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['minlength'] || control.errors['maxlength'])
      return 'O código deve ter 6 dígitos';

    return '';
  }
}
