import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  TEMPORADAS
} from '../../core/data';

import {
  AppState
} from '../../core/app-state';

import {
  IconComponent
} from '../../shared/icon';

import {
  RevealDirective
} from '../../core/reveal.directive';


@Component({
  selector: 'app-sugerencias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    FormsModule,
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
          appReveal
          class="section-title text-center font-display font-extrabold text-3xl text-[var(--verde-primary)] mx-auto block w-fit"
        >
          Sugerencias
        </h1>

        <p
          class="text-[var(--texto-suave)] text-sm mt-2 max-w-2xl mx-auto"
        >
          Visualiza recomendaciones personalizadas de abonos
          según el diagnóstico de la IA, la variedad de café,
          la temporada y los datos registrados de los sensores.
        </p>

      </div>


      <!-- =====================================================
           DIAGNÓSTICO IA
           ===================================================== -->

      @if (diagnostico(); as d) {

        <div
          appReveal
          class="card p-4 mb-6 flex items-center gap-3 border-l-4 !border-l-[var(--verde-primary)]"
        >

          <span
            class="icon-badge !w-11 !h-11 shrink-0"
          >

            <app-icon
              name="brain"
              [size]="22"
            />

          </span>


          <div class="flex-1">

            <p
              class="font-display font-bold text-sm"
            >
              Diagnóstico de la IA incluido
            </p>


            <p
              class="text-sm text-[var(--texto-suave)]"
            >

              Se utilizará el diagnóstico:

              <b>
                {{ d.etiqueta }}
              </b>

              ({{ etiquetaEstado(d.estado) }})

              para generar la recomendación.

            </p>

          </div>


          <button
            type="button"
            (click)="quitarDiagnostico()"
            class="btn btn-outline !p-2 !rounded-full shrink-0"
            title="Quitar diagnóstico"
          >

            <app-icon
              name="close"
              [size]="16"
            />

          </button>

        </div>

      }


      <!-- =====================================================
           CONFIGURACIÓN
           ===================================================== -->

      <div
        class="grid md:grid-cols-2 gap-6"
      >


        <!-- ===================================================
             TEMPORADA
             =================================================== -->

        <div
          appReveal
          class="card p-6"
        >

          <h3
            class="font-display font-bold mb-4 flex items-center gap-2"
          >

            <app-icon
              name="leaf"
              [size]="20"
              class="text-[var(--verde-primary)]"
            />

            Temporada

          </h3>


          <div class="space-y-2">

            @for (
              t of temporadas;
              track t.clave
            ) {

              <button
                type="button"
                (click)="temporada.set(t.clave)"
                class="temp-item"
                [class.sel]="temporada() === t.clave"
              >

                {{ t.nombre }}


                @if (
                  temporada() === t.clave
                ) {

                  <app-icon
                    name="check"
                    [size]="18"
                  />

                }

              </button>

            }

          </div>

        </div>


        <!-- ===================================================
             FECHAS
             =================================================== -->

        <div
          appReveal="120"
          class="card p-6"
        >

          <h3
            class="font-display font-bold mb-4 flex items-center gap-2"
          >

            <app-icon
              name="calendar"
              [size]="20"
              class="text-[var(--verde-primary)]"
            />

            Período de los sensores

          </h3>


          <label class="lbl">
            Desde
          </label>


          <input
            type="date"
            class="field mb-4"
            [(ngModel)]="desde"
          />


          <label class="lbl">
            Hasta
          </label>


          <input
            type="date"
            class="field"
            [(ngModel)]="hasta"
          />


          <button
            type="button"
            (click)="buscar()"
            class="btn btn-primary w-full mt-6"
          >

            <app-icon
              name="search"
              [size]="18"
            />

            Continuar

          </button>

        </div>

      </div>


      <!-- =====================================================
           INFORMACIÓN
           ===================================================== -->

      <div
        appReveal
        class="mt-6 rounded-2xl bg-[var(--verde-soft)] p-5"
      >

        <div class="flex gap-3">

          <app-icon
            name="help"
            [size]="20"
            class="text-[var(--verde-primary)] shrink-0 mt-0.5"
          />

          <div>

            <p
              class="font-display font-bold text-sm mb-1"
            >
              Período seleccionado
            </p>

            <p
              class="text-sm text-[var(--texto-suave)]"
            >

              Los datos de los sensores se consultarán
              únicamente entre

              <b>
                {{ desde }}
              </b>

              y

              <b>
                {{ hasta }}
              </b>.

              Los promedios de pH, humedad y temperatura
              se calcularán utilizando las lecturas encontradas
              en ese período.

            </p>

          </div>

        </div>

      </div>

    </section>

  `,

  styles: [`

    .lbl {
      display: block;
      font-size: .78rem;
      font-weight: 500;
      margin-bottom: .3rem;
      color: var(--texto-suave);
    }


    .temp-item {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;

      padding: .8rem 1.1rem;

      border-radius: .9rem;

      border: 1.5px solid var(--borde);

      background: #fff;

      font-weight: 500;

      transition: .2s;
    }


    .temp-item:hover {
      border-color: var(--verde-accent);
      background: var(--verde-soft);
    }


    .temp-item.sel {
      background: var(--verde-primary);
      color: #fff;
      border-color: var(--verde-primary);
    }

  `]
})
export class SugerenciasComponent {

  private router =
    inject(Router);


  private route =
    inject(ActivatedRoute);


  private state =
    inject(AppState);


  // ==========================================================
  // DATOS
  // ==========================================================

  readonly temporadas =
    TEMPORADAS;


  readonly diagnostico =
    this.state.diagnosticoIA;


  temporada =
    signal<string>('cosecha');


  desde =
    '2025-01-01';


  hasta =
    '2026-12-31';


  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor() {

    /*
     * Si el diagnóstico IA envía temporada y fechas
     * mediante queryParams, las recuperamos.
     *
     * Esto evita perder la información seleccionada
     * anteriormente.
     */

    const params =
      this.route.snapshot.queryParamMap;


    const temporadaParam =
      params.get('temporada');


    const desdeParam =
      params.get('desde');


    const hastaParam =
      params.get('hasta');


    if (temporadaParam) {

      const temporadaEncontrada =
        this.temporadas.find(
          t =>
            t.clave === temporadaParam ||
            t.nombre === temporadaParam
        );


      if (temporadaEncontrada) {

        this.temporada.set(
          temporadaEncontrada.clave
        );

      }

    }


    if (desdeParam) {

      this.desde =
        desdeParam;

    }


    if (hastaParam) {

      this.hasta =
        hastaParam;

    }

  }


  // ==========================================================
  // ESTADO DEL DIAGNÓSTICO
  // ==========================================================

  etiquetaEstado(
    s: string
  ): string {

    return (

      s === 'healthy'

        ? 'Sano'

        : s === 'deficiency'

          ? 'Deficiencia'

          : 'Alerta'

    );

  }


  // ==========================================================
  // QUITAR DIAGNÓSTICO
  // ==========================================================

  quitarDiagnostico() {

    this.state.limpiarDiagnosticoIA();

  }


  // ==========================================================
  // NOMBRES PARA DJANGO
  // ==========================================================

  private readonly nombreRecomendador:
    Record<string, string> = {

      cosecha:
        'Cosecha',

      mitaca:
        'Mitaca',

      florecencia:
        'Florescencia',

      recuperacion:
        'Recuperacion'

    };


  // ==========================================================
  // BUSCAR
  // ==========================================================

  buscar() {

    /*
     * Validación de fechas.
     */

    if (
      !this.desde ||
      !this.hasta
    ) {

      return;

    }


    /*
     * Validación del rango.
     */

    if (
      this.desde >
      this.hasta
    ) {

      return;

    }


    /*
     * Convertimos la clave interna
     * al nombre que espera Django.
     */

    const temporadaBackend =
      this.nombreRecomendador[
        this.temporada()
      ];


    /*
     * Si por alguna razón no existe,
     * usamos Cosecha como respaldo.
     */

    const temporadaFinal =
      temporadaBackend ||
      'Cosecha';


    /*
     * Diagnóstico actual.
     */

    const diagnostico =
      this.diagnostico();


    /*
     * Navegamos al resultado.
     *
     * IMPORTANTE:
     *
     * Aquí enviamos:
     *
     * - temporada
     * - desde
     * - hasta
     *
     * para que ResultadoComponent pueda
     * llamar correctamente a Django.
     */

    this.router.navigate(
      ['/app/resultado'],
      {
        queryParams: {

          temporada:
            temporadaFinal,

          desde:
            this.desde,

          hasta:
            this.hasta

        }
      }
    );

  }

}