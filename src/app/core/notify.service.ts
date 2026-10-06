import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'info' | 'advertencia';

export interface Toast {
  id: number;
  tipo: TipoToast;
  titulo: string;
  mensaje: string;
}

export interface ConfirmOpciones {
  titulo?: string;
  mensaje: string;
  confirmar?: string;
  cancelar?: string;
  peligro?: boolean;
}

interface ConfirmEstado extends ConfirmOpciones {
  resolver: (v: boolean) => void;
}

/** Notificaciones globales: toasts bonitos + modal de confirmación. */
@Injectable({ providedIn: 'root' })
export class NotifyService {
  readonly toasts = signal<Toast[]>([]);
  readonly confirmEstado = signal<ConfirmEstado | null>(null);
  private seq = 0;

  private push(tipo: TipoToast, mensaje: string, titulo: string, duracion = 5000) {
    const id = ++this.seq;
    this.toasts.update((t) => [...t, { id, tipo, titulo, mensaje }]);
    if (duracion > 0 && typeof window !== 'undefined') {
      setTimeout(() => this.cerrar(id), duracion);
    }
  }

  exito(mensaje: string, titulo = '¡Todo listo!') { this.push('exito', mensaje, titulo); }
  error(mensaje: string, titulo = 'Ups, algo pasó') { this.push('error', mensaje, titulo, 7000); }
  info(mensaje: string, titulo = 'Para tu información') { this.push('info', mensaje, titulo); }
  advertencia(mensaje: string, titulo = 'Un momento') { this.push('advertencia', mensaje, titulo, 6000); }

  cerrar(id: number) {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }

  /** Muestra un modal de confirmación y resuelve true/false. */
  confirmar(opciones: ConfirmOpciones): Promise<boolean> {
    return new Promise((resolver) => this.confirmEstado.set({ ...opciones, resolver }));
  }

  responderConfirm(valor: boolean) {
    const estado = this.confirmEstado();
    if (estado) {
      estado.resolver(valor);
      this.confirmEstado.set(null);
    }
  }
}
