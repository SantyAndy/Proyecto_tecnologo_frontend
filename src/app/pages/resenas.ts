import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AppState } from '../core/app-state';
import { Resena, ResumenResenas } from '../core/models';
import { ResenaService } from '../core/resena.service';
import { NotifyService } from '../core/notify.service';
import { IconComponent } from '../shared/icon';
import { StarsComponent } from '../shared/stars';
import { RevealDirective } from '../core/reveal.directive';

@Component({
  selector: 'app-resenas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, IconComponent, StarsComponent, RevealDirective],
  template: `
    <!-- Encabezado con calidad global -->
    <section class="bg-leaf-dark text-white pt-24 pb-28 text-center px-6">
      <h1 class="hero-title font-display font-extrabold text-4xl sm:text-5xl">Opiniones de los caficultores</h1>
      <p appReveal class="text-white/80 mt-3 max-w-xl mx-auto">Lo que dicen quienes ya usan la plataforma.</p>

      @if (resumen(); as r) {
        <div appReveal class="mt-8 inline-flex flex-col items-center gap-2 bg-white/10 rounded-3xl px-10 py-6 backdrop-blur">
          <div class="font-display font-extrabold text-6xl text-[var(--verde-accent)]">{{ r.porcentaje }}%</div>
          <div class="text-sm text-white/80">Calidad de la página</div>
          <app-stars [rating]="r.promedio" [size]="26" />
          <div class="text-sm text-white/70">{{ r.promedio }} de 5 · {{ r.total }} opinión(es)</div>
        </div>
      }
    </section>

    <section class="mx-auto max-w-5xl px-6 -mt-14 pb-20">
      <!-- Formulario / estado de opinión -->
      <div appReveal class="card p-7 mb-10">
        @if (!state.logueado()) {
          <div class="text-center">
            <app-icon name="user" [size]="32" class="text-[var(--verde-primary)]" />
            <p class="mt-2 text-[var(--texto-suave)]">Inicia sesión para dejar tu opinión.</p>
            <a routerLink="/login" class="btn btn-primary mt-4">Iniciar sesión</a>
          </div>
        } @else if (yaOpino(); as mia) {
          <div class="text-center">
            <app-icon name="check" [size]="32" class="text-[var(--verde-primary)]" />
            <p class="mt-2 font-medium">¡Gracias! Ya dejaste tu opinión.</p>
            <div class="inline-flex flex-col items-center mt-3 bg-[var(--verde-soft)] rounded-2xl px-6 py-4">
              <app-stars [rating]="mia.estrellas" [size]="22" />
              <p class="text-sm text-[var(--texto-suave)] mt-2 max-w-md">“{{ mia.comentario }}”</p>
            </div>
          </div>
        } @else {
          <h2 class="font-display font-bold text-xl text-[var(--verde-primary)] mb-1">Deja tu opinión</h2>
          <p class="text-[var(--texto-suave)] text-sm mb-5">Solo puedes opinar una vez. ¡Cuéntanos tu experiencia!</p>
          @if (error()) { <p class="text-[var(--rojo)] text-sm mb-3">{{ error() }}</p> }

          <div class="grid sm:grid-cols-2 gap-4 mb-4">
            <div><label class="lbl">Nombre</label><input class="field" [(ngModel)]="form.nombre" placeholder="Tu nombre" /></div>
            <div><label class="lbl">Ciudad</label><input class="field" [(ngModel)]="form.ciudad" placeholder="Tu ciudad" /></div>
          </div>

          <label class="lbl">Tu calificación</label>
          <div class="flex items-center gap-2 mb-4">
            @for (s of [1,2,3,4,5]; track s) {
              <button type="button" (click)="form.estrellas = s" (mouseenter)="hover.set(s)" (mouseleave)="hover.set(0)" class="estrella" [class.on]="s <= (hover() || form.estrellas)">
                <svg width="32" height="32" viewBox="0 0 24 24"><path d="M12 2l2.9 6.26 6.9.55-5.23 4.52 1.57 6.74L12 17.27 6.86 20.6l1.57-6.74L3.2 9.36l6.9-.55z"/></svg>
              </button>
            }
            <span class="ml-2 text-sm text-[var(--texto-suave)]">{{ form.estrellas }}/5 — {{ form.estrellas * 20 }}%</span>
          </div>

          <label class="lbl">Comentario</label>
          <textarea class="field field-area mb-4" [(ngModel)]="form.comentario" placeholder="Cuéntanos cómo te ha ido con la plataforma"></textarea>

          <button (click)="enviar()" [disabled]="enviando()" class="btn btn-primary disabled:opacity-60"><app-icon name="check" [size]="18" /> {{ enviando() ? 'Enviando…' : 'Publicar opinión' }}</button>
        }
      </div>

      <!-- Listado de opiniones -->
      <h2 appReveal class="section-title font-display font-extrabold text-2xl text-[var(--verde-primary)] mb-6">Todas las opiniones</h2>
      <div class="grid md:grid-cols-2 gap-6">
        @for (r of resenas(); track r.id; let i = $index) {
          <figure [appReveal]="i * 80" class="card card-hover p-6">
            <div class="flex items-center justify-between mb-2">
              <app-stars [rating]="r.estrellas" [size]="18" />
              <span class="text-xs text-[var(--texto-suave)]">{{ r.estrellas * 20 }}%</span>
            </div>
            <blockquote class="text-[var(--texto-suave)] text-sm italic leading-relaxed">“{{ r.comentario }}”</blockquote>
            <figcaption class="flex items-center gap-3 mt-4">
              <span class="grid place-items-center w-10 h-10 rounded-full bg-[var(--verde-primary)] text-white font-display font-bold flex-shrink-0">{{ r.nombre.charAt(0) }}</span>
              <span class="leading-tight">
                <span class="block font-display font-bold text-sm">{{ r.nombre }}</span>
                <span class="block text-xs text-[var(--texto-suave)]">{{ r.ciudad || 'Colombia' }}</span>
              </span>
            </figcaption>
          </figure>
        } @empty {
          <p class="text-[var(--texto-suave)] col-span-full text-center py-8">Aún no hay opiniones. ¡Sé el primero!</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .lbl { display:block; font-weight:500; font-size:.85rem; margin-bottom:.35rem; color:var(--texto); }
    .estrella { color:#e2e2e2; transition:transform .15s, color .15s; }
    .estrella svg { fill:currentColor; }
    .estrella:hover { transform:scale(1.15); }
    .estrella.on { color:#f5a623; }
  `],
})
export class ResenasComponent implements OnInit {
  state = inject(AppState);
  private api = inject(ResenaService);
  private platformId = inject(PLATFORM_ID);
  private notify = inject(NotifyService);

  resenas = signal<Resena[]>([]);
  resumen = signal<ResumenResenas | null>(null);
  yaOpino = signal<Resena | null>(null);
  hover = signal(0);
  enviando = signal(false);
  error = signal('');
  form = { nombre: '', ciudad: '', comentario: '', estrellas: 5 };
  private prefilled = false;

  constructor() {
    // Reacciona cuando la sesión se confirma (puede restaurarse de forma asíncrona al recargar).
    effect(() => {
      const u = this.state.usuario();
      if (u && isPlatformBrowser(this.platformId) && !this.prefilled) {
        this.prefilled = true;
        this.form.nombre = `${u.nombre} ${u.apellido}`.trim();
        this.form.ciudad = u.ubicacion ?? '';
        this.api.mia().subscribe((m) => this.yaOpino.set(m));
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) this.cargar();
  }

  private cargar() {
    this.api.listar().subscribe((d) => this.resenas.set(d));
    this.api.resumen().subscribe((r) => this.resumen.set(r));
  }

  enviar() {
    if (!this.form.nombre.trim() || !this.form.comentario.trim()) {
      this.error.set('Completa tu nombre y comentario.');
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.api.crear(this.form).subscribe({
      next: (r) => { this.enviando.set(false); this.yaOpino.set(r); this.cargar(); this.notify.exito('¡Gracias por compartir tu experiencia!', 'Opinión publicada'); },
      error: (e) => {
        this.enviando.set(false);
        const msg = e?.error?.detail ?? 'No se pudo publicar tu opinión.';
        this.error.set(msg);
        this.notify.error(msg);
      },
    });
  }
}
