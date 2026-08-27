import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { getTestBed, TestBed, type ComponentFixture } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import type { CylinderRequest } from '@models/cylinder.model';
import type { SelectOption } from '@shared/components/ui/select/select.component';
import { CylinderFormComponent } from './cylinder-form.component';

const globalTestBed = globalThis as typeof globalThis & { __cylinderFormTestEnv?: boolean };

if (!globalTestBed.__cylinderFormTestEnv) {
  try {
    getTestBed().initTestEnvironment([BrowserTestingModule], platformBrowserTesting());
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('Cannot set base providers because it has already been called')) {
      throw error;
    }
  }
  globalTestBed.__cylinderFormTestEnv = true;
}

const MODELS: SelectOption[] = [
  { label: 'O2-50L-200BAR — Oxigênio 50L/200bar', value: 7 },
  { label: 'N2-50L-200BAR — Nitrogênio 50L/200bar', value: 8 },
];

describe('CylinderFormComponent', () => {
  let fixture: ComponentFixture<CylinderFormComponent>;

  function render(inputs: Record<string, unknown> = {}): CylinderFormComponent {
    fixture = TestBed.createComponent(CylinderFormComponent);
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('modelOptions', MODELS);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('fica válido sem seletor de empresa quando o dono vem pronto (ADMIN)', () => {
    // companyOptions vazio = /companies/active é SUPER_ADMIN-only. Sem defaultCompanyId,
    // companyId (required) nunca é preenchido e "Criar Cilindro" fica desabilitado pra sempre.
    const component = render({ companyOptions: [], defaultCompanyId: 42 });

    component.form.patchValue({ cylinderModelId: 7, serialNumber: 'TESTE-CIL-01' });

    expect(component.form.getRawValue().companyId).toBe(42);
    expect(component.form.valid).toBe(true);
  });

  it('semeia a linha de origem quando aberto a partir de uma linha de gás', () => {
    const component = render({ companyOptions: [], defaultCompanyId: 42, defaultPontoGasId: 403 });

    expect(component.form.getRawValue().pontoGasId).toBe(403);
  });

  it('esconde o campo Empresa sem opções e mostra com opções', () => {
    render({ companyOptions: [], defaultCompanyId: 42 });
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Empresa');

    render({ companyOptions: [{ label: 'Empresa A', value: 1 }] });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Empresa');
  });

  /**
   * O modal vive fora de `@if` na tela de cilindros: nasce fechado. Reproduzir isso importa —
   * foi com o form nascendo aberto que o spec deixou de ver o effect morto.
   */
  function renderClosed(inputs: Record<string, unknown> = {}): CylinderFormComponent {
    fixture = TestBed.createComponent(CylinderFormComponent);
    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('modelOptions', MODELS);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  /**
   * Regressão: o effect que limpa o modelo saía por `return` antes de ler qualquer signal na
   * primeira execução — sem dependência registrada, nunca era reagendado. O campo ficava com um
   * modelo de outro gás, invisível no select (a opção não existe mais), com o form `valid` e o
   * botão habilitado: o usuário só descobria no 409 do backend.
   */
  it('troca de linha tira o modelo de outro gás de vez do formulário', () => {
    const component = renderClosed({
      companyOptions: [],
      defaultCompanyId: 42,
      modelGasTypeById: { 7: 'O2', 8: 'N2' },
      lineGasTypeById: { 403: 'O2', 404: 'N2' },
    });

    component.form.patchValue({ pontoGasId: 403, cylinderModelId: 7 });
    fixture.detectChanges();
    expect(component.form.getRawValue().cylinderModelId).toBe(7);

    component.form.patchValue({ pontoGasId: 404 });
    fixture.detectChanges();

    expect(component.availableModelOptions().map((o) => o.value)).toEqual([8]);
    expect(component.form.getRawValue().cylinderModelId).toBeNull();
    expect(component.form.valid).toBe(false);
  });

  /**
   * O backend exclui o cilindro em edição da checagem de gás, então trocar o modelo do único
   * casco da linha é legítimo. Filtrar pelo gás derivado dele mesmo escondia a opção e travava
   * a correção pela UI, sem mensagem nenhuma.
   */
  it('editar o casco que ocupa a linha continua oferecendo os outros gases', () => {
    const component = renderClosed({
      companyOptions: [],
      defaultCompanyId: 42,
      modelGasTypeById: { 7: 'O2', 8: 'N2' },
      lineGasTypeById: { 403: 'O2' },
      cylinder: {
        id: 1,
        cylinderModelId: 7,
        companyId: 42,
        pontoGasId: 403,
        addressId: null,
        serialNumber: 'CIL-01',
        connected: true,
      },
    });
    fixture.detectChanges();

    expect(component.availableModelOptions().map((o) => o.value)).toEqual([7, 8]);
    expect(component.form.getRawValue().cylinderModelId).toBe(7);
  });

  it('emite o payload com o modelo escolhido', () => {
    const component = render({ companyOptions: [], defaultCompanyId: 42, defaultPontoGasId: 403 });
    const emitted: CylinderRequest[] = [];
    component.submitted.subscribe((payload) => emitted.push(payload));

    component.form.patchValue({ cylinderModelId: 8, serialNumber: 'TESTE-CIL-02' });
    component.onSubmit();

    const [payload] = emitted;
    expect(emitted.length).toBe(1);
    expect(payload?.cylinderModelId).toBe(8);
    expect(payload?.pontoGasId).toBe(403);
  });
});
