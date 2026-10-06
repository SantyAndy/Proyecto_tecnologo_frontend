import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, OnInit, Output, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppState } from '../../core/app-state';
import { Finca } from '../../core/models';
import { IconComponent } from '../../shared/icon';

@Component({
  selector: 'app-fincas-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-[100] grid place-items-center p-4 anim-fade-in">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div class="relative w-full max-w-md card p-6 anim-pop">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-display font-bold text-xl text-[var(--verde-primary)]">Gestionar mis fincas</h3>
          <button (click)="cerrar.emit()" class="text-[var(--rojo)] hover:rotate-90 transition-transform"><app-icon name="close" [size]="22" /></button>
        </div>

        @if (!modoCrear()) {
          <p class="text-sm text-[var(--texto-suave)] mb-3">Selecciona la finca que deseas monitorear:</p>
          <ul class="space-y-2 max-h-60 overflow-auto pr-1">
            @for (f of state.fincas(); track f.id) {
              <li>
                <button (click)="seleccion.set(f)"
                        class="finca-item" [class.sel]="seleccion()?.id === f.id">
                  <app-icon name="pin" [size]="18" />
                  <span>{{ f.nombre }} — {{ f.ubicacion }}</span>
                </button>
              </li>
            }
          </ul>
          <div class="flex gap-3 mt-5">
            <button (click)="modoCrear.set(true)" class="btn btn-danger flex-1"><app-icon name="plus" [size]="18" /> Crear finca</button>
            <button (click)="ir()" [disabled]="!seleccion()" class="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">Ir a finca <app-icon name="arrow" [size]="18" /></button>
          </div>
        } @else {
          <p class="text-sm text-[var(--texto-suave)] mb-3">Registra una nueva finca con su nombre y ubicación:</p>
          <div class="space-y-3">
            <input class="field" [(ngModel)]="nombre" placeholder="Nombre de la finca" />
            <input class="field" [(ngModel)]="ubicacion" placeholder="Ubicación" />
            <input class="field" type="number" min="0" step="0.5" inputmode="decimal" [(ngModel)]="hectareas" placeholder="Hectáreas (opcional)" />
          </div>
          <div class="flex gap-3 mt-5">
            <button (click)="modoCrear.set(false)" class="btn btn-outline flex-1">Volver</button>
            <button (click)="crear()" [disabled]="!nombre.trim() || !ubicacion.trim()" class="btn btn-danger flex-1 disabled:opacity-50">Crear finca</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .finca-item { width:100%; display:flex; align-items:center; gap:.6rem; padding:.7rem 1rem; border-radius:.9rem; border:1.5px solid var(--borde); background:#fff; color:var(--texto); font-size:.9rem; text-align:left; transition:.2s; }
    .finca-item:hover { border-color:var(--verde-accent); background:var(--verde-soft); }
    .finca-item.sel { border-color:var(--verde-primary); background:var(--verde-soft); color:var(--verde-primary-dark); font-weight:600; }
    .finca-item app-icon { color:var(--verde-primary); flex-shrink:0; }
  `],
})
export class FincasModalComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() confirmada = new EventEmitter<Finca>();
  state = inject(AppState);

  seleccion = signal<Finca | null>(null);
  modoCrear = signal(false);
  nombre = '';
  ubicacion = '';
  hectareas: number | null = null;

  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.state.cargarFincas().subscribe((fs) => this.seleccion.set(fs[0] ?? null));
  }

  ir() {
    const f = this.seleccion();
    if (!f) return;
    this.state.seleccionarFinca(f);
    this.confirmada.emit(f);
  }

  crear() {
    if (!this.nombre.trim() || !this.ubicacion.trim()) return;
    const ha = this.hectareas !== null && Number(this.hectareas) >= 0 ? Number(this.hectareas) : null;
    this.state.crearFinca(this.nombre.trim(), this.ubicacion.trim(), ha).subscribe((nueva) => {
      this.seleccion.set(nueva);
      this.modoCrear.set(false);
      this.nombre = '';
      this.ubicacion = '';
      this.hectareas = null;
    });
  }
}
