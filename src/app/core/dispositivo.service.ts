import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';
import { Dispositivo, InfoConexion } from './models';

/** Arduinos de las fincas del usuario (registro, clave y estado de conexión). */
@Injectable({ providedIn: 'root' })
export class DispositivoService {
  private http = inject(HttpClient);
  private url = `${API_BASE}/dispositivos/`;

  listar(fincaId?: number): Observable<Dispositivo[]> {
    let params = new HttpParams();
    if (fincaId) params = params.set('finca', fincaId);
    return this.http.get<Dispositivo[]>(this.url, { params });
  }

  crear(nombre: string, finca: number): Observable<Dispositivo> {
    return this.http.post<Dispositivo>(this.url, { nombre, finca });
  }

  renombrar(id: number, nombre: string): Observable<Dispositivo> {
    return this.http.patch<Dispositivo>(`${this.url}${id}/`, { nombre });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}${id}/`);
  }

  regenerarClave(id: number): Observable<Dispositivo> {
    return this.http.post<Dispositivo>(`${this.url}${id}/regenerar-clave/`, {});
  }

  /** IP, puerto y ruta del servidor que debe usar el código del Arduino. */
  conexion(): Observable<InfoConexion> {
    return this.http.get<InfoConexion>(`${this.url}conexion/`);
  }
}
