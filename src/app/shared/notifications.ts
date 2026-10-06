import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotifyService } from '../core/notify.service';
import { IconComponent } from './icon';

@Component({
  selector: 'app-notifications',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <!-- Toasts -->
    <div class="toast-stack">
      @for (t of notify.toasts(); track t.id) {
        <div class="toast toast-{{ t.tipo }}" role="alert">
          <span class="t-ico">
            @switch (t.tipo) {
              @case ('exito') { <app-icon name="check" [size]="22" /> }
              @case ('error') { <app-icon name="close" [size]="22" /> }
              @case ('advertencia') { <app-icon name="shield" [size]="22" /> }
              @default { <app-icon name="help" [size]="22" /> }
            }
          </span>
          <div class="t-cuerpo">
            <p class="t-titulo">{{ t.titulo }}</p>
            <p class="t-msg">{{ t.mensaje }}</p>
          </div>
          <button class="t-cerrar" (click)="notify.cerrar(t.id)" aria-label="Cerrar"><app-icon name="close" [size]="16" /></button>
          <span class="t-barra"></span>
        </div>
      }
    </div>

    <!-- Modal de confirmación -->
    @if (notify.confirmEstado(); as c) {
      <div class="fixed inset-0 z-[300] grid place-items-center p-4 anim-fade-in" (click)="notify.responderConfirm(false)">
        <div class="absolute inset-0 bg-black/55 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7 text-center anim-pop" (click)="$event.stopPropagation()">
          <span class="c-ico" [class.peligro]="c.peligro">
            <app-icon [name]="c.peligro ? 'trash' : 'help'" [size]="30" />
          </span>
          <h3 class="font-display font-bold text-xl mt-4">{{ c.titulo || '¿Confirmas?' }}</h3>
          <p class="text-[var(--texto-suave)] text-sm mt-2 leading-relaxed">{{ c.mensaje }}</p>
          <div class="flex gap-3 mt-6">
            <button (click)="notify.responderConfirm(false)" class="btn btn-outline flex-1">{{ c.cancelar || 'Cancelar' }}</button>
            <button (click)="notify.responderConfirm(true)" class="btn flex-1" [class.btn-danger]="c.peligro" [class.btn-primary]="!c.peligro">{{ c.confirmar || 'Sí, continuar' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .toast-stack {
      position: fixed; top: 1rem; right: 1rem; z-index: 350;
      display: flex; flex-direction: column; gap: .75rem;
      width: min(360px, calc(100vw - 2rem));
      pointer-events: none;
    }
    .toast {
      pointer-events: auto;
      position: relative; overflow: hidden;
      display: flex; align-items: flex-start; gap: .8rem;
      background: #fff; border-radius: 1.1rem;
      padding: 1rem 1rem 1rem .9rem;
      box-shadow: 0 18px 40px -16px rgba(20,58,34,.45);
      border: 1px solid var(--borde);
      border-left: 5px solid var(--c, var(--verde-primary));
      animation: toastIn .45s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes toastIn { from { opacity:0; transform: translateX(60px) scale(.96); } to { opacity:1; transform:none; } }

    .toast-exito       { --c:#2e7d32; }
    .toast-error       { --c:#e53935; }
    .toast-advertencia { --c:#fb8c00; }
    .toast-info        { --c:#1976d2; }

    .t-ico { display:grid; place-items:center; width:38px; height:38px; border-radius:12px; flex-shrink:0; color:#fff; background:var(--c); }
    .t-cuerpo { flex:1; min-width:0; }
    .t-titulo { font-family:'Poppins',sans-serif; font-weight:700; font-size:.95rem; color:var(--texto); }
    .t-msg { font-size:.85rem; color:var(--texto-suave); margin-top:.1rem; line-height:1.35; }
    .t-cerrar { color:var(--texto-suave); padding:2px; border-radius:6px; transition:.2s; flex-shrink:0; }
    .t-cerrar:hover { background:var(--verde-soft); color:var(--texto); }
    .t-barra { position:absolute; left:0; bottom:0; height:3px; width:100%; background:var(--c); opacity:.35; transform-origin:left; animation: barra 5s linear forwards; }
    @keyframes barra { from { transform:scaleX(1);} to { transform:scaleX(0);} }

    .c-ico { display:inline-grid; place-items:center; width:64px; height:64px; border-radius:50%; background:var(--verde-soft); color:var(--verde-primary); }
    .c-ico.peligro { background:#fdecea; color:var(--rojo); }
  `],
})
export class NotificationsComponent {
  notify = inject(NotifyService);
}
