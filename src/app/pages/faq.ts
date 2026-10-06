import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FAQS } from '../core/data';
import { IconComponent } from '../shared/icon';
import { RevealDirective } from '../core/reveal.directive';

@Component({
  selector: 'app-faq',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, RevealDirective],
  template: `
    <section class="bg-leaf-dark text-white pt-24 pb-28 text-center">
      <h1 class="hero-title font-display font-extrabold text-4xl sm:text-5xl">Preguntas frecuentes</h1>
      <p appReveal class="text-white/80 mt-3 max-w-xl mx-auto px-6">Resolvemos las dudas más comunes sobre el sistema de monitoreo del café.</p>
    </section>

    <section class="mx-auto max-w-3xl px-6 -mt-16 pb-16">
      <div class="space-y-3">
        @for (f of faqs; track f.pregunta; let i = $index) {
          <div [appReveal]="i * 70" class="card overflow-hidden">
            <button class="w-full flex items-center justify-between gap-4 p-5 text-left" (click)="toggle(i)">
              <span class="font-display font-semibold text-[var(--texto)]">{{ f.pregunta }}</span>
              <span class="icono" [class.abierto]="abierta() === i"><app-icon name="plus" [size]="20" /></span>
            </button>
            <div class="resp" [style.maxHeight]="abierta() === i ? '320px' : '0'">
              <p class="px-5 pb-5 text-[var(--texto-suave)] text-sm leading-relaxed">{{ f.respuesta }}</p>
            </div>
          </div>
        }
      </div>

      <!-- Manual de usuario (PDF en public/manual/) -->
      <div appReveal class="card manual p-6 mt-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <span class="manual-icono"><app-icon name="download" [size]="26" /></span>
        <div class="flex-1">
          <h2 class="font-display font-bold text-lg text-[var(--texto)]">Manual de usuario</h2>
          <p class="text-sm text-[var(--texto-suave)] mt-1">Guía paso a paso, con imágenes, de todo el aplicativo web: sitio público, cuenta y panel del caficultor.</p>
        </div>
        <div class="flex flex-col items-center gap-2 shrink-0">
          <a href="/manual/manual-usuario.pdf" target="_blank" rel="noopener" class="btn btn-primary">
            <app-icon name="download" [size]="18" /> Descargar manual de usuario
          </a>
          <a href="/manual/manual-usuario.pdf" download="Manual de usuario - Agroindustria Cafetera.pdf" class="text-xs text-[var(--verde-primary)] hover:underline">Guardar el PDF en mi dispositivo</a>
        </div>
      </div>

      <div class="text-center mt-12">
        <p class="text-[var(--texto-suave)] mb-4">¿No encuentras tu respuesta?</p>
        <a routerLink="/contactanos" class="btn btn-primary"><app-icon name="mail" [size]="18" /> Contáctanos</a>
      </div>
    </section>
  `,
  styles: [`
    .icono { display:grid; place-items:center; width:34px; height:34px; border-radius:50%; background:var(--verde-soft); color:var(--verde-primary); flex-shrink:0; transition:transform .3s, background .3s, color .3s; }
    .icono.abierto { transform:rotate(135deg); background:var(--verde-primary); color:#fff; }
    .resp { overflow:hidden; transition:max-height .35s ease; }
    .manual { border:1.5px solid var(--verde-soft); }
    .manual-icono { display:grid; place-items:center; width:56px; height:56px; border-radius:16px; background:var(--verde-soft); color:var(--verde-primary); flex-shrink:0; }
  `],
})
export class FaqComponent {
  readonly faqs = FAQS;
  abierta = signal<number | null>(0);
  toggle(i: number) { this.abierta.update((v) => (v === i ? null : i)); }
}
