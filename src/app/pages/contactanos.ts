import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { API_BASE } from '../core/api.config';
import { FAQS } from '../core/data';
import { NotifyService } from '../core/notify.service';
import { IconComponent } from '../shared/icon';
import { RevealDirective } from '../core/reveal.directive';

@Component({
  selector: 'app-contactanos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, RevealDirective],
  template: `
    <section class="bg-leaf-dark text-white pt-24 pb-32 text-center">
      <h1 class="hero-title font-display font-extrabold text-4xl sm:text-5xl">Contáctanos</h1>
      <p appReveal class="text-white/80 mt-3 max-w-xl mx-auto px-6">Tu opinión es importante para nosotros. Diligencia el formulario y pronto nos comunicaremos contigo.</p>
    </section>

    <section class="mx-auto max-w-6xl px-6 -mt-20 pb-20 grid lg:grid-cols-2 gap-8 items-start">
      <!-- Datos de contacto + mapa -->
      <div appReveal class="space-y-5">
        <div class="grid sm:grid-cols-1 gap-4">
          @for (c of contactos; track c.titulo) {
            <div class="card p-5 flex items-center gap-4">
              <span class="icon-badge !w-12 !h-12"><app-icon [name]="c.icono" [size]="22" /></span>
              <div>
                <div class="font-display font-bold text-sm">{{ c.titulo }}</div>
                <div class="text-[var(--texto-suave)] text-sm">{{ c.valor }}</div>
              </div>
            </div>
          }
        </div>
        <!-- Mapa: Neiva, Huila -->
        <div class="card overflow-hidden">
          <iframe
            title="Ubicación: Neiva, Huila"
            class="w-full h-72 border-0"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-75.345%2C2.905%2C-75.230%2C2.975&layer=mapnik&marker=2.9273%2C-75.2819">
          </iframe>
          <div class="px-4 py-2 text-xs text-[var(--texto-suave)] flex items-center gap-1">
            <app-icon name="pin" [size]="14" class="text-[var(--verde-primary)]" /> Neiva, Huila — Colombia
          </div>
        </div>
      </div>

      <div appReveal="120" class="card p-7 sm:p-10">
        <h2 class="font-display font-bold text-2xl text-[var(--verde-primary)] text-center mb-1">Diligencia el siguiente formulario</h2>
        <p class="text-center text-[var(--texto-suave)] text-sm mb-8">Te responderemos lo antes posible.</p>

        @if (enviado()) {
          <div class="anim-pop bg-[var(--verde-soft)] text-[var(--verde-primary-dark)] rounded-2xl p-5 flex items-center gap-3 mb-6">
            <app-icon name="check" [size]="26" />
            <span class="font-medium">¡Gracias! Tu mensaje fue enviado correctamente.</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="enviar()" class="space-y-4" novalidate>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="lbl">Nombre</label>
              <input class="field" formControlName="nombre" placeholder="Tu nombre" />
              @if (invalido('nombre')) { <p class="err">El nombre es obligatorio</p> }
            </div>
            <div>
              <label class="lbl">Apellido</label>
              <input class="field" formControlName="apellido" placeholder="Tu apellido" />
              @if (invalido('apellido')) { <p class="err">El apellido es obligatorio</p> }
            </div>
          </div>
          <div>
            <label class="lbl">Email</label>
            <input class="field" type="email" formControlName="email" placeholder="correo@ejemplo.com" />
            @if (invalido('email')) { <p class="err">Ingresa un correo válido</p> }
          </div>
          <div>
            <label class="lbl">Mensaje</label>
            <textarea class="field field-area" formControlName="mensaje" placeholder="Escríbenos tu mensaje, comentario o sugerencia aquí"></textarea>
            @if (invalido('mensaje')) { <p class="err">Por favor escribe tu mensaje</p> }
          </div>
          <label class="flex items-start gap-3 text-sm text-[var(--texto-suave)] cursor-pointer">
            <input type="checkbox" formControlName="autoriza" class="mt-1 w-5 h-5 accent-[var(--verde-primary)]" />
            <span>Autorizo de manera voluntaria el tratamiento de mis datos personales según la política de privacidad y protección de datos del sistema.</span>
          </label>
          @if (invalido('autoriza')) { <p class="err">Debes aceptar el tratamiento de datos</p> }

          <button type="submit" class="btn btn-primary w-full !py-3.5 mt-2">
            Enviar <app-icon name="arrow" [size]="18" />
          </button>
        </form>
      </div>
    </section>

    <!-- FAQ rápida -->
    <section class="bg-[var(--verde-soft)] py-16">
      <div class="mx-auto max-w-3xl px-6">
        <h2 appReveal class="section-title text-center font-display font-extrabold text-2xl sm:text-3xl text-[var(--verde-primary)] mb-8 mx-auto block w-fit">Preguntas frecuentes</h2>
        <div class="space-y-3">
          @for (f of faqs; track f.pregunta; let i = $index) {
            <div class="card overflow-hidden">
              <button class="w-full flex items-center justify-between gap-4 p-4 text-left" (click)="toggle(i)">
                <span class="font-display font-semibold text-sm">{{ f.pregunta }}</span>
                <app-icon [name]="abierta() === i ? 'close' : 'plus'" [size]="18" class="text-[var(--verde-primary)] shrink-0" />
              </button>
              <div class="overflow-hidden transition-all duration-300" [style.maxHeight]="abierta() === i ? '300px' : '0'">
                <p class="px-4 pb-4 text-[var(--texto-suave)] text-sm">{{ f.respuesta }}</p>
              </div>
            </div>
          }
        </div>
        <div class="text-center mt-6">
          <a routerLink="/faq" class="text-[var(--verde-primary)] font-medium hover:underline text-sm">Ver todas las preguntas →</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .lbl { display:block; font-weight:500; font-size:.85rem; margin-bottom:.35rem; color:var(--texto); }
    .err { color:#e53935; font-size:.78rem; margin-top:.3rem; }
  `],
})
export class ContactanosComponent {
  private fb = new FormBuilder();
  private http = inject(HttpClient);
  private notify = inject(NotifyService);
  enviado = signal(false);

  readonly contactos = [
    { icono: 'pin', titulo: 'Dirección', valor: 'Neiva, Huila — Colombia' },
    { icono: 'mail', titulo: 'Correo', valor: 'rojasarevalodaniel@gmail.com' },
    { icono: 'clock', titulo: 'Horario', valor: 'Lun a Vie · 8:00 a.m. – 6:00 p.m.' },
    { icono: 'user', titulo: 'Soporte', valor: 'Fundación Escuela Tecnológica (FET)' },
  ];
  readonly faqs = FAQS.slice(0, 4);
  abierta = signal<number | null>(0);
  toggle(i: number) { this.abierta.update((v) => (v === i ? null : i)); }

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mensaje: ['', Validators.required],
    autoriza: [false, Validators.requiredTrue],
  });

  invalido(c: string): boolean {
    const ctrl = this.form.get(c);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.http.post(`${API_BASE}/contacto/`, this.form.value).subscribe({
      next: () => { this.enviado.set(true); this.form.reset({ autoriza: false }); this.notify.exito('Recibimos tu mensaje, pronto te contactamos.', '¡Mensaje enviado!'); },
      error: () => { this.enviado.set(true); this.form.reset({ autoriza: false }); this.notify.exito('Recibimos tu mensaje, pronto te contactamos.', '¡Mensaje enviado!'); },
    });
  }
}
