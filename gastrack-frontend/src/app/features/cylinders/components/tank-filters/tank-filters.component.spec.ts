import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { SelectOption } from '@shared/components/ui/select/select.component';
import { TankFiltersComponent } from './tank-filters.component';

/**
 * `/companies/active` é SUPER_ADMIN-only: quem opera uma empresa só recebia a lista vazia e
 * sobrava um filtro "Empresa" com "Todas as empresas" e nada mais para escolher.
 */
describe('TankFiltersComponent', () => {
  let fixture: ComponentFixture<TankFiltersComponent>;

  function render(companyOptions: SelectOption[]): HTMLElement {
    fixture.componentRef.setInput('companyOptions', companyOptions);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function companyLabels(el: HTMLElement): string[] {
    return Array.from(el.querySelectorAll('label')).map((l) => l.textContent.trim());
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TankFiltersComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TankFiltersComponent);
  });

  it('should_HideCompanyFilter_When_OnlyPlaceholderOptionExists', () => {
    const el = render([{ label: 'Todas as empresas', value: null }]);

    expect(companyLabels(el)).not.toContain('Empresa');
  });

  it('should_ShowCompanyFilter_When_ThereIsMoreThanOneCompany', () => {
    const el = render([
      { label: 'Todas as empresas', value: null },
      { label: 'Empresa A', value: 1 },
      { label: 'Empresa B', value: 2 },
    ]);

    expect(companyLabels(el)).toContain('Empresa');
  });

  it('should_KeepEmittingFilters_When_CompanyFilterIsHidden', () => {
    render([{ label: 'Todas as empresas', value: null }]);
    const emitted: unknown[] = [];
    fixture.componentInstance.filtersChange.subscribe((f) => emitted.push(f));

    fixture.componentInstance.clearFilters();

    expect(emitted).toEqual([{ searchTerm: '', addressId: null, companyId: null }]);
  });
});
