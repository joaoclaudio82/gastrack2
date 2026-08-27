import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { matchField, passwordStrength } from '@shared/validators/custom-validators';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Reset Password Content (rendered inside auth-layout card) -->
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-semibold text-foreground">Redefinir senha</h2>
        <p class="text-sm text-muted-foreground mt-1">Digite o código recebido e sua nova senha</p>
      </div>

      <!-- Success Alert -->
      @if (success()) {
        <div
          class="p-4 rounded-sm bg-success/20 border border-success/30 text-success text-sm flex items-start gap-3"
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
          <span>Senha redefinida com sucesso! Redirecionando...</span>
        </div>
      }

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

      <!-- Reset Password Form -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
        <app-input
          type="email"
          label="Email"
          placeholder="seu@email.com"
          formControlName="username"
          [error]="getFieldError('username')"
          [required]="true"
        />

        <app-input
          type="text"
          label="Código de verificação"
          placeholder="123456"
          formControlName="code"
          [error]="getFieldError('code')"
          [required]="true"
          hint="Código de 6 dígitos enviado para seu email"
        />

        <app-input
          type="password"
          label="Nova Senha"
          placeholder="Crie uma senha forte"
          formControlName="password"
          [error]="getFieldError('password')"
          hint="Mínimo 8 caracteres com maiúscula, minúscula, número e caractere especial"
          [required]="true"
        />

        <app-input
          type="password"
          label="Confirmar Senha"
          placeholder="Confirme sua senha"
          formControlName="confirmPassword"
          [error]="getFieldError('confirmPassword')"
          [required]="true"
        />

        <!-- Submit Button -->
        <app-button
          type="submit"
          [loading]="isLoading()"
          [disabled]="form.invalid"
          [fullWidth]="true"
        >
          Redefinir senha
        </app-button>
      </form>

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
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    password: ['', [Validators.required, passwordStrength()]],
    confirmPassword: ['', [Validators.required, matchField('password')]],
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

    const { username, code, password } = this.form.getRawValue();

    this.authService.resetPassword(username, code, password).subscribe({
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
            : 'Erro ao redefinir senha';
        this.error.set(errorMessage ?? 'Erro ao redefinir senha');
      },
    });
  }

  protected getFieldError(field: string): string {
    const control = this.form.get(field);
    if (!control?.touched || !control.errors) return '';

    const fieldLabels: Record<string, string> = {
      username: 'Email',
      code: 'Código',
      password: 'Senha',
      confirmPassword: 'Confirmação',
    };
    const label = fieldLabels[field] ?? field;

    if (control.errors['required']) return `${label} é obrigatório`;
    if (control.errors['email']) return 'Email inválido';
    if (control.errors['minlength'] || control.errors['maxlength'])
      return 'O código deve ter 6 dígitos';
    if (control.errors['passwordStrength']) return 'A senha não atende aos requisitos';
    if (control.errors['matchField']) return 'As senhas não coincidem';

    return '';
  }
}
