import { DatePipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { AppState } from '../../core/app-state';
import { FincaService } from '../../core/finca.service';
import { Lectura } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { descargarTablaPdf, fmtFechaHora, fmtNum } from '../../core/pdf';
import { IconComponent } from '../../shared/icon';
import { RevealDirective } from '../../core/reveal.directive';

@Component({
  selector: 'app-datos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, IconComponent, RevealDirective],
  template: `
    <section class="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div class="text-center mb-8 anim-fade-up">
        <h1 appReveal class="section-title text-center font-display font-extrabold text-xl sm:text-2xl md:text-3xl leading-tight text-[var(--verde-primary)] mx-auto block w-fit">Información de los sensores</h1>
        <p class="text-[var(--texto-suave)] text-[13px] sm:text-sm leading-relaxed mt-3 max-w-2xl mx-auto px-2">
          En esta sección se presentan los últimos 30 registros del mes, con datos detallados sobre la humedad, temperatura y nivel de pH. Esta información es clave para el análisis y monitoreo de las condiciones ambientales del cultivo.
        </p>
      </div>

      <!-- Tarjetas resumen -->
      <div class="grid grid-cols-3 gap-4 mb-8">
        @for (m of metricas(); track m.label; let i = $index) {
          <div [appReveal]="i*100" class="card p-5 text-center">
            <span class="icon-badge mx-auto"><app-icon [name]="m.icono" [size]="24" /></span>
            <div class="font-display font-extrabold text-2xl mt-3" [style.color]="m.color">{{ m.valor }}</div>
            <div class="text-xs text-[var(--texto-suave)]">{{ m.label }}</div>
          </div>
        }
      </div>

      <div class="flex justify-center mb-6">
        <button (click)="descargar()" class="btn btn-danger">
          <app-icon name="download" [size]="18" /> {{ descargando() ? 'Generando…' : 'Descargar PDF' }}
        </button>
      </div>

      <div appReveal class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-[var(--verde-primary)] text-white text-left">
                <th class="th">Fecha</th><th class="th">Humedad (%)</th><th class="th">Temperatura (°C)</th><th class="th">Humedad aire (%)</th><th class="th">pH</th>
              </tr>
            </thead>
            <tbody>
              @for (l of lecturas(); track l.id) {
                <tr class="row">
                  <td class="td">{{ l.fecha | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                  <td class="td">{{ l.humedad }}</td>
                  <td class="td">{{ l.temperatura }}</td>
                  <td class="td">{{ l.humedad_aire ?? '—' }}</td>
                  <td class="td">
                    @if (l.ph !== null) {
                      <span class="ph-pill" [style.background]="phColor(l.ph)">{{ l.ph | number:'1.0-3' }}</span>
                    } @else { — }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="td text-center py-10 text-[var(--texto-suave)]">No hay lecturas registradas todavía. Conecta un Arduino desde la sección «Dispositivos».</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .th { padding:.9rem 1rem; font-weight:600; font-family:'Poppins',sans-serif; }
    .td { padding:.8rem 1rem; border-bottom:1px solid var(--borde); }
    .row { transition:background .2s; }
    .row:hover { background:var(--verde-soft); }
    .ph-pill { display:inline-block; padding:.15rem .6rem; border-radius:999px; color:#fff; font-weight:600; font-size:.78rem; }
  `],
})
export class DatosComponent {
  private state = inject(AppState);
  private fincaService = inject(FincaService);
  private notify = inject(NotifyService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  lecturas = signal<Lectura[]>([]);
  descargando = signal(false);

  readonly metricas = computed(() => [
    { icono: 'drop', label: 'Humedad prom.', valor: this.prom('humedad') + '%', color: '#1976d2' },
    { icono: 'thermo', label: 'Temp. prom.', valor: this.prom('temperatura') + '°C', color: '#e53935' },
    { icono: 'ph', label: 'pH promedio', valor: this.prom('ph'), color: '#2e7d32' },
  ]);

  constructor() {
    // Recarga las lecturas cada vez que cambia la finca activa,
    // así la tabla siempre muestra los datos de la finca seleccionada.
    effect(() => {
      const finca = this.state.fincaActiva();
      if (!this.esNavegador || !finca) { this.lecturas.set([]); return; }
      this.fincaService.datos(finca.id).subscribe((d) => this.lecturas.set(d));
    });
  }

  private prom(k: 'humedad' | 'temperatura' | 'ph'): string {
    // Las lecturas "sin dato" (null) no cuentan: un 0 falso bajaría el promedio.
    const valores = this.lecturas().map((l) => l[k]).filter((v): v is number => v !== null && v !== undefined);
    if (!valores.length) return '—';
    const v = valores.reduce((s, x) => s + x, 0) / valores.length;
    return v.toFixed(1);
  }

  phColor(ph: number): string {
    if (ph < 5) return '#e53935';
    if (ph < 5.5) return '#fb8c00';
    if (ph <= 6.5) return '#2e7d32';
    return '#1976d2';
  }

  async descargar() {
    const lecturas = this.lecturas();
    if (!lecturas.length) {
      this.notify.advertencia('No hay lecturas para exportar.');
      return;
    }
    const finca = this.state.fincaActiva();
    this.descargando.set(true);
    try {
      await descargarTablaPdf({
        titulo: 'Información de los sensores',
        subtitulo: finca ? `Finca: ${finca.nombre} — ${finca.ubicacion}` : undefined,
        columnas: ['Fecha', 'Humedad (%)', 'Temperatura (°C)', 'Humedad aire (%)', 'pH'],
        pesos: [2, 1, 1.2, 1.2, 0.8],
        filas: lecturas.map((l) => [
          fmtFechaHora(l.fecha),
          fmtNum(l.humedad),
          fmtNum(l.temperatura),
          fmtNum(l.humedad_aire),
          fmtNum(l.ph, 3),
        ]),
        archivo: `datos_${finca?.nombre ?? 'finca'}`,
      });
      this.notify.exito('PDF descargado.');
    } catch {
      this.notify.error('No se pudo generar el PDF.');
    } finally {
      this.descargando.set(false);
    }
  }
}
