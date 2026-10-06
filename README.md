# Frontend

## Web, PWA y app móvil (Ionic + Capacitor)

El mismo código Angular se publica de tres formas:

| Forma | Cómo se genera | Dónde se usa |
|---|---|---|
| **Web** (SSR) | `npm run build` → `dist/frontend` | Navegador en computador o celular |
| **PWA** | La misma web + service worker (`ngsw-config.json`, `public/manifest.webmanifest`) | Botón «Descargar app» en Android, Windows, macOS, Linux; en iPhone: Compartir → Añadir a inicio |
| **App nativa** (Capacitor) | `npm run app:sync` → `dist/app` → carpeta `android/` | APK / Play Store (y iOS con `npx cap add ios` en un Mac) |

- `src/app/core/plataforma.service.ts` decide el comportamiento según dónde corre (`web`, `pwa`, `app-android`, `app-ios`) usando el servicio `Platform` de **Ionic** y **Capacitor**. Ionic marca el `<html>` con clases `plt-android`, `plt-ios`, `plt-desktop`, `plt-pwa`…
- En la app nativa: sin service worker, sin botón «Descargar app», sin botón de Google (Google no lo permite en apps con WebView), barra de estado verde y botón «atrás» de Android.
- La app nativa llama a Django en `API_APP_URL` (`src/app/core/api.config.ts`). Pon ahí la IP del computador que corre Django (`python manage.py runserver 0.0.0.0:8000`) o el dominio de producción.
- Para usar componentes de Ionic (`<ion-...>`) en el futuro, agrega `provideIonicAngular({ mode: 'md' })` en `app.config.ts`. Los colores de la marca ya están en `src/styles.css` (`--ion-color-primary`).

### Generar la app Android

1. Instala [Android Studio](https://developer.android.com/studio) (trae el SDK y el JDK 21).
2. `npm run app:android` → compila, copia a `android/` y abre Android Studio.
3. En Android Studio: **Run ▶** para probar en el celular, o **Build → Build APK(s)** para generar el instalable.

Íconos y pantalla de carga: se generan desde `assets/logo.png` con `npx @capacitor/assets generate --android`.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
