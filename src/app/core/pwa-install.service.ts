import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { esAppNativa } from './plataforma.service';

/** Evento `beforeinstallprompt` (no está tipado en TS por defecto). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Maneja la instalación de la PWA (botón "Descargar app").
 *
 * - En Android/Chrome captura el evento `beforeinstallprompt` y lo dispara
 *   cuando el usuario pulsa el botón.
 * - En iOS (Safari) no existe ese evento, así que mostramos las instrucciones
 *   manuales ("Compartir → Añadir a pantalla de inicio").
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private platformId = inject(PLATFORM_ID);
  private esNavegador = isPlatformBrowser(this.platformId);

  /** Evento guardado para lanzar el diálogo nativo de instalación. */
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  /** Indica si el navegador permite instalar mediante diálogo nativo. */
  readonly disponible = signal(false);
  /** Verdadero cuando la app ya está instalada / abierta como app. */
  readonly instalada = signal(false);
  /** Verdadero en iPhone/iPad (instalación manual). */
  readonly esIos = signal(false);

  /**
   * Si debemos mostrar el botón de descarga en la interfaz.
   * Lo mostramos siempre que la app NO esté ya instalada: si el navegador no
   * puede instalarla todavía (p. ej. HTTP en vez de HTTPS), al pulsar el botón
   * mostramos las instrucciones en lugar de esconderlo.
   */
  readonly mostrarBoton = computed(() => this.esNavegador && !this.instalada());

  constructor() {
    if (!this.esNavegador) return;

    // ¿Ya está abierta como app instalada?
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    // Dentro de la app nativa (Capacitor) ya está instalada: no se ofrece la PWA.
    this.instalada.set(!!standalone || esAppNativa());

    // Detección de iOS (no soporta beforeinstallprompt).
    const ua = window.navigator.userAgent || '';
    const ios = /iphone|ipad|ipod/i.test(ua);
    const ipadOs = ua.includes('Mac') && 'ontouchend' in document;
    this.esIos.set(ios || ipadOs);

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.disponible.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.disponible.set(false);
      this.instalada.set(true);
    });
  }

  /**
   * Lanza la instalación. Devuelve un mensaje cuando hay que mostrar las
   * instrucciones manuales (iOS) o cuando no está disponible.
   */
  async instalar(): Promise<{ ok: boolean; mensaje?: string }> {
    if (!this.esNavegador) return { ok: false };

    if (this.deferredPrompt) {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.disponible.set(false);
      return { ok: outcome === 'accepted' };
    }

    if (this.esIos()) {
      return {
        ok: false,
        mensaje:
          'En iPhone/iPad: pulsa el botón Compartir (cuadro con flecha) y luego "Añadir a pantalla de inicio".',
      };
    }

    const esSeguro =
      window.location.protocol === 'https:' || window.location.hostname === 'localhost';

    if (!esSeguro) {
      return {
        ok: false,
        mensaje:
          'Para poder instalarla, abre la página por HTTPS o desde localhost. ' +
          'Mientras tanto, en Android puedes instalarla con el menú ⋮ del navegador → "Instalar app" / "Añadir a pantalla de inicio".',
      };
    }

    return {
      ok: false,
      mensaje:
        'Usa el menú ⋮ de tu navegador → "Instalar app" / "Añadir a pantalla de inicio". ' +
        'Si no aparece, es posible que ya esté instalada.',
    };
  }
}
