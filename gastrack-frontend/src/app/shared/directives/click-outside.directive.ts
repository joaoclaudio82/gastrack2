import { afterNextRender, DestroyRef, Directive, ElementRef, inject, output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly appClickOutside = output<MouseEvent>();

  constructor() {
    afterNextRender(() => {
      const clickHandler = this.onClick.bind(this);
      document.addEventListener('click', clickHandler);

      // Remove event listener when directive is destroyed
      this.destroyRef.onDestroy(() => {
        document.removeEventListener('click', clickHandler);
      });
    });
  }

  private onClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.appClickOutside.emit(event);
    }
  }
}
