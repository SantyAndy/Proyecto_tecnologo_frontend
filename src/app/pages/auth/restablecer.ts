import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthShellComponent } from './auth-shell';
import { IconComponent } from '../../shared/icon';
import { AppState } from '../../core/app-state';
import { NotifyService } from '../../core/notify.service';

function igualA(otro: string) {
  return (c: AbstractControl): ValidationErrors | null =>
    c.parent?.get(otro)?.value === c.value ? null : { noCoincide: true };
}

@Component({
  selector: 'app-restablecer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent, IconComponent],
  template: `
    <app-auth-shell titulo="Restablecer la contraseña" icono="lock"
      subtitulo="Una vez realizado el cambio podrás iniciar sesión sin inconvenientes.">
      @if (listo()) {
        <div class="anim-pop bg-[var(--verde-soft)] text-[var(--verde-primary-dark)] rounded-2xl p-6 text-center">
          <app-icon name="check" [size]="34" />
          <p class="font-semibold mt-2">Restablecimiento completado</p>
          <p class="text-sm mt-1">Tu contraseña ha sido establecida. Ahora puedes iniciar sesión.</p>
          <a routerLink="/login" class="btn btn-primary mt-4">Iniciar sesión</a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="confirmar()" class="space-y-4" novalidate>
          <div class="input-icon">
            <app-icon name="lock" [size]="18" />
            <input class="field !pl-11 !pr-11" [type]="verPass() ? 'text' : 'password'" formControlName="password" placeholder="Introduce la nueva contraseña" />
            <button type="button" class="toggle-pass" (click)="verPass.set(!verPass())"><app-icon [name]="verPass() ? 'eye-off' : 'eye'" [size]="18" /></button>
          </div>
          <div class="input-icon">
            <app-icon name="lock" [size]="18" />
            <input class="field !pl-11 !pr-11" [type]="verPass() ? 'text' : 'password'" formControlName="repetir" placeholder="Confirme la nueva contraseña" />
          </div>
          @if (noCoincide()) { <p class="err">Las contraseñas no coinciden</p> }
          @if (error()) { <p class="err text-center">{{ error() }}</p> }
          <button type="submit" [disabled]="enviando()" class="btn btn-primary w-full !py-3.5 disabled:opacity-60">{{ enviando() ? 'Guardando…' : 'Confirmar' }} <app-icon name="arrow" [size]="18" /></button>
        </form>
      }
    </app-auth-shell>
  `,
  styles: [`
    .input-icon { position:relative; }
    .input-icon > app-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--verde-primary); pointer-events:none; }
    .toggle-pass { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:var(--texto-suave); padding:4px; border-radius:8px; transition:color .2s, background .2s; }
    .toggle-pass:hover { color:var(--verde-primary); background:var(--verde-soft); }
    .err { color:#e53935; font-size:.78rem; margin-top:-.4rem; }
  `],
})
export class RestablecerComponent {
  private fb = new FormBuilder();
  private state = inject(AppState);
  private route = inject(ActivatedRoute);
  private notify = inject(NotifyService);
  listo = signal(false);
  verPass = signal(false);
  enviando = signal(false);
  error = signal('');
  private uid = this.route.snapshot.queryParamMap.get('uid') ?? '';
  private token = this.route.snapshot.queryParamMap.get('token') ?? '';

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    repetir: ['', [Validators.required, igualA('password')]],
  });

  noCoincide(): boolean {
    const c = this.form.get('repetir');
    return !!c && c.hasError('noCoincide') && (c.touched || c.dirty);
  }

  confirmar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.uid || !this.token) {
      this.error.set('Abre esta página desde el enlace que llegó a tu correo.');
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.state.restablecer(this.uid, this.token, this.form.value.password!).subscribe({
      next: () => { this.enviando.set(false); this.listo.set(true); this.notify.exito('Tu contraseña fue actualizada.', '¡Listo!'); },
      error: (e) => {
        this.enviando.set(false);
        const msg = e?.error?.detail ?? 'No se pudo cambiar la contraseña.';
        this.error.set(msg);
        this.notify.error(msg, 'No pudimos cambiarla');
      },
    });
  }
}
