import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EQUIPO } from '../core/data';
import { IconComponent } from '../shared/icon';
import { RevealDirective } from '../core/reveal.directive';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, RevealDirective],
  template: `
    <!-- Encabezado / historia -->
    <section class="bg-leaf-dark text-white py-20">
      <div class="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-10 items-center">
        <div appReveal>
          <span class="inline-block px-4 py-1.5 rounded-full bg-white/15 text-sm font-medium mb-4">Desde 2023</span>
          <h1 class="hero-title font-display font-extrabold text-4xl sm:text-5xl mb-5">Nuestra Historia</h1>
          <p class="text-white/85 leading-relaxed mb-6">
            Nacimos en el campo, entre tradición y esfuerzo. Con esa raíz y nuestra pasión por la tecnología, emprendimos este proyecto para dignificar la tierra y las manos que la trabajan.
          </p>
          <p class="text-white/75 leading-relaxed">
            Somos estudiantes de Ingeniería de Software que decidimos unir nuestras dos pasiones: el campo y la tecnología. Buscamos soluciones que aporten productividad y sostenibilidad a la agricultura.
          </p>
          <div class="flex flex-wrap gap-3 mt-7">
            @for (b of badges; track b.label) {
              <div class="flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-3">
                <app-icon [name]="b.icono" [size]="22" />
                <div class="leading-tight">
                  <div class="font-display font-bold">{{ b.valor }}</div>
                  <div class="text-xs text-white/70">{{ b.label }}</div>
                </div>
              </div>
            }
          </div>
        </div>
        <img appReveal="120" src="/img/imagen_nosotros.png"
             alt="Cultivo de café" class="rounded-3xl shadow-2xl w-full h-96 object-cover" />
      </div>
    </section>

    <!-- Misión / Visión / Valores -->
    <section class="mx-auto max-w-7xl px-6 py-20">
      <h2 appReveal class="section-title text-center font-display font-extrabold text-3xl text-[var(--verde-primary)] mb-12 mx-auto block w-fit">Lo que nos mueve</h2>
      <div class="grid md:grid-cols-3 gap-6">
        @for (m of pilares; track m.titulo; let i = $index) {
          <article [appReveal]="i * 120" class="card card-hover p-7">
            <span class="icon-badge"><app-icon [name]="m.icono" [size]="26" /></span>
            <h3 class="font-display font-bold text-xl mt-5 mb-2">{{ m.titulo }}</h3>
            <p class="text-[var(--texto-suave)] text-sm leading-relaxed">{{ m.texto }}</p>
          </article>
        }
      </div>
    </section>

    <!-- Timeline -->
    <section class="mx-auto max-w-4xl px-6 pb-20">
      <h2 appReveal class="section-title text-center font-display font-extrabold text-3xl text-[var(--verde-primary)] mb-12 mx-auto block w-fit">Nuestra evolución</h2>
      <div class="relative pl-8 sm:pl-0">
        <div class="hidden sm:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-[var(--verde-soft)] -translate-x-1/2"></div>
        @for (h of hitos; track h.titulo; let i = $index; let last = $last) {
          <div [appReveal]="i * 120" class="relative sm:grid sm:grid-cols-2 sm:gap-10 mb-10"
               [class.sm:text-right]="i % 2 === 0">
            <div class="card p-6" [class.sm:col-start-2]="i % 2 !== 0">
              <span class="icon-badge !w-12 !h-12 mb-3" [class.sm:ml-auto]="i % 2 === 0"><app-icon [name]="h.icono" [size]="22" /></span>
              <h3 class="font-display font-bold text-xl mb-2">{{ h.titulo }}</h3>
              <p class="text-[var(--texto-suave)] text-sm">{{ h.texto }}</p>
            </div>
          </div>
        }
      </div>
    </section>

    <!-- Equipo -->
    <section class="bg-[var(--verde-soft)] py-20">
      <div class="mx-auto max-w-5xl px-6">
        <h2 appReveal class="section-title text-center font-display font-extrabold text-3xl text-[var(--verde-primary)] mb-12 mx-auto block w-fit">Nuestro equipo</h2>
        <div class="grid sm:grid-cols-3 gap-6">
          @for (m of equipo; track m.nombre; let i = $index) {
            <div [appReveal]="i * 120" class="card card-hover p-7 text-center">
              <span class="grid place-items-center w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--verde-primary)] to-[var(--verde-primary-dark)] text-white font-display font-extrabold text-3xl shadow-lg">{{ m.inicial }}</span>
              <h3 class="font-display font-bold mt-4">{{ m.nombre }}</h3>
              <p class="text-[var(--texto-suave)] text-sm mt-1">{{ m.rol }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class NosotrosComponent {
  readonly equipo = EQUIPO;
  readonly badges = [
    { icono: 'rocket', valor: '+2', label: 'años construyendo' },
    { icono: 'coffee', valor: '100%', label: 'origen cafetero' },
    { icono: 'leaf', valor: 'tech + agro', label: 'unidos' },
  ];
  readonly hitos = [
    { icono: 'leaf', titulo: 'Raíces', texto: 'Crecimos entre cafetales. Entendemos las necesidades del campo y valoramos a quienes lo trabajan.' },
    { icono: 'rocket', titulo: 'Decisión', texto: 'En 2023 elegimos Ingeniería de Software para transformar lo aprendido en impacto real.' },
    { icono: 'sprout', titulo: 'Propósito', texto: 'Crear tecnología útil para una agricultura más eficiente, sostenible y justa.' },
  ];
  readonly pilares = [
    { icono: 'rocket', titulo: 'Misión', texto: 'Acercar la tecnología al caficultor con herramientas simples que monitorean el suelo en tiempo real y detectan enfermedades del café con inteligencia artificial para mejorar cada cosecha.' },
    { icono: 'leaf', titulo: 'Visión', texto: 'Ser la plataforma de referencia en agricultura de precisión para el café colombiano, impulsando un campo más sostenible.' },
    { icono: 'shield', titulo: 'Valores', texto: 'Cercanía con el campo, rigor técnico, sostenibilidad y compromiso con quienes hacen posible cada taza de café.' },
  ];
}
