import { afterNextRender, Directive, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly appAutoFocus = input<boolean>(true);

  constructor() {
    afterNextRender(() => {
      if (this.appAutoFocus()) {
        this.elementRef.nativeElement.focus();
      }
    });
  }
}
