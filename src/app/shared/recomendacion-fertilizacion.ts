import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { NivelConfianza, ProductoRecomendado, RecomendacionFertilizacion, RecomendacionVisual } from '../core/models';
import { IconComponent } from './icon';

/**
 * Componentes que muestran la recomendación de fertilización tal como la
 * devuelve el backend (tablas/motor_recomendacion.py). Se usan en el
 * resultado del diagnóstico y en el historial de diagnósticos guardados.
 *
 * Las tarjetas muestran EXACTAMENTE los productos que envía el backend, en
 * su orden y con la imagen de cada registro: aquí no hay listas de productos
 * ni imágenes fijas.
 */

const NIVEL_CLASE: Record<NivelConfianza, string> = {
  'ALTA': 'nivel-alta',
  'MEDIA': 'nivel-media',
  'BAJA': 'nivel-baja',
  'NO CONCLUYENTE': 'nivel-nc',
};

const ESTADO_HIPOTESIS: Record<string, string> = {
  posible: 'Posible',
  probable: 'Probable',
  confirmado: 'Confirmado',
  descartado: 'Descartado',
};

const NIVEL_NECESIDAD: Record<string, string> = {
  alta: 'Prioridad alta',
  media: 'Prioridad media',
  contexto: 'Demanda de la etapa',
  normal: 'Normal',
  exceso: 'Exceso',
};


// ============================================================
// RESUMEN DEL DIAGNÓSTICO Y LA VALIDACIÓN
// ============================================================

@Component({
  selector: 'app-resumen-diagnostico',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (recomendacion; as f) {
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="dato">
          <span>Diagnóstico</span>
          <strong>{{ f.diagnostico_visual.descripcion }}</strong>
        </div>
        <div class="dato">
          <span>Confianza visual</span>
          <strong>{{ f.diagnostico_visual.confianza_visual !== null ? f.diagnostico_visual.confianza_visual + ' %' : '—' }}</strong>
        </div>
        <div class="dato">
          <span>Confianza de la recomendación</span>
          <strong><span class="nivel" [class]="'nivel ' + claseNivel(f.nivel_confianza)">{{ f.nivel_confianza }}</span></strong>
        </div>
        <div class="dato">
          <span>Etapa</span>
          <strong>{{ f.contexto.etapas_fisiologicas.join(', ') || f.contexto.temporada }}</strong>
        </div>
      </div>

      @if (f.recomendacion_visual; as v) {
        @if (v.tipo_recomendacion === 'apoyo_nutricional_preliminar') {
          <div class="grid sm:grid-cols-2 gap-3 mt-3">
            <div class="dato">
              <span>Diagnóstico principal</span>
              <strong>{{ v.diagnostico_principal }}</strong>
            </div>
            <div class="dato">
              <span>Deficiencia nutricional detectada</span>
              <strong>{{ nombresDetectados(f) }}</strong>
            </div>
          </div>
        }
      }

      <p class="text-sm mt-4"><strong>Validación:</strong> {{ f.validacion.resumen }}</p>

      @if (f.hipotesis_nutricional.length) {
        <div class="mt-4">
          <span class="titulo">Hipótesis nutricional</span>
          <ul class="lista">
            @for (h of f.hipotesis_nutricional; track h.nutriente) {
              <li>
                <span class="chip" [class.chip-off]="h.estado === 'descartado'">{{ estadoHipotesis(h.estado) }}</span>
                <strong>{{ h.nombre }} ({{ h.nutriente }})</strong>
                @if (h.rol === 'secundaria') { <em> · secundaria</em> }
                <small>{{ h.validacion }}</small>
              </li>
            }
          </ul>
        </div>
      }

      @if (f.necesidad_nutricional.length) {
        <div class="mt-4">
          <span class="titulo">Necesidad nutricional</span>
          <div class="flex flex-wrap gap-2">
            @for (n of f.necesidad_nutricional; track n.nutriente) {
              <span class="chip" [class.chip-off]="n.nivel === 'normal'" [class.chip-warn]="n.nivel === 'exceso'" [title]="n.motivo">
                {{ n.nombre }}: {{ nivelNecesidad(n.nivel) }}
              </span>
            }
          </div>
        </div>
      }

      @if (f.advertencias.length) {
        <ul class="avisos mt-4">
          @for (a of f.advertencias; track $index) {
            <li><app-icon name="alert" [size]="14" /> {{ a }}</li>
          }
        </ul>
      }

      @if (f.datos_faltantes.length) {
        <p class="text-xs text-[var(--texto-suave)] mt-3">
          Datos no disponibles (no se usaron en la evaluación): {{ f.datos_faltantes.join(', ') }}.
        </p>
      }

      @if (f.contexto.variedad_nota) {
        <p class="text-xs text-[var(--texto-suave)] mt-1">{{ f.contexto.variedad_nota }}</p>
      }
    }
  `,
  styles: [`
    .dato { padding:1rem; border:1px solid var(--borde); border-radius:.9rem; background:#fff; }
    .dato > span { display:block; font-size:.72rem; color:var(--texto-suave); margin-bottom:.25rem; }
    .dato > strong { display:block; font-size:.9rem; }
    .titulo { display:block; font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; color:var(--texto-suave); font-weight:700; margin-bottom:.4rem; }
    .lista { display:grid; gap:.5rem; margin:0; padding:0; list-style:none; }
    .lista li { display:flex; flex-wrap:wrap; align-items:center; gap:.4rem; font-size:.85rem; }
    .lista small { flex-basis:100%; color:var(--texto-suave); font-size:.75rem; }
    .chip { display:inline-flex; align-items:center; padding:.2rem .6rem; border-radius:999px; background:var(--verde-soft); color:var(--verde-primary); font-size:.75rem; font-weight:700; }
    .chip-off { background:#f1f1f1; color:#777; }
    .chip-warn { background:#fdecea; color:#b3261e; }
    .nivel { display:inline-block; padding:.15rem .6rem; border-radius:999px; font-size:.78rem; font-weight:800; }
    .nivel-alta { background:var(--verde-primary); color:#fff; }
    .nivel-media { background:#fff4d6; color:#8a5a00; }
    .nivel-baja { background:#f1f1f1; color:#555; }
    .nivel-nc { background:#fdecea; color:#b3261e; }
    .avisos { display:grid; gap:.35rem; margin:0; padding:0; list-style:none; }
    .avisos li { display:flex; gap:.4rem; align-items:flex-start; font-size:.8rem; color:#8a5a00; background:#fff8e6; padding:.5rem .7rem; border-radius:.6rem; }
  `],
})
export class ResumenDiagnosticoComponent {
  @Input() recomendacion: RecomendacionFertilizacion | null = null;

  claseNivel(nivel: NivelConfianza) { return NIVEL_CLASE[nivel] ?? 'nivel-baja'; }
  estadoHipotesis(estado: string) { return ESTADO_HIPOTESIS[estado] ?? estado; }
  nivelNecesidad(nivel: string) { return NIVEL_NECESIDAD[nivel] ?? nivel; }
  nombresDetectados(f: RecomendacionFertilizacion) {
    return (f.recomendacion_visual?.nutrientes_detectados ?? []).map((d) => d.nombre).join(', ');
  }
}


// ============================================================
// TARJETAS DE ABONOS RECOMENDADOS
// ============================================================

@Component({
  selector: 'app-tarjetas-abonos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, NgTemplateOutlet],
  template: `
    @if (recomendacion; as f) {

      @if (f.decision === 'recomendar' && (f.productos_recomendados.length || f.recomendaciones_foliares.length)) {

        <p class="text-sm text-[var(--texto-suave)] mb-5">
          Ordenados por mayor compatibilidad con las necesidades detectadas.
        </p>

        @if (f.productos_recomendados.length) {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (item of f.productos_recomendados; track item.producto.id) {
              <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: item }" />
            }
          </div>
        }

        @if (f.recomendaciones_foliares.length) {
          <h3 class="font-display font-bold text-lg text-[var(--verde-primary)] mt-8 mb-3 flex items-center gap-2">
            <app-icon name="drop" [size]="18" /> Aplicación foliar
          </h3>
          <p class="text-xs text-[var(--texto-suave)] mb-4">
            Productos foliares evaluados por separado de los fertilizantes al suelo.
          </p>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (item of f.recomendaciones_foliares; track item.producto.id) {
              <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: item }" />
            }
          </div>
        }

        <p class="dosis mt-5"><app-icon name="alert" [size]="15" /> {{ f.dosis }}</p>
        @if (f.recomendacion_validacion) {
          <p class="text-xs text-[var(--texto-suave)] mt-2">{{ f.recomendacion_validacion }}</p>
        }

      } @else if (f.recomendacion_visual; as v) {

        <div class="preliminar">
          <span class="preliminar-tag">
            <app-icon name="eye" [size]="15" /> {{ v.titulo }}
          </span>
          <p class="text-sm mt-2">
            Deficiencia detectada visualmente:
            <strong>{{ detectadosTexto(v) }}</strong>
          </p>
          <p class="text-sm mt-1 font-semibold">{{ v.advertencia }}</p>
          @if (v.nota_enfermedad) {
            <p class="text-sm mt-2">{{ v.nota_enfermedad }}</p>
          }
        </div>

        @if (v.productos.length) {
          <p class="text-sm text-[var(--texto-suave)] my-4">
            Ordenados por mayor compatibilidad con los nutrientes detectados.
          </p>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (item of v.productos; track item.producto.id) {
              <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: item }" />
            }
          </div>
        }

        @if (v.foliares.length) {
          <h3 class="font-display font-bold text-lg text-[var(--verde-primary)] mt-8 mb-3 flex items-center gap-2">
            <app-icon name="drop" [size]="18" /> Aplicación foliar
          </h3>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (item of v.foliares; track item.producto.id) {
              <ng-container *ngTemplateOutlet="tarjeta; context: { $implicit: item }" />
            }
          </div>
        }

        @if (v.mensaje_sin_producto) {
          <div class="sin-recomendacion mt-5">
            <app-icon name="shield" [size]="26" />
            <div>
              <p class="font-display font-bold text-[var(--texto)]">{{ v.mensaje_sin_producto }}</p>
              <p class="text-sm mt-2 font-semibold">{{ v.recomendacion_validacion }}</p>
            </div>
          </div>
        }

        <p class="dosis mt-5"><app-icon name="alert" [size]="15" /> {{ v.dosis }}</p>

        @if (f.motivos_no_recomendacion.length) {
          <p class="text-xs text-[var(--texto-suave)] mt-2">
            Recomendación agronómica validada: {{ f.mensaje }} {{ f.motivos_no_recomendacion.join(' ') }}
          </p>
        }

      } @else {

        <div class="sin-recomendacion">
          <app-icon name="shield" [size]="26" />
          <div>
            <p class="font-display font-bold text-[var(--texto)]">
              {{ f.mensaje || 'No hay un fertilizante recomendado con suficiente evidencia.' }}
            </p>
            @if (f.motivos_no_recomendacion.length) {
              <ul class="motivos">
                @for (m of f.motivos_no_recomendacion; track $index) { <li>{{ m }}</li> }
              </ul>
            }
            <p class="text-sm mt-2 font-semibold">
              {{ f.recomendacion_validacion || 'Se recomienda realizar análisis de suelo y/o análisis foliar antes de seleccionar un fertilizante.' }}
            </p>
          </div>
        </div>

      }
    }

    <ng-template #tarjeta let-item>
      <article class="abono-card">
        @if (item.orden) { <div class="abono-numero">{{ item.orden }}</div> }

        <div class="abono-imagen">
          @if (item.producto.imagen && !imagenFallida(item.producto.imagen)) {
            <img [src]="item.producto.imagen" [alt]="item.producto.nombre" loading="lazy"
                 (error)="marcarFallida(item.producto.imagen)" />
          } @else {
            <app-icon name="image" [size]="34" />
          }
        </div>

        <h3 class="font-display font-extrabold text-lg text-[var(--verde-primary)] mt-4 leading-tight">
          {{ item.producto.nombre }}
        </h3>
        @if (item.producto.marca) {
          <p class="text-xs text-[var(--texto-suave)]">{{ item.producto.marca }}</p>
        }
        <span class="formula">{{ item.producto.composicion }}</span>

        <div class="compat" [class]="'compat compat-' + item.compatibilidad">
          Compatibilidad: {{ item.compatibilidad.toUpperCase() }}
          <small>{{ item.puntuacion }}/100</small>
        </div>

        @if (item.tipo_recomendacion) {
          <span class="tag-preliminar">
            {{ item.tipo_recomendacion === 'apoyo_nutricional_preliminar' ? 'Apoyo nutricional preliminar' : 'Recomendación nutricional preliminar' }}
          </span>
        }

        @if (item.nutrientes_detectados?.length) {
          <div class="info-abono">
            <span class="info-titulo">Nutrientes detectados que cubre</span>
            <div class="flex flex-wrap gap-1.5">
              @for (n of item.nutrientes_detectados; track n) {
                <span class="nutri nutri-req">✓ Aporta {{ n }}</span>
              }
            </div>
          </div>
        }

        <div class="info-abono">
          <span class="info-titulo">Aporta</span>
          <div class="flex flex-wrap gap-1.5">
            @for (n of item.nutrientes_aportados; track n) {
              <span class="nutri" [class.nutri-req]="esCubierto(item, n)">✓ {{ n }}</span>
            }
          </div>
        </div>

        @if (item.motivo) {
          <p class="text-xs mt-3 leading-relaxed"><strong>Motivo:</strong> {{ item.motivo }}</p>
        }

        @if (item.razones.length) {
          <div class="porque-abono">
            <span class="info-titulo">¿Por qué?</span>
            <ul>
              @for (r of item.razones; track $index) { <li>{{ r }}</li> }
            </ul>
          </div>
        }

        @if (item.advertencias.length) {
          <div class="advertencia">
            <span class="info-titulo">Advertencia</span>
            <ul>
              @for (a of item.advertencias; track $index) { <li>{{ a }}</li> }
            </ul>
          </div>
        }

        <div class="aplicacion">
          <app-icon name="leaf" [size]="15" />
          {{ item.producto.tipo === 'foliar' ? 'Aplicación foliar' : 'Aplicación al suelo' }}
        </div>
      </article>
    </ng-template>
  `,
  styles: [`
    .abono-card { position:relative; display:flex; flex-direction:column; padding:1.25rem; border:1px solid var(--borde); border-radius:1.15rem; background:#fff; box-shadow:0 5px 18px rgba(0,0,0,.04); transition:.2s; min-width:0; }
    .abono-card:hover { transform:translateY(-3px); box-shadow:0 10px 25px rgba(0,0,0,.08); border-color:var(--verde-accent); }
    .abono-numero { position:absolute; top:12px; right:12px; z-index:1; width:30px; height:30px; border-radius:50%; display:grid; place-items:center; background:var(--verde-primary); color:#fff; font-weight:800; font-size:.8rem; }
    .abono-imagen { height:190px; border-radius:.9rem; background:#fff; border:1px solid var(--borde); display:grid; place-items:center; overflow:hidden; color:var(--texto-suave); }
    .abono-imagen img { max-width:100%; max-height:100%; object-fit:contain; }
    .formula { display:inline-block; align-self:flex-start; margin-top:.5rem; padding:.3rem .65rem; border-radius:999px; background:var(--verde-soft); color:var(--verde-primary); font-size:.75rem; font-weight:700; }
    .compat { margin-top:.8rem; display:flex; align-items:center; justify-content:space-between; gap:.5rem; padding:.45rem .75rem; border-radius:.7rem; font-weight:800; font-size:.8rem; }
    .compat small { font-weight:600; opacity:.8; }
    .compat-alta { background:var(--verde-primary); color:#fff; }
    .compat-media { background:#fff4d6; color:#8a5a00; }
    .compat-baja { background:#f1f1f1; color:#555; }
    .info-abono { margin-top:1rem; padding-top:.8rem; border-top:1px solid var(--borde); }
    .info-titulo { display:block; font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; color:var(--texto-suave); font-weight:700; margin-bottom:.35rem; }
    .nutri { padding:.15rem .5rem; border-radius:999px; background:#f3f3f3; color:#555; font-size:.75rem; font-weight:700; }
    .nutri-req { background:var(--verde-soft); color:var(--verde-primary); }
    .porque-abono { margin-top:1rem; padding:.85rem; border-radius:.85rem; background:var(--verde-soft); }
    .advertencia { margin-top:.75rem; padding:.85rem; border-radius:.85rem; background:#fff8e6; color:#6b4600; }
    .porque-abono ul, .advertencia ul { margin:0; padding-left:1rem; font-size:.8rem; line-height:1.5; }
    .porque-abono li { list-style:'✓  '; }
    .advertencia li { list-style:'!  '; }
    .aplicacion { display:flex; align-items:center; gap:.35rem; margin-top:auto; padding-top:.8rem; font-size:.75rem; color:var(--texto-suave); }
    .dosis { display:flex; gap:.4rem; align-items:center; font-size:.85rem; font-weight:600; color:#6b4600; }
    .sin-recomendacion { display:flex; gap:1rem; align-items:flex-start; padding:1.25rem; border-radius:1rem; background:#fff8e6; color:#6b4600; }
    .motivos { margin:.5rem 0 0; padding-left:1.1rem; font-size:.85rem; line-height:1.5; }
    .preliminar { padding:1rem 1.1rem; border-radius:1rem; background:#eef6ff; color:#1d3b5c; border:1px solid #cfe3f7; }
    .preliminar-tag { display:inline-flex; align-items:center; gap:.4rem; font-weight:800; font-size:.85rem; }
    .tag-preliminar { display:inline-block; align-self:flex-start; margin-top:.6rem; padding:.2rem .6rem; border-radius:999px; background:#eef6ff; color:#1d3b5c; font-size:.72rem; font-weight:700; }
  `],
})
export class TarjetasAbonosComponent {
  @Input() recomendacion: RecomendacionFertilizacion | null = null;

  private fallidas = signal<ReadonlySet<string>>(new Set());

  imagenFallida(url: string) { return this.fallidas().has(url); }

  marcarFallida(url: string) {
    this.fallidas.update((s) => new Set(s).add(url));
  }

  detectadosTexto(v: RecomendacionVisual) {
    return v.nutrientes_detectados.map((d) => `${d.nombre} (${d.nutriente})`).join(', ');
  }

  esCubierto(item: ProductoRecomendado, nutriente: string) {
    return (item.nutrientes_cubiertos ?? item.nutrientes_requeridos).includes(nutriente);
  }
}
