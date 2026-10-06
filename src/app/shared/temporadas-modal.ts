import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { TEMPORADAS } from '../core/data';
import { IconComponent } from './icon';

@Component({
  selector: 'app-temporadas-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="fixed inset-0 z-[100] grid place-items-center p-4 anim-fade-in" (click)="cerrar.emit()">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div class="relative w-full max-w-2xl rounded-3xl overflow-hidden anim-pop"
           style="background: linear-gradient(160deg, var(--verde-hero), var(--verde-hero-2));"
           (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-6 py-4 text-white">
          <h3 class="font-display font-bold text-xl">Temporadas del café</h3>
          <button (click)="cerrar.emit()" class="hover:rotate-90 transition-transform"><app-icon name="close" [size]="24" /></button>
        </div>

        <div class="relative">
          <img [src]="actual().imagen" [alt]="actual().nombre"
               class="w-full h-72 sm:h-80 object-cover anim-fade-in" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>

          <button (click)="prev()" class="arrow left-3"><span class="rotate-180 inline-block"><app-icon name="arrow" [size]="22" /></span></button>
          <button (click)="next()" class="arrow right-3"><app-icon name="arrow" [size]="22" /></button>

          <div class="absolute bottom-0 inset-x-0 p-6 text-white">
            <h4 class="font-display font-bold text-2xl mb-1">{{ actual().nombre }}</h4>
            <p class="text-white/85 text-sm max-w-lg">{{ actual().descripcion }}</p>
          </div>
        </div>

        <div class="flex justify-center gap-2 py-4">
          @for (t of temporadas; track t.clave; let i = $index) {
            <button (click)="ir(i)" class="dot" [class.dot-on]="i === idx()"></button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .arrow { position:absolute; top:50%; transform:translateY(-50%); display:grid; place-items:center; width:42px; height:42px; border-radius:50%; background:rgba(255,255,255,.2); color:#fff; backdrop-filter:blur(4px); transition:.25s; }
    .arrow:hover { background:#fff; color:var(--verde-primary); transform:translateY(-50%) scale(1.1); }
    .dot { width:10px; height:10px; border-radius:50%; background:rgba(46,125,50,.3); transition:.3s; }
    .dot-on { background:var(--verde-primary); width:26px; border-radius:6px; }
  `],
})
export class TemporadasModalComponent {
  @Output() cerrar = new EventEmitter<void>();
  readonly temporadas = TEMPORADAS;
  idx = signal(0);
  actual = () => this.temporadas[this.idx()];
  next() { this.idx.update((i) => (i + 1) % this.temporadas.length); }
  prev() { this.idx.update((i) => (i - 1 + this.temporadas.length) % this.temporadas.length); }
  ir(i: number) { this.idx.set(i); }
}
