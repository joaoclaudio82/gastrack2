import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '@core/auth/services/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  readonly appHasRole = input.required<string | string[]>();

  constructor() {
    effect(() => {
      const roles = this.appHasRole();
      const rolesArray = Array.isArray(roles) ? roles : [roles];

      this.viewContainer.clear();

      if (this.authService.hasAnyRole(rolesArray)) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
