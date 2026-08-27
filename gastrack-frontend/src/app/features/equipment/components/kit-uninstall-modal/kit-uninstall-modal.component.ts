import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import type { EquipmentKit } from '@models/equipment-kit.model';
import { AlertComponent } from '@shared/components/ui/alert/alert.component';
import { ButtonComponent } from '@shared/components/ui/button/button.component';
import { DatePickerComponent } from '@shared/components/ui/date-picker/date-picker.component';
import { InputComponent } from '@shared/components/ui/input/input.component';
import { ModalComponent } from '@shared/components/ui/modal/modal.component';
import { TextareaComponent } from '@shared/components/ui/textarea/textarea.component';

export interface KitUninstallResult {
  kitId: number;
  uninstallationDate: string | null;
  reason: string | null;
  notes: string | null;
}

@Component({
  selector: 'app-kit-uninstall-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    DatePickerComponent,
    InputComponent,
    TextareaComponent,
    AlertComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [isOpen]="isOpen()" title="Desinstalar Kit" size="md" (closed)="onClose()">
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        @if (kit()) {
          <div class="rounded-sm border border-border bg-muted/50 p-3 space-y-1">
            <p class="text-sm font-medium">Kit</p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Código:</span>
              {{ kit()?.kitCode }}
            </p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Endereço Atual:</span>
              {{ kit()?.addressName }}
            </p>
            <p class="text-xs text-muted-foreground">
              <span class="font-medium">Equipamentos:</span>
              {{ kit()?.equipmentCount }}
            </p>
          </div>
        }

        <app-alert variant="warning">
          <p class="font-medium">Atenção</p>
          <p class="text-sm mt-1">
            Ao desinstalar este kit, todos os equipamentos associados serão removidos do kit e
            ficarão disponíveis para nova alocação.
          </p>
        </app-alert>

        <app-input
          label="Motivo da Desinstalação"
          placeholder="Informe o motivo (opcional)"
          formControlName="reason"
          hint="Motivo pelo qual o kit está sendo desinstalado"
        />

        <app-date-picker
          label="Data de Desinstalação"
          placeholder="Selecione a data"
          formControlName="uninstallationDate"
          [maxDate]="today"
          hint="Data em que o kit foi desinstalado (máximo: hoje)"
        />

        <app-textarea
          label="Observações"
          placeholder="Informações adicionais sobre a desinstalação (opcional)"
          formControlName="notes"
          [rows]="3"
        />
      </form>

      <ng-container modal-footer>
        <app-button variant="outline" (buttonClick)="onClose()">Cancelar</app-button>
        <app-button variant="destructive" [loading]="isLoading()" (buttonClick)="onSubmit()">
          Desinstalar Kit
        </app-button>
      </ng-container>
    </app-modal>
  `,
})
export class KitUninstallModalComponent {
  private readonly fb = inject(FormBuilder);

  readonly isOpen = input.required<boolean>();
  readonly kit = input<EquipmentKit | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly submitted = output<KitUninstallResult>();
  readonly closed = output();

  readonly form = this.fb.nonNullable.group({
    reason: [''],
    uninstallationDate: [''],
    notes: [''],
  });

  /** Max date for uninstallation (today) */
  readonly today = new Date();

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.form.reset({
          reason: '',
          uninstallationDate: this.getTodayISO(),
          notes: '',
        });
      }
    });
  }

  onSubmit(): void {
    const kitData = this.kit();
    if (!kitData) return;

    const formValue = this.form.getRawValue();
    this.submitted.emit({
      kitId: kitData.id,
      uninstallationDate: formValue.uninstallationDate || null,
      reason: formValue.reason || null,
      notes: formValue.notes || null,
    });
  }

  onClose(): void {
    this.form.reset({
      reason: '',
      uninstallationDate: '',
      notes: '',
    });
    this.closed.emit();
  }

  private getTodayISO(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
