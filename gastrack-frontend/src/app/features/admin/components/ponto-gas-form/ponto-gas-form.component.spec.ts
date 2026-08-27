import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { getTestBed, TestBed, type ComponentFixture } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import type { PontoGasRequest } from '@models/ponto-gas.model';
import { PontoGasFormComponent } from './ponto-gas-form.component';

const globalTestBed = globalThis as typeof globalThis & { __pontoGasFormTestEnv?: boolean };

if (!globalTestBed.__pontoGasFormTestEnv) {
  try {
    getTestBed().initTestEnvironment([BrowserTestingModule], platformBrowserTesting());
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('Cannot set base providers because it has already been called')) {
      throw error;
    }
  }
  globalTestBed.__pontoGasFormTestEnv = true;
}

describe('PontoGasFormComponent', () => {
  let fixture: ComponentFixture<PontoGasFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(PontoGasFormComponent);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  });

  it('should_OmitFallbackFields_When_SubmittingGasPoint', () => {
    // capacityLiters e fullTankPressureBar são fallback: só valem para linha sem
    // casco conectado, e a tela mostra os derivados dos cascos (ARCHITECTURE §3).
    // Reenviá-los pelo formulário é o que envenenava o fallback de 5 L com os 150 L
    // derivados (CONVENTIONS §1). Omitidos, o create aplica o default e o update
    // preserva o gravado.
    const component = fixture.componentInstance;
    component.form.patchValue({
      companyId: 1,
      contractId: 2,
      addressId: 3,
      location: 'Forno 1',
    });

    let emitted: PontoGasRequest | undefined;
    component.submitted.subscribe((request: PontoGasRequest) => (emitted = request));

    component.onSubmit();

    expect(emitted).toEqual({ addressId: 3, location: 'Forno 1' });
    expect(emitted).not.toHaveProperty('capacityLiters');
    expect(emitted).not.toHaveProperty('fullTankPressureBar');
  });
});
