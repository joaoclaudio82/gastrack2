import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PermissionService } from '@core/auth/services/permission.service';
import { UserRole } from '@models/role.model';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let permission: { hasAnyRole: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    permission = { hasAnyRole: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: PermissionService, useValue: permission },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
  });

  it('should create', () => {
    permission.hasAnyRole.mockImplementation((roles: UserRole[]) =>
      roles.some((r) => r === UserRole.USER),
    );
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows only Monitoramento routes for a basic USER role', () => {
    permission.hasAnyRole.mockImplementation((roles: UserRole[]) =>
      roles.some((r) => r === UserRole.USER),
    );
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const links = el.querySelectorAll('nav[aria-label="Menu de navegação"] a');
    // Dashboard + Analytics (sem papel) + Pontos de Gás (USER) = 3
    expect(links.length).toBe(3);

    const groupHeaders = Array.from(el.querySelectorAll('nav p')).map((p) => p.textContent.trim());
    expect(groupHeaders).toEqual(['Monitoramento']);
  });

  it('shows Monitoramento + Gestão (no Admin da plataforma) for ADMIN', () => {
    permission.hasAnyRole.mockImplementation((roles: UserRole[]) =>
      roles.some((r) => r === UserRole.ADMIN),
    );
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const groupHeaders = Array.from(el.querySelectorAll('nav p')).map((p) => p.textContent.trim());
    expect(groupHeaders).toEqual(['Monitoramento', 'Gestão da empresa']);
    expect(groupHeaders).not.toContain('Admin da plataforma');
  });

  it('shows all three groups and every nav item for SUPER_ADMIN', () => {
    permission.hasAnyRole.mockReturnValue(true);
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const links = el.querySelectorAll('nav[aria-label="Menu de navegação"] a');
    expect(links.length).toBe(16);

    const groupHeaders = Array.from(el.querySelectorAll('nav p')).map((p) => p.textContent.trim());
    expect(groupHeaders).toEqual(['Monitoramento', 'Gestão da empresa', 'Admin da plataforma']);
  });

  /**
   * Cadastrar um casco novo obrigava a entrar por uma linha de gás que talvez nem exista —
   * o caminho direto para /admin/cylinders é de quem gere a operação, e só dele.
   */
  it('should_LinkCylinders_When_UserManagesTheOperation', () => {
    permission.hasAnyRole.mockImplementation((roles: UserRole[]) =>
      roles.some((r) => r === UserRole.ADMIN),
    );
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector('a[href="/admin/cylinders"]');
    expect(link?.textContent.trim()).toBe('Cilindros');
  });

  it('should_HideCylinders_When_UserOnlyObserves', () => {
    permission.hasAnyRole.mockImplementation((roles: UserRole[]) =>
      roles.some((r) => r === UserRole.USER),
    );
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector('a[href="/admin/cylinders"]');
    expect(link).toBeNull();
  });

  it('emits toggleCollapse when footer control is activated', () => {
    permission.hasAnyRole.mockReturnValue(true);
    fixture.componentRef.setInput('collapsed', false);
    fixture.detectChanges();

    const spy = vi.fn();
    fixture.componentInstance.toggleCollapse.subscribe(spy);

    const btn = (fixture.nativeElement as HTMLElement).querySelector('aside button[aria-expanded]');
    if (!btn) throw new Error('collapse button not found');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(spy).toHaveBeenCalled();
  });
});
