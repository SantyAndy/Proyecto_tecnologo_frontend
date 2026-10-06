import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Platform } from '@ionic/angular/platform';
import { Capacitor } from '@capacitor/core';

export type TipoPlataforma = 'app-android' | 'app-ios' | 'pwa' | 'web';

/**
 * Punto único para saber DÓNDE se está ejecutando la aplicación y ajustar
 * su comportamiento, combinando Ionic (detección de plataforma) y
 * Capacitor (app nativa Android/iOS):
 *
 *  - app-android / app-ios → app nativa generada con Capacitor.
 *  - pwa                    → PWA instalada en celular o computador.
 *  - web                    → navegador normal.
 *
 * Ionic agrega además clases al <html> (plt-android, plt-ios, plt-desktop,
 * plt-pwa, plt-capacitor…) que se pueden usar desde CSS.
 */
@Injectable({ providedIn: 'root' })
export class PlataformaService {
  private platformId = inject(PLATFORM_ID);
  private ionic = inject(Platform);
  private esNavegador = isPlatformBrowser(this.platformId);

  /** Verdadero dentro de la app nativa (Capacitor). */
  readonly esApp = esAppNativa();

  get tipo(): TipoPlataforma {
    if (this.esApp) return Capacitor.getPlatform() === 'ios' ? 'app-ios' : 'app-android';
    if (this.esNavegador && this.ionic.is('pwa')) return 'pwa';
    return 'web';
  }

  /** Celular o tableta (web, PWA o app). */
  get esMovil(): boolean {
    return this.esNavegador && (this.ionic.is('mobile') || this.ionic.is('tablet'));
  }

  /** Computador (navegador o PWA de escritorio). */
  get esEscritorio(): boolean {
    return this.esNavegador && this.ionic.is('desktop');
  }

  /** Se ejecuta una vez al arrancar la aplicación (ver app.config.ts). */
  async iniciar(): Promise<void> {
    if (!this.esNavegador) return;
    this.ionic.platforms(); // Ionic marca el <html> con plt-android, plt-desktop…
    document.documentElement.dataset['plataforma'] = this.tipo;
    if (!this.esApp) return;

    // Botón "atrás" de Android: vuelve a la pantalla anterior o sale de la app.
    try {
      const { App } = await import('@capacitor/app');
      await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else App.exitApp();
      });
    } catch { /* plugin no disponible: se ignora */ }

    // Barra de estado del celular con el verde de la marca.
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#1f8f3a' });
      }
    } catch { /* plugin no disponible: se ignora */ }
  }
}

/** Disponible fuera de Angular (p. ej. en api.config.ts o app.config.ts). */
export function esAppNativa(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}
