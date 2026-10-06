import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../shared/icon';
import { PwaInstallService } from '../core/pwa-install.service';
import { NotifyService } from '../core/notify.service';

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <header class="nav-wrap" [class.scrolled]="scrolled()">
      <nav class="mx-auto max-w-7xl px-4 sm:px-6 h-[68px] flex items-center justify-between">
        <!-- Logo (imagen real de la empresa) -->
        <a routerLink="/" class="flex items-center gap-3 group">
          <span class="logo-ring">
            <img src="/img/logo_empresa.png" alt="Logo Agroindustria Cafetera" class="logo-img" />
          </span>
          <span class="leading-tight">
            <span class="block font-display font-extrabold text-white text-[15px] sm:text-[17px] tracking-tight">Agroindustria Cafetera</span>
            <span class="block text-[10px] sm:text-[11px] font-medium text-white/70 tracking-[.18em] uppercase">Monitoreo del café</span>
          </span>
        </a>

        <!-- Links escritorio -->
        <ul class="hidden md:flex items-center gap-1">
          @for (l of links; track l.path) {
            <li>
              <a [routerLink]="l.path" routerLinkActive="nav-active"
                 [routerLinkActiveOptions]="{ exact: l.path === '/' }"
                 class="nav-link">{{ l.label }}</a>
            </li>
          }
          @if (pwa.mostrarBoton()) {
            <li class="ml-2">
              <button type="button" class="btn-install" (click)="instalarApp()">
                <app-icon name="download" [size]="16" /> Descargar app
              </button>
            </li>
          }
          <li class="ml-3">
            <a routerLink="/login" class="btn-login">
              <app-icon name="user" [size]="16" /> Iniciar Sesión
            </a>
          </li>
        </ul>

        <!-- Acciones móvil -->
        <div class="md:hidden flex items-center gap-1">
          @if (pwa.mostrarBoton()) {
            <button type="button" class="btn-install-mobile" (click)="instalarApp()" aria-label="Descargar app">
              <app-icon name="download" [size]="18" />
              <span class="text-[13px] font-semibold">Descargar</span>
            </button>
          }
          <button class="text-white p-2 rounded-lg hover:bg-white/10 transition" (click)="toggle()" aria-label="Menú">
          <app-icon [name]="open() ? 'close' : 'menu'" [size]="26" />
          </button>
        </div>
      </nav>

      <!-- Menú móvil -->
      @if (open()) {
        <div class="md:hidden bg-white border-t border-black/5 anim-slide-down shadow-2xl">
          <ul class="px-4 py-3 flex flex-col gap-1">
            @for (l of links; track l.path) {
              <li>
                <a [routerLink]="l.path" (click)="close()"
                   routerLinkActive="!text-[var(--verde-primary)] !bg-[var(--verde-soft)]"
                   [routerLinkActiveOptions]="{ exact: l.path === '/' }"
                   class="block px-3 py-3 rounded-xl font-medium text-[var(--texto)] hover:bg-[var(--verde-soft)] transition">
                  {{ l.label }}</a>
              </li>
            }
            @if (pwa.mostrarBoton()) {
              <li class="pt-2">
                <button type="button" (click)="instalarApp(); close()"
                        class="btn w-full !bg-[var(--verde-soft)] !text-[var(--verde-primary-dark)] font-semibold">
                  <app-icon name="download" [size]="18" /> Descargar app
                </button>
              </li>
            }
            <li class="pt-2">
              <a routerLink="/login" (click)="close()" class="btn btn-primary w-full"><app-icon name="user" [size]="16" /> Iniciar Sesión</a>
            </li>
          </ul>
        </div>
      }
    </header>
  `,
  styles: [`
    .nav-wrap {
      position: fixed; top: 0; inset-inline: 0; z-index: 50;
      transition: background .35s ease, box-shadow .35s ease, backdrop-filter .35s ease, padding .35s ease;
      background: linear-gradient(120deg, rgba(47,169,74,.92), rgba(31,143,58,.92));
      backdrop-filter: blur(2px);
    }
    /* Al hacer scroll: vidrio esmerilado translúcido + sombra */
    .nav-wrap.scrolled {
      background: linear-gradient(120deg, rgba(20,58,34,.82), rgba(27,94,32,.86));
      backdrop-filter: blur(14px) saturate(140%);
      box-shadow: 0 10px 30px -12px rgba(0,0,0,.5);
    }

    .logo-ring {
      display: grid; place-items: center;
      width: 46px; height: 46px; border-radius: 50%;
      background: #fff;
      box-shadow: 0 6px 16px -6px rgba(0,0,0,.5), 0 0 0 3px rgba(255,255,255,.25);
      overflow: hidden; flex-shrink: 0;
      transition: transform .4s cubic-bezier(.34,1.56,.64,1);
    }
    .group:hover .logo-ring { transform: rotate(-8deg) scale(1.08); }
    .logo-img { width: 100%; height: 100%; object-fit: cover; }

    .nav-link {
      position: relative; display: inline-block;
      padding: .55rem 1rem; color: #fff; font-weight: 500; border-radius: 10px;
      transition: color .2s;
    }
    .nav-link::after {
      content: ''; position: absolute; left: 50%; bottom: 6px;
      width: 0; height: 2px; background: #fff; border-radius: 2px;
      transition: width .28s cubic-bezier(.34,1.56,.64,1); transform: translateX(-50%);
    }
    .nav-link:hover::after, .nav-active::after { width: 60%; }
    .nav-active { font-weight: 600; }

    .btn-login {
      display: inline-flex; align-items: center; gap: .45rem;
      padding: .55rem 1.25rem; border-radius: 999px; font-weight: 600;
      color: var(--verde-primary-dark); background: #fff;
      box-shadow: 0 8px 20px -8px rgba(0,0,0,.4);
      transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s, color .2s, background .2s;
    }
    .btn-login:hover { transform: translateY(-3px); box-shadow: 0 14px 26px -8px rgba(0,0,0,.45); }

    /* Botón "Descargar app" — escritorio */
    .btn-install {
      display: inline-flex; align-items: center; gap: .45rem;
      padding: .55rem 1.1rem; border-radius: 999px; font-weight: 600; cursor: pointer;
      color: #fff; background: rgba(255,255,255,.14);
      border: 1px solid rgba(255,255,255,.45);
      transition: transform .25s cubic-bezier(.34,1.56,.64,1), background .2s, box-shadow .25s;
    }
    .btn-install:hover { transform: translateY(-3px); background: rgba(255,255,255,.24); box-shadow: 0 12px 24px -10px rgba(0,0,0,.5); }

    /* Botón "Descargar" — móvil (barra superior) */
    .btn-install-mobile {
      display: inline-flex; align-items: center; gap: .35rem; cursor: pointer;
      padding: .4rem .7rem; border-radius: 999px;
      color: var(--verde-primary-dark); background: #fff;
      box-shadow: 0 6px 14px -6px rgba(0,0,0,.4);
      transition: transform .2s;
    }
    .btn-install-mobile:active { transform: scale(.95); }
  `],
})
export class PublicNavbarComponent {
  readonly links = [
    { path: '/', label: 'Inicio' },
    { path: '/nosotros', label: 'Nosotros' },
    { path: '/resenas', label: 'Opiniones' },
    { path: '/faq', label: 'Ayuda' },
    { path: '/contactanos', label: 'Contáctanos' },
  ];
  open = signal(false);
  scrolled = signal(false);

  readonly pwa = inject(PwaInstallService);
  private notify = inject(NotifyService);

  toggle() { this.open.update((v) => !v); }
  close() { this.open.set(false); }

  async instalarApp() {
    const r = await this.pwa.instalar();
    if (r.ok) {
      this.notify.exito('La app se está instalando en tu dispositivo.', '¡Genial!');
    } else if (r.mensaje) {
      this.notify.info(r.mensaje, 'Instalar la app');
    }
  }

  @HostListener('window:scroll')
  onScroll() { this.scrolled.set(window.scrollY > 20); }
}
