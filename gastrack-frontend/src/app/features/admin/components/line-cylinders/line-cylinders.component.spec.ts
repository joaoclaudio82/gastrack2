import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { getTestBed, TestBed, type ComponentFixture } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { GasType } from '@models/cylinder-model.model';
import { CylinderStatus } from '@models/cylinder.model';
import type { LineCylinder, PontoGas } from '@models/ponto-gas.model';
import { LineCylindersComponent } from './line-cylinders.component';

const globalTestBed = globalThis as typeof globalThis & { __lineCylindersTestEnv?: boolean };

if (!globalTestBed.__lineCylindersTestEnv) {
  try {
    getTestBed().initTestEnvironment([BrowserTestingModule], platformBrowserTesting());
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('Cannot set base providers because it has already been called')) {
      throw error;
    }
  }
  globalTestBed.__lineCylindersTestEnv = true;
}

function cylinder(id: number, serial: string, liters: number, connected: boolean): LineCylinder {
  return {
    id,
    serialNumber: serial,
    modelCodigo: 'O2-50L-200BAR',
    gasType: GasType.O2,
    waterVolumeLiters: liters,
    capacityBar: 200,
    connected,
  };
}

function line(overrides: Partial<PontoGas> = {}): PontoGas {
  return {
    id: 1,
    addressId: 1,
    addressName: 'Filial',
    location: 'Forno',
    effectiveCapacityLiters: 150,
    effectiveFullTankPressureBar: 200,
    thresholds: { critical: 20, low: 50, normal: 80 },
    cylinders: [
      cylinder(1, 'BOT-1021', 50, true),
      cylinder(2, 'BOT-1022', 50, true),
      cylinder(3, 'BOT-1044', 50, true),
    ],
    availableCubicMeters: 13.8,
    fillPercentage: 46,
    gasType: GasType.O2,
    currentPressureBar: 92,
    lastReadingAt: '2026-08-10T12:00:00',
    status: CylinderStatus.LOW,
    active: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    equipments: [],
    ...overrides,
  };
}

describe('LineCylindersComponent', () => {
  let fixture: ComponentFixture<LineCylindersComponent>;

  function render(pontoGas: PontoGas, canManage = true): HTMLElement {
    fixture = TestBed.createComponent(LineCylindersComponent);
    fixture.componentRef.setInput('pontoGas', pontoGas);
    fixture.componentRef.setInput('canManage', canManage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('lists every cylinder of the manifold with its serial', () => {
    const el = render(line());
    const text = el.textContent;

    expect(text).toContain('BOT-1021');
    expect(text).toContain('BOT-1022');
    expect(text).toContain('BOT-1044');
  });

  it('shows the summed line volume, not a per-bottle figure', () => {
    const el = render(line());
    const text = el.textContent;

    expect(text).toContain('Volume da linha');
    expect(text).toContain('150');
  });

  it('flags closed cylinders as out of the sum', () => {
    const el = render(
      line({
        effectiveCapacityLiters: 100,
        cylinders: [
          cylinder(1, 'BOT-1021', 50, true),
          cylinder(2, 'BOT-1022', 50, true),
          cylinder(3, 'BOT-1044', 50, false),
        ],
      }),
    );
    const text = el.textContent;

    expect(text).toContain('fechado');
    expect(text).toContain('fora da conta');
    expect(text).toContain('100');
  });

  it('classifies the level using the thresholds sent by the server', () => {
    // 46% com faixas padrão (20/50/80) => Baixo
    expect(render(line()).textContent).toContain('Baixo');

    // Mesmos 46%, servidor mais exigente => Crítico
    const strict = render(line({ thresholds: { critical: 60, low: 80, normal: 95 } }));
    expect(strict.textContent).toContain('Crítico');
  });

  it('says there is no reading instead of showing a fake level', () => {
    const el = render(line({ fillPercentage: null, currentPressureBar: null }));

    expect(el.textContent).toContain('Sem leitura ainda');
  });

  it('warns when the line has no cylinder registered', () => {
    const el = render(line({ cylinders: [] }));

    expect(el.textContent).toContain('Nenhum cilindro cadastrado');
  });

  it('esconde as ações de escrita de quem só observa a linha', () => {
    // USER vê os cascos e a soma, mas trocar/gerenciar são chamadas que o backend nega.
    const readOnly = render(line(), false);
    expect(readOnly.textContent).toContain('BOT-1021');
    expect(readOnly.textContent).not.toContain('Troquei um botijão');
    expect(readOnly.textContent).not.toContain('Gerenciar cilindros');

    expect(render(line(), true).textContent).toContain('Troquei um botijão');
  });
});
