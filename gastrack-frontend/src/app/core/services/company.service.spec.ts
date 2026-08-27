import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CompanyService } from './company.service';
import { ConfigService } from './config.service';

/**
 * Regressão: `/companies/active` é paginado e era chamado sem `size`. O dropdown mostrava só as
 * 20 empresas mais recentes e omitia o resto — sem erro, sem aviso, sem jeito de perceber.
 */
describe('CompanyService', () => {
  let service: CompanyService;
  let http: HttpTestingController;
  const baseUrl = 'http://test/api/v1';

  function page(items: { id: number; name: string }[], totalPages: number) {
    return { content: items, totalPages, total: items.length, page: 0, pageSize: 100 };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { apiUrl: baseUrl } },
        CompanyService,
      ],
    });
    service = TestBed.inject(CompanyService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should_LoadEveryPage_When_ActiveCompaniesSpanMoreThanOne', () => {
    service.getActive();

    const first = http.expectOne(
      (r) => r.url === `${baseUrl}/companies/active` && r.params.get('page') === '0',
    );
    expect(first.request.params.get('size')).toBe('100');
    first.flush(page([{ id: 1, name: 'Empresa 1' }], 2));

    const second = http.expectOne(
      (r) => r.url === `${baseUrl}/companies/active` && r.params.get('page') === '1',
    );
    second.flush(page([{ id: 2, name: 'Empresa 2' }], 2));

    expect(service.activeCompanies().map((c) => c.id)).toEqual([1, 2]);
  });

  it('should_NotAskForASecondPage_When_EverythingFitsInTheFirst', () => {
    service.getActive();

    http
      .expectOne((r) => r.url === `${baseUrl}/companies/active` && r.params.get('page') === '0')
      .flush(page([{ id: 1, name: 'Empresa 1' }], 1));

    expect(service.activeCompanies().map((c) => c.id)).toEqual([1]);
    http.expectNone((r) => r.params.get('page') === '1');
  });

  /** O endpoint já respondeu lista pura em versões anteriores; o cliente não pode quebrar. */
  it('should_AcceptAPlainArray_When_EndpointDoesNotPaginate', () => {
    service.getActive();

    http
      .expectOne((r) => r.url === `${baseUrl}/companies/active`)
      .flush([{ id: 3, name: 'Empresa 3' }]);

    expect(service.activeCompanies().map((c) => c.id)).toEqual([3]);
  });
});
