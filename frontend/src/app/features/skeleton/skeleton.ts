import { Component, input } from '@angular/core';

/** A grey shimmering placeholder. Size it with width / height / radius. */
@Component({
  selector: 'app-skeleton',
  template: '',
  styles: `
    :host {
      display: block;
      width: var(--sk-w, 100%);
      height: var(--sk-h, 16px);
      border-radius: var(--sk-r, 8px);
      background: linear-gradient(
        90deg,
        var(--mat-sys-surface-container-high) 25%,
        var(--mat-sys-surface-container-highest) 37%,
        var(--mat-sys-surface-container-high) 63%
      );
      background-size: 400% 100%;
      animation: shimmer 1.4s ease infinite;
    }
    @keyframes shimmer {
      0% { background-position: 100% 50%; }
      100% { background-position: 0 50%; }
    }
    @media (prefers-reduced-motion: reduce) {
      :host { animation: none; }
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[style.--sk-w]': 'width()',
    '[style.--sk-h]': 'height()',
    '[style.--sk-r]': 'radius()',
  },
})
export class Skeleton {
  width = input('100%');
  height = input('16px');
  radius = input('8px');
}