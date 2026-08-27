import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '@layouts/dashboard-layout/components/breadcrumb/breadcrumb.component';
import { OnboardingStateService } from './onboarding-state.service';
import { ONBOARDING_STEPS } from './onboarding.model';
import { StepAddressComponent } from './steps/step-address.component';
import { StepAwaitEspComponent } from './steps/step-await-esp.component';
import { StepCompanyComponent } from './steps/step-company.component';
import { StepContractComponent } from './steps/step-contract.component';
import { StepCylindersComponent } from './steps/step-cylinders.component';
import { StepGasPointsComponent } from './steps/step-gas-points.component';
import { StepInstallComponent } from './steps/step-install.component';
import { StepKitEquipmentsComponent } from './steps/step-kit-equipments.component';
import { StepKitComponent } from './steps/step-kit.component';
import { StepRegisterEspComponent } from './steps/step-register-esp.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    StepCompanyComponent,
    StepAddressComponent,
    StepContractComponent,
    StepKitComponent,
    StepKitEquipmentsComponent,
    StepAwaitEspComponent,
    StepRegisterEspComponent,
    StepGasPointsComponent,
    StepCylindersComponent,
    StepInstallComponent,
  ],
  providers: [OnboardingStateService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-breadcrumb />

    <div class="mx-auto max-w-4xl px-4 py-6">
      @if (completed()) {
        <div class="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div class="flex flex-col items-center gap-6 py-8 text-center">
            <div
              class="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600"
            >
              <svg
                class="h-10 w-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-foreground">Kit instalado com sucesso!</h2>
            <p class="max-w-md text-muted-foreground">
              O processo de onboarding foi concluído. Todos os equipamentos foram vinculados e
              configurados.
            </p>
            <div class="flex gap-3 pt-4">
              <button
                type="button"
                class="rounded-lg border border-border bg-card px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                (click)="startNew()"
              >
                Novo Onboarding
              </button>
              <button
                type="button"
                class="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                (click)="goToDashboard()"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        </div>
      } @else {
        <div class="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div class="relative flex items-center justify-between">
            <div class="absolute left-0 top-4 h-0.5 w-full bg-border"></div>
            <div
              class="absolute left-0 top-4 h-0.5 bg-primary transition-all duration-300"
              [style.width.%]="wizardState.progressPercent()"
            ></div>

            @for (step of steps; track step.num) {
              <button
                type="button"
                class="relative z-10 flex flex-col items-center gap-1.5"
                [disabled]="step.num > wizardState.currentStep() || isEspStepSkipped(step.num)"
                [title]="isEspStepSkipped(step.num) ? 'Etapa pulada: o kit já possui um ESP32' : ''"
                (click)="wizardState.goToStep(step.num)"
              >
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200"
                  [class]="getStepClasses(step.num)"
                >
                  @if (isEspStepSkipped(step.num)) {
                    <span aria-hidden="true">–</span>
                  } @else if (step.num < wizardState.currentStep()) {
                    <svg
                      class="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  } @else {
                    {{ step.num }}
                  }
                </div>
                <span
                  class="hidden text-xs font-medium sm:block"
                  [class.text-primary]="step.num <= wizardState.currentStep()"
                  [class.text-muted-foreground]="step.num > wizardState.currentStep()"
                >
                  {{ step.label }}
                </span>
              </button>
            }
          </div>
        </div>

        <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
          @switch (wizardState.currentStep()) {
            @case (1) {
              <app-onboarding-step-company (completed)="wizardState.nextStep()" />
            }
            @case (2) {
              <app-onboarding-step-address (completed)="wizardState.nextStep()" />
            }
            @case (3) {
              <app-onboarding-step-contract (completed)="wizardState.nextStep()" />
            }
            @case (4) {
              <app-onboarding-step-kit (completed)="wizardState.nextStep()" />
            }
            @case (5) {
              <app-onboarding-step-kit-equipments (completed)="wizardState.nextStep()" />
            }
            @case (6) {
              <app-onboarding-step-await-esp (completed)="onEspDetected($event)" />
            }
            @case (7) {
              <app-onboarding-step-register-esp
                [serials]="wizardState.capturedSerials()"
                (completed)="wizardState.nextStep()"
              />
            }
            @case (8) {
              <app-onboarding-step-gas-points (completed)="wizardState.nextStep()" />
            }
            @case (9) {
              <app-onboarding-step-cylinders (completed)="wizardState.nextStep()" />
            }
            @case (10) {
              <app-onboarding-step-install (completed)="finishOnboarding()" />
            }
          }
        </div>

        @if (wizardState.canGoBack()) {
          <div class="mt-4">
            <button
              type="button"
              class="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              (click)="wizardState.prevStep()"
            >
              Voltar
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class OnboardingComponent {
  protected readonly wizardState = inject(OnboardingStateService);
  private readonly router = inject(Router);

  protected readonly steps = ONBOARDING_STEPS;
  protected readonly completed = signal(false);

  /** Etapas Detectar/Registrar ESP (6, 7) puladas quando o kit já tem um ESP32. */
  protected isEspStepSkipped(stepNum: number): boolean {
    return this.wizardState.kitHasEsp() && (stepNum === 6 || stepNum === 7);
  }

  protected getStepClasses(stepNum: number): string {
    const current = this.wizardState.currentStep();
    if (this.isEspStepSkipped(stepNum)) {
      return 'border-dashed border-border bg-card text-muted-foreground/60';
    }
    if (stepNum < current) {
      return 'border-primary bg-primary text-primary-foreground';
    }
    if (stepNum === current) {
      return 'border-primary bg-card text-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-card';
    }
    return 'border-border bg-card text-muted-foreground';
  }

  protected onEspDetected(serials: string[]): void {
    this.wizardState.setCapturedSerials(serials);
    this.wizardState.nextStep();
  }

  protected finishOnboarding(): void {
    this.completed.set(true);
  }

  protected startNew(): void {
    this.completed.set(false);
    this.wizardState.reset();
  }

  protected goToDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }
}
