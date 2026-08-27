import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { matchField, passwordStrength } from '@shared/validators/custom-validators';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- New Password Content (rendered inside auth-layout card) -->
    <div class="space-y-6 sm:space-y-8">
      <div class="text-center sm:text-left">
        <h2 class="text-2xl sm:text-3xl font-semibold text-foreground">Criar nova senha</h2>
        <p class="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          Este é seu primeiro acesso. Por favor, defina uma nova senha.
        </p>
      </div>

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

      <!-- New Password Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5 sm:space-y-6">
        <app-input
          type="password"
          label="Nova Senha"
          placeholder="Crie uma senha forte"
          formControlName="password"
          [error]="getFieldError('password')"
          hint="Mínimo 8 caracteres com maiúscula, minúscula, número e caractere especial"
          [required]="true"
          size="lg"
        />

        <app-input
          type="password"
          label="Confirmar Senha"
          placeholder="Confirme sua senha"
          formControlName="confirmPassword"
          [error]="getFieldError('confirmPassword')"
          [required]="true"
          size="lg"
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
            Definir senha e entrar
          </app-button>
        </div>
      </form>

      <!-- Back to login link -->
      <p class="text-center text-sm text-muted-foreground pt-4 border-t border-border">
        <a
          routerLink="/auth/login"
          (click)="onBackToLogin()"
          class="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Voltar para login
        </a>
      </p>
    </div>
  `,
})
export class NewPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, passwordStrength()]],
    confirmPassword: ['', [Validators.required, matchField('password')]],
  });

  ngOnInit(): void {
    // Redirect to login if no challenge context exists
    if (this.authService.challengeContext()?.challengeName !== 'NEW_PASSWORD_REQUIRED') {
      void this.router.navigate(['/auth/login']);
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;

    const challenge = this.authService.challengeContext();
    if (!challenge) {
      this.error.set('Sessão expirada. Por favor, faça login novamente.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const { password } = this.form.getRawValue();

    this.authService
      .respondToChallenge({
        username: challenge.username,
        newPassword: password,
        session: challenge.session,
        challengeName: challenge.challengeName,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          void this.router.navigate(['/dashboard']);
        },
        error: (err: unknown) => {
          this.isLoading.set(false);
          const errorMessage =
            err && typeof err === 'object' && 'error' in err
              ? (err as { error?: { message?: string } }).error?.message
              : 'Erro ao definir nova senha';
          this.error.set(errorMessage ?? 'Erro ao definir nova senha');
        },
      });
  }

  protected onBackToLogin(): void {
    this.authService.clearChallenge();
  }

  protected getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';

    const fieldLabels: Record<string, string> = {
      password: 'Senha',
      confirmPassword: 'Confirmação',
    };
    const label = fieldLabels[field] ?? field;

    if (control.errors['required']) return `${label} é obrigatório`;
    if (control.errors['passwordStrength']) return 'A senha não atende aos requisitos';
    if (control.errors['matchField']) return 'As senhas não coincidem';

    return '';
  }
}
