import { HttpClient } from '@angular/common/http';
import {
  Injectable,
  computed,
  inject,
  PLATFORM_ID,
  signal
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  firstValueFrom,
  Observable,
  tap
} from 'rxjs';

import { API_BASE } from './api.config';
import {
  DiagnosticoContexto,
  Finca
} from './models';


// ============================================================
// USUARIO
// ============================================================

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  ubicacion: string;
  is_staff: boolean;
  is_superuser: boolean;
}


interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}


// ============================================================
// CONFIGURACIÓN DEL DIAGNÓSTICO
// ============================================================

export type TemporadaDiagnostico =
  | 'cosecha'
  | 'mitaca'
  | 'floracion'
  | 'recuperacion';


export type CondicionClimaticaDiagnostico =
  | 'seca'
  | 'normal'
  | 'lluviosa';


export interface ConfiguracionDiagnostico {
  variedad: string;
  temporada: TemporadaDiagnostico;

  usarSensores: boolean;

  desde: string | null;
  hasta: string | null;

  condicionClimatica:
    | CondicionClimaticaDiagnostico
    | null;
}


// ============================================================
// ESTADO GLOBAL
// ============================================================

@Injectable({
  providedIn: 'root'
})
export class AppState {

  private http = inject(HttpClient);

  private platformId =
    inject(PLATFORM_ID);

  private esNavegador =
    isPlatformBrowser(this.platformId);


  // ==========================================================
  // ESTADO DE USUARIO
  // ==========================================================

  private readonly _usuario =
    signal<Usuario | null>(null);

  private readonly _fincas =
    signal<Finca[]>([]);

  private readonly _fincaActiva =
    signal<Finca | null>(null);


  // ==========================================================
  // DIAGNÓSTICO IA
  // ==========================================================

  private readonly _diagnosticoIA =
    signal<DiagnosticoContexto | null>(null);

  private readonly _configuracionDiagnostico =
    signal<ConfiguracionDiagnostico | null>(null);


  // ==========================================================
  // SIGNALS PÚBLICOS
  // ==========================================================

  readonly usuario =
    this._usuario.asReadonly();

  readonly fincas =
    this._fincas.asReadonly();

  readonly fincaActiva =
    this._fincaActiva.asReadonly();

  readonly diagnosticoIA =
    this._diagnosticoIA.asReadonly();

  readonly configuracionDiagnostico =
    this._configuracionDiagnostico.asReadonly();

  readonly logueado =
    computed(() => !!this._usuario());

  readonly nombreFincaActiva =
    computed(() => {

      const f =
        this._fincaActiva();

      return f
        ? `${f.nombre} — ${f.ubicacion}`
        : 'Sin finca';

    });


  // ==========================================================
  // AUTH
  // ==========================================================

  login(
    email: string,
    password: string
  ): Observable<RespuestaAuth> {

    return this.http
      .post<RespuestaAuth>(
        `${API_BASE}/auth/login/`,
        {
          email,
          password
        }
      )
      .pipe(
        tap((r) =>
          this.guardarSesion(r)
        )
      );

  }


  registro(
    payload: {
      email: string;
      nombre: string;
      apellido: string;
      password: string;
      ubicacion: string;
    }
  ): Observable<RespuestaAuth> {

    return this.http
      .post<RespuestaAuth>(
        `${API_BASE}/auth/register/`,
        payload
      )
      .pipe(
        tap((r) =>
          this.guardarSesion(r)
        )
      );

  }


  recuperar(
    email: string
  ): Observable<{ detail: string }> {

    return this.http.post<{
      detail: string
    }>(
      `${API_BASE}/auth/password-reset/`,
      {
        email
      }
    );

  }


  googleLogin(
    credential: string
  ): Observable<RespuestaAuth> {

    return this.http
      .post<RespuestaAuth>(
        `${API_BASE}/auth/google/`,
        {
          credential
        }
      )
      .pipe(
        tap((r) =>
          this.guardarSesion(r)
        )
      );

  }


  restablecer(
    uid: string,
    token: string,
    password: string
  ): Observable<{ detail: string }> {

    return this.http.post<{
      detail: string
    }>(
      `${API_BASE}/auth/password-reset-confirm/`,
      {
        uid,
        token,
        password
      }
    );

  }


  // ==========================================================
  // CERRAR SESIÓN
  // ==========================================================

  cerrarSesion() {

    this.http
      .post(
        `${API_BASE}/auth/logout/`,
        {}
      )
      .subscribe({
        next: () => {},
        error: () => {}
      });

    this._usuario.set(null);

    this._fincas.set([]);

    this._fincaActiva.set(null);

    this._diagnosticoIA.set(null);

    this._configuracionDiagnostico.set(null);

    if (this.esNavegador) {

      localStorage.removeItem(
        'token'
      );

    }

  }


  // ==========================================================
  // RESTAURAR SESIÓN
  // ==========================================================

  restaurarSesion():
    Observable<Usuario> | null {

    if (
      !this.esNavegador ||
      !localStorage.getItem('token')
    ) {

      return null;

    }

    const obs =
      this.http.get<Usuario>(
        `${API_BASE}/auth/me/`
      );

    obs.subscribe({

      next: (u) => {

        this._usuario.set(u);

        // Cargar automáticamente las fincas
        // del usuario al restaurar la sesión.
        this.cargarFincas()
          .subscribe({
            error: () => {}
          });

      },

      error: () =>
        this.cerrarSesion()

    });

    return obs;

  }


  // ==========================================================
  // ASEGURAR USUARIO
  // ==========================================================

  async asegurarUsuario():
    Promise<Usuario | null> {

    if (this._usuario()) {

      // Si ya existe usuario pero todavía
      // no hay finca activa, intentamos cargarla.
      if (
        this._fincas().length === 0 &&
        this.esNavegador
      ) {

        try {

          await firstValueFrom(
            this.cargarFincas()
          );

        } catch {

          // No cerramos sesión por un error
          // de carga de fincas.

        }

      }

      return this._usuario();

    }


    if (
      !this.esNavegador ||
      !localStorage.getItem('token')
    ) {

      return null;

    }

    try {

      const u =
        await firstValueFrom(
          this.http.get<Usuario>(
            `${API_BASE}/auth/me/`
          )
        );

      this._usuario.set(u);

      // Cargar automáticamente las fincas
      // después de recuperar la sesión.
      try {

        await firstValueFrom(
          this.cargarFincas()
        );

      } catch {

        // El usuario sigue autenticado aunque
        // la carga de fincas falle temporalmente.

      }

      return u;

    } catch {

      this.cerrarSesion();

      return null;

    }

  }


  esAdmin(): boolean {

    return !!this._usuario()?.is_staff;

  }


  esSuperusuario(): boolean {

    return !!this._usuario()?.is_superuser;

  }


  // ==========================================================
  // GUARDAR SESIÓN
  // ==========================================================

  private guardarSesion(
    r: RespuestaAuth
  ) {

    if (this.esNavegador) {

      localStorage.setItem(
        'token',
        r.token
      );

    }

    this._usuario.set(
      r.usuario
    );

    // ========================================================
    // IMPORTANTE:
    // Después de iniciar sesión se cargan automáticamente
    // las fincas del usuario y se establece la primera
    // como finca activa.
    //
    // NO se le pide al usuario seleccionar una finca.
    // ========================================================

    this.cargarFincas()
      .subscribe({
        error: () => {}
      });

  }


  // ==========================================================
  // FINCAS
  // ==========================================================

  cargarFincas():
    Observable<Finca[]> {

    return this.http
      .get<Finca[]>(
        `${API_BASE}/fincas/`
      )
      .pipe(

        tap((fs) => {

          this._fincas.set(fs);

          // ==================================================
          // SELECCIÓN AUTOMÁTICA
          // ==================================================
          //
          // Si ya existe una finca activa y todavía
          // pertenece a la lista, la conservamos.
          //
          // Si no existe finca activa, utilizamos
          // automáticamente la primera finca del usuario.
          //

          const activa =
            this._fincaActiva();

          if (activa) {

            const fincaActualizada =
              fs.find(
                f => f.id === activa.id
              );

            if (fincaActualizada) {

              this._fincaActiva.set(
                fincaActualizada
              );

              return;

            }

          }

          if (fs.length > 0) {

            this._fincaActiva.set(
              fs[0]
            );

          } else {

            this._fincaActiva.set(
              null
            );

          }

        })

      );

  }


  // ==========================================================
  // CREAR FINCA
  // ==========================================================

  crearFinca(
    nombre: string,
    ubicacion: string,
    hectareas: number | null = null
  ): Observable<Finca> {

    return this.http
      .post<Finca>(
        `${API_BASE}/fincas/`,
        {
          nombre,
          ubicacion,
          ...(hectareas !== null ? { hectareas } : {})
        }
      )
      .pipe(

        tap((f) => {

          this._fincas.update(
            (arr) => [
              ...arr,
              f
            ]
          );

          // Si el usuario no tenía ninguna finca,
          // la nueva finca se convierte automáticamente
          // en la finca activa.
          if (
            !this._fincaActiva()
          ) {

            this._fincaActiva.set(
              f
            );

          }

        })

      );

  }


  // ==========================================================
  // SELECCIONAR FINCA
  // ==========================================================
  //
  // Este método se mantiene porque otras partes
  // de la aplicación pueden utilizarlo.
  //
  // Pero Diagnóstico IA ya NO necesita pedir
  // al usuario que seleccione una finca.
  //

  seleccionarFinca(
    f: Finca
  ) {

    this._fincaActiva.set(
      f
    );

  }


  // ==========================================================
  // DIAGNÓSTICO IA
  // ==========================================================

  guardarDiagnosticoIA(
    d: DiagnosticoContexto
  ) {

    this._diagnosticoIA.set(
      d
    );

  }


  guardarConfiguracionDiagnostico(
    configuracion: ConfiguracionDiagnostico
  ) {

    this._configuracionDiagnostico.set(
      configuracion
    );

  }


  guardarContextoDiagnostico(
    diagnostico: DiagnosticoContexto,
    configuracion: ConfiguracionDiagnostico
  ) {

    this._diagnosticoIA.set(
      diagnostico
    );

    this._configuracionDiagnostico.set(
      configuracion
    );

  }


  limpiarDiagnosticoIA() {

    this._diagnosticoIA.set(
      null
    );

  }


  limpiarConfiguracionDiagnostico() {

    this._configuracionDiagnostico.set(
      null
    );

  }


  limpiarContextoDiagnostico() {

    this._diagnosticoIA.set(
      null
    );

    this._configuracionDiagnostico.set(
      null
    );

  }

}