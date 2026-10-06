import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthShellComponent } from './auth-shell';
import { IconComponent } from '../../shared/icon';
import { GoogleButtonComponent } from '../../shared/google-button';
import { AppState } from '../../core/app-state';
import { NotifyService } from '../../core/notify.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent, IconComponent, GoogleButtonComponent],
  template: `
    <app-auth-shell titulo="Inicio de sesión">
      <form [formGroup]="form" (ngSubmit)="entrar()" class="space-y-4" novalidate>
        <div class="input-icon">
          <app-icon name="mail" [size]="18" />
          <input class="field !pl-11" type="email" formControlName="email" placeholder="Email" />
        </div>
        <div class="input-icon">
          <app-icon name="lock" [size]="18" />
          <input class="field !pl-11 !pr-11" [type]="verPass() ? 'text' : 'password'" formControlName="password" placeholder="Contraseña" />
          <button type="button" class="toggle-pass" (click)="verPass.set(!verPass())" [attr.aria-label]="verPass() ? 'Ocultar' : 'Mostrar'">
            <app-icon [name]="verPass() ? 'eye-off' : 'eye'" [size]="18" />
          </button>
        </div>

        <div class="flex items-center justify-between text-sm">
          <a routerLink="/crear-cuenta" class="text-[var(--verde-primary)] font-medium hover:underline">Crea cuenta</a>
          <a routerLink="/recuperar-contrasena" class="text-[var(--texto-suave)] hover:text-[var(--verde-primary)]">¿Olvidaste tu contraseña?</a>
        </div>

        <button type="submit" [disabled]="cargando()" class="btn btn-primary w-full !py-3.5 disabled:opacity-60">
          {{ cargando() ? 'Entrando…' : 'Iniciar Sesión' }} <app-icon name="arrow" [size]="18" />
        </button>
      </form>

      <app-google-button />

      <div class="mt-8 space-y-2 text-center text-sm text-[var(--texto-suave)]">
        <p class="inline-flex items-center justify-center gap-1.5 w-full">
          <app-icon name="shield" [size]="15" class="text-[var(--verde-primary)]" />
          ¿Eres administrador? Inicia sesión y entrarás directo al panel.
        </p>
      </div>
    </app-auth-shell>
  `,
  styles: [`
    .input-icon { position:relative; }
    .input-icon > app-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--verde-primary); pointer-events:none; }
    .toggle-pass { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:var(--texto-suave); padding:4px; border-radius:8px; transition:color .2s, background .2s; }
    .toggle-pass:hover { color:var(--verde-primary); background:var(--verde-soft); }
    .err { color:#e53935; font-size:.85rem; }
  `],
})
export class LoginComponent {
  verPass = signal(false);
  private fb = new FormBuilder();
  private router = inject(Router);
  private state = inject(AppState);
  private notify = inject(NotifyService);

  cargando = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  entrar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.cargando.set(true);
    this.state.login(this.form.value.email!, this.form.value.password!).subscribe({
      next: (r) => {
        const u = r.usuario;
        this.notify.exito(`¡Hola ${u.nombre || 'de nuevo'}! Bienvenido.`, 'Sesión iniciada');
        this.router.navigate([u.is_staff ? '/admin' : '/app/datos']);
      },
      error: (e) => {
        this.cargando.set(false);
        this.notify.error(e?.error?.detail ?? 'Verifica tu correo y contraseña e inténtalo de nuevo.', 'No pudimos iniciar sesión');
      },
    });
  }
}
