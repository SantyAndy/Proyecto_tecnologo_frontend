import {
  isPlatformBrowser,
  DecimalPipe
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ViewChild
} from '@angular/core';

import { Router } from '@angular/router';

import { IconComponent } from '../../shared/icon';
import { NotifyService } from '../../core/notify.service';
import { DiagnosticoService } from '../../core/diagnostico.service';
import { AppState } from '../../core/app-state';
import { RevealDirective } from '../../core/reveal.directive';
import { RecomendacionFertilizacion } from '../../core/models';
import {
  ResumenDiagnosticoComponent,
  TarjetasAbonosComponent
} from '../../shared/recomendacion-fertilizacion';


// ============================================================
// TIPOS
// ============================================================

interface BoundingBox {
  label: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}


// ============================================================
// ABONO RECOMENDADO
// ============================================================

interface AbonoRecomendado {

  nombre: string;

  formula?: string | null;

  nutrientes?: string | null;

  aplicacion?: string | null;

  descripcion?: string | null;

  uso?: string | null;

  paraQueSirve?: string | null;

  porQueSeRecomienda?: string | null;

  compatibilidad?: string | null;

  puntuacion?: number | null;

}


// ============================================================
// RESULTADO DEL DIAGNÓSTICO
// ============================================================

interface DiagnosisResult {

  imageUrl: string;

  boundingBoxes: BoundingBox[];

  status:
    | 'alert'
    | 'healthy'
    | 'deficiency';

  diagnosis: string;

  scientificName?: string;

  recommendation: string;

  source?: string;

  allDetections?: {
    label: string;
    confidence: number;
  }[];

  abono?: string | null;

  abonos?: AbonoRecomendado[];

  abonosRecomendados?: AbonoRecomendado[];

  sugerencia_integrada?: {
    estado?: string;
    etiqueta?: string;
    titulo_fito?: string;
    tratamiento?: string;
    texto?: string;
    abono?: string | null;
    abonos?: AbonoRecomendado[];
  } | null;

  /** Confianza visual del diagnóstico principal (0-100). */
  confianza?: number | null;

  /** Recomendación del motor en dos etapas (productos + imagen + razones). */
  fertilizacion?: RecomendacionFertilizacion | null;

}


// ============================================================
// CONTEXTO DEL CULTIVO
// ============================================================

type Temporada =
  | 'cosecha'
  | 'mitaca'
  | 'floracion'
  | 'recuperacion';


type CondicionClimatica =
  | 'seca'
  | 'normal'
  | 'lluviosa';


interface ContextoCultivo {

  variedad: string;

  temporada: Temporada;

  usarSensores: boolean;

  desde: string | null;

  hasta: string | null;

  condicionClimatica:
    | CondicionClimatica
    | null;

  /** De dónde salen pH, humedad y temperatura. */
  fuente?: FuenteSensores;

  ph?: number | null;

  humedad?: number | null;

  temperatura?: number | null;

  /** Análisis de laboratorio opcionales (null = no disponible). */
  analisisFoliar?: Record<string, number> | null;

  analisisSuelo?: Record<string, number | string> | null;

}


/**
 * arduino = promedio de las lecturas de los sensores
 * manual  = valores escritos por el usuario (medidos sin Arduino)
 * ninguno = sin datos del suelo, solo la condición climática
 */
type FuenteSensores =
  | 'arduino'
  | 'manual'
  | 'ninguno';


/** Datos del suelo con los que se calculó la recomendación. */
interface DatosSuelo {

  fuente: FuenteSensores;

  // null = sin lectura válida (no es lo mismo que 0).
  ph: number | null;

  humedad: number | null;

  temperatura: number | null;

  lecturas: number;

}


/** Campos del análisis de laboratorio opcional. */
const CAMPOS_FOLIARES = [
  { clave: 'N', etiqueta: 'N', unidad: '%', rango: '2.36–2.78' },
  { clave: 'P', etiqueta: 'P', unidad: '%', rango: '0.14–0.20' },
  { clave: 'K', etiqueta: 'K', unidad: '%', rango: '1.58–2.15' },
  { clave: 'Ca', etiqueta: 'Ca', unidad: '%', rango: '0.75–1.29' },
  { clave: 'Mg', etiqueta: 'Mg', unidad: '%', rango: '0.18–0.45' },
  { clave: 'S', etiqueta: 'S', unidad: '%', rango: '0.15–0.19' },
  { clave: 'Mn', etiqueta: 'Mn', unidad: 'mg/kg', rango: '106–278' },
  { clave: 'Fe', etiqueta: 'Fe', unidad: 'mg/kg', rango: '54–121' },
  { clave: 'B', etiqueta: 'B', unidad: 'mg/kg', rango: '29–55' },
  { clave: 'Cu', etiqueta: 'Cu', unidad: 'mg/kg', rango: '8–17' },
  { clave: 'Zn', etiqueta: 'Zn', unidad: 'mg/kg', rango: '6–12' },
];

const CAMPOS_SUELO = [
  { clave: 'ph', etiqueta: 'pH', unidad: '' },
  { clave: 'materia_organica', etiqueta: 'Materia orgánica', unidad: '%' },
  { clave: 'P', etiqueta: 'P', unidad: 'mg/kg' },
  { clave: 'K', etiqueta: 'K', unidad: 'cmol(+)/kg' },
  { clave: 'Ca', etiqueta: 'Ca', unidad: 'cmol(+)/kg' },
  { clave: 'Mg', etiqueta: 'Mg', unidad: 'cmol(+)/kg' },
  { clave: 'Al', etiqueta: 'Al', unidad: 'cmol(+)/kg' },
  { clave: 'saturacion_al', etiqueta: 'Saturación de Al', unidad: '%' },
  { clave: 'cice', etiqueta: 'CICE', unidad: 'cmol(+)/kg' },
];


// ============================================================
// COMPONENTE
// ============================================================

@Component({

  selector: 'app-diagnostico-ia',

  standalone: true,

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  imports: [
    IconComponent,
    RevealDirective,
    DecimalPipe,
    ResumenDiagnosticoComponent,
    TarjetasAbonosComponent
  ],

  template: `

    <!-- ======================================================
         ENCABEZADO
         ====================================================== -->

    <section
      class="mx-auto max-w-5xl px-4 sm:px-6 py-10"
    >

      <div class="text-center mb-8">

        <span class="badge-ia anim-fade-up">

          <app-icon
            name="brain"
            [size]="16"
          />

          Modelo YOLOv8

        </span>


        <h1
          class="hero-ia font-display font-extrabold text-3xl sm:text-4xl mt-4 anim-fade-up d-1"
        >

          Diagnóstico de Cultivo por Inteligencia Artificial

        </h1>


        <p
          class="text-[var(--texto-suave)] max-w-2xl mx-auto mt-4 anim-fade-up d-2"
        >

          Sube o captura una fotografía de la hoja o fruto de café
          para detectar enfermedades o deficiencias nutricionales
          mediante nuestro modelo YOLOv8.

        </p>

      </div>


      <!-- ======================================================
           SELECTOR DE MODO
           ====================================================== -->

      <div
        appReveal
        class="flex justify-center mb-6"
      >

        <div class="switch-ia">

          <button
            type="button"
            [class.on]="modo() === 'archivo'"
            (click)="cambiarModo('archivo')"
          >

            <app-icon
              name="upload"
              [size]="16"
            />

            Subir archivo

          </button>


          <button
            type="button"
            [class.on]="modo() === 'camara'"
            (click)="cambiarModo('camara')"
          >

            <app-icon
              name="camera"
              [size]="16"
            />

            Usar cámara

          </button>

        </div>

      </div>


      <!-- ======================================================
           ENTRADA + PREVIEW
           ====================================================== -->

      <div
        class="grid lg:grid-cols-2 gap-6 mb-8"
      >

        <div appReveal>

          @if (modo() === 'archivo') {

            <div
              class="dropzone"
              [class.drag]="arrastrando()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
            >

              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                class="absolute inset-0 opacity-0 cursor-pointer z-10"
                (change)="onFile($event)"
              />


              <span
                class="circulo"
                [class.drag]="arrastrando()"
              >

                <app-icon
                  name="camera"
                  [size]="34"
                />

              </span>


              <p
                class="font-display font-semibold text-lg mt-4"
              >

                Arrastra tu imagen aquí o haz clic para buscar

              </p>


              <p
                class="text-sm text-[var(--texto-suave)] mt-1"
              >

                Formatos aceptados: JPG, PNG

              </p>


              <span
                class="btn btn-outline mt-4"
              >

                <app-icon
                  name="upload"
                  [size]="16"
                />

                Seleccionar archivo

              </span>

            </div>

          } @else {

            <div class="camara-box">

              @if (camaraActiva()) {

                <video
                  #video
                  autoplay
                  playsinline
                  class="w-full h-full object-cover"
                ></video>


                <button
                  type="button"
                  class="obturador"
                  (click)="capturar()"
                  title="Capturar"
                >

                  <app-icon
                    name="camera"
                    [size]="26"
                  />

                </button>

              } @else {

                <div
                  class="flex flex-col items-center justify-center h-full gap-3 text-center p-6"
                >

                  <span class="circulo">

                    <app-icon
                      name="camera"
                      [size]="34"
                    />

                  </span>


                  <p
                    class="text-[var(--texto-suave)] text-sm"
                  >

                    {{
                      errorCamara()
                      || 'Iniciando la cámara…'
                    }}

                  </p>


                  @if (errorCamara()) {

                    <button
                      type="button"
                      class="btn btn-outline"
                      (click)="iniciarCamara()"
                    >

                      Reintentar

                    </button>

                  }

                </div>

              }

            </div>

          }

        </div>


        <div
          appReveal="100"
          class="card p-4 flex flex-col"
        >

          <h3
            class="font-display font-bold flex items-center gap-2 mb-3"
          >

            <app-icon
              name="image"
              [size]="18"
              class="text-[var(--verde-primary)]"
            />

            Vista previa

          </h3>


          <div
            class="flex-1 grid place-items-center rounded-xl bg-[var(--verde-soft)] min-h-64 overflow-hidden relative"
          >

            @if (previewUrl()) {

              <img
                [src]="previewUrl()!"
                alt="Vista previa"
                class="w-full h-full object-contain max-h-80"
              />


              <button
                type="button"
                class="absolute top-2 right-2 btn btn-danger !p-2 !rounded-full"
                (click)="limpiarImagen()"
                title="Quitar"
              >

                <app-icon
                  name="close"
                  [size]="16"
                />

              </button>

            } @else {

              <div
                class="text-center text-[var(--texto-suave)] p-6"
              >

                <app-icon
                  name="image"
                  [size]="40"
                  class="opacity-40"
                />

                <p class="text-sm mt-2">

                  Aquí verás la foto seleccionada o capturada.

                </p>

              </div>

            }

          </div>

        </div>

      </div>


      <!-- ======================================================
           BOTÓN DE DIAGNÓSTICO
           ====================================================== -->

      @if (previewUrl() && !resultado()) {

        <div
          class="flex justify-center mb-8"
        >

          <button
            type="button"
            class="btn btn-danger !h-14 !px-8 !text-lg"
            [disabled]="procesando()"
            (click)="abrirConfiguracionDiagnostico()"
          >

            @if (procesando()) {

              <span class="spinner"></span>

              Analizando imagen…

            } @else {

              <app-icon
                name="sparkles"
                [size]="20"
              />

              Analizar cultivo

            }

          </button>

        </div>

      }


      <!-- ======================================================
           RESULTADO
           ====================================================== -->

      @if (resultado(); as r) {

        <div
          appReveal
          class="space-y-6"
        >

          <div class="card overflow-hidden">

            <div
              class="bg-[var(--verde-primary)] text-white px-6 py-4 flex items-center gap-3"
            >

              <app-icon
                name="brain"
                [size]="22"
              />

              <h2
                class="font-display font-bold text-lg"
              >

                Resultado del diagnóstico

              </h2>

            </div>


            <div class="p-6">

              <div
                class="flex flex-wrap items-center gap-3 mb-4"
              >

                <span
                  class="estado"
                  [class.estado-alert]="r.status === 'alert'"
                  [class.estado-healthy]="r.status === 'healthy'"
                  [class.estado-deficiency]="r.status === 'deficiency'"
                >

                  <app-icon
                    [name]="
                      r.status === 'healthy'
                        ? 'check'
                        : r.status === 'deficiency'
                          ? 'help'
                          : 'alert'
                    "
                    [size]="18"
                  />

                  {{ etiquetaEstado(r.status) }}

                </span>


                <span
                  class="chip-diagnostico"
                >

                  {{ nombreDeteccion(r.diagnosis) }}

                </span>

              </div>


              <p
                class="text-lg font-display font-bold text-[var(--verde-primary)]"
              >

                {{ r.diagnosis }}

              </p>


              @if (r.scientificName) {

                <p
                  class="text-sm italic text-[var(--texto-suave)] mt-1"
                >

                  {{ r.scientificName }}

                </p>

              }


              @if (r.recommendation) {

                <div
                  class="bg-[var(--verde-soft)] rounded-xl p-5 mt-5"
                >

                  <p
                    class="text-xs uppercase tracking-wider text-[var(--texto-suave)] mb-2"
                  >

                    Recomendación técnica

                  </p>


                  <p
                    class="text-sm leading-relaxed"
                  >

                    {{ r.recommendation }}

                  </p>

                </div>

              }

            </div>

          </div>


          @if (contextoCultivo(); as contexto) {

            <div
              appReveal
              class="card p-6"
            >

              <h3
                class="font-display font-bold flex items-center gap-2 mb-4"
              >

                <app-icon
                  name="leaf"
                  [size]="20"
                  class="text-[var(--verde-primary)]"
                />

                Contexto utilizado para la recomendación

              </h3>


              <div
                class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >

                <div class="contexto-item">

                  <span>Variedad</span>

                  <strong>
                    {{ nombreVariedad(contexto.variedad) }}
                  </strong>

                </div>


                <div class="contexto-item">

                  <span>Temporada</span>

                  <strong>
                    {{ nombreTemporada(contexto.temporada) }}
                  </strong>

                </div>


                @if (contexto.fuente === 'manual') {

                  <div class="contexto-item">

                    <span>Condiciones</span>

                    <strong>
                      Datos ingresados
                    </strong>

                  </div>


                  <div class="contexto-item">

                    <span>Origen</span>

                    <strong>
                      Medición manual (sin Arduino)
                    </strong>

                  </div>

                } @else if (contexto.usarSensores) {

                  <div class="contexto-item">

                    <span>Condiciones</span>

                    <strong>
                      Sensores (Arduino)
                    </strong>

                  </div>


                  <div class="contexto-item">

                    <span>Periodo</span>

                    <strong>
                      {{ contexto.desde || '—' }}
                      →
                      {{ contexto.hasta || '—' }}
                    </strong>

                  </div>

                } @else {

                  <div class="contexto-item">

                    <span>Condiciones</span>

                    <strong>
                      Clima
                    </strong>

                  </div>


                  <div class="contexto-item">

                    <span>Clima</span>

                    <strong>
                      {{ nombreClima(contexto.condicionClimatica) }}
                    </strong>

                  </div>

                }

              </div>

            </div>

          }


          <div appReveal class="card p-6">

            <div class="flex flex-wrap items-start justify-between gap-3 mb-4">

              <div>
                <h3 class="font-display font-bold text-lg text-[var(--texto)] flex items-center gap-2">
                  <app-icon name="ph" [size]="20" class="text-[var(--verde-primary)]" />
                  Datos del suelo usados
                </h3>
                <p class="text-sm text-[var(--texto-suave)] mt-1">
                  @switch (datosSuelo()?.fuente) {
                    @case ('arduino') { Promedio de {{ datosSuelo()!.lecturas }} lecturas de los sensores Arduino. }
                    @case ('manual') { Valores ingresados manualmente (medidos sin Arduino). }
                    @default { No se usaron datos del suelo: la recomendación se basó en el clima. }
                  }
                </p>
              </div>

              <button type="button" class="btn btn-outline" [disabled]="procesando()" (click)="abrirEdicionSuelo()">
                <app-icon name="edit" [size]="16" />
                {{ datosSuelo() ? 'Modificar datos' : 'Agregar datos del suelo' }}
              </button>

            </div>

            @if (datosSuelo(); as d) {

              <div class="grid grid-cols-3 gap-3">

                <div class="suelo-dato">
                  <app-icon name="ph" [size]="20" />
                  <strong>{{ d.ph === null ? '—' : (d.ph | number:'1.1-2') }}</strong>
                  <span>pH</span>
                </div>

                <div class="suelo-dato">
                  <app-icon name="drop" [size]="20" />
                  <strong>{{ d.humedad === null ? '—' : (d.humedad | number:'1.0-1') + ' %' }}</strong>
                  <span>Humedad</span>
                </div>

                <div class="suelo-dato">
                  <app-icon name="thermo" [size]="20" />
                  <strong>{{ d.temperatura === null ? '—' : (d.temperatura | number:'1.0-1') + ' °C' }}</strong>
                  <span>Temperatura</span>
                </div>

              </div>

            }

          </div>


          @if (r.fertilizacion; as f) {

            <div appReveal class="card p-6">

              <h3 class="font-display font-bold flex items-center gap-2 mb-4">
                <app-icon name="brain" [size]="20" class="text-[var(--verde-primary)]" />
                Diagnóstico y validación
              </h3>

              <app-resumen-diagnostico [recomendacion]="f" />

            </div>


            <div appReveal class="card p-6">

              <div class="flex items-center gap-3 mb-4">

                <span class="icon-badge">
                  <app-icon name="leaf" [size]="22" />
                </span>

                <h2 class="font-display font-extrabold text-2xl text-[var(--verde-primary)]">
                  Abonos recomendados
                </h2>

              </div>

              <app-tarjetas-abonos [recomendacion]="f" />

            </div>

          } @else if (obtenerAbonos(r).length) {

            <div
              appReveal
              class="card p-6"
            >

              <div class="mb-6">

                <div
                  class="flex items-center gap-3"
                >

                  <span class="icon-badge">

                    <app-icon
                      name="leaf"
                      [size]="22"
                    />

                  </span>


                  <div>

                    <h2
                      class="font-display font-extrabold text-2xl text-[var(--verde-primary)]"
                    >

                      Abonos recomendados

                    </h2>


                    <p
                      class="text-sm text-[var(--texto-suave)] mt-1"
                    >

                      Se seleccionaron hasta 3 opciones teniendo en cuenta
                      el diagnóstico, la temporada y las condiciones del cultivo.

                    </p>

                  </div>

                </div>

              </div>


              <div
                class="grid md:grid-cols-3 gap-5"
              >

                @for (
                  abono of obtenerAbonos(r);
                  track abono.nombre;
                  let i = $index
                ) {

                  <article
                    class="abono-card"
                    appReveal
                  >

                    <div
                      class="abono-numero"
                    >

                      {{ i + 1 }}

                    </div>


                    <div
                      class="abono-icon"
                    >

                      <app-icon
                        name="leaf"
                        [size]="25"
                      />

                    </div>


                    <h3
                      class="font-display font-extrabold text-xl text-[var(--verde-primary)] mt-4"
                    >

                      {{ abono.nombre }}

                    </h3>


                    @if (abono.formula) {

                      <span
                        class="formula"
                      >

                        {{ abono.formula }}

                      </span>

                    }


                    @if (abono.nutrientes) {

                      <div class="info-abono">

                        <span class="info-titulo">
                          Nutrientes
                        </span>

                        <p>
                          {{ abono.nutrientes }}
                        </p>

                      </div>

                    }


                    @if (abono.descripcion) {

                      <div class="info-abono">

                        <span class="info-titulo">
                          ¿Qué es?
                        </span>

                        <p>
                          {{ abono.descripcion }}
                        </p>

                      </div>

                    }


                    @if (abono.paraQueSirve || abono.uso) {

                      <div class="info-abono">

                        <span class="info-titulo">
                          ¿Para qué sirve?
                        </span>

                        <p>
                          {{
                            abono.paraQueSirve
                            || abono.uso
                          }}
                        </p>

                      </div>

                    }


                    @if (abono.porQueSeRecomienda) {

                      <div class="porque-abono">

                        <span class="info-titulo">
                          ¿Por qué se recomienda?
                        </span>

                        <p>
                          {{ abono.porQueSeRecomienda }}
                        </p>

                      </div>

                    }


                    @if (abono.aplicacion) {

                      <div class="aplicacion">

                        <app-icon
                          name="info"
                          [size]="15"
                        />

                        {{ abono.aplicacion }}

                      </div>

                    }

                  </article>

                }

              </div>

            </div>

          }


          @if (r.boundingBoxes.length) {

            <div
              appReveal
              class="card p-6"
            >

              <h3
                class="font-display font-bold flex items-center gap-2 mb-4"
              >

                <app-icon
                  name="search"
                  [size]="20"
                  class="text-[var(--verde-primary)]"
                />

                Detecciones realizadas

              </h3>


              <div
                class="space-y-2"
              >

                @for (
                  d of r.boundingBoxes;
                  track $index
                ) {

                  <div
                    class="deteccion-row"
                  >

                    <span>
                      {{ nombreDeteccion(d.label) }}
                    </span>


                    <strong>
                      {{ d.confidence | number:'1.0-1' }}%
                    </strong>

                  </div>

                }

              </div>

            </div>

          }


          <div
            class="flex flex-wrap justify-center gap-3 pt-2"
          >

            <button
              type="button"
              class="btn btn-primary"
              [disabled]="guardando()"
              (click)="guardarHistorial()"
            >

              <app-icon
                name="save"
                [size]="18"
              />

              {{
                guardando()
                  ? 'Guardando…'
                  : 'Guardar diagnóstico'
              }}

            </button>


            <button
              type="button"
              class="btn btn-outline"
              [disabled]="descargando()"
              (click)="descargarPdf()"
            >

              <app-icon
                name="download"
                [size]="18"
              />

              {{
                descargando()
                  ? 'Generando PDF…'
                  : 'Descargar PDF'
              }}

            </button>


            <button
              type="button"
              class="btn btn-outline"
              (click)="limpiarImagen()"
            >

              <app-icon
                name="refresh"
                [size]="18"
              />

              Nuevo diagnóstico

            </button>

          </div>

        </div>

      }

    </section>


    @if (editandoSuelo()) {

      <div class="modal-backdrop" (click)="editandoSuelo.set(false)">

        <div class="modal-card" (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between mb-2">
            <h2 class="font-display font-extrabold text-xl text-[var(--verde-primary)]">
              Modificar datos del suelo
            </h2>
            <button type="button" class="btn btn-outline !p-2 !rounded-full" (click)="editandoSuelo.set(false)">
              <app-icon name="close" [size]="16" />
            </button>
          </div>

          <p class="text-sm text-[var(--texto-suave)] mb-4">
            Corrige los valores (de los Arduinos o de tu propia medición) y
            se recalculará la recomendación con la misma foto.
          </p>

          <div class="grid grid-cols-3 gap-3 mb-5">

            <div>
              <label class="lbl">pH</label>
              <input type="number" inputmode="decimal" step="0.1" min="0" max="14" class="field"
                     [value]="phManual() ?? ''" (input)="phManual.set(leerNumero($event))" />
            </div>

            <div>
              <label class="lbl">Humedad (%)</label>
              <input type="number" inputmode="decimal" step="1" min="0" max="100" class="field"
                     [value]="humedadManual() ?? ''" (input)="humedadManual.set(leerNumero($event))" />
            </div>

            <div>
              <label class="lbl">Temp. (°C)</label>
              <input type="number" inputmode="decimal" step="0.5" min="-10" max="60" class="field"
                     [value]="temperaturaManual() ?? ''" (input)="temperaturaManual.set(leerNumero($event))" />
            </div>

          </div>

          <button type="button" class="btn btn-primary w-full" [disabled]="procesando()" (click)="recalcularConDatosSuelo()">
            @if (procesando()) {
              <span class="spinner"></span> Recalculando…
            } @else {
              <app-icon name="sparkles" [size]="18" /> Recalcular recomendación
            }
          </button>

        </div>

      </div>

    }


    @if (mostrarModal()) {

      <div
        class="modal-backdrop"
        (click)="cerrarModal()"
      >

        <div
          class="modal-card"
          (click)="$event.stopPropagation()"
        >

          <div
            class="flex items-center justify-between mb-5"
          >

            <div>

              <h2
                class="font-display font-extrabold text-xl text-[var(--verde-primary)]"
              >

                Configurar diagnóstico

              </h2>


              <p
                class="text-sm text-[var(--texto-suave)] mt-1"
              >

                Selecciona el contexto para mejorar la recomendación.

              </p>

            </div>


            <button
              type="button"
              class="btn btn-outline !p-2 !rounded-full"
              (click)="cerrarModal()"
            >

              <app-icon
                name="close"
                [size]="16"
              />

            </button>

          </div>


          <label class="lbl">
            Variedad
          </label>

          <select
            class="field mb-4"
            [value]="variedad()"
            (change)="variedad.set($any($event.target).value)"
          >

            <option value="">
              Seleccionar variedad
            </option>

            <option value="caturra">
              Caturra
            </option>

            <option value="castillo">
              Castillo
            </option>

            <option value="bourbon">
              Bourbon
            </option>

            <option value="tabi">
              Tabi
            </option>

            <option value="typica">
              Typica
            </option>

            <option value="maragogipe">
              Maragogipe
            </option>

          </select>


          <label class="lbl">
            Temporada
          </label>

          <select
            class="field mb-4"
            [value]="temporada()"
            (change)="temporada.set($any($event.target).value)"
          >

            <option value="cosecha">
              Cosecha
            </option>

            <option value="mitaca">
              Mitaca
            </option>

            <option value="floracion">
              Floración
            </option>

            <option value="recuperacion">
              Recuperación
            </option>

          </select>


          <div
            class="modo-sensores mb-4"
          >

            <button
              type="button"
              [class.selected]="usarSensores()"
              (click)="usarSensores.set(true)"
            >

              <app-icon
                name="chip"
                [size]="18"
              />

              Usar sensores

            </button>


            <button
              type="button"
              [class.selected]="!usarSensores()"
              (click)="usarSensores.set(false)"
            >

              <app-icon
                name="edit"
                [size]="18"
              />

              Sin sensores

            </button>

          </div>


          @if (usarSensores()) {

            <label class="lbl">
              Desde
            </label>

            <input
              type="date"
              class="field mb-4"
              [value]="desde()"
              (input)="desde.set($any($event.target).value)"
            />


            <label class="lbl">
              Hasta
            </label>

            <input
              type="date"
              class="field mb-4"
              [value]="hasta()"
              (input)="hasta.set($any($event.target).value)"
            />

          } @else {

            <div class="modo-sensores sub mb-4">

              <button
                type="button"
                [class.selected]="modoSinSensores() === 'manual'"
                (click)="modoSinSensores.set('manual')"
              >
                <app-icon name="ph" [size]="16" />
                Ingresar mis datos
              </button>

              <button
                type="button"
                [class.selected]="modoSinSensores() === 'ninguno'"
                (click)="modoSinSensores.set('ninguno')"
              >
                <app-icon name="help" [size]="16" />
                No tengo datos
              </button>

            </div>

          }


          @if (!usarSensores() && modoSinSensores() === 'manual') {

            <p class="text-xs text-[var(--texto-suave)] mb-3 leading-relaxed">
              Escribe los valores que mediste en el suelo sin Arduino
              (medidor de pH, higrómetro o termómetro).
            </p>

            <div class="grid grid-cols-3 gap-3 mb-4">

              <div>
                <label class="lbl">pH</label>
                <input
                  type="number" inputmode="decimal" step="0.1" min="0" max="14"
                  class="field" placeholder="5.5"
                  [value]="phManual() ?? ''"
                  (input)="phManual.set(leerNumero($event))"
                />
              </div>

              <div>
                <label class="lbl">Humedad (%)</label>
                <input
                  type="number" inputmode="decimal" step="1" min="0" max="100"
                  class="field" placeholder="55"
                  [value]="humedadManual() ?? ''"
                  (input)="humedadManual.set(leerNumero($event))"
                />
              </div>

              <div>
                <label class="lbl">Temp. (°C)</label>
                <input
                  type="number" inputmode="decimal" step="0.5" min="-10" max="60"
                  class="field" placeholder="21"
                  [value]="temperaturaManual() ?? ''"
                  (input)="temperaturaManual.set(leerNumero($event))"
                />
              </div>

            </div>

          }


          @if (!usarSensores() && modoSinSensores() === 'ninguno') {

            <label class="lbl">
              Condición climática
            </label>

            <select
              class="field mb-4"
              [value]="condicionClimatica() || ''"
              (change)="condicionClimatica.set($any($event.target).value || null)"
            >

              <option value="">
                Seleccionar condición
              </option>

              <option value="seca">
                Seca
              </option>

              <option value="normal">
                Normal
              </option>

              <option value="lluviosa">
                Lluviosa
              </option>

            </select>

          }


          <details class="lab mb-4">

            <summary>
              <app-icon name="search" [size]="16" />
              Análisis de laboratorio (opcional)
              @if (cantidadAnalisis()) {
                <span class="lab-count">{{ cantidadAnalisis() }}</span>
              }
            </summary>

            <p class="text-xs text-[var(--texto-suave)] mt-3 mb-3 leading-relaxed">
              Si tienes un análisis foliar o de suelo, escribe solo los valores que tengas.
              Los campos vacíos no se usan. Sin análisis, el sistema no recomienda un
              fertilizante específico con base solo en la foto.
            </p>

            <span class="lbl">Análisis foliar</span>
            <div class="grid grid-cols-3 gap-2 mb-4">
              @for (c of camposFoliares; track c.clave) {
                <div>
                  <label class="lbl-mini">{{ c.etiqueta }} ({{ c.unidad }})</label>
                  <input type="number" inputmode="decimal" step="any" min="0" class="field field-mini"
                         [placeholder]="c.rango"
                         [value]="analisisFoliar()[c.clave] ?? ''"
                         (input)="cambiarAnalisis('foliar', c.clave, $event)" />
                </div>
              }
            </div>

            <span class="lbl">Análisis de suelo</span>
            <div class="grid grid-cols-3 gap-2">
              @for (c of camposSuelo; track c.clave) {
                <div>
                  <label class="lbl-mini">{{ c.etiqueta }}{{ c.unidad ? ' (' + c.unidad + ')' : '' }}</label>
                  <input type="number" inputmode="decimal" step="any" class="field field-mini"
                         [value]="analisisSuelo()[c.clave] ?? ''"
                         (input)="cambiarAnalisis('suelo', c.clave, $event)" />
                </div>
              }
              <div>
                <label class="lbl-mini">Textura</label>
                <select class="field field-mini" [value]="texturaSuelo()"
                        (change)="texturaSuelo.set($any($event.target).value)">
                  <option value="">—</option>
                  <option value="arenosa">Arenosa</option>
                  <option value="franca">Franca</option>
                  <option value="arcillosa">Arcillosa</option>
                </select>
              </div>
            </div>

          </details>


          <button
            type="button"
            class="btn btn-primary w-full mt-2"
            [disabled]="procesando()"
            (click)="confirmarDiagnostico()"
          >

            @if (procesando()) {

              <span class="spinner"></span>

              Analizando…

            } @else {

              <app-icon
                name="sparkles"
                [size]="18"
              />

              Analizar imagen

            }

          </button>

        </div>

      </div>

    }

  `,

  styles: [`

    .badge-ia {
      display:inline-flex;
      align-items:center;
      gap:.4rem;
      padding:.35rem .8rem;
      border-radius:999px;
      background:var(--verde-soft);
      color:var(--verde-primary);
      font-size:.78rem;
      font-weight:700;
    }

    .switch-ia {
      display:flex;
      gap:.3rem;
      padding:.3rem;
      border-radius:999px;
      background:var(--verde-soft);
    }

    .switch-ia button {
      display:flex;
      align-items:center;
      gap:.4rem;
      border:0;
      border-radius:999px;
      padding:.55rem 1rem;
      background:transparent;
      font-weight:600;
      cursor:pointer;
    }

    .switch-ia button.on {
      background:var(--verde-primary);
      color:white;
    }

    .dropzone {
      min-height:330px;
      border:2px dashed var(--borde);
      border-radius:1.25rem;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      text-align:center;
      padding:2rem;
      position:relative;
      background:white;
      transition:.2s;
    }

    .dropzone:hover,
    .dropzone.drag {
      border-color:var(--verde-primary);
      background:var(--verde-soft);
    }

    .circulo {
      width:76px;
      height:76px;
      border-radius:50%;
      display:grid;
      place-items:center;
      background:var(--verde-soft);
      color:var(--verde-primary);
    }

    .circulo.drag {
      transform:scale(1.08);
    }

    .camara-box {
      min-height:330px;
      border-radius:1.25rem;
      overflow:hidden;
      background:#111;
      position:relative;
    }

    .obturador {
      position:absolute;
      left:50%;
      bottom:20px;
      transform:translateX(-50%);
      width:60px;
      height:60px;
      border-radius:50%;
      border:4px solid white;
      display:grid;
      place-items:center;
      background:var(--verde-primary);
      color:white;
      cursor:pointer;
    }

    .card {
      background:white;
      border:1px solid var(--borde);
      border-radius:1.25rem;
      box-shadow:0 8px 30px rgba(0,0,0,.05);
    }

    .estado {
      display:inline-flex;
      align-items:center;
      gap:.45rem;
      padding:.45rem 1rem;
      border-radius:999px;
      font-weight:700;
    }

    .estado-alert {
      background:#fdecea;
      color:#d9383a;
    }

    .estado-healthy {
      background:var(--verde-soft);
      color:var(--verde-primary);
    }

    .estado-deficiency {
      background:#fff3e0;
      color:#fb8c00;
    }

    .chip-diagnostico {
      display:inline-flex;
      align-items:center;
      padding:.45rem 1rem;
      border-radius:999px;
      background:var(--verde-soft);
      color:var(--verde-primary);
      font-weight:600;
    }

    .icon-badge {
      width:48px;
      height:48px;
      border-radius:50%;
      display:grid;
      place-items:center;
      background:var(--verde-soft);
      color:var(--verde-primary);
      flex-shrink:0;
    }

    .contexto-item {
      padding:1rem;
      border:1px solid var(--borde);
      border-radius:.9rem;
      background:#fff;
    }

    .contexto-item span {
      display:block;
      font-size:.72rem;
      color:var(--texto-suave);
      margin-bottom:.25rem;
    }

    .contexto-item strong {
      display:block;
      font-size:.9rem;
    }

    .abono-card {
      position:relative;
      padding:1.4rem;
      border:1px solid var(--borde);
      border-radius:1.15rem;
      background:white;
      box-shadow:0 5px 18px rgba(0,0,0,.04);
      transition:.2s;
    }

    .abono-card:hover {
      transform:translateY(-3px);
      box-shadow:0 10px 25px rgba(0,0,0,.08);
      border-color:var(--verde-accent);
    }

    .abono-numero {
      position:absolute;
      top:12px;
      right:12px;
      width:30px;
      height:30px;
      border-radius:50%;
      display:grid;
      place-items:center;
      background:var(--verde-primary);
      color:white;
      font-weight:800;
      font-size:.8rem;
    }

    .abono-icon {
      width:52px;
      height:52px;
      border-radius:15px;
      display:grid;
      place-items:center;
      background:var(--verde-soft);
      color:var(--verde-primary);
    }

    .formula {
      display:inline-block;
      margin-top:.5rem;
      padding:.3rem .65rem;
      border-radius:999px;
      background:var(--verde-soft);
      color:var(--verde-primary);
      font-size:.75rem;
      font-weight:700;
    }

    .info-abono {
      margin-top:1rem;
      padding-top:.8rem;
      border-top:1px solid var(--borde);
    }

    .info-titulo {
      display:block;
      font-size:.72rem;
      text-transform:uppercase;
      letter-spacing:.05em;
      color:var(--texto-suave);
      font-weight:700;
      margin-bottom:.25rem;
    }

    .info-abono p,
    .porque-abono p {
      font-size:.82rem;
      line-height:1.55;
      margin:0;
    }

    .porque-abono {
      margin-top:1rem;
      padding:.9rem;
      border-radius:.85rem;
      background:var(--verde-soft);
    }

    .aplicacion {
      display:flex;
      align-items:center;
      gap:.35rem;
      margin-top:1rem;
      padding-top:.8rem;
      border-top:1px solid var(--borde);
      font-size:.75rem;
      color:var(--texto-suave);
    }

    .deteccion-row {
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:.75rem 1rem;
      border-radius:.75rem;
      background:var(--verde-soft);
    }

    .modal-backdrop {
      position:fixed;
      inset:0;
      z-index:1000;
      background:rgba(0,0,0,.5);
      display:grid;
      place-items:center;
      padding:1rem;
    }

    .modal-card {
      width:min(100%,520px);
      max-height:90vh;
      overflow-y:auto;
      background:white;
      border-radius:1.25rem;
      padding:1.5rem;
      box-shadow:0 20px 60px rgba(0,0,0,.2);
    }

    .lbl {
      display:block;
      font-size:.78rem;
      font-weight:600;
      margin-bottom:.35rem;
      color:var(--texto-suave);
    }

    .field {
      width:100%;
      border:1px solid var(--borde);
      border-radius:.75rem;
      padding:.7rem .85rem;
      background:white;
    }

    .modo-sensores {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:.5rem;
    }

    .modo-sensores button {
      display:flex;
      justify-content:center;
      align-items:center;
      gap:.4rem;
      padding:.75rem;
      border:1px solid var(--borde);
      border-radius:.8rem;
      background:white;
      cursor:pointer;
      font-weight:600;
    }

    .modo-sensores.sub button {
      padding:.55rem;
      font-size:.85rem;
    }

    .suelo-dato {
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:.25rem;
      padding:.9rem .5rem;
      border-radius:1rem;
      background:var(--verde-soft);
      color:var(--verde-primary);
      text-align:center;
    }

    .suelo-dato strong {
      font-size:1.25rem;
      color:var(--texto);
    }

    .suelo-dato span {
      font-size:.75rem;
      color:var(--texto-suave);
    }

    .modo-sensores button.selected {
      background:var(--verde-primary);
      color:white;
      border-color:var(--verde-primary);
    }

    .lab {
      border:1px solid var(--borde);
      border-radius:.9rem;
      padding:.75rem .9rem;
    }

    .lab summary {
      display:flex;
      align-items:center;
      gap:.45rem;
      cursor:pointer;
      font-weight:600;
      font-size:.9rem;
      color:var(--verde-primary);
    }

    .lab-count {
      margin-left:auto;
      min-width:22px;
      padding:0 .4rem;
      border-radius:999px;
      background:var(--verde-primary);
      color:white;
      font-size:.72rem;
      text-align:center;
    }

    .lbl-mini {
      display:block;
      font-size:.68rem;
      color:var(--texto-suave);
      margin-bottom:.2rem;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

    .field-mini {
      padding:.45rem .55rem;
      font-size:.85rem;
    }

    .spinner {
      width:18px;
      height:18px;
      border:2px solid currentColor;
      border-right-color:transparent;
      border-radius:50%;
      display:inline-block;
      animation:girar .7s linear infinite;
    }

    @keyframes girar {
      to {
        transform:rotate(360deg);
      }
    }

  `]
})
export class DiagnosticoIaComponent implements OnDestroy {

  private router =
    inject(Router);

  private notify =
    inject(NotifyService);

  private api =
    inject(DiagnosticoService);

  private state =
    inject(AppState);

  private platformId =
    inject(PLATFORM_ID);

  private esNavegador =
    isPlatformBrowser(
      this.platformId
    );


  @ViewChild('video')
  video?: ElementRef<HTMLVideoElement>;


  modo =
    signal<'archivo' | 'camara'>(
      'archivo'
    );

  arrastrando =
    signal(false);

  previewUrl =
    signal<string | null>(
      null
    );

  resultado =
    signal<DiagnosisResult | null>(
      null
    );

  procesando =
    signal(false);

  guardando =
    signal(false);

  descargando =
    signal(false);

  camaraActiva =
    signal(false);

  errorCamara =
    signal<string | null>(
      null
    );

  mostrarModal =
    signal(false);


  variedad =
    signal<string>(
      ''
    );

  temporada =
    signal<Temporada>(
      'cosecha'
    );

  usarSensores =
    signal<boolean>(
      true
    );

  desde =
    signal<string>(
      ''
    );

  hasta =
    signal<string>(
      ''
    );

  condicionClimatica =
    signal<CondicionClimatica | null>(
      null
    );


  /** Sin sensores: escribir los datos del suelo o solo elegir el clima. */
  modoSinSensores =
    signal<'manual' | 'ninguno'>(
      'manual'
    );

  phManual =
    signal<number | null>(null);

  humedadManual =
    signal<number | null>(null);

  temperaturaManual =
    signal<number | null>(null);


  /** Análisis de laboratorio opcionales (se envían solo si hay valores). */
  readonly camposFoliares = CAMPOS_FOLIARES;

  readonly camposSuelo = CAMPOS_SUELO;

  analisisFoliar =
    signal<Record<string, number | null>>({});

  analisisSuelo =
    signal<Record<string, number | null>>({});

  texturaSuelo =
    signal<string>('');


  /** Datos del suelo usados en la recomendación actual. */
  datosSuelo =
    signal<DatosSuelo | null>(null);

  /** Modal "Modificar datos del suelo" (desde el resultado). */
  editandoSuelo =
    signal(false);


  contextoCultivo =
    signal<ContextoCultivo | null>(
      null
    );


  archivo:
    File | null =
    null;


  private stream:
    MediaStream | null =
    null;


  cambiarModo(
    modo: 'archivo' | 'camara'
  ) {

    this.modo.set(
      modo
    );


    if (
      modo === 'camara'
    ) {

      this.iniciarCamara();

    } else {

      this.detenerCamara();

    }

  }


  onFile(
    event: Event
  ) {

    const input =
      event.target as HTMLInputElement;

    const archivo =
      input.files?.[0];

    // Se limpia para que volver a elegir la misma foto también funcione.
    input.value = '';

    if (
      archivo
    ) {

      this.seleccionarArchivo(
        archivo
      );

    }

  }


  seleccionarArchivo(
    archivo: File
  ) {

    if (
      !archivo.type.startsWith(
        'image/'
      )
    ) {

      this.notify.error(
        'Selecciona una imagen JPG o PNG.'
      );

      return;

    }


    this.detenerCamara();

    this.archivo =
      archivo;


    this.previewUrl.set(
      URL.createObjectURL(
        archivo
      )
    );


    this.resultado.set(
      null
    );

  }


  onDragOver(
    event: DragEvent
  ) {

    event.preventDefault();

    this.arrastrando.set(
      true
    );

  }


  onDragLeave(
    event: DragEvent
  ) {

    event.preventDefault();

    this.arrastrando.set(
      false
    );

  }


  onDrop(
    event: DragEvent
  ) {

    event.preventDefault();

    this.arrastrando.set(
      false
    );


    const archivo =
      event.dataTransfer?.files?.[0];

    if (
      archivo
    ) {

      this.seleccionarArchivo(
        archivo
      );

    }

  }


  async iniciarCamara() {

    if (
      !this.esNavegador
    ) {

      return;

    }


    this.errorCamara.set(
      null
    );


    try {

      this.detenerCamara();


      this.stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: 'environment'
            }
          },
          audio: false
        });


      this.camaraActiva.set(
        true
      );


      setTimeout(() => {

        if (
          this.video?.nativeElement &&
          this.stream
        ) {

          this.video.nativeElement.srcObject =
            this.stream;

        }

      });

    } catch {

      this.camaraActiva.set(
        false
      );

      this.errorCamara.set(
        'No fue posible acceder a la cámara.'
      );

    }

  }


  capturar() {

    const video =
      this.video?.nativeElement;

    if (
      !video
    ) {

      return;

    }


    const canvas =
      document.createElement(
        'canvas'
      );


    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;


    const ctx =
      canvas.getContext(
        '2d'
      );

    if (
      !ctx
    ) {

      return;

    }


    ctx.drawImage(
      video,
      0,
      0
    );


    canvas.toBlob(
      (blob) => {

        if (
          !blob
        ) {

          return;

        }


        const archivo =
          new File(
            [blob],
            `captura-${Date.now()}.jpg`,
            {
              type: 'image/jpeg'
            }
          );


        this.seleccionarArchivo(
          archivo
        );


        this.detenerCamara();

      },
      'image/jpeg',
      .92
    );

  }


  detenerCamara() {

    if (
      this.stream
    ) {

      this.stream
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      this.stream =
        null;

    }


    this.camaraActiva.set(
      false
    );

  }


  abrirConfiguracionDiagnostico() {

    if (
      !this.archivo
    ) {

      return;

    }


    this.mostrarModal.set(
      true
    );

  }


  cerrarModal() {

    if (
      this.procesando()
    ) {

      return;

    }


    this.mostrarModal.set(
      false
    );

  }


  /** Convierte el valor de un <input type="number"> en número (o null si está vacío). */
  leerNumero(evento: Event): number | null {

    const texto =
      String((evento.target as HTMLInputElement).value ?? '')
        .replace(',', '.')
        .trim();

    if (!texto) return null;

    const n = Number(texto);

    return Number.isFinite(n) ? n : null;

  }


  /** Número o null (nunca convierte un dato ausente en 0). */
  numeroONulo(valor: unknown): number | null {

    if (valor === null || valor === undefined || valor === '') return null;

    const n = Number(valor);

    return Number.isFinite(n) ? n : null;

  }


  cambiarAnalisis(
    tipo: 'foliar' | 'suelo',
    clave: string,
    evento: Event
  ) {

    const destino = tipo === 'foliar' ? this.analisisFoliar : this.analisisSuelo;

    destino.update((actual) => ({ ...actual, [clave]: this.leerNumero(evento) }));

  }


  /** Quita los campos vacíos; si no queda ninguno devuelve null. */
  limpiarAnalisis(
    datos: Record<string, number | string | null>
  ): Record<string, number | string> | null {

    const limpio = Object.fromEntries(
      Object.entries(datos).filter(([, v]) => v !== null && v !== '')
    ) as Record<string, number | string>;

    return Object.keys(limpio).length ? limpio : null;

  }


  cantidadAnalisis(): number {

    return (
      Object.values(this.analisisFoliar()).filter((v) => v !== null).length +
      Object.values(this.analisisSuelo()).filter((v) => v !== null).length +
      (this.texturaSuelo() ? 1 : 0)
    );

  }


  /** Devuelve el mensaje de error, o null si los datos del suelo son válidos. */
  validarDatosSuelo(
    ph: number | null,
    humedad: number | null,
    temperatura: number | null
  ): string | null {

    if (ph === null || humedad === null || temperatura === null) {
      return 'Escribe el pH, la humedad y la temperatura del suelo.';
    }

    if (ph < 0 || ph > 14) return 'El pH debe estar entre 0 y 14.';

    if (humedad < 0 || humedad > 100) return 'La humedad debe estar entre 0 y 100 %.';

    if (temperatura < -10 || temperatura > 60) return 'La temperatura debe estar entre -10 y 60 °C.';

    return null;

  }


  /** Abre el modal con los datos actuales (de los Arduinos o manuales). */
  abrirEdicionSuelo() {

    const d = this.datosSuelo();

    this.phManual.set(d?.ph ?? null);
    this.humedadManual.set(d?.humedad ?? null);
    this.temperaturaManual.set(d?.temperatura ?? null);

    this.editandoSuelo.set(true);

  }


  /** Vuelve a analizar la misma foto usando los datos del suelo editados. */
  recalcularConDatosSuelo() {

    const anterior = this.contextoCultivo();

    if (!anterior || !this.archivo) return;

    const error =
      this.validarDatosSuelo(
        this.phManual(),
        this.humedadManual(),
        this.temperaturaManual()
      );

    if (error) {

      this.notify.error(error);

      return;

    }

    const contexto: ContextoCultivo = {
      ...anterior,
      fuente: 'manual',
      usarSensores: false,
      desde: null,
      hasta: null,
      condicionClimatica: null,
      ph: this.phManual(),
      humedad: this.humedadManual(),
      temperatura: this.temperaturaManual(),
    };

    // El modal de configuración queda coherente con los nuevos datos.
    this.usarSensores.set(false);
    this.modoSinSensores.set('manual');

    this.contextoCultivo.set(contexto);

    this.editandoSuelo.set(false);

    this.analizarImagen(contexto);

  }


  confirmarDiagnostico() {

    if (
      !this.archivo
    ) {

      return;

    }


    if (
      !this.variedad()
    ) {

      this.notify.error(
        'Selecciona la variedad del café.'
      );

      return;

    }


    if (
      this.usarSensores()
    ) {

      if (
        !this.desde() ||
        !this.hasta()
      ) {

        this.notify.error(
          'Selecciona las fechas de los sensores.'
        );

        return;

      }

    } else if (
      this.modoSinSensores() === 'manual'
    ) {

      const error =
        this.validarDatosSuelo(
          this.phManual(),
          this.humedadManual(),
          this.temperaturaManual()
        );

      if (error) {

        this.notify.error(error);

        return;

      }

    } else {

      if (
        !this.condicionClimatica()
      ) {

        this.notify.error(
          'Selecciona la condición climática.'
        );

        return;

      }

    }


    const fuente: FuenteSensores =
      this.usarSensores()
        ? 'arduino'
        : this.modoSinSensores() === 'manual'
          ? 'manual'
          : 'ninguno';


    const contexto:
      ContextoCultivo = {

      fuente,

      ph:
        fuente === 'manual'
          ? this.phManual()
          : null,

      humedad:
        fuente === 'manual'
          ? this.humedadManual()
          : null,

      temperatura:
        fuente === 'manual'
          ? this.temperaturaManual()
          : null,


      variedad:
        this.variedad(),

      temporada:
        this.temporada(),

      usarSensores:
        this.usarSensores(),

      desde:
        this.usarSensores()
          ? this.desde()
          : null,

      hasta:
        this.usarSensores()
          ? this.hasta()
          : null,

      condicionClimatica:
        fuente === 'ninguno'
          ? this.condicionClimatica()
          : null,

      analisisFoliar:
        this.limpiarAnalisis(this.analisisFoliar()) as Record<string, number> | null,

      analisisSuelo:
        this.limpiarAnalisis({
          ...this.analisisSuelo(),
          textura: this.texturaSuelo() || null
        })

    };


    this.contextoCultivo.set(
      contexto
    );


    this.state
      .guardarConfiguracionDiagnostico({
        variedad:
          contexto.variedad,

        temporada:
          contexto.temporada,

        usarSensores:
          contexto.usarSensores,

        desde:
          contexto.desde,

        hasta:
          contexto.hasta,

        condicionClimatica:
          contexto.condicionClimatica
      });


    this.mostrarModal.set(
      false
    );


    this.analizarImagen(
      contexto
    );

  }


  analizarImagen(
    contexto: ContextoCultivo
  ) {

    if (
      !this.archivo
    ) {

      return;

    }


    this.procesando.set(
      true
    );


    this.api
      .analizar(
        this.archivo,
        {

          variedad:
            contexto.variedad,

          temporada:
            contexto.temporada,

          usarSensores:
            contexto.usarSensores,

          desde:
            contexto.desde,

          hasta:
            contexto.hasta,

          condicionClimatica:
            contexto.condicionClimatica,

          fuenteSensores:
            contexto.fuente ?? (contexto.usarSensores ? 'arduino' : 'ninguno'),

          ph:
            contexto.ph ?? null,

          humedad:
            contexto.humedad ?? null,

          temperatura:
            contexto.temperatura ?? null,

          fincaId:
            this.state.fincaActiva()?.id ?? null,

          analisisFoliar:
            contexto.analisisFoliar ?? null,

          analisisSuelo:
            contexto.analisisSuelo ?? null

        }
      )
      .subscribe({

        next: (r) => {

          console.log(
            'RESULTADO COMPLETO IA:',
            r
          );


          const detecciones =
            Array.isArray(
              r?.detecciones
            )
              ? r.detecciones
              : Array.isArray(
                  r?.boundingBoxes
                )
                ? r.boundingBoxes
                : [];


          const boundingBoxes:
            BoundingBox[] =
            detecciones.map(
              (d: any) => ({

                label:
                  d.etiqueta ??
                  d.label ??
                  '',

                confidence:
                  Number(
                    d.confianza ??
                    d.confidence ??
                    0
                  ),

                x:
                  Number(
                    d.x ??
                    0
                  ),

                y:
                  Number(
                    d.y ??
                    0
                  ),

                width:
                  Number(
                    d.ancho ??
                    d.width ??
                    0
                  ),

                height:
                  Number(
                    d.alto ??
                    d.height ??
                    0
                  )

              })
            );


          const abonos =
            this.normalizarAbonos(
              r
            );


          const resultado:
            DiagnosisResult = {

            imageUrl:
              r?.imagen_url ??
              r?.imageUrl ??
              this.previewUrl() ??
              '',

            boundingBoxes,

            status:
              r?.estado ??
              r?.status ??
              'alert',

            diagnosis:
              r?.diagnostico ??
              r?.diagnosis ??
              'Sin diagnóstico',

            scientificName:
              r?.nombre_cientifico ??
              r?.scientificName ??
              '',

            recommendation:
              r?.recomendacion ??
              r?.recommendation ??
              r?.sugerencia_integrada?.texto ??
              '',

            source:
              r?.fuente ??
              r?.source ??
              '',

            allDetections:
              r?.todas_detecciones ??
              r?.allDetections ??
              [],

            abonos,

            confianza:
              this.numeroONulo(r?.confianza),

            fertilizacion:
              r?.recomendacion_fertilizacion ??
              r?.sugerencia_integrada?.recomendacion ??
              null

          };


          this.resultado.set(
            resultado
          );


          const sensores =
            r?.sensores ?? {};

          const fuenteUsada: FuenteSensores =
            sensores.fuente ??
            contexto.fuente ??
            (contexto.usarSensores ? 'arduino' : 'ninguno');

          this.datosSuelo.set(
            fuenteUsada === 'ninguno'
              ? null
              : {
                  fuente: fuenteUsada,
                  ph: this.numeroONulo(sensores.ph_promedio ?? contexto.ph),
                  humedad: this.numeroONulo(sensores.humedad_promedio ?? contexto.humedad),
                  temperatura: this.numeroONulo(sensores.temperatura_promedio ?? contexto.temperatura),
                  lecturas: Number(sensores.cantidad_lecturas ?? 0),
                }
          );


          const diagnosticoContexto = {
            diagnostico:
              resultado.diagnosis,

            estado:
              resultado.status,

            etiqueta:
              resultado.diagnosis,

            clase:
              resultado.fertilizacion?.diagnostico_visual.clase ?? null,

            confianza:
              resultado.confianza ?? null
          };


          this.state
            .guardarContextoDiagnostico(
              diagnosticoContexto,
              contexto
            );


          this.procesando.set(
            false
          );

        },


        error: (error) => {

          console.error(
            'ERROR DIAGNÓSTICO IA:',
            error
          );


          this.procesando.set(
            false
          );


          this.notify.error(
            error?.error?.detail ??
            'No se pudo analizar la imagen.',
            'Error de diagnóstico'
          );

        }

      });

  }


 normalizarAbonos(
  r: any
): AbonoRecomendado[] {

  const origen =
    Array.isArray(r?.productos_recomendados)
      ? r.productos_recomendados
      : Array.isArray(r?.abonos_recomendados)
        ? r.abonos_recomendados
        : Array.isArray(r?.abonos)
          ? r.abonos
          : Array.isArray(r?.sugerencia_integrada?.abonos)
            ? r.sugerencia_integrada.abonos
            : [];

  return origen
    .filter(
      (a: any) =>
        a &&
        a.nombre
    )
    .map(
      (a: any) => ({

        nombre:
          String(
            a.nombre
          ),

        formula:
          a.formula ??
          null,

        nutrientes:
          a.nutrientes ??
          null,

        aplicacion:
          a.aplicacion ??
          null,

        descripcion:
          a.descripcion ??
          null,

        uso:
          a.uso ??
          null,

        paraQueSirve:
          a.paraQueSirve ??
          a.para_que_sirve ??
          null,

        porQueSeRecomienda:
          a.porQueSeRecomienda ??
          a.por_que_se_recomienda ??
          null,

        compatibilidad:
          a.compatibilidad ??
          null,

        puntuacion:
          a.puntuacion ??
          null

      })
    );
}


  nombreVariedad(
    variedad: string
  ): string {

    const nombres:
      Record<string, string> = {

      bourbon:
        'Bourbon',

      tabi:
        'Tabi',

      typica:
        'Typica',

      maragogipe:
        'Maragogipe',

      caturra:
        'Caturra',

      castillo:
        'Castillo'

    };


    return (
      nombres[variedad] ??
      variedad
    );

  }


  nombreTemporada(
    temporada: Temporada
  ): string {

    const nombres:
      Record<Temporada, string> = {

      cosecha:
        'Cosecha',

      mitaca:
        'Mitaca',

      floracion:
        'Floración',

      recuperacion:
        'Recuperación'

    };


    return nombres[temporada];

  }


  nombreClima(
    clima:
      CondicionClimatica | null
  ): string {

    if (
      !clima
    ) {

      return 'Sin seleccionar';

    }


    const nombres:
      Record<CondicionClimatica, string> = {

      seca:
        'Seca',

      normal:
        'Normal',

      lluviosa:
        'Lluviosa'

    };


    return nombres[clima];

  }


  nombreDeteccion(
    label: string
  ): string {

    const nombres:
      Record<string, string> = {

      def_azufre:
        'Posible deficiencia de azufre',

      def_boro:
        'Posible deficiencia de boro',

      def_calcio:
        'Posible deficiencia de calcio',

      def_cobre:
        'Posible deficiencia de cobre',

      def_fosforo:
        'Posible deficiencia de fósforo',

      def_hierro:
        'Posible deficiencia de hierro',

      def_magnesio:
        'Posible deficiencia de magnesio',

      def_manganeso:
        'Posible deficiencia de manganeso',

      def_nitrogeno:
        'Posible deficiencia de nitrógeno',

      def_potasio:
        'Posible deficiencia de potasio',

      def_zinc:
        'Posible deficiencia de zinc',

      Cercospora:
        'Cercospora',

      cercospora:
        'Cercospora',

      Antracnosis:
        'Antracnosis',

      antracnosis:
        'Antracnosis',

      Fumagina:
        'Fumagina',

      fumagina:
        'Fumagina',

      Phoma:
        'Phoma',

      phoma:
        'Phoma',

      Roya:
        'Roya',

      roya:
        'Roya',

      Hoja_sana:
        'Hoja sana',

      hoja_sana:
        'Hoja sana'

    };


    return (
      nombres[label] ??
      label
    );

  }


  guardarHistorial() {

    const r =
      this.resultado();


    if (!r) {

      return;

    }


    this.guardando.set(
      true
    );


    // Se guarda la imagen analizada y la recomendación completa de ese
    // momento (productos, imagen de cada producto, razones, contexto).
    const datos = new FormData();

    datos.append('estado', r.status);
    datos.append('diagnostico', r.diagnosis);
    datos.append('nombre_cientifico', r.scientificName ?? '');
    datos.append('recomendacion', r.recommendation ?? '');
    datos.append('fuente', r.source ?? '');

    if (r.confianza !== null && r.confianza !== undefined) {
      datos.append('confianza', String(r.confianza));
    }

    datos.append(
      'detecciones',
      JSON.stringify(
        r.boundingBoxes.map((b) => ({
          etiqueta: b.label,
          confianza: b.confidence,
          x: b.x,
          y: b.y,
          ancho: b.width,
          alto: b.height
        }))
      )
    );

    datos.append(
      'recomendacion_detalle',
      JSON.stringify({
        fertilizacion: r.fertilizacion ?? null,
        contexto: this.contextoCultivo(),
        datos_suelo: this.datosSuelo()
      })
    );

    if (this.archivo) {
      datos.append('imagen', this.archivo);
    }


    this.api
      .guardar(datos)
      .subscribe({

        next: () => {

          this.guardando.set(
            false
          );


          this.notify.exito(
            'El diagnóstico quedó guardado en el historial.',
            'Guardado'
          );


          this.router.navigate(
            ['/app/historial'],
            { queryParams: { vista: 'diagnosticos' } }
          );

        },


        error: (error) => {

          console.error(
            'ERROR GUARDANDO HISTORIAL:',
            error
          );


          this.guardando.set(
            false
          );


          this.notify.error(
            'No se pudo guardar el diagnóstico.'
          );

        }

      });

  }


  async descargarPdf() {

    const r =
      this.resultado();


    if (!r) {

      return;

    }


    this.descargando.set(
      true
    );


    try {

      const {
        jsPDF
      } =
        await import(
          'jspdf'
        );


      const doc =
        new jsPDF();


      const W =
        doc.internal.pageSize
          .getWidth();


      const verde:
        [number, number, number] =
        [
          45,
          106,
          79
        ];


      doc.setFillColor(
        ...verde
      );


      doc.rect(
        0,
        0,
        W,
        28,
        'F'
      );


      doc.setTextColor(
        255,
        255,
        255
      );


      doc.setFont(
        'helvetica',
        'bold'
      );


      doc.setFontSize(
        15
      );


      doc.text(
        'Reporte Fitosanitario — Diagnóstico IA',
        14,
        13
      );


      doc.setFont(
        'helvetica',
        'normal'
      );


      doc.setFontSize(
        10
      );


      doc.text(
        'Agroindustria Cafetera · Modelo YOLOv8',
        14,
        21
      );


      try {

        doc.addImage(
          r.imageUrl,
          'PNG',
          14,
          36,
          80,
          60
        );

      } catch {}

      doc.setTextColor(
        40,
        40,
        40
      );


      doc.setFontSize(
        12
      );


      doc.setFont(
        'helvetica',
        'bold'
      );


      doc.text(
        'Estado:',
        104,
        44
      );


      doc.setFont(
        'helvetica',
        'normal'
      );


      doc.text(
        this.etiquetaEstado(
          r.status
        ),
        128,
        44
      );


      doc.setFont(
        'helvetica',
        'bold'
      );


      doc.text(
        'Diagnóstico:',
        104,
        54
      );


      doc.setFont(
        'helvetica',
        'normal'
      );


      doc.text(
        doc.splitTextToSize(
          r.diagnosis,
          92
        ),
        104,
        60
      );


      let y =
        108;


      const contexto =
        this.contextoCultivo();


      if (
        contexto
      ) {

        doc.setFont(
          'helvetica',
          'bold'
        );


        doc.setFontSize(
          11
        );


        doc.setTextColor(
          ...verde
        );


        doc.text(
          'Contexto del cultivo',
          14,
          y
        );


        doc.setTextColor(
          40,
          40,
          40
        );


        doc.setFont(
          'helvetica',
          'normal'
        );


        doc.setFontSize(
          10
        );


        doc.text(
          `Variedad: ${
            this.nombreVariedad(
              contexto.variedad
            )
          }`,
          14,
          y + 7
        );


        doc.text(
          `Temporada: ${
            this.nombreTemporada(
              contexto.temporada
            )
          }`,
          14,
          y + 14
        );


        const suelo =
          this.datosSuelo();

        if (suelo) {

          doc.text(
            `Suelo (${suelo.fuente === 'manual' ? 'datos ingresados' : 'sensores Arduino'}): ` +
            `pH ${suelo.ph} · Humedad ${suelo.humedad}% · Temperatura ${suelo.temperatura} °C`,
            14,
            y + 21
          );

          y += 7;

        }


        if (
          contexto.usarSensores
        ) {

          doc.text(
            'Condiciones: Datos de sensores',
            14,
            y + 21
          );


          if (
            contexto.desde &&
            contexto.hasta
          ) {

            doc.text(
              `Periodo: ${contexto.desde} → ${contexto.hasta}`,
              14,
              y + 28
            );

            y += 7;

          }

        } else {

          doc.text(
            `Condición climática: ${
              this.nombreClima(
                contexto.condicionClimatica
              )
            }`,
            14,
            y + 21
          );

        }


        y += 32;

      }


      doc.setFont(
        'helvetica',
        'bold'
      );


      doc.setFontSize(
        12
      );


      doc.setTextColor(
        ...verde
      );


      doc.text(
        'Recomendación técnica',
        14,
        y
      );


      doc.setTextColor(
        40,
        40,
        40
      );


      doc.setFont(
        'helvetica',
        'normal'
      );


      doc.setFontSize(
        11
      );


      doc.text(
        doc.splitTextToSize(
          r.recommendation,
          W - 28
        ),
        14,
        y + 8
      );


      if (
        r.source
      ) {

        doc.setFontSize(
          9
        );


        doc.setTextColor(
          120,
          120,
          120
        );


        doc.text(
          `Fuente: ${r.source}`,
          14,
          y + 50
        );

      }


      const abonos =
        this.obtenerAbonos(
          r
        );


      if (
        abonos.length
      ) {

        y += 65;


        doc.setFont(
          'helvetica',
          'bold'
        );

        doc.setFontSize(
          12
        );

        doc.setTextColor(
          ...verde
        );

        doc.text(
          'Abonos recomendados',
          14,
          y
        );


        y += 8;


        doc.setTextColor(
          40,
          40,
          40
        );


        doc.setFontSize(
          9
        );


        doc.setFont(
          'helvetica',
          'normal'
        );


        for (
          const abono of abonos
        ) {

          if (
            y > 260
          ) {

            doc.addPage();

            y = 20;

          }


          doc.setFont(
            'helvetica',
            'bold'
          );


          doc.text(
            abono.nombre,
            14,
            y
          );


          y += 5;


          if (abono.compatibilidad) {

            doc.setFont('helvetica', 'normal');

            doc.text(
              `Compatibilidad: ${abono.compatibilidad.toUpperCase()} (${abono.puntuacion ?? '—'}/100)`,
              14,
              y
            );

            y += 5;

          }


          doc.setFont(
            'helvetica',
            'normal'
          );


          if (
            abono.formula
          ) {

            doc.text(
              `Fórmula: ${abono.formula}`,
              14,
              y
            );

            y += 5;

          }


          const descripcion =
            abono.paraQueSirve ||
            abono.uso ||
            abono.descripcion;


          if (
            descripcion
          ) {

            const lineas =
              doc.splitTextToSize(
                `Uso: ${descripcion}`,
                W - 28
              );


            doc.text(
              lineas,
              14,
              y
            );


            y +=
              lineas.length * 4.5;

          }


          if (
            abono.porQueSeRecomienda
          ) {

            const lineas =
              doc.splitTextToSize(
                `Motivo: ${abono.porQueSeRecomienda}`,
                W - 28
              );


            doc.text(
              lineas,
              14,
              y
            );


            y +=
              lineas.length * 4.5;

          }


          y += 5;

        }

      } else if (r.fertilizacion?.decision === 'no_recomendar') {

        y += 65;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...verde);
        doc.text('Abonos recomendados', 14, y);

        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);

        const visual = r.fertilizacion.recomendacion_visual;

        const lineas = doc.splitTextToSize(
          visual
            ? [visual.titulo, visual.advertencia, visual.nota_enfermedad ?? '', visual.mensaje_sin_producto ?? ''].join(' ')
            : [
                r.fertilizacion.mensaje,
                ...r.fertilizacion.motivos_no_recomendacion,
                r.fertilizacion.recomendacion_validacion ?? ''
              ].join(' '),
          W - 28
        );

        doc.text(lineas, 14, y);

        y += lineas.length * 4.5 + 4;

        for (const item of visual ? [...visual.productos, ...visual.foliares] : []) {

          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.text(item.producto.nombre, 14, y);
          y += 5;

          doc.setFont('helvetica', 'normal');
          doc.text(
            `${item.producto.composicion} · Compatibilidad: ${item.compatibilidad.toUpperCase()} (${item.puntuacion}/100)`,
            14,
            y
          );
          y += 5;

          const motivo = doc.splitTextToSize(`Motivo: ${item.motivo ?? ''}`, W - 28);
          doc.text(motivo, 14, y);
          y += motivo.length * 4.5 + 4;

        }

      }


      doc.save(
        'reporte-fitosanitario.pdf'
      );


      this.notify.exito(
        'Reporte descargado en PDF.',
        'PDF listo'
      );


    } catch (error) {

      console.error(
        'ERROR GENERANDO PDF:',
        error
      );


      this.notify.error(
        'No se pudo generar el reporte PDF.',
        'Error'
      );


    } finally {

      this.descargando.set(
        false
      );

    }

  }


  obtenerAbonos(
    r: DiagnosisResult
  ): AbonoRecomendado[] {

    if (
      r.abonos &&
      r.abonos.length
    ) {

      return r.abonos;

    }


    if (
      r.abonosRecomendados &&
      r.abonosRecomendados.length
    ) {

      return r.abonosRecomendados.slice(
        0,
        3
      );

    }


    if (
      r.sugerencia_integrada?.abonos?.length
    ) {

      return r.sugerencia_integrada.abonos.slice(
        0,
        3
      );

    }


    return [];

  }


  etiquetaEstado(
    s: string
  ): string {

    return s === 'healthy'
      ? 'Sano'
      : s === 'deficiency'
        ? 'Deficiencia'
        : 'Alerta';

  }


  limpiarImagen() {

    if (
      this.previewUrl()
    ) {

      try {

        URL.revokeObjectURL(
          this.previewUrl()!
        );

      } catch {}

    }


    this.previewUrl.set(
      null
    );


    this.archivo =
      null;


    this.resultado.set(
      null
    );


    this.contextoCultivo.set(
      null
    );


    this.mostrarModal.set(
      false
    );


    this.desde.set(
      ''
    );


    this.hasta.set(
      ''
    );


    this.condicionClimatica.set(
      null
    );


    this.variedad.set(
      ''
    );


    this.temporada.set(
      'cosecha'
    );


    this.usarSensores.set(
      true
    );

    this.modoSinSensores.set('manual');
    this.phManual.set(null);
    this.humedadManual.set(null);
    this.temperaturaManual.set(null);
    this.datosSuelo.set(null);
    this.editandoSuelo.set(false);
    this.analisisFoliar.set({});
    this.analisisSuelo.set({});
    this.texturaSuelo.set('');


    this.state
      .limpiarContextoDiagnostico();

  }


  ngOnDestroy() {

    this.detenerCamara();

    if (
      this.previewUrl()
    ) {

      try {

        URL.revokeObjectURL(
          this.previewUrl()!
        );

      } catch {}

    }

  }

}