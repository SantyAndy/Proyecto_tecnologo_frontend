import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';

/** CRUD genérico contra /api/admin/<recurso>/ (solo staff). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private base = `${API_BASE}/admin`;

  list(recurso: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${recurso}/`);
  }
  create(recurso: string, data: any): Observable<any> {
    return this.http.post(`${this.base}/${recurso}/`, data);
  }
  update(recurso: string, id: number, data: any): Observable<any> {
    // PATCH para permitir actualizaciones parciales (p. ej. editar sin re-subir imagen).
    return this.http.patch(`${this.base}/${recurso}/${id}/`, data);
  }
  remove(recurso: string, id: number): Observable<any> {
    return this.http.delete(`${this.base}/${recurso}/${id}/`);
  }
}
