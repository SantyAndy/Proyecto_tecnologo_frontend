import {
  HttpClient
} from '@angular/common/http';

import {
  Injectable,
  inject
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import {
  API_BASE
} from './api.config';


@Injectable({
  providedIn: 'root'
})
export class DiagnosticoService {

  private http =
    inject(HttpClient);


  private base =
    `${API_BASE}/diagnostico`;


  // ==========================================================
  // ANALIZAR IMAGEN
  // ==========================================================

  /**
   * Envía la imagen al backend junto con el contexto
   * seleccionado por el usuario.
   *
   * Puede trabajar en dos modalidades:
   *
   * 1. CON SENSORES
   *
   *    - variedad
   *    - temporada
   *    - usarSensores = true
   *    - desde
   *    - hasta
   *    - ph
   *    - humedad
   *    - temperatura
   *
   * 2. SIN SENSORES
   *
   *    - variedad
   *    - temporada
   *    - usarSensores = false
   *    - condicionClimatica
   *
   * NO se solicita finca para realizar el diagnóstico.
   *
   * El backend utilizará el contexto recibido para
   * construir las recomendaciones de abonos.
   */
  analizar(
    archivo: File,
    contexto?: {
      variedad: string;

      temporada: string;

      usarSensores: boolean;

      desde?: string | null;

      hasta?: string | null;

      condicionClimatica?:
        | string
        | null;

      ph?: number | null;

      humedad?: number | null;

      temperatura?: number | null;

      /** arduino = lecturas guardadas · manual = datos escritos por el usuario · ninguno = solo clima */
      fuenteSensores?: 'arduino' | 'manual' | 'ninguno';

      /** Finca activa (para tomar las lecturas de sus Arduinos). */
      fincaId?: number | null;

      /** Análisis de laboratorio opcionales. null = no disponible. */
      analisisFoliar?: Record<string, number> | null;

      analisisSuelo?: Record<string, number | string> | null;
    }
  ): Observable<any> {

    const formData =
      new FormData();


    // ========================================================
    // IMAGEN
    // ========================================================

    formData.append(
      'imagen',
      archivo
    );


    // ========================================================
    // CONTEXTO DEL CULTIVO
    // ========================================================

    if (contexto) {

      // ------------------------------------------------------
      // VARIEDAD
      // ------------------------------------------------------

      formData.append(
        'variedad',
        contexto.variedad
      );


      // ------------------------------------------------------
      // TEMPORADA
      // ------------------------------------------------------

      formData.append(
        'temporada',
        contexto.temporada
      );


      // ------------------------------------------------------
      // USAR SENSORES
      // ------------------------------------------------------

      formData.append(
        'usar_sensores',
        String(
          contexto.usarSensores
        )
      );


      // ======================================================
      // MODALIDAD CON SENSORES
      // ======================================================

      if (
        contexto.usarSensores
      ) {

        // ----------------------------------------------------
        // FECHA INICIAL
        // ----------------------------------------------------

        if (contexto.desde) {

          formData.append(
            'desde',
            contexto.desde
          );

        }


        // ----------------------------------------------------
        // FECHA FINAL
        // ----------------------------------------------------

        if (contexto.hasta) {

          formData.append(
            'hasta',
            contexto.hasta
          );

        }


        // ----------------------------------------------------
        // PH
        // ----------------------------------------------------

        if (
          contexto.ph !== null &&
          contexto.ph !== undefined
        ) {

          formData.append(
            'ph',
            String(
              contexto.ph
            )
          );

        }


        // ----------------------------------------------------
        // HUMEDAD
        // ----------------------------------------------------

        if (
          contexto.humedad !== null &&
          contexto.humedad !== undefined
        ) {

          formData.append(
            'humedad',
            String(
              contexto.humedad
            )
          );

        }


        // ----------------------------------------------------
        // TEMPERATURA
        // ----------------------------------------------------

        if (
          contexto.temperatura !== null &&
          contexto.temperatura !== undefined
        ) {

          formData.append(
            'temperatura',
            String(
              contexto.temperatura
            )
          );

        }

      }


      // ======================================================
      // MODALIDAD SIN SENSORES
      // ======================================================

      else {

        // ----------------------------------------------------
        // CONDICIÓN CLIMÁTICA
        // ----------------------------------------------------

        if (
          contexto.condicionClimatica
        ) {

          formData.append(
            'condicion_climatica',
            contexto.condicionClimatica
          );

        }

      }

    }


    // ========================================================
    // ORIGEN DE LOS DATOS DEL SUELO Y FINCA
    // ========================================================

    if (contexto?.fuenteSensores) {

      formData.append(
        'fuente_sensores',
        contexto.fuenteSensores
      );

      // Datos escritos por el usuario (sin Arduino).
      if (contexto.fuenteSensores === 'manual') {

        formData.append('ph', String(contexto.ph ?? ''));
        formData.append('humedad', String(contexto.humedad ?? ''));
        formData.append('temperatura', String(contexto.temperatura ?? ''));

      }

    }


    if (contexto?.fincaId) {

      formData.append(
        'finca_id',
        String(contexto.fincaId)
      );

    }


    // ========================================================
    // ANÁLISIS DE LABORATORIO (solo si hay valores)
    // ========================================================

    if (contexto?.analisisFoliar) {

      formData.append(
        'analisis_foliar',
        JSON.stringify(contexto.analisisFoliar)
      );

    }

    if (contexto?.analisisSuelo) {

      formData.append(
        'analisis_suelo',
        JSON.stringify(contexto.analisisSuelo)
      );

    }


    // ========================================================
    // PETICIÓN AL BACKEND
    // ========================================================

    return this.http.post<any>(
      `${this.base}/analizar/`,
      formData
    );

  }


  // ==========================================================
  // GUARDAR DIAGNÓSTICO
  // ==========================================================

  /** Acepta un objeto JSON o un FormData (con la imagen analizada). */
  guardar(
    data: any
  ): Observable<any> {

    return this.http.post<any>(
      `${this.base}/`,
      data
    );

  }


  // ==========================================================
  // HISTORIAL DE DIAGNÓSTICOS
  // ==========================================================

  historial(): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.base}/`
    );

  }


  // ==========================================================
  // DATOS DE SENSORES POR PERÍODO
  // ==========================================================

  /**
   * Obtiene las lecturas de sensores de una finca
   * dentro de un rango de fechas.
   *
   * Este método NO obliga al usuario a seleccionar
   * una finca desde la pantalla de diagnóstico.
   *
   * La finca puede estar asociada a la sesión
   * del usuario.
   */
  sensoresPorPeriodo(
    fincaId: number,
    desde: string,
    hasta: string
  ): Observable<any[]> {

    return this.http.get<any[]>(
      `${API_BASE}/fincas/${fincaId}/historial/`,
      {
        params: {
          desde,
          hasta
        }
      }
    );

  }

}