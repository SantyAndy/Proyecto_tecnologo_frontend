import { DatePipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AppState } from '../../core/app-state';
import { DiagnosticoService } from '../../core/diagnostico.service';
import { FincaService } from '../../core/finca.service';
import { Lectura } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { descargarTablaPdf, fmtFechaHora, fmtNum } from '../../core/pdf';
import { IconComponent } from '../../shared/icon';
import { RevealDirective } from '../../core/reveal.directive';
import { RecomendacionFertilizacion } from '../../core/models';
import { ResumenDiagnosticoComponent, TarjetasAbonosComponent } from '../../shared/recomendacion-fertilizacion';

interface DiagnosticoGuardado {
  id: number;
  imagen: string | null;
  estado: string;
  diagnostico: string;
  recomendacion: string;
  confianza: number | null;
  creado: string;
  recomendacion_detalle?: { fertilizacion?: RecomendacionFertilizacion | null } | null;
}

@Component({
  selector: 'app-historial',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, FormsModule, IconComponent, RevealDirective, ResumenDiagnosticoComponent, TarjetasAbonosComponent],
  template: `
    <section class="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div class="flex justify-center mb-6">
        <div class="tabs">
          <button type="button" [class.on]="vista() === 'sensores'" (click)="vista.set('sensores')">
            <app-icon name="chip" [size]="16" /> Sensores
          </button>
          <button type="button" [class.on]="vista() === 'diagnosticos'" (click)="verDiagnosticos()">
            <app-icon name="brain" [size]="16" /> Diagnósticos
          </button>
        </div>
      </div>

      @if (vista() === 'diagnosticos') {

        <div class="text-center mb-6 anim-fade-up">
          <h1 class="section-title text-center font-display font-extrabold text-3xl text-[var(--verde-primary)] mx-auto block w-fit">Historial de diagnósticos</h1>
          <p class="text-[var(--texto-suave)] text-sm mt-2">Cada análisis guardado conserva la imagen, el diagnóstico y los abonos recomendados en ese momento.</p>
        </div>

        <div class="space-y-4">
          @for (d of diagnosticos(); track d.id) {
            <article class="card p-4 sm:p-5">
              <button type="button" class="diag-fila" (click)="alternar(d.id)">
                <div class="diag-img">
                  @if (d.imagen) { <img [src]="d.imagen" [alt]="d.diagnostico" loading="lazy" /> }
                  @else { <app-icon name="image" [size]="24" /> }
                </div>
                <div class="flex-1 min-w-0 text-left">
                  <p class="font-display font-bold text-[var(--verde-primary)] truncate">{{ d.diagnostico || 'Diagnóstico' }}</p>
                  <p class="text-xs text-[var(--texto-suave)]">
                    {{ d.creado | date:'yyyy-MM-dd HH:mm' }}
                    @if (d.confianza !== null) { · Confianza visual {{ d.confianza | number:'1.0-0' }} % }
                    @if (d.recomendacion_detalle?.fertilizacion; as f) {
                      · {{ f.productos_recomendados.length + f.recomendaciones_foliares.length }} abono(s) recomendado(s)
                    }
                  </p>
                </div>
                <app-icon name="chevron" [size]="18" [class.girado]="abierto() === d.id" />
              </button>

              @if (abierto() === d.id) {
                <div class="mt-5 space-y-5">
                  @if (d.recomendacion_detalle?.fertilizacion; as f) {
                    <app-resumen-diagnostico [recomendacion]="f" />
                    <div>
                      <h3 class="font-display font-extrabold text-xl text-[var(--verde-primary)] mb-3">Abonos recomendados</h3>
                      <app-tarjetas-abonos [recomendacion]="f" />
                    </div>
                  } @else {
                    <p class="text-sm leading-relaxed">{{ d.recomendacion || 'Este diagnóstico se guardó antes de registrar las recomendaciones.' }}</p>
                  }
                </div>
              }
            </article>
          } @empty {
            <div class="card p-10 text-center text-[var(--texto-suave)]">
              {{ cargandoDiagnosticos() ? 'Cargando…' : 'Aún no has guardado diagnósticos.' }}
            </div>
          }
        </div>

      } @else {

      <div class="text-center mb-6 anim-fade-up">
        <h1 appReveal class="section-title text-center font-display font-extrabold text-3xl text-[var(--verde-primary)] mx-auto block w-fit">Historial de sensores</h1>
        <p class="text-[var(--texto-suave)] text-sm mt-2">Consulta los registros de los últimos 30 días. Filtra por fecha.</p>
      </div>

      <!-- Buscador -->
      <div appReveal class="card p-4 sm:p-5 mb-6 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div class="flex-1">
          <label class="lbl">Desde</label>
          <input type="date" class="field" [(ngModel)]="desde" />
        </div>
        <div class="flex-1">
          <label class="lbl">Hasta</label>
          <input type="date" class="field" [(ngModel)]="hasta" />
        </div>
        <div class="flex gap-2">
          <button (click)="buscar()" class="btn btn-primary"><app-icon name="search" [size]="18" /> Buscar</button>
          <button (click)="limpiar()" class="btn btn-outline">Limpiar</button>
        </div>
      </div>

      <div class="flex justify-end mb-4">
        <button (click)="descargar()" class="btn btn-danger"><app-icon name="download" [size]="18" /> {{ descargando() ? 'Generando…' : 'Descargar PDF' }}</button>
      </div>

      <div appReveal class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-[var(--verde-primary)] text-white text-left">
                <th class="th">Fecha</th><th class="th">Humedad (%)</th><th class="th">Temperatura (°C)</th><th class="th">pH</th><th class="th">Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              @for (l of lecturas(); track l.id) {
                <tr class="row">
                  <td class="td">{{ l.fecha | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                  <td class="td">{{ l.humedad }}</td>
                  <td class="td">{{ l.temperatura }}</td>
                  <td class="td">{{ l.ph | number:'1.0-3' }}</td>
                  <td class="td"><span class="chip"><app-icon name="user" [size]="14" /> {{ l.dispositivo }}</span></td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="td text-center py-10 text-[var(--texto-suave)]">
                  No hay registros en el rango de fechas seleccionado.
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      }
    </section>
  `,
  styles: [`
    .lbl { display:block; font-size:.78rem; font-weight:500; margin-bottom:.3rem; color:var(--texto-suave); }
    .th { padding:.9rem 1rem; font-weight:600; font-family:'Poppins',sans-serif; }
    .td { padding:.8rem 1rem; border-bottom:1px solid var(--borde); }
    .row:hover { background:var(--verde-soft); }
    .tabs { display:flex; gap:.3rem; padding:.3rem; border-radius:999px; background:var(--verde-soft); }
    .tabs button { display:flex; align-items:center; gap:.4rem; border:0; border-radius:999px; padding:.55rem 1.1rem; background:transparent; font-weight:600; cursor:pointer; }
    .tabs button.on { background:var(--verde-primary); color:#fff; }
    .diag-fila { display:flex; align-items:center; gap:1rem; width:100%; background:none; border:0; cursor:pointer; padding:0; }
    .diag-img { width:64px; height:64px; flex-shrink:0; border-radius:.8rem; overflow:hidden; background:var(--verde-soft); display:grid; place-items:center; color:var(--verde-primary); }
    .diag-img img { width:100%; height:100%; object-fit:cover; }
    .girado { transform:rotate(90deg); }
    .chip { display:inline-flex; align-items:center; gap:.3rem; padding:.15rem .6rem; border-radius:999px; background:var(--verde-soft); color:var(--verde-primary-dark); font-weight:600; font-size:.75rem; }
  `],
})
export class HistorialComponent {
  private state = inject(AppState);
  private fincaService = inject(FincaService);
  private notify = inject(NotifyService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private diagnosticoService = inject(DiagnosticoService);

  vista = signal<'sensores' | 'diagnosticos'>(
    inject(ActivatedRoute).snapshot.queryParamMap.get('vista') === 'diagnosticos' ? 'diagnosticos' : 'sensores'
  );
  diagnosticos = signal<DiagnosticoGuardado[]>([]);
  cargandoDiagnosticos = signal(false);
  abierto = signal<number | null>(null);

  lecturas = signal<Lectura[]>([]);
  desde = '';
  hasta = '';
  descargando = signal(false);

  constructor() {
    // Recarga el historial cuando cambia la finca activa (respetando el filtro de fechas actual).
    effect(() => {
      const finca = this.state.fincaActiva();
      if (!this.esNavegador || !finca) { this.lecturas.set([]); return; }
      this.cargar();
    });
    if (this.vista() === 'diagnosticos') this.cargarDiagnosticos();
  }

  verDiagnosticos() {
    this.vista.set('diagnosticos');
    this.cargarDiagnosticos();
  }

  private cargarDiagnosticos() {
    if (!this.esNavegador) return;
    this.cargandoDiagnosticos.set(true);
    this.diagnosticoService.historial().subscribe({
      next: (d) => {
        this.diagnosticos.set(d);
        this.abierto.set(d[0]?.id ?? null);
        this.cargandoDiagnosticos.set(false);
      },
      error: () => {
        this.cargandoDiagnosticos.set(false);
        this.notify.error('No se pudo cargar el historial de diagnósticos.');
      },
    });
  }

  alternar(id: number) {
    this.abierto.update((actual) => (actual === id ? null : id));
  }

  private cargar() {
    const finca = this.state.fincaActiva();
    if (!finca) return;
    this.fincaService.historial(finca.id, this.desde || undefined, this.hasta || undefined)
      .subscribe((d) => this.lecturas.set(d));
  }

  buscar() { this.cargar(); }
  limpiar() { this.desde = ''; this.hasta = ''; this.cargar(); }

  async descargar() {
    const lecturas = this.lecturas();
    if (!lecturas.length) {
      this.notify.advertencia('No hay registros para exportar.');
      return;
    }
    const finca = this.state.fincaActiva();
    const rango = this.desde || this.hasta
      ? `Rango: ${this.desde || '…'} a ${this.hasta || '…'}`
      : 'Últimos registros';
    const subtitulo = finca
      ? `Finca: ${finca.nombre} — ${finca.ubicacion}  ·  ${rango}`
      : rango;
    this.descargando.set(true);
    try {
      await descargarTablaPdf({
        titulo: 'Historial de sensores',
        subtitulo,
        columnas: ['Fecha', 'Humedad (%)', 'Temperatura (°C)', 'pH', 'Dispositivo'],
        pesos: [2, 1, 1.2, 0.8, 1.6],
        filas: lecturas.map((l) => [
          fmtFechaHora(l.fecha),
          fmtNum(l.humedad),
          fmtNum(l.temperatura),
          fmtNum(l.ph, 3),
          l.dispositivo ?? '',
        ]),
        archivo: `historial_${finca?.nombre ?? 'finca'}`,
      });
      this.notify.exito('PDF descargado.');
    } catch {
      this.notify.error('No se pudo generar el PDF.');
    } finally {
      this.descargando.set(false);
    }
  }
}
