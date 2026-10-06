import { esAppNativa } from './plataforma.service';

/**
 * Servidor Django que usa la app nativa de Android/iOS (Capacitor).
 * Pon aquí la IP del computador que corre Django en tu red WiFi
 * (python manage.py runserver 0.0.0.0:8000) o el dominio de producción.
 */
export const API_APP_URL = 'http://192.168.100.20:8000/api';

/**
 * URL base de la API REST de Django.
 *
 * Se calcula a partir del host con el que se abrió la app, de modo que:
 *  - En el computador (localhost:4200)  -> http://localhost:8000/api
 *  - Desde el celular (192.168.0.x:4200) -> http://192.168.0.x:8000/api
 * Así funciona tanto en el PC como en otros dispositivos de la misma red WiFi.
 */
function resolverApiBase(): string {
  // App nativa (Capacitor): la página corre en https://localhost del celular,
  // así que el servidor se toma de API_APP_URL.
  if (esAppNativa()) return API_APP_URL;
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  // Durante el prerender (SSR) no hay window; valor por defecto.
  return 'http://localhost:8000/api';
}

export const API_BASE = resolverApiBase();

/** Panel de administración nativo de Django (solo superusuarios). */
export const DJANGO_ADMIN_URL = API_BASE.replace(/\/api$/, '/admin/');

/**
 * Client ID de Google para "Iniciar sesión con Google".
 * Consíguelo en Google Cloud Console → APIs y servicios → Credenciales →
 * Crear credenciales → ID de cliente de OAuth 2.0 (Aplicación web).
 * En "Orígenes autorizados de JavaScript" agrega http://localhost:4200
 * Pega aquí el Client ID (termina en .apps.googleusercontent.com).
 * Déjalo vacío para ocultar el botón de Google.
 */
export const GOOGLE_CLIENT_ID = '331789073953-o16oruanc99hpbeo9h0usih1r5cufk62.apps.googleusercontent.com';
