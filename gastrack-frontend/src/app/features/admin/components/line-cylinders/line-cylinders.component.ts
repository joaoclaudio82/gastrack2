import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { LineCylinder, PontoGas } from '@models/ponto-gas.model';
import { ButtonComponent } from '@shared/components/ui/button/button.component';

/**
 * Cascos do manifold sob a linha de gás, com a soma de volume explícita.
 *
 * Nível e pressão pertencem à LINHA, não ao casco: um único sensor mede a saída
 * combinada, então percentual por botijão não é mensurável. Cada cilindro carrega
 * identidade (serial), tipo de gás e volume.
 */
@Component({
  selector: 'app-line-cylinders',
  standalone: true,
  imports: [DecimalPipe, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-3">
      <!-- Números da linha -->
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        @if (pontoGas().fillPercentage !== null) {
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold tabular-nums" [class]="levelTextClass()">
              {{ pontoGas().fillPercentage | number: '1.0-0' }}%
            </span>
            <span class="text-xs font-semibold uppercase tracking-wide" [class]="levelTextClass()">
              {{ levelLabel() }}
            </span>
          </div>
        } @else {
          <span class="text-sm text-muted-foreground">Sem leitura ainda</span>
        }

        @if (pontoGas().currentPressureBar !== null) {
          <span class="text-muted-foreground">
            Pressão
            <b class="tabular-nums text-foreground">
              {{ pontoGas().currentPressureBar | number: '1.0-1' }} bar
            </b>
            / {{ pontoGas().effectiveFullTankPressureBar | number: '1.0-0' }}
          </span>
        } @else {
          <!-- Sem leitura, a pressão de referência efetiva não aparecia em tela nenhuma: quem
               conferisse pelo "Editar Ponto de Gás" via o valor gravado, não o do casco mais fraco. -->
          <span class="text-muted-foreground">
            Pressão de referência
            <b class="tabular-nums text-foreground">
              {{ pontoGas().effectiveFullTankPressureBar | number: '1.0-0' }} bar
            </b>
          </span>
        }
        <span class="text-muted-foreground">
          Volume
          <b class="tabular-nums text-foreground">
            {{ pontoGas().effectiveCapacityLiters | number: '1.0-1' }} L
          </b>
        </span>
        @if (pontoGas().availableCubicMeters !== null) {
          <span class="text-muted-foreground">
            Disponível
            <b class="tabular-nums text-foreground">
              {{ pontoGas().availableCubicMeters | number: '1.0-2' }} m³
            </b>
          </span>
        }
      </div>

      <!-- Cascos -->
      @if (cylinders().length === 0) {
        <div
          class="rounded-md border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground"
        >
          Nenhum cilindro cadastrado nesta linha.
          <br />
          O volume cai no valor padrão da linha, e a previsão de autonomia fica imprecisa.
        </div>
      } @else {
        <ul class="space-y-1.5">
          @for (cylinder of cylinders(); track cylinder.id) {
            <li
              class="flex flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
              [class.opacity-60]="!cylinder.connected"
            >
              @if (cylinder.gasType) {
                <span
                  class="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary"
                >
                  {{ cylinder.gasType }}
                </span>
              }
              <span class="font-mono text-xs font-semibold">{{ cylinder.serialNumber }}</span>
              <span class="text-xs text-muted-foreground">
                {{ cylinder.modelCodigo ?? 'sem modelo' }}
              </span>
              @if (cylinder.connected) {
                <span
                  class="inline-flex items-center rounded-full border border-emerald-600/30 bg-emerald-600/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
                >
                  aberto
                </span>
              } @else {
                <span
                  class="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                >
                  fechado
                </span>
              }
              <span
                class="ml-auto font-mono text-xs font-semibold tabular-nums"
                [class.line-through]="!cylinder.connected"
                [class.text-muted-foreground]="!cylinder.connected"
              >
                {{ cylinder.waterVolumeLiters | number: '1.0-1' }} L
              </span>
            </li>
          }
        </ul>

        <div
          class="flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-sm text-muted-foreground"
        >
          <span aria-hidden="true">&Sigma;</span>
          <span>
            Volume da linha
            <b class="font-mono tabular-nums text-foreground">
              {{ pontoGas().effectiveCapacityLiters | number: '1.0-1' }} L
            </b>
            @if (disconnectedCount() > 0) {
              — {{ disconnectedCount() }}
              {{ disconnectedCount() === 1 ? 'casco fechado está' : 'cascos fechados estão' }}
              fora da conta.
            }
          </span>
        </div>
      }

      @if (canManage()) {
        <div class="flex flex-wrap gap-2">
          <app-button variant="primary" size="sm" (buttonClick)="refillRequested.emit(pontoGas())">
            Troquei um botijão
          </app-button>
          <app-button variant="outline" size="sm" (buttonClick)="manageRequested.emit(pontoGas())">
            Gerenciar cilindros
          </app-button>
        </div>
      }
    </div>
  `,
})
export class LineCylindersComponent {
  readonly pontoGas = input.required<PontoGas>();

  /** USER observa a linha: vê os cascos e a soma, mas não troca nem gerencia. */
  readonly canManage = input<boolean>(true);

  readonly refillRequested = output<PontoGas>();
  readonly manageRequested = output<PontoGas>();

  protected readonly cylinders = computed<LineCylinder[]>(() => this.pontoGas().cylinders ?? []);

  protected readonly disconnectedCount = computed(
    () => this.cylinders().filter((c) => !c.connected).length,
  );

  /**
   * Faixas vêm do servidor (PontoGas.thresholds), nunca de constantes locais —
   * o backend é a fonte única desses limites.
   */
  protected readonly levelLabel = computed(() => {
    const fill = this.pontoGas().fillPercentage;
    if (fill === null) return '';
    const { critical, low, normal } = this.pontoGas().thresholds;
    if (fill >= normal) return 'Cheio';
    if (fill >= low) return 'Normal';
    if (fill >= critical) return 'Baixo';
    return 'Crítico';
  });

  protected readonly levelTextClass = computed(() => {
    const fill = this.pontoGas().fillPercentage;
    if (fill === null) return 'text-muted-foreground';
    const { critical, low } = this.pontoGas().thresholds;
    if (fill >= low) return 'text-emerald-700 dark:text-emerald-400';
    if (fill >= critical) return 'text-amber-700 dark:text-amber-400';
    return 'text-destructive';
  });
}
