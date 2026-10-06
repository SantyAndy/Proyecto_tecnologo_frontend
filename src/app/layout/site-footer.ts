import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { IconComponent } from '../shared/icon';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <footer class="footer text-white">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <!-- Marca + redes -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/15">
          <div class="flex items-center gap-3">
            <span class="logo-badge"><img src="/img/logo_empresa.png" alt="Logo" /></span>
            <span class="font-display font-bold text-lg">Agroindustria Cafetera</span>
          </div>
          <div class="flex items-center gap-3">
            <a class="soc" href="#" aria-label="Facebook"><app-icon name="facebook" [size]="18" /></a>
            <a class="soc" href="#" aria-label="X"><app-icon name="x" [size]="18" /></a>
            <a class="soc" href="#" aria-label="Instagram"><app-icon name="instagram" [size]="18" /></a>
          </div>
        </div>

        <!-- Columnas (acordeón en móvil) -->
        <div class="grid sm:grid-cols-3 gap-2 sm:gap-8 pt-6">
          @for (col of columnas; track col.titulo) {
            <div class="border-b border-white/10 sm:border-0">
              <button class="w-full flex items-center justify-between py-3 sm:cursor-default sm:py-0 sm:mb-3"
                      (click)="toggle(col.titulo)">
                <span class="font-semibold font-display">{{ col.titulo }}</span>
                <span class="sm:hidden"><app-icon [name]="abierta() === col.titulo ? 'close' : 'plus'" [size]="18" /></span>
              </button>
              <ul class="overflow-hidden transition-all duration-300 sm:!max-h-none"
                  [style.maxHeight]="abierta() === col.titulo ? '300px' : '0'"
                  [class.pb-3]="abierta() === col.titulo">
                @for (item of col.items; track item) {
                  <li><a href="#" class="block py-1.5 text-white/80 hover:text-white hover:translate-x-1 transition text-sm">{{ item }}</a></li>
                }
              </ul>
            </div>
          }
        </div>
      </div>

      <div class="bg-black/20 text-center text-xs text-white/70 py-4 px-4">
        © Fundación Escuela Tecnológica (FET) · Desarrolladores: Daniel Rojas y Santiago Losada · Políticas de privacidad — Términos y Condiciones
      </div>
    </footer>
  `,
  styles: [`
    .footer { background: linear-gradient(120deg, var(--verde-header), var(--verde-header-2)); }
    .logo-badge { display:grid; place-items:center; width:44px; height:44px; border-radius:50%; background:#fff; overflow:hidden; box-shadow:0 0 0 3px rgba(255,255,255,.2); }
    .logo-badge img { width:100%; height:100%; object-fit:cover; }
    .soc { display:grid; place-items:center; width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,.16); color:#fff; transition:transform .3s, background .3s; }
    .soc:hover { background:#fff; color:var(--verde-primary); transform:translateY(-4px) scale(1.1); }
  `],
})
export class SiteFooterComponent {
  readonly columnas = [
    { titulo: 'Información', items: ['Políticas y privacidad', 'Términos y condiciones', 'Testimonios de clientes'] },
    { titulo: 'Recursos', items: ['Guía de uso para el pH del suelo', 'Guía de interpretación del suelo', 'Blog / Artículos educativos'] },
    { titulo: 'Soporte', items: ['Preguntas frecuentes (FAQ)', 'Newsletter / Suscripción', 'Actualizaciones'] },
  ];
  abierta = signal<string | null>(null);
  toggle(t: string) { this.abierta.update((v) => (v === t ? null : t)); }
}
