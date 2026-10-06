import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, NgZone, PLATFORM_ID, signal, ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { GOOGLE_CLIENT_ID } from '../core/api.config';
import { AppState } from '../core/app-state';
import { esAppNativa } from '../core/plataforma.service';

/** Botón "Continuar con Google" (sirve para iniciar sesión o registrarse). */
@Component({
  selector: 'app-google-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Google no permite su inicio de sesión dentro de la app nativa (WebView). -->
    @if (!esApp) {
    <div class="w-full">
      <div class="flex items-center gap-3 my-5">
        <span class="flex-1 h-px bg-[var(--borde)]"></span>
        <span class="text-xs text-[var(--texto-suave)]">o</span>
        <span class="flex-1 h-px bg-[var(--borde)]"></span>
      </div>

      @if (habilitado) {
        <div class="flex justify-center"><div #btn></div></div>
      } @else {
        <button type="button" (click)="sinConfig()" class="gbtn">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.9 6.2C12.3 13.3 17.6 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7C43.8 38 46.5 31.8 46.5 24.5z"/>
            <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.8l7.9-6.2z"/>
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.7-3.8-13.6-9.2l-7.9 6.2C6.4 42.6 14.6 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>
        @if (aviso()) { <p class="text-xs text-[var(--texto-suave)] mt-2 text-center leading-snug">{{ aviso() }}</p> }
      }
      @if (error()) { <p class="text-[var(--rojo)] text-sm text-center mt-3">{{ error() }}</p> }
    </div>
    }
  `,
  styles: [`
    .gbtn {
      width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: .6rem;
      padding: .7rem 1.2rem; border-radius: 999px; font-weight: 600; font-size: .92rem;
      background: #fff; color: #3c4043; border: 1.5px solid var(--borde);
      transition: box-shadow .2s, transform .2s;
    }
    .gbtn:hover { box-shadow: 0 4px 14px -6px rgba(0,0,0,.3); transform: translateY(-1px); }
  `],
})
export class GoogleButtonComponent implements AfterViewInit {
  private state = inject(AppState);
  private router = inject(Router);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('btn') btn?: ElementRef<HTMLElement>;
  readonly esApp = esAppNativa();
  readonly habilitado = !!GOOGLE_CLIENT_ID;
  aviso = signal('');
  error = signal('');

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId) || !this.habilitado || this.esApp) return;
    this.init(0);
  }

  private init(intentos: number) {
    const g = (window as any).google;
    if (!g?.accounts?.id) {
      // El script de Google carga async: esperamos hasta ~10 s antes de avisar.
      if (intentos < 40) setTimeout(() => this.init(intentos + 1), 250);
      else this.zone.run(() => this.error.set('No se pudo cargar el inicio con Google. Revisa tu conexión y recarga la página.'));
      return;
    }
    g.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp: any) => this.zone.run(() => this.entrar(resp.credential)),
    });
    if (this.btn) {
      g.accounts.id.renderButton(this.btn.nativeElement, {
        theme: 'outline', size: 'large', width: 320, text: 'continue_with', locale: 'es',
      });
    }
  }

  private entrar(credential: string) {
    this.error.set('');
    if (!credential) {
      this.error.set('Google no devolvió la credencial. Intenta de nuevo.');
      return;
    }
    this.state.googleLogin(credential).subscribe({
      next: (r) => {
        const u = r.usuario;
        this.router.navigate([u.is_staff ? '/admin' : '/app/datos']);
      },
      error: (e) => this.error.set(
        e?.error?.detail ?? (e?.status === 0 ? 'No hay conexión con el servidor.' : 'No se pudo continuar con Google.'),
      ),
    });
  }

  sinConfig() {
    this.aviso.set('Para activarlo, configura el Client ID de Google en frontend/src/app/core/api.config.ts y en el backend (GOOGLE_CLIENT_ID).');
  }
}
