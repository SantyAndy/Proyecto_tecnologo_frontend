import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';
import { Resena, ResumenResenas } from './models';

/** Opiniones/reseñas de los caficultores. */
@Injectable({ providedIn: 'root' })
export class ResenaService {
  private http = inject(HttpClient);
  private base = `${API_BASE}/resenas`;

  listar(): Observable<Resena[]> {
    return this.http.get<Resena[]>(`${this.base}/`);
  }
  resumen(): Observable<ResumenResenas> {
    return this.http.get<ResumenResenas>(`${this.base}/resumen/`);
  }
  mia(): Observable<Resena | null> {
    return this.http.get<Resena | null>(`${this.base}/mia/`);
  }
  crear(data: { nombre: string; ciudad: string; comentario: string; estrellas: number }): Observable<Resena> {
    return this.http.post<Resena>(`${this.base}/`, data);
  }
}
