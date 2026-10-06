import {
  HttpClient,
  HttpParams
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

import {
  DiagnosticoContexto,
  Lectura,
  ResultadoSugerencia
} from './models';


/**
 * Servicio para trabajar con las fincas,
 * sensores, historial y recomendaciones.
 */
@Injectable({
  providedIn: 'root'
})
export class FincaService {

  private http =
    inject(HttpClient);


  // ==========================================================
  // DATOS ACTUALES DE LOS SENSORES
  // ==========================================================

  datos(
    fincaId: number
  ): Observable<Lectura[]> {

    return this.http.get<Lectura[]>(
      `${API_BASE}/fincas/${fincaId}/datos/`
    );

  }


  // ==========================================================
  // HISTORIAL DE SENSORES
  // ==========================================================

  historial(
    fincaId: number,
    desde?: string,
    hasta?: string
  ): Observable<Lectura[]> {

    let params =
      new HttpParams();


    if (desde) {

      params =
        params.set(
          'desde',
          desde
        );

    }


    if (hasta) {

      params =
        params.set(
          'hasta',
          hasta
        );

    }


    return this.http.get<Lectura[]>(
      `${API_BASE}/fincas/${fincaId}/historial/`,
      {
        params
      }
    );

  }


  // ==========================================================
  // DATOS DE SENSORES POR PERÍODO
  // ==========================================================

  /**
   * Obtiene las lecturas de los sensores
   * dentro de las fechas seleccionadas.
   *
   * Este método será utilizado desde
   * el diagnóstico IA para mostrar:
   *
   * - pH promedio
   * - humedad promedio
   * - temperatura promedio
   *
   * y posteriormente permitir consultar
   * todas las lecturas del período.
   */
  sensoresPorPeriodo(
    fincaId: number,
    desde: string,
    hasta: string
  ): Observable<Lectura[]> {

    let params =
      new HttpParams();


    params =
      params.set(
        'desde',
        desde
      );


    params =
      params.set(
        'hasta',
        hasta
      );


    return this.http.get<Lectura[]>(
      `${API_BASE}/fincas/${fincaId}/historial/`,
      {
        params
      }
    );

  }


  // ==========================================================
  // SUGERENCIAS DE ABONO
  // ==========================================================

  /**
   * Envía las condiciones seleccionadas
   * al recomendador de Django.
   *
   * IMPORTANTE:
   * Esta función NO se ejecuta al analizar
   * la imagen.
   *
   * Solo se ejecutará cuando el usuario
   * decida ir a la sugerencia de abono.
   */
  sugerencias(
    fincaId: number,
    desde: string,
    hasta: string,
    temporada: string,
    diagnostico?: DiagnosticoContexto | null
  ): Observable<ResultadoSugerencia> {

    const body: Record<string, unknown> = {

      desde:
        desde,

      hasta:
        hasta,

      temporada:
        temporada

    };


    if (diagnostico) {

      body['diagnostico'] = {

        estado:
          diagnostico.estado,

        etiqueta:
          diagnostico.etiqueta,

        clase:
          diagnostico.clase ?? null,

        confianza:
          diagnostico.confianza ?? null

      };

    }


    console.log(
      'ENVIANDO SUGERENCIA:',
      {
        fincaId,
        body
      }
    );


    return this.http.post<ResultadoSugerencia>(
      `${API_BASE}/fincas/${fincaId}/sugerencias/`,
      body
    );

  }

}