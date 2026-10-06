import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Muestra una calificación con estrellas (admite medias estrellas: 4.5 → 90%). */
@Component({
  selector: 'app-stars',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="wrap" [attr.title]="rating + ' de 5'">
      <span class="layer base">
        @for (s of estrellas; track s) {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24"><path d="M12 2l2.9 6.26 6.9.55-5.23 4.52 1.57 6.74L12 17.27 6.86 20.6l1.57-6.74L3.2 9.36l6.9-.55z"/></svg>
        }
      </span>
      <span class="layer fill" [style.width.%]="(rating / 5) * 100">
        @for (s of estrellas; track s) {
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24"><path d="M12 2l2.9 6.26 6.9.55-5.23 4.52 1.57 6.74L12 17.27 6.86 20.6l1.57-6.74L3.2 9.36l6.9-.55z"/></svg>
        }
      </span>
    </span>
  `,
  styles: [`
    .wrap { position: relative; display: inline-block; line-height: 0; white-space: nowrap; }
    .layer { display: flex; gap: 2px; line-height: 0; }
    .layer svg { display: block; flex: none; }
    .base svg { fill: #e2e2e2; }
    .fill {
      position: absolute;
      top: 0; left: 0;
      overflow: hidden;
    }
    .fill svg { fill: #f5a623; }
  `],
})
export class StarsComponent {
  @Input() rating = 0;
  @Input() size = 20;
  readonly estrellas = [1, 2, 3, 4, 5];
}
