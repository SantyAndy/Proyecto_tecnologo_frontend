import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthShellComponent } from './auth-shell';
import { IconComponent } from '../../shared/icon';
import { AppState } from '../../core/app-state';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent, IconComponent],
  template: `
    <app-auth-shell titulo="Recupera tu contraseña" icono="mail"
      subtitulo="Se enviará a tu correo un enlace para verificar tu identidad. Revisa también la bandeja de correo no deseado.">
      @if (enviado()) {
        <div class="anim-pop bg-[var(--verde-soft)] text-[var(--verde-primary-dark)] rounded-2xl p-6 text-center">
          <app-icon name="mail" [size]="34" />
          <p class="font-semibold mt-2">Revisa tu correo</p>
          <p class="text-sm mt-1">Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña. Revisa también la bandeja de spam.</p>
          <a routerLink="/login" class="btn btn-primary mt-4">Volver a iniciar sesión</a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="enviar()" class="space-y-4" novalidate>
          <div class="input-icon">
            <app-icon name="mail" [size]="18" />
            <input class="field !pl-11" type="email" formControlName="email" placeholder="Introduce tu correo electrónico" />
          </div>
          <button type="submit" class="btn btn-primary w-full !py-3.5">Enviar <app-icon name="arrow" [size]="18" /></button>
          <p class="text-center text-sm"><a routerLink="/login" class="text-[var(--verde-primary)] hover:underline">Volver a iniciar sesión</a></p>
        </form>
      }
    </app-auth-shell>
  `,
  styles: [`
    .input-icon { position:relative; }
    .input-icon app-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--verde-primary); }
  `],
})
export class RecuperarComponent {
  private fb = new FormBuilder();
  private state = inject(AppState);
  enviado = signal(false);
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });

  enviar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.state.recuperar(this.form.value.email!).subscribe({
      next: () => this.enviado.set(true),
      error: () => this.enviado.set(true), // no revelamos si el correo existe
    });
  }
}
