import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PASOS, SERVICIOS, VENTAJAS } from '../core/data';
import { ResumenResenas } from '../core/models';
import { ResenaService } from '../core/resena.service';
import { IconComponent } from '../shared/icon';
import { StarsComponent } from '../shared/stars';
import { RevealDirective } from '../core/reveal.directive';
import { TemporadasModalComponent } from '../shared/temporadas-modal';

@Component({
  selector: 'app-inicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, StarsComponent, RevealDirective, TemporadasModalComponent],
  template: `
    <!-- HERO -->
    <section class="relative bg-hero-coffee min-h-[78vh] flex items-center text-white overflow-hidden">
      <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[var(--verde-accent)]/20 blur-3xl anim-float"></div>
      <div class="mx-auto max-w-7xl px-6 py-24 relative">
        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-sm font-medium anim-fade-up">
          <app-icon name="leaf" [size]="16" /> Nuestro compromiso con la calidad y la sostenibilidad
        </span>
        <h1 class="hero-title font-display font-extrabold text-4xl sm:text-6xl mt-5 max-w-3xl leading-tight d-1">
          Sector Agroindustria Cafetera
        </h1>
        <p class="mt-5 max-w-xl text-white/85 text-lg anim-fade-up d-2">
          Monitoreo en tiempo real del suelo —pH, humedad y temperatura— y diagnóstico de enfermedades del café con inteligencia artificial, para mejorar la productividad y calidad de tus cultivos.
        </p>
        <div class="mt-8 flex flex-wrap gap-4 anim-fade-up d-3">
          <a routerLink="/login" class="btn btn-primary">Iniciar Sesión <app-icon name="arrow" [size]="18" /></a>
          <a routerLink="/nosotros" class="btn btn-ghost">Conócenos</a>
        </div>
      </div>
    </section>

    <!-- SERVICIOS -->
    <section class="mx-auto max-w-7xl px-6 py-20">
      <h2 appReveal class="section-title font-display font-extrabold text-3xl sm:text-4xl text-[var(--verde-primary)] mb-3">Nuestros Servicios</h2>
      <p appReveal class="text-[var(--texto-suave)] mb-10 max-w-xl">Soluciones tecnológicas para el manejo del suelo y la sanidad de tus cultivos de café.</p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (s of servicios; track s.titulo; let i = $index) {
          <article [appReveal]="i * 120" class="card card-hover p-7">
            <span class="icon-badge"><app-icon [name]="s.icono" [size]="26" /></span>
            <h3 class="font-display font-bold text-xl mt-5 mb-2">{{ s.titulo }}</h3>
            <p class="text-[var(--texto-suave)] text-sm leading-relaxed">{{ s.descripcion }}</p>
          </article>
        }
      </div>
    </section>

    <!-- ¿POR QUÉ EL CAFÉ? -->
    <section class="bg-[var(--verde-soft)] py-20">
      <div class="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-10 items-center">
        <img appReveal src="/img/cafe.png"
             alt="Café" class="rounded-3xl shadow-xl w-full h-80 object-cover" />
        <div appReveal="120">
          <h2 class="section-title font-display font-extrabold text-3xl text-[var(--verde-primary)] mb-4">¿Por qué el café?</h2>
          <p class="text-[var(--texto-suave)] leading-relaxed">
            El café no solo es una de las bebidas más consumidas del mundo, también es el motor económico de miles de familias caficultoras. Cuidar el suelo y monitorear sus condiciones es clave para una cosecha de alta calidad.
          </p>
        </div>
      </div>
    </section>

    <!-- ¿CÓMO FUNCIONA? -->
    <section class="bg-[var(--verde-soft)] py-20">
      <div class="mx-auto max-w-7xl px-6">
        <h2 appReveal class="section-title text-center font-display font-extrabold text-3xl sm:text-4xl text-[var(--verde-primary)] mb-12 mx-auto block w-fit">¿Cómo funciona?</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          @for (p of pasos; track p.titulo; let i = $index) {
            <div [appReveal]="i * 130" class="card p-7 text-center relative z-10">
              <span class="icon-badge mx-auto"><app-icon [name]="p.icono" [size]="28" /></span>
              <h3 class="font-display font-bold text-lg mt-4 mb-2">{{ p.titulo }}</h3>
              <p class="text-[var(--texto-suave)] text-sm leading-relaxed">{{ p.texto }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ¿POR QUÉ ELEGIRNOS? -->
    <section class="mx-auto max-w-7xl px-6 py-20">
      <h2 appReveal class="section-title text-center font-display font-extrabold text-3xl sm:text-4xl text-[var(--verde-primary)] mb-10 mx-auto block w-fit">¿Por qué elegirnos?</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (v of ventajas; track v.titulo; let i = $index) {
          <div [appReveal]="i * 100" class="card card-hover p-6 text-center">
            <span class="icon-badge mx-auto"><app-icon [name]="v.icono" [size]="26" /></span>
            <h3 class="font-display font-bold mt-4 mb-2">{{ v.titulo }}</h3>
            <p class="text-[var(--texto-suave)] text-sm">{{ v.descripcion }}</p>
          </div>
        }
      </div>
    </section>

    <!-- CALIDAD DE LA PÁGINA -->
    <section class="mx-auto max-w-7xl px-6 py-20">
      <h2 appReveal class="section-title text-center font-display font-extrabold text-3xl sm:text-4xl text-[var(--verde-primary)] mb-12 mx-auto block w-fit">Calidad de la página</h2>
      <div appReveal class="card max-w-2xl mx-auto p-10 text-center">
        @if (resumen(); as r) {
          <div class="font-display font-extrabold text-7xl text-[var(--verde-primary)]">{{ r.porcentaje }}%</div>
          <div class="flex justify-center my-4"><app-stars [rating]="r.promedio" [size]="32" /></div>
          <p class="text-[var(--texto-suave)]">Promedio de <b>{{ r.promedio }}</b> de 5 · basado en <b>{{ r.total }}</b> opinión(es) de caficultores.</p>
        } @else {
          <div class="font-display font-extrabold text-7xl text-[var(--verde-primary)]">★</div>
          <p class="text-[var(--texto-suave)] mt-3">Aún no hay opiniones. ¡Sé el primero en calificar!</p>
        }
        <a routerLink="/resenas" class="btn btn-primary mt-7">Ver más opiniones <app-icon name="arrow" [size]="18" /></a>
      </div>
    </section>

    <!-- TEMPORADAS + STATS -->
    <section class="bg-leaf-dark text-white py-20">
      <div class="mx-auto max-w-7xl px-6 text-center">
        <h2 appReveal class="section-title text-center font-display font-extrabold text-3xl sm:text-4xl mb-3 mx-auto block w-fit">Temporadas</h2>
        <p appReveal class="text-white/80 max-w-xl mx-auto mb-8">El café pasa por diferentes etapas que determinan su calidad, productividad y sabor único…</p>
        <button appReveal (click)="mostrarModal.set(true)" class="btn btn-primary mb-14">
          <app-icon name="coffee" [size]="18" /> Ver temporadas del café
        </button>

        <div class="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
          @for (st of stats; track st.label; let i = $index) {
            <div [appReveal]="i * 120">
              <div class="font-display font-extrabold text-4xl sm:text-5xl text-[var(--verde-accent)]">{{ st.valor }}</div>
              <div class="text-white/75 text-sm mt-1">{{ st.label }}</div>
            </div>
          }
        </div>
      </div>
    </section>

    @if (mostrarModal()) {
      <app-temporadas-modal (cerrar)="mostrarModal.set(false)" />
    }
  `,
})
export class InicioComponent implements OnInit {
  private resenaService = inject(ResenaService);
  private platformId = inject(PLATFORM_ID);
  resumen = signal<ResumenResenas | null>(null);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.resenaService.resumen().subscribe((r) => this.resumen.set(r));
    }
  }

  readonly servicios = SERVICIOS;
  readonly ventajas = VENTAJAS;
  readonly pasos = PASOS;
  readonly stats = [
    { valor: '50', label: 'Caficultores beneficiados' },
    { valor: '5', label: 'Años de experiencia' },
    { valor: '+1000', label: 'Análisis de pH' },
  ];
  mostrarModal = signal(false);
}
