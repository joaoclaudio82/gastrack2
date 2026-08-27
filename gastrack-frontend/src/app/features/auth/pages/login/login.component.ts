import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { RememberMeComponent } from '../../components/remember-me/remember-me.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent, RememberMeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Login Content - Compact & Professional -->
    <div class="space-y-4">
      <div class="text-center sm:text-left">
        <h2 class="text-xl font-semibold text-foreground">Bem-vindo de volta</h2>
        <p class="text-sm text-muted-foreground mt-0.5">Entre na sua conta</p>
      </div>

      <!-- Error Alert - Compact -->
      @if (authService.error()) {
        <div
          role="alert"
          class="p-2.5 rounded-sm bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2"
        >
          <svg
            class="w-4 h-4 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{{ authService.error() }}</span>
        </div>
      }

      <!-- Login Form - Compact -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-3">
        <app-input
          type="email"
          label="Email"
          placeholder="seu@email.com"
          formControlName="username"
          [error]="getFieldError('username')"
          [required]="true"
          size="md"
          autocomplete="email"
        />

        <app-input
          type="password"
          label="Senha"
          placeholder="Digite sua senha"
          formControlName="password"
          [error]="getFieldError('password')"
          [required]="true"
          size="md"
          autocomplete="current-password"
        />

        <!-- Remember me & Forgot password - Same line -->
        <div class="flex items-center justify-between pt-1">
          <app-remember-me formControlName="rememberMe" />
          <a
            routerLink="/auth/forgot-password"
            class="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Esqueceu a senha?
          </a>
        </div>

        <!-- Submit Button -->
        <div class="pt-1">
          <app-button
            type="submit"
            [loading]="authService.isLoading()"
            [disabled]="form.invalid"
            [fullWidth]="true"
            size="md"
          >
            Entrar
          </app-button>
        </div>
      </form>
    </div>
  `,
})
export class LoginComponent {
  protected readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  protected onSubmit(): void {
    if (this.form.invalid) return;

    const { username, password } = this.form.getRawValue();

    this.authService.login({ username, password }).subscribe({
      next: () => {
        // Verifica se precisa de challenge (ex: NEW_PASSWORD_REQUIRED)
        const challenge = this.authService.challengeContext();
        if (challenge?.challengeName === 'NEW_PASSWORD_REQUIRED') {
          void this.router.navigate(['/auth/new-password']);
          return;
        }

        const returnUrl = this.route.snapshot.queryParams['returnUrl'] ?? '/dashboard';
        void this.router.navigateByUrl(returnUrl);
      },
      error: (err: unknown) => {
        // Check if user is not confirmed (403 with specific message)
        if (this.isUserNotConfirmedError(err)) {
          this.authService.clearError();
          void this.router.navigate(['/auth/confirm-account'], {
            queryParams: { username },
          });
        }
      },
    });
  }

  private isUserNotConfirmedError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;

    const error = err as { error?: { errorCode?: string } };

    // Check for specific errorCode from backend
    return error.error?.errorCode === 'UserNotConfirmedException';
  }

  protected getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';

    const fieldLabels: Record<string, string> = {
      username: 'Email',
      password: 'Senha',
    };
    const label = fieldLabels[field] ?? field;

    if (control.errors['required']) return `${label} é obrigatório`;
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['minlength'])
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;

    return '';
  }
}
