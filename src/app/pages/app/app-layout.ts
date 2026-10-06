import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DJANGO_ADMIN_URL } from '../../core/api.config';
import { AppState } from '../../core/app-state';
import { IconComponent } from '../../shared/icon';
import { SiteFooterComponent } from '../../layout/site-footer';
import { FincasModalComponent } from './fincas-modal';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, SiteFooterComponent, FincasModalComponent],
  template: `
    <header class="topbar">
      <nav class="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <button class="md:hidden text-white p-2" (click)="open.update(v=>!v)" aria-label="Menú">
          <app-icon [name]="open() ? 'close' : 'menu'" [size]="26" />
        </button>

        <div class="flex items-center gap-2">
          <span class="logo-badge"><img src="/img/logo_empresa.png" alt="Logo" /></span>
          <span class="hidden sm:block font-display font-bold text-white text-sm leading-tight">
            Datos Sensores<span class="block text-[11px] font-normal text-white/75">{{ state.nombreFincaActiva() }}</span>
          </span>
        </div>

        <div class="flex items-center gap-2">
        <ul class="hidden md:flex items-center gap-1">
          @for (l of links; track l.path) {
            <li><a [routerLink]="l.path" routerLinkActive="nav-active" class="nav-link inline-flex items-center gap-1.5"><app-icon [name]="l.icono" [size]="16" /> {{ l.label }}</a></li>
          }
          <li><button (click)="abrirFincas()" class="nav-link inline-flex items-center gap-1.5"><app-icon name="pin" [size]="16" /> Cambiar finca</button></li>
          <li><a routerLink="/resenas" class="nav-link inline-flex items-center gap-1.5"><app-icon name="star" [size]="16" /> Mi reseña</a></li>

          <!-- Menú de 3 puntos: área de administración -->
          @if (state.esAdmin()) {
            <li class="relative">
              <button (click)="toggleKebab()" class="kebab-btn" [class.activo]="kebab()" title="Áreas principales">
                <app-icon name="dots" [size]="20" />
              </button>
              @if (kebab()) {
                <div class="kebab-menu anim-slide-down">
                  @if (state.esAdmin()) {
                    <button class="kebab-head" (click)="toggleGrupo('adm')">
                      <span class="inline-flex items-center gap-2"><app-icon name="shield" [size]="17" /> Administrador</span>
                      <app-icon name="chevron" [size]="16" class="chev" [class.rot]="grupo()==='adm'" />
                    </button>
                    @if (grupo()==='adm') {
                      @for (s of admSecciones; track s.q) {
                        <a routerLink="/admin" [queryParams]="{ recurso: s.q }" (click)="cerrarKebab()" class="kebab-item">{{ s.label }}</a>
                      }
                    }
                  }
                  @if (state.esSuperusuario()) {
                    <a [href]="djangoAdminUrl" target="_blank" rel="noopener" (click)="cerrarKebab()" class="kebab-head">
                      <span class="inline-flex items-center gap-2"><app-icon name="shield" [size]="17" /> Entrar a Django</span>
                    </a>
                  }
                </div>
              }
            </li>
          }

          <li class="ml-2"><button (click)="salir()" class="btn btn-danger !py-2 !px-5"><app-icon name="logout" [size]="16" /> Cerrar sesión</button></li>
        </ul>
        </div>
      </nav>

      @if (open()) {
        <div class="md:hidden bg-white anim-slide-down shadow-xl">
          <ul class="px-4 py-3 flex flex-col gap-1">
            @for (l of links; track l.path) {
              <li><a [routerLink]="l.path" (click)="open.set(false)" routerLinkActive="!text-[var(--verde-primary)] !bg-[var(--verde-soft)]"
                     class="flex items-center gap-2.5 px-3 py-3 rounded-xl font-medium hover:bg-[var(--verde-soft)]"><app-icon [name]="l.icono" [size]="18" /> {{ l.label }}</a></li>
            }
            <li><button (click)="abrirFincas(); open.set(false)" class="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl font-medium hover:bg-[var(--verde-soft)]"><app-icon name="pin" [size]="18" /> Cambiar finca</button></li>
            <li><a routerLink="/resenas" (click)="open.set(false)" class="flex items-center gap-2.5 px-3 py-3 rounded-xl font-medium hover:bg-[var(--verde-soft)]"><app-icon name="star" [size]="18" /> Mi reseña</a></li>

            <!-- Áreas principales (fondo oscuro) -->
            @if (state.esAdmin()) {
              <li class="movil-principal">
                <button class="movil-head" (click)="toggleGrupo('adm')">
                  <span class="inline-flex items-center gap-2.5"><app-icon name="shield" [size]="18" /> Administrador</span>
                  <app-icon name="chevron" [size]="16" class="chev" [class.rot]="grupo()==='adm'" />
                </button>
                @if (grupo()==='adm') {
                  @for (s of admSecciones; track s.q) {
                    <a routerLink="/admin" [queryParams]="{ recurso: s.q }" (click)="open.set(false)" class="movil-sub">{{ s.label }}</a>
                  }
                }
              </li>
            }
            @if (state.esSuperusuario()) {
              <li class="movil-principal">
                <a [href]="djangoAdminUrl" target="_blank" rel="noopener" (click)="open.set(false)" class="movil-head">
                  <span class="inline-flex items-center gap-2.5"><app-icon name="shield" [size]="18" /> Entrar a Django</span>
                </a>
              </li>
            }
            <li class="pt-2"><button (click)="salir()" class="btn btn-danger w-full"><app-icon name="logout" [size]="16" /> Cerrar sesión</button></li>
          </ul>
        </div>
      }
    </header>

    <main class="min-h-[70vh] bg-[var(--crema)]"><router-outlet /></main>
    <app-site-footer />

    @if (mostrarFincas()) {
      <app-fincas-modal (cerrar)="mostrarFincas.set(false)" (confirmada)="mostrarFincas.set(false)" />
    }
  `,
  styles: [`
    .topbar { position:sticky; top:0; z-index:50; background:linear-gradient(120deg, var(--verde-header), var(--verde-header-2)); box-shadow:0 4px 18px -8px rgba(0,0,0,.35); }
    .logo-badge { display:grid; place-items:center; width:40px; height:40px; border-radius:50%; background:#fff; overflow:hidden; box-shadow:0 0 0 2px rgba(255,255,255,.25); }
    .logo-badge img { width:100%; height:100%; object-fit:cover; }
    .nav-link { position:relative; padding:.4rem .6rem; color:#fff; font-weight:500; font-size:.82rem; border-radius:10px; background:transparent; border:none; cursor:pointer; transition:background .2s; white-space:nowrap; }
    .nav-link app-icon svg { width:15px; height:15px; }
    .nav-link::after { content:''; position:absolute; left:50%; bottom:4px; width:0; height:2px; background:#fff; transition:.25s; transform:translateX(-50%); border-radius:2px; }
    .nav-link:hover::after, .nav-active::after { width:55%; }

    /* Menú de 3 puntos (áreas principales) */
    .kebab-btn { display:grid; place-items:center; width:38px; height:38px; border-radius:10px; color:#fff; background:rgba(0,0,0,.28); border:none; cursor:pointer; transition:background .2s, transform .2s; }
    .kebab-btn:hover, .kebab-btn.activo { background:rgba(0,0,0,.5); transform:translateY(-1px); }
    .kebab-menu {
      position:absolute; right:0; top:calc(100% + 10px); z-index:60; width:248px;
      background:linear-gradient(160deg, var(--verde-hero), var(--verde-hero-2));
      border:1px solid rgba(255,255,255,.1); border-radius:1rem; padding:.5rem;
      box-shadow:0 18px 44px -12px rgba(0,0,0,.6);
    }
    .kebab-head {
      width:100%; display:flex; align-items:center; justify-content:space-between;
      padding:.65rem .8rem; border-radius:.7rem; color:#fff; font-weight:600; font-size:.9rem;
      background:rgba(255,255,255,.06); border:none; cursor:pointer; margin-bottom:.25rem; transition:background .2s;
    }
    .kebab-head:hover { background:rgba(255,255,255,.14); }
    .kebab-item { display:block; padding:.5rem .8rem .5rem 2.1rem; color:rgba(255,255,255,.82); font-size:.85rem; border-radius:.6rem; transition:background .2s, color .2s; }
    .kebab-item:hover { background:rgba(255,255,255,.12); color:#fff; }
    .chev { transition:transform .25s; }
    .chev.rot { transform:rotate(180deg); }

    /* Versión móvil de las áreas principales (fondo oscuro) */
    .movil-principal { background:linear-gradient(160deg, var(--verde-hero), var(--verde-hero-2)); border-radius:.9rem; margin:.15rem 0; overflow:hidden; }
    .movil-head { width:100%; display:flex; align-items:center; justify-content:space-between; padding:.8rem 1rem; color:#fff; font-weight:600; background:transparent; border:none; cursor:pointer; }
    .movil-sub { display:block; padding:.55rem 1rem .55rem 2.6rem; color:rgba(255,255,255,.85); font-size:.9rem; }
    .movil-sub:hover { background:rgba(255,255,255,.12); }
  `],
})
export class AppLayoutComponent {
  state = inject(AppState);
  private router = inject(Router);
  readonly links = [
    { path: '/app/historial', label: 'Historial', icono: 'clock' },
    { path: '/app/datos', label: 'Datos', icono: 'chart' },
    { path: '/app/dispositivos', label: 'Dispositivos', icono: 'chip' },
    { path: '/app/sugerencias', label: 'Sugerencias', icono: 'leaf' },
    { path: '/app/diagnostico', label: 'Diagnóstico IA', icono: 'brain' },
  ];
  readonly admSecciones = [
    { label: 'Fincas', q: 'fincas' },
    { label: 'Dispositivos', q: 'arduinos' },
    { label: 'Lecturas', q: 'datos' },
    { label: 'Tipos de abono', q: 'tipo-abonos' },
    { label: 'Imágenes de abono', q: 'abono-imagenes' },
    { label: 'Productos', q: 'productos' },
    { label: 'Usuarios', q: 'usuarios' },
  ];

  open = signal(false);
  kebab = signal(false);
  grupo = signal<'adm' | null>(null);
  // Abre el modal de fincas al entrar si todavía no hay finca seleccionada.
  mostrarFincas = signal(!this.state.fincaActiva());

  toggleKebab() { this.kebab.update((v) => !v); if (!this.kebab()) this.grupo.set(null); }
  cerrarKebab() { this.kebab.set(false); this.grupo.set(null); }
  toggleGrupo(g: 'adm') { this.grupo.update((v) => (v === g ? null : g)); }

  abrirFincas() { this.mostrarFincas.set(true); }
  readonly djangoAdminUrl = DJANGO_ADMIN_URL;
  salir() { this.state.cerrarSesion(); this.router.navigate(['/']); }
}
