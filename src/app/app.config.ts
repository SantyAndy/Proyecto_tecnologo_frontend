import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { authInterceptor } from './core/auth.interceptor';
import { esAppNativa, PlataformaService } from './core/plataforma.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay()),
    // Ionic (servicio Platform) + Capacitor: detecta web / PWA / app nativa.
    // Si más adelante se usan componentes de Ionic (<ion-...>), agregar aquí
    // provideIonicAngular({ mode: 'md' }) de '@ionic/angular/provide'.
    // Sin await: los plugins nativos se configuran sin bloquear el arranque.
    provideAppInitializer(() => { void inject(PlataformaService).iniciar(); }),
    // El service worker (PWA) solo en la web: la app nativa ya trae los archivos.
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !esAppNativa(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
