import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { cn } from '@shared/lib';

type PopoverAlign = 'start' | 'center' | 'end';
type PopoverSide = 'top' | 'bottom';

@Component({
  selector: 'app-popover',
  standalone: true,
  imports: [CdkOverlayOrigin, CdkConnectedOverlay],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative inline-block" cdkOverlayOrigin #trigger="cdkOverlayOrigin">
      <div
        role="button"
        tabindex="0"
        (click)="toggle()"
        (keydown.enter)="toggle()"
        (keydown.space)="toggle()"
      >
        <ng-content select="[popover-trigger]" />
      </div>
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayPositions]="positions()"
      [cdkConnectedOverlayHasBackdrop]="closeOnOutsideClick()"
      [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
      (backdropClick)="close()"
    >
      <div [class]="popoverClasses()" role="dialog" aria-modal="true">
        <ng-content />
      </div>
    </ng-template>
  `,
  styles: `
    @keyframes fade-in-0 {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes zoom-in-95 {
      from {
        transform: scale(0.95);
      }
      to {
        transform: scale(1);
      }
    }
    .animate-in {
      animation:
        fade-in-0 150ms ease-out,
        zoom-in-95 150ms ease-out;
    }
  `,
})
export class PopoverComponent {
  readonly align = input<PopoverAlign>('start');
  readonly side = input<PopoverSide>('bottom');
  readonly class = input<string>('');
  readonly open = input<boolean | undefined>(undefined);
  readonly closeOnOutsideClick = input<boolean>(true);

  readonly openChange = output<boolean>();
  readonly closed = output();

  private readonly internalOpen = signal(false);

  readonly isOpen = computed(() => {
    return this.open() ?? this.internalOpen();
  });

  protected readonly popoverClasses = computed(() =>
    cn(
      'rounded-sm border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none animate-in',
      this.class(),
    ),
  );

  protected readonly positions = computed((): ConnectedPosition[] => {
    const align = this.align();
    const side = this.side();

    const originX = align === 'start' ? 'start' : align === 'end' ? 'end' : 'center';
    const overlayX = originX;

    if (side === 'bottom') {
      return [
        { originX, originY: 'bottom', overlayX, overlayY: 'top', offsetY: 8 },
        { originX, originY: 'top', overlayX, overlayY: 'bottom', offsetY: -8 },
      ];
    }
    return [
      { originX, originY: 'top', overlayX, overlayY: 'bottom', offsetY: -8 },
      { originX, originY: 'bottom', overlayX, overlayY: 'top', offsetY: 8 },
    ];
  });

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.openPopover();
    }
  }

  openPopover(): void {
    this.internalOpen.set(true);
    this.openChange.emit(true);
  }

  close(): void {
    this.internalOpen.set(false);
    this.openChange.emit(false);
    this.closed.emit();
  }
}
