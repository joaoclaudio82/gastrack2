import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComboboxComponent, type ComboboxOption } from './combobox.component';

const OPTIONS: ComboboxOption[] = [
  { label: 'Banana', value: 1 },
  { label: 'Maçã', value: 2 },
  { label: 'Abacaxi', value: 3 },
];

describe('ComboboxComponent', () => {
  let fixture: ComponentFixture<ComboboxComponent>;
  // Acesso a membros protegidos (signals/computed) para o teste.
  let c: {
    writeValue: (v: string | number | null) => void;
    searchQuery: { set: (v: string) => void };
    filteredOptions: () => ComboboxOption[];
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComboboxComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ComboboxComponent);
    fixture.componentRef.setInput('options', OPTIONS);
    c = fixture.componentInstance as unknown as typeof c;
    fixture.detectChanges();
  });

  it('shows ALL options after a value is selected (not just the selected one)', () => {
    // writeValue simula seleção: searchQuery vira o label do item.
    c.writeValue(2);
    fixture.detectChanges();
    // Regressão #5: antes filtrava até sobrar só "Maçã".
    expect(c.filteredOptions().map((o) => o.value)).toEqual([1, 2, 3]);
  });

  it('still filters when the user types a real search query', () => {
    c.writeValue(2);
    c.searchQuery.set('aba'); // busca digitada, diferente do label selecionado
    fixture.detectChanges();
    expect(c.filteredOptions().map((o) => o.value)).toEqual([3]);
  });
});
