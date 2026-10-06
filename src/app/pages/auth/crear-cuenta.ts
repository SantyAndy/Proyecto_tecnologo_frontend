import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthShellComponent } from './auth-shell';
import { IconComponent } from '../../shared/icon';
import { GoogleButtonComponent } from '../../shared/google-button';
import { AppState } from '../../core/app-state';
import { NotifyService } from '../../core/notify.service';

function igualesA(otro: string) {
  return (c: AbstractControl): ValidationErrors | null => {
    const padre = c.parent;
    if (!padre) return null;
    return padre.get(otro)?.value === c.value ? null : { noCoincide: true };
  };
}

@Component({
  selector: 'app-crear-cuenta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent, IconComponent, GoogleButtonComponent],
  template: `
    <app-auth-shell titulo="Crear Usuario" icono="userplus">
      @if (creado()) {
        <div class="anim-pop bg-[var(--verde-soft)] text-[var(--verde-primary-dark)] rounded-2xl p-5 text-center">
          <app-icon name="check" [size]="34" />
          <p class="font-medium mt-2">¡Cuenta creada con éxito!</p>
          <a routerLink="/app/datos" class="btn btn-primary mt-4">Entrar al panel</a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="crear()" class="space-y-3.5" novalidate>
          <input class="field" type="email" formControlName="email" placeholder="Email" />
          <div class="grid grid-cols-2 gap-3">
            <input class="field" formControlName="nombre" placeholder="Nombre" />
            <input class="field" formControlName="apellido" placeholder="Apellido" />
          </div>
          <input class="field" type="email" formControlName="repetirEmail" placeholder="Repetir Email" />
          @if (mostrar('repetirEmail')) { <p class="err">Los correos no coinciden</p> }
          <div class="pass-wrap">
            <input class="field !pr-11" [type]="verPass() ? 'text' : 'password'" formControlName="password" placeholder="Contraseña" />
            <button type="button" class="toggle-pass" (click)="verPass.set(!verPass())"><app-icon [name]="verPass() ? 'eye-off' : 'eye'" [size]="18" /></button>
          </div>
          <div class="pass-wrap">
            <input class="field !pr-11" [type]="verPass() ? 'text' : 'password'" formControlName="repetirPassword" placeholder="Repetir Contraseña" />
          </div>
          @if (mostrar('repetirPassword')) { <p class="err">Las contraseñas no coinciden</p> }
          <input class="field" formControlName="ubicacion" placeholder="Ubicación" />

          <label class="flex items-start gap-3 text-sm text-[var(--texto-suave)] cursor-pointer pt-1">
            <input type="checkbox" formControlName="terminos" class="mt-0.5 w-5 h-5 accent-[var(--verde-primary)]" />
            <span>Acepto todos los términos y condiciones</span>
          </label>

          <button type="submit" class="btn btn-primary w-full !py-3.5 mt-1">Crear Cuenta</button>
          <p class="text-center text-sm text-[var(--texto-suave)]">
            ¿Ya tienes cuenta? <a routerLink="/login" class="text-[var(--verde-primary)] font-medium hover:underline">Inicia sesión</a>
          </p>
        </form>

        <app-google-button />
      }
    </app-auth-shell>
  `,
  styles: [`
    .err { color:#e53935; font-size:.78rem; margin:-.4rem 0 .2rem; }
    .pass-wrap { position:relative; }
    .toggle-pass { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:var(--texto-suave); padding:4px; border-radius:8px; transition:color .2s, background .2s; }
    .toggle-pass:hover { color:var(--verde-primary); background:var(--verde-soft); }
  `],
})
export class CrearCuentaComponent {
  private fb = new FormBuilder();
  private state = inject(AppState);
  private notify = inject(NotifyService);
  creado = signal(false);
  verPass = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    repetirEmail: ['', [Validators.required, igualesA('email')]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    repetirPassword: ['', [Validators.required, igualesA('password')]],
    ubicacion: ['', Validators.required],
    terminos: [false, Validators.requiredTrue],
  });

  mostrar(c: string): boolean {
    const ctrl = this.form.get(c);
    return !!ctrl && ctrl.hasError('noCoincide') && (ctrl.touched || ctrl.dirty);
  }

  crear() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.state.registro({
      email: v.email!, nombre: v.nombre!, apellido: v.apellido!,
      password: v.password!, ubicacion: v.ubicacion!,
    }).subscribe({
      next: () => { this.creado.set(true); this.notify.exito('Tu cuenta fue creada. ¡Bienvenido!', '¡Registro exitoso!'); },
      error: (e) => {
        const err = e?.error;
        this.notify.error(err?.email?.[0] ?? err?.password?.[0] ?? err?.detail ?? 'Revisa los datos e inténtalo otra vez.', 'No pudimos crear la cuenta');
      },
    });
  }
}
