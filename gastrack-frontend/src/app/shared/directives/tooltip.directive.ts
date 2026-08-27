import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  Renderer2,
} from '@angular/core';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  readonly appTooltip = input<string>('');
  readonly tooltipPosition = input<TooltipPosition>('top');
  readonly tooltipDelay = input<number>(200);

  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  private tooltipElement: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    const text = this.appTooltip();
    if (!text) return;

    this.showTimeout = setTimeout(() => {
      this.show();
    }, this.tooltipDelay());
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hide();
  }

  @HostListener('focus')
  onFocus(): void {
    const text = this.appTooltip();
    if (!text) return;

    this.showTimeout = setTimeout(() => {
      this.show();
    }, this.tooltipDelay());
  }

  @HostListener('blur')
  onBlur(): void {
    this.hide();
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private show(): void {
    if (this.tooltipElement) return;

    const text = this.appTooltip();
    if (!text) return;

    // Create tooltip element
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.appendChild(this.tooltipElement, this.renderer.createText(text));

    // Add base styles using design system tokens
    this.renderer.addClass(this.tooltipElement, 'fixed');
    this.renderer.setStyle(this.tooltipElement, 'z-index', 'var(--z-tooltip)');
    this.renderer.addClass(this.tooltipElement, 'px-2');
    this.renderer.addClass(this.tooltipElement, 'py-1');
    this.renderer.addClass(this.tooltipElement, 'text-xs');
    this.renderer.addClass(this.tooltipElement, 'font-medium');
    this.renderer.addClass(this.tooltipElement, 'text-popover-foreground');
    this.renderer.addClass(this.tooltipElement, 'bg-popover');
    this.renderer.addClass(this.tooltipElement, 'border');
    this.renderer.addClass(this.tooltipElement, 'border-border');
    this.renderer.addClass(this.tooltipElement, 'rounded');
    this.renderer.addClass(this.tooltipElement, 'shadow-lg');
    this.renderer.addClass(this.tooltipElement, 'whitespace-nowrap');
    this.renderer.addClass(this.tooltipElement, 'pointer-events-none');

    // Add to body
    this.renderer.appendChild(document.body, this.tooltipElement);

    // Position the tooltip
    this.setPosition();
  }

  private hide(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }

    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  private setPosition(): void {
    if (!this.tooltipElement) return;

    const hostEl = this.elementRef.nativeElement as HTMLElement;
    const hostRect = hostEl.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();

    const offset = 8;
    let top = 0;
    let left = 0;

    switch (this.tooltipPosition()) {
      case 'top':
        top = hostRect.top - tooltipRect.height - offset;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + offset;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + offset;
        break;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 0) left = offset;
    if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - offset;
    }
    if (top < 0) top = offset;
    if (top + tooltipRect.height > viewportHeight) {
      top = viewportHeight - tooltipRect.height - offset;
    }

    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
  }
}
