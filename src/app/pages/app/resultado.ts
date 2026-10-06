import {
  DatePipe,
  DecimalPipe,
  isPlatformBrowser
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  AppState
} from '../../core/app-state';

import {
  FincaService
} from '../../core/finca.service';

import {
  Lectura,
  ResultadoSugerencia
} from '../../core/models';

import {
  IconComponent
} from '../../shared/icon';

import {
  RevealDirective
} from '../../core/reveal.directive';


@Component({
  selector: 'app-resultado',

  standalone: true,

  changeDetection:
    ChangeDetectionStrategy.OnPush,

  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    IconComponent,
    RevealDirective
  ],

  template: `

    <section
      class="mx-auto max-w-4xl px-4 sm:px-6 py-10"
    >

      <!-- =====================================================
           ENCABEZADO
           ===================================================== -->

      <div
        class="text-center mb-8 anim-fade-up"
      >

        <h1
          class="font-display font-extrabold text-3xl text-[var(--verde-primary)]"
        >
          Datos del cultivo
        </h1>


        <p
          class="text-[var(--texto-suave)] mt-2"
        >

          Período seleccionado:

          <b>
            {{ desde() }}
          </b>

          hasta

          <b>
            {{ hasta() }}
          </b>

        </p>


        @if (temporada()) {

          <span
            class="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-[var(--verde-soft)] text-[var(--verde-primary)] font-semibold text-sm"
          >

            <app-icon
              name="leaf"
              [size]="16"
            />

            Temporada:
            {{ temporada() }}

          </span>

        }

      </div>


      <!-- =====================================================
           CARGANDO SENSORES
           ===================================================== -->

      @if (cargandoSensores()) {

        <div
          class="card p-10 text-center"
        >

          <app-icon
            name="loader"
            [size]="28"
            class="mx-auto mb-3 text-[var(--verde-primary)]"
          />

          <p
            class="text-[var(--texto-suave)]"
          >
            Consultando los datos de los sensores...
          </p>

        </div>

      }


      <!-- =====================================================
           ERROR SENSORES
           ===================================================== -->

      @else if (errorSensores()) {

        <div
          class="card p-6 mb-6 border-l-4 !border-l-red-500"
        >

          <div
            class="flex gap-3 items-start"
          >

            <app-icon
              name="alert"
              [size]="22"
              class="text-red-500 shrink-0"
            />

            <div>

              <p
                class="font-display font-bold"
              >
                No se pudieron consultar los sensores
              </p>

              <p
                class="text-sm text-[var(--texto-suave)] mt-1"
              >
                {{ errorSensores() }}
              </p>

            </div>

          </div>

        </div>

      }


      <!-- =====================================================
           RESULTADO DE SENSORES
           ===================================================== -->

      @else {

        <!-- ===================================================
             RESUMEN
             =================================================== -->

        <div
          appReveal
          class="card p-6 mb-6"
        >

          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
          >

            <div>

              <h2
                class="font-display font-bold text-xl"
              >

                Datos de los sensores

              </h2>

              <p
                class="text-sm text-[var(--texto-suave)] mt-1"
              >

                Promedio de las lecturas encontradas
                en el período seleccionado.

              </p>

            </div>


            <div
              class="px-4 py-2 rounded-full bg-[var(--verde-soft)] text-[var(--verde-primary)] text-sm font-semibold"
            >

              {{ lecturas().length }}

              {{ lecturas().length === 1
                ? 'lectura'
                : 'lecturas'
              }}

            </div>

          </div>


          <!-- ===============================================
               PROMEDIOS
               =============================================== -->

          <div
            class="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >

            <!-- pH -->

            <div
              class="rounded-2xl border border-[var(--borde)] p-5 text-center"
            >

              <div
                class="w-11 h-11 mx-auto mb-3 rounded-full bg-[var(--verde-soft)] flex items-center justify-center"
              >

                <app-icon
                  name="flask"
                  [size]="21"
                  class="text-[var(--verde-primary)]"
                />

              </div>


              <p
                class="text-xs text-[var(--texto-suave)] uppercase tracking-wide"
              >
                pH promedio
              </p>


              <p
                class="font-display font-extrabold text-3xl text-[var(--verde-primary)] mt-1"
              >

                {{ phPromedio() | number:'1.2-2' }}

              </p>

            </div>


            <!-- HUMEDAD -->

            <div
              class="rounded-2xl border border-[var(--borde)] p-5 text-center"
            >

              <div
                class="w-11 h-11 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center"
              >

                <app-icon
                  name="droplet"
                  [size]="21"
                  class="text-blue-600"
                />

              </div>


              <p
                class="text-xs text-[var(--texto-suave)] uppercase tracking-wide"
              >
                Humedad promedio
              </p>


              <p
                class="font-display font-extrabold text-3xl text-blue-600 mt-1"
              >

                {{ humedadPromedio() | number:'1.1-1' }}

                <span class="text-lg">
                  %
                </span>

              </p>

            </div>


            <!-- TEMPERATURA -->

            <div
              class="rounded-2xl border border-[var(--borde)] p-5 text-center"
            >

              <div
                class="w-11 h-11 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center"
              >

                <app-icon
                  name="thermometer"
                  [size]="21"
                  class="text-red-500"
                />

              </div>


              <p
                class="text-xs text-[var(--texto-suave)] uppercase tracking-wide"
              >
                Temperatura promedio
              </p>


              <p
                class="font-display font-extrabold text-3xl text-red-500 mt-1"
              >

                {{ temperaturaPromedio() | number:'1.1-1' }}

                <span class="text-lg">
                  °C
                </span>

              </p>

            </div>

          </div>

        </div>


        <!-- ===================================================
             SIN LECTURAS
             =================================================== -->

        @if (!lecturas().length) {

          <div
            class="card p-7 mb-6 text-center"
          >

            <app-icon
              name="info"
              [size]="30"
              class="mx-auto mb-3 text-[var(--texto-suave)]"
            />

            <h3
              class="font-display font-bold"
            >
              No hay datos de sensores
            </h3>

            <p
              class="text-sm text-[var(--texto-suave)] mt-2"
            >

              No se encontraron lecturas entre
              {{ desde() }} y {{ hasta() }}.

            </p>

          </div>

        }


        <!-- ===================================================
             VER TODOS LOS DATOS
             =================================================== -->

        @if (lecturas().length) {

          <div
            appReveal
            class="card overflow-hidden mb-6"
          >

            <button
              type="button"
              (click)="mostrarTabla.update(v => !v)"
              class="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[var(--verde-soft)] transition"
            >

              <div
                class="flex items-center gap-3"
              >

                <span
                  class="icon-badge !w-10 !h-10"
                >

                  <app-icon
                    name="table"
                    [size]="19"
                  />

                </span>


                <div>

                  <p
                    class="font-display font-bold"
                  >
                    Ver todos los datos del período
                  </p>

                  <p
                    class="text-xs text-[var(--texto-suave)]"
                  >

                    Consulta las
                    {{ lecturas().length }}
                    lecturas registradas.

                  </p>

                </div>

              </div>


              <app-icon
                [name]="mostrarTabla() ? 'chevron-up' : 'chevron-down'"
                [size]="20"
              />

            </button>


            @if (mostrarTabla()) {

              <div
                class="border-t border-[var(--borde)] overflow-x-auto"
              >

                <table
                  class="w-full text-sm"
                >

                  <thead>

                    <tr
                      class="bg-[var(--verde-primary)] text-white text-left"
                    >

                      <th class="th">
                        Fecha
                      </th>

                      <th class="th">
                        pH
                      </th>

                      <th class="th">
                        Humedad
                      </th>

                      <th class="th">
                        Temperatura
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    @for (
                      l of lecturas();
                      track l.id
                    ) {

                      <tr
                        class="row"
                      >

                        <td class="td">
                          {{ l.fecha | date:'yyyy-MM-dd HH:mm' }}
                        </td>

                        <td class="td">
                          {{ l.ph | number:'1.1-2' }}
                        </td>

                        <td class="td">
                          {{ l.humedad | number:'1.1-1' }} %
                        </td>

                        <td class="td">
                          {{ l.temperatura | number:'1.1-1' }} °C
                        </td>

                      </tr>

                    }

                  </tbody>

                </table>

              </div>

            }

          </div>

        }


        <!-- ===================================================
             DIAGNÓSTICO IA
             =================================================== -->

        @if (diagnostico(); as d) {

          <div
            appReveal
            class="card p-5 mb-6 border-l-4 !border-l-[var(--verde-primary)]"
          >

            <div
              class="flex items-center gap-3"
            >

              <span
                class="icon-badge !w-11 !h-11 shrink-0"
              >

                <app-icon
                  name="brain"
                  [size]="21"
                />

              </span>


              <div>

                <p
                  class="font-display font-bold"
                >
                  Diagnóstico de la IA
                </p>

                <p
                  class="text-sm text-[var(--texto-suave)]"
                >

                  {{ d.etiqueta }}

                </p>

              </div>

            </div>

          </div>

        }


        <!-- ===================================================
             BOTÓN SUGERENCIA
             =================================================== -->

        @if (lecturas().length) {

          <div
            appReveal
            class="card p-6 mb-6"
          >

            <div
              class="text-center"
            >

              <div
                class="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--verde-soft)] flex items-center justify-center"
              >

                <app-icon
                  name="leaf"
                  [size]="23"
                  class="text-[var(--verde-primary)]"
                />

              </div>


              <h2
                class="font-display font-bold text-xl"
              >
                ¿Quieres obtener la sugerencia de abono?
              </h2>


              <p
                class="text-sm text-[var(--texto-suave)] max-w-xl mx-auto mt-2"
              >

                Se utilizarán el diagnóstico de la IA,
                la temporada seleccionada y los datos
                promedio de los sensores para generar
                una recomendación.

              </p>


              <button
                type="button"
                (click)="obtenerSugerencia()"
                [disabled]="cargandoSugerencia()"
                class="btn btn-primary mt-5"
              >

                @if (cargandoSugerencia()) {

                  <app-icon
                    name="loader"
                    [size]="18"
                  />

                  Calculando...

                } @else {

                  <app-icon
                    name="leaf"
                    [size]="18"
                  />

                  Ir a sugerencia de abono

                }

              </button>

            </div>

          </div>

        }


        <!-- ===================================================
             ERROR DE SUGERENCIA
             =================================================== -->

        @if (errorSugerencia()) {

          <div
            class="card p-5 mb-6 border-l-4 !border-l-red-500"
          >

            <div
              class="flex gap-3 items-start"
            >

              <app-icon
                name="alert"
                [size]="22"
                class="text-red-500 shrink-0"
              />

              <div>

                <p
                  class="font-display font-bold"
                >
                  No se pudo generar la sugerencia
                </p>

                <p
                  class="text-sm text-[var(--texto-suave)] mt-1"
                >

                  {{ errorSugerencia() }}

                </p>

              </div>

            </div>

          </div>

        }


        <!-- ===================================================
             RESULTADO DE SUGERENCIA
             =================================================== -->

        @if (res(); as r) {

          @if (r.sugerencia_integrada; as s) {

            <div
              appReveal
              class="card overflow-hidden mb-8 border-2 !border-[var(--verde-accent)]/50"
            >

              <div
                class="bg-[var(--verde-primary)] text-white px-6 py-4 flex items-center gap-2"
              >

                <app-icon
                  name="brain"
                  [size]="20"
                />

                <h2
                  class="font-display font-bold text-lg"
                >
                  Sugerencia integrada
                </h2>

              </div>


              <div
                class="p-6 space-y-4"
              >

                <div
                  class="flex flex-wrap items-center gap-3"
                >

                  <span
                    class="estado"
                    [class]="'estado-' + s.estado"
                  >

                    <app-icon
                      [name]="
                        s.estado === 'healthy'
                          ? 'check'
                          : (
                              s.estado === 'deficiency'
                                ? 'help'
                                : 'alert'
                            )
                      "
                      [size]="18"
                    />

                    {{ s.titulo_fito }}

                  </span>


                  @if (s.abono) {

                    <span
                      class="chip-abono"
                    >

                      <app-icon
                        name="leaf"
                        [size]="16"
                      />

                      Abono:
                      {{ s.abono }}

                    </span>

                  }

                </div>


                <p
                  class="text-[var(--texto-suave)] leading-relaxed"
                >
                  {{ s.texto }}
                </p>


                <div
                  class="bg-[var(--verde-soft)] rounded-xl p-4"
                >

                  <p
                    class="text-xs uppercase tracking-wider text-[var(--texto-suave)] mb-1"
                  >
                    Acción fitosanitaria
                  </p>

                  <p
                    class="text-sm leading-relaxed"
                  >
                    {{ s.tratamiento }}
                  </p>

                </div>

              </div>

            </div>

          }


          <!-- ===============================================
               ABONOS
               =============================================== -->

          @if (r.recomendacion_general) {

            <p
              appReveal
              class="text-center text-sm text-[var(--texto-suave)] max-w-xl mx-auto mb-5"
            >

              <app-icon
                name="help"
                [size]="16"
                class="text-[var(--verde-primary)]"
              />

              No hubo una coincidencia exacta en la tabla,
              así que esta es la
              <b>fórmula sugerida</b>
              según las condiciones del suelo.

            </p>

          }


          @for (
            a of r.abonos_recomendados;
            track a.nombre
          ) {

            <div
              appReveal="120"
              class="card p-7 text-center mb-6"
            >

              @if (a.es_general) {

                <span
                  class="chip-general"
                  [class.especial]="
                    a.situacion === 'extraordinaria'
                  "
                >

                  {{
                    a.situacion === 'extraordinaria'
                      ? 'Situación especial'
                      : 'Fórmula sugerida'
                  }}

                </span>

              }


              <h2
                class="font-display font-bold text-2xl text-[var(--verde-primary)] mt-2"
              >

                {{
                  a.es_general
                    ? (
                        a.situacion === 'extraordinaria'
                          ? 'Abono correctivo'
                          : 'Fórmula a aplicar'
                      )
                    : 'Abono recomendado'
                }}

              </h2>


              <h3
                class="font-display font-extrabold text-xl mt-2"
              >
                {{ a.nombre }}
              </h3>


              @if (
                a.imagenes.length &&
                a.imagenes[0].url
              ) {

                <img
                  [src]="a.imagenes[0].url"
                  [alt]="a.nombre"
                  class="mx-auto my-5 w-40 h-40 object-cover rounded-2xl shadow-lg anim-float"
                />

              }


              @if (a.descripcion) {

                <p
                  class="text-[var(--texto-suave)] text-sm max-w-xl mx-auto leading-relaxed text-left sm:text-center mt-3"
                >

                  {{ a.descripcion }}

                </p>

              }

            </div>

          }

        }

      }


      <!-- =====================================================
           NUEVA CONSULTA
           ===================================================== -->

      <div
        class="text-center mt-8"
      >

        <a
          routerLink="/app/sugerencias"
          class="btn btn-outline"
        >

          <app-icon
            name="arrow"
            [size]="18"
            class="rotate-180"
          />

          Nueva consulta

        </a>

      </div>

    </section>

  `,

  styles: [`

    .th {
      padding: .85rem 1rem;
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
    }


    .td {
      padding: .75rem 1rem;
      border-bottom: 1px solid var(--borde);
    }


    .row:hover {
      background: var(--verde-soft);
    }


    .estado {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      padding: .4rem 1rem;
      border-radius: 999px;
      font-weight: 700;
      font-family: 'Poppins', sans-serif;
    }


    .estado-alert {
      background: #fdecea;
      color: #d9383a;
    }


    .estado-healthy {
      background: var(--verde-soft);
      color: var(--verde-primary);
    }


    .estado-deficiency {
      background: #fff3e0;
      color: #fb8c00;
    }


    .chip-abono {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: .4rem 1rem;
      border-radius: 999px;
      font-weight: 600;
      background: var(--verde-soft);
      color: var(--verde-primary);
    }


    .chip-general {
      display: inline-block;
      padding: .3rem .9rem;
      border-radius: 999px;
      font-size: .72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      background: var(--verde-soft);
      color: var(--verde-primary);
    }


    .chip-general.especial {
      background: #fff3e0;
      color: #fb8c00;
    }

  `]
})
export class ResultadoComponent {

  private route =
    inject(ActivatedRoute);


  private router =
    inject(Router);


  private state =
    inject(AppState);


  private fincaService =
    inject(FincaService);


  private esNavegador =
    isPlatformBrowser(
      inject(PLATFORM_ID)
    );


  // ==========================================================
  // DATOS
  // ==========================================================

  res =
    signal<ResultadoSugerencia | null>(
      null
    );


  lecturas =
    signal<Lectura[]>([]);


  cargandoSensores =
    signal(true);


  mostrarTabla =
    signal(false);


  cargandoSugerencia =
    signal(false);


  errorSensores =
    signal('');


  errorSugerencia =
    signal('');


  desde =
    signal('');


  hasta =
    signal('');


  temporada =
    signal('');


  // ==========================================================
  // DIAGNÓSTICO IA
  // ==========================================================

  readonly diagnostico =
    this.state.diagnosticoIA;


  // ==========================================================
  // PROMEDIO pH
  // ==========================================================

  phPromedio =
    computed(() => {

      const datos =
        this.lecturas();


      const valores =
        datos
          .map(
            d => Number(d.ph)
          )
          .filter(
            v => Number.isFinite(v)
          );


      if (!valores.length) {

        return 0;

      }


      return (
        valores.reduce(
          (a, b) => a + b,
          0
        ) /
        valores.length
      );

    });


  // ==========================================================
  // PROMEDIO HUMEDAD
  // ==========================================================

  humedadPromedio =
    computed(() => {

      const datos =
        this.lecturas();


      const valores =
        datos
          .map(
            d => Number(d.humedad)
          )
          .filter(
            v => Number.isFinite(v)
          );


      if (!valores.length) {

        return 0;

      }


      return (
        valores.reduce(
          (a, b) => a + b,
          0
        ) /
        valores.length
      );

    });


  // ==========================================================
  // PROMEDIO TEMPERATURA
  // ==========================================================

  temperaturaPromedio =
    computed(() => {

      const datos =
        this.lecturas();


      const valores =
        datos
          .map(
            d => Number(d.temperatura)
          )
          .filter(
            v => Number.isFinite(v)
          );


      if (!valores.length) {

        return 0;

      }


      return (
        valores.reduce(
          (a, b) => a + b,
          0
        ) /
        valores.length
      );

    });


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor() {

    effect(() => {

      /*
       * Obtenemos la finca activa.
       */

      const finca =
        this.state.fincaActiva();


      /*
       * Obtenemos los parámetros
       * enviados desde la pantalla anterior.
       */

      const q =
        this.route.snapshot.queryParamMap;


      const desde =
        q.get('desde');


      const hasta =
        q.get('hasta');


      const temporada =
        q.get('temporada');


      /*
       * Guardamos los parámetros
       * en los signals.
       */

      this.desde.set(
        desde ?? ''
      );


      this.hasta.set(
        hasta ?? ''
      );


      this.temporada.set(
        temporada ?? ''
      );


      /*
       * Si estamos en SSR,
       * no consultamos la API.
       */

      if (!this.esNavegador) {

        return;

      }


      /*
       * Validación.
       */

      if (
        !finca ||
        !desde ||
        !hasta
      ) {

        this.errorSensores.set(
          'Faltan la finca o las fechas seleccionadas.'
        );

        this.cargandoSensores.set(
          false
        );

        return;

      }


      /*
       * Consultamos únicamente el historial.
       *
       * IMPORTANTE:
       *
       * Aquí NO llamamos a:
       *
       * /sugerencias/
       *
       * La recomendación solo se calculará
       * cuando el usuario pulse el botón.
       */

      this.cargandoSensores.set(
        true
      );


      this.errorSensores.set(
        ''
      );


      this.fincaService
        .historial(
          finca.id,
          desde,
          hasta
        )
        .subscribe({

          next: (datos) => {

            this.lecturas.set(
              datos ?? []
            );


            this.cargandoSensores.set(
              false
            );

          },


          error: (error) => {

            console.error(
              'Error obteniendo sensores:',
              error
            );


            this.lecturas.set(
              []
            );


            this.errorSensores.set(
              this.obtenerMensajeError(
                error,
                'No fue posible consultar los datos de los sensores.'
              )
            );


            this.cargandoSensores.set(
              false
            );

          }

        });

    });

  }


  // ==========================================================
  // OBTENER SUGERENCIA
  // ==========================================================

  obtenerSugerencia() {

    const finca =
      this.state.fincaActiva();


    const desde =
      this.desde();


    const hasta =
      this.hasta();


    const temporada =
      this.temporada();


    /*
     * Validación antes de enviar.
     */

    if (!finca) {

      this.errorSugerencia.set(
        'No hay una finca seleccionada.'
      );

      return;

    }


    if (
      !desde ||
      !hasta ||
      !temporada
    ) {

      this.errorSugerencia.set(
        'Faltan la fecha inicial, la fecha final o la temporada.'
      );

      return;

    }


    /*
     * Limpiamos errores anteriores.
     */

    this.errorSugerencia.set(
      ''
    );


    this.cargandoSugerencia.set(
      true
    );


    /*
     * Diagnóstico IA actual.
     */

    const diagnostico =
      this.diagnostico();


    /*
     * AQUÍ es donde ahora sí se llama
     * al endpoint /sugerencias/.
     *
     * Ya NO se llama automáticamente
     * al entrar a la pantalla.
     */

    this.fincaService
      .sugerencias(
        finca.id,
        desde,
        hasta,
        temporada,
        diagnostico
      )
      .subscribe({

        next: (resultado) => {

          this.res.set(
            resultado
          );


          this.cargandoSugerencia.set(
            false
          );

        },


        error: (error) => {

          console.error(
            'Error generando sugerencia:',
            error
          );


          this.errorSugerencia.set(
            this.obtenerMensajeError(
              error,
              'No fue posible generar la sugerencia de abono.'
            )
          );


          this.cargandoSugerencia.set(
            false
          );

        }

      });

  }


  // ==========================================================
  // MENSAJE DE ERROR
  // ==========================================================

  private obtenerMensajeError(
    error: any,
    mensajeDefault: string
  ): string {

    /*
     * Django normalmente responde:
     *
     * {
     *   "detail": "..."
     * }
     */

    if (
      error?.error?.detail
    ) {

      return String(
        error.error.detail
      );

    }


    if (
      typeof error?.error === 'string'
    ) {

      return error.error;

    }


    if (
      error?.message
    ) {

      return error.message;

    }


    return mensajeDefault;

  }

}