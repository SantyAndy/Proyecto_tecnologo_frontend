import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon';

/** Estructura partida: panel verde de bienvenida + contenido de formulario (ng-content). */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="min-h-screen grid lg:grid-cols-2">
      <!-- Panel bienvenida -->
      <aside class="bg-auth-leaf text-white relative overflow-hidden hidden lg:flex flex-col justify-center px-12">
        <div class="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-[var(--verde-accent)]/20 blur-3xl anim-float"></div>
        <a routerLink="/" class="flex items-center gap-3 mb-10 relative">
          <span class="logo-badge"><img src="/img/logo_empresa.png" alt="Logo" /></span>
          <span class="font-display font-bold">Agroindustria Cafetera</span>
        </a>
        <p class="text-[var(--verde-accent)] font-medium anim-fade-up">Gusto en tenerlos acá</p>
        <h1 class="hero-title font-display font-extrabold text-5xl mt-1 d-1">Bienvenidos</h1>
        <ul class="mt-8 space-y-3 anim-fade-up d-2">
          @for (f of features; track f) {
            <li class="flex items-center gap-3 text-white/85">
              <app-icon name="check" [size]="20" /> {{ f }}
            </li>
          }
        </ul>
      </aside>

      <!-- Formulario -->
      <main class="relative flex items-center justify-center px-6 py-12 bg-white">
        <!-- Botón volver al inicio -->
        <a routerLink="/" class="back-home">
          <app-icon name="home" [size]="18" /> <span class="hidden sm:inline">Volver al inicio</span>
        </a>
        <div class="w-full max-w-md anim-fade-up">
          <a routerLink="/" class="lg:hidden flex items-center justify-center gap-2 mb-8 text-[var(--verde-primary)]">
            <span class="logo-badge"><img src="/img/logo_empresa.png" alt="Logo" /></span>
            <span class="font-display font-bold">Agroindustria Cafetera</span>
          </a>
          @if (icono) {
            <div class="grid place-items-center mb-4">
              <span class="icon-badge !w-16 !h-16"><app-icon [name]="icono" [size]="32" /></span>
            </div>
          }
          <h2 class="font-display font-extrabold text-3xl text-center text-[var(--verde-primary)]">{{ titulo }}</h2>
          @if (subtitulo) { <p class="text-center text-[var(--texto-suave)] text-sm mt-2">{{ subtitulo }}</p> }
          <div class="mt-7">
            <ng-content />
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .logo-badge { display:grid; place-items:center; width:44px; height:44px; border-radius:50%; background:#fff; overflow:hidden; box-shadow:0 0 0 3px rgba(255,255,255,.25); flex-shrink:0; }
    .logo-badge img { width:100%; height:100%; object-fit:cover; }
    .back-home {
      position:absolute; top:1.25rem; right:1.25rem; display:inline-flex; align-items:center; gap:.4rem;
      padding:.5rem .9rem; border-radius:999px; font-weight:600; font-size:.85rem;
      color:var(--verde-primary); background:var(--verde-soft); border:1.5px solid transparent;
      transition:transform .25s, border-color .2s, background .2s;
    }
    .back-home:hover { transform:translateY(-2px); border-color:var(--verde-primary); }
  `],
})
export class AuthShellComponent {
  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() icono = '';
  readonly features = [
    'Diagnóstico del pH de tu suelo',
    'Recomendaciones personalizadas',
    'Guía para corregir niveles de pH',
    'Información científica y actualizada sobre nutrición vegetal',
  ];
}
