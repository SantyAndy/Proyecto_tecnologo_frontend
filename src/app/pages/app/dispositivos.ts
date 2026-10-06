import { DatePipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, PLATFORM_ID, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppState } from '../../core/app-state';
import { ConfigSketch, esIpValida, generarSketch } from '../../core/arduino-sketch';
import { DispositivoService } from '../../core/dispositivo.service';
import { Dispositivo, InfoConexion } from '../../core/models';
import { NotifyService } from '../../core/notify.service';
import { RevealDirective } from '../../core/reveal.directive';
import { IconComponent } from '../../shared/icon';

/** Datos de red del formulario del código (la contraseña del WiFi nunca sale del navegador). */
interface ConfigRed {
  wifiSsid: string;
  wifiPassword: string;
  servidor: string;
  puerto: number;
  usarIpFija: boolean;
  ipFija: string;
  gateway: string;
  mascara: string;
}

const CLAVE_RED_GUARDADA = 'arduino-red';

@Component({
  selector: 'app-dispositivos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, FormsModule, IconComponent, RevealDirective],
  template: `
    <section class="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div class="text-center mb-8 anim-fade-up">
        <h1 appReveal class="section-title text-center font-display font-extrabold text-xl sm:text-2xl md:text-3xl leading-tight text-[var(--verde-primary)] mx-auto block w-fit">Mis dispositivos Arduino</h1>
        <p class="text-[var(--texto-suave)] text-[13px] sm:text-sm leading-relaxed mt-3 max-w-2xl mx-auto px-2">
          Registra los Arduinos de tus fincas, genera el código listo para cargarlos y revisa si están enviando datos.
        </p>
      </div>

      <!-- Pasos -->
      <div class="grid sm:grid-cols-3 gap-4 mb-8">
        @for (p of pasos; track p.n) {
          <div appReveal class="card p-4 flex gap-3 items-start">
            <span class="paso-num">{{ p.n }}</span>
            <div>
              <div class="font-semibold text-sm">{{ p.titulo }}</div>
              <div class="text-xs text-[var(--texto-suave)] mt-0.5 leading-relaxed">{{ p.texto }}</div>
            </div>
          </div>
        }
      </div>

      <!-- Registrar -->
      <div appReveal class="card p-5 mb-8">
        <h2 class="font-display font-bold text-lg text-[var(--verde-primary)] mb-3 flex items-center gap-2"><app-icon name="plus" [size]="20" /> Registrar un dispositivo</h2>
        @if (state.fincas().length === 0) {
          <p class="text-sm text-[var(--texto-suave)]">Primero crea una finca con el botón «Cambiar finca» del menú.</p>
        } @else {
          <div class="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
            <input class="field" [(ngModel)]="nuevoNombre" placeholder="Nombre (ej. Sensor lote 1)" maxlength="100" />
            <select class="field" [(ngModel)]="nuevaFinca">
              @for (f of state.fincas(); track f.id) { <option [ngValue]="f.id">{{ f.nombre }}</option> }
            </select>
            <button class="btn btn-primary" (click)="crear()" [disabled]="creando() || !nuevaFinca">
              <app-icon name="chip" [size]="18" /> {{ creando() ? 'Registrando…' : 'Registrar' }}
            </button>
          </div>
        }
      </div>

      <!-- Lista -->
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-display font-bold text-lg text-[var(--verde-primary)]">Dispositivos registrados</h2>
        <button class="btn btn-outline !py-1.5 !px-4 text-sm" (click)="cargar()"><app-icon name="clock" [size]="16" /> Actualizar</button>
      </div>

      @if (cargando() && dispositivos().length === 0) {
        <div class="card p-8 text-center text-[var(--texto-suave)]">Cargando…</div>
      }
      @if (!cargando() && dispositivos().length === 0) {
        <div class="card p-8 text-center text-[var(--texto-suave)]">Todavía no tienes dispositivos. Registra el primero arriba.</div>
      }

      <div class="grid md:grid-cols-2 gap-4">
        @for (d of dispositivos(); track d.id) {
          <article class="card p-5 dispositivo" [class.sel]="seleccionado()?.id === d.id">
            <header class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                @if (editando() === d.id) {
                  <div class="flex gap-2">
                    <input class="field !py-1.5" [(ngModel)]="nombreEditado" maxlength="100" (keyup.enter)="guardarNombre(d)" />
                    <button class="btn btn-primary !py-1.5 !px-3" (click)="guardarNombre(d)" title="Guardar"><app-icon name="save" [size]="16" /></button>
                  </div>
                } @else {
                  <h3 class="font-display font-bold text-base truncate flex items-center gap-2">
                    {{ d.nombre || 'Arduino ' + d.id }}
                    <button class="icon-btn" (click)="editar(d)" title="Cambiar nombre"><app-icon name="edit" [size]="14" /></button>
                  </h3>
                }
                <div class="text-xs text-[var(--texto-suave)]">ID {{ d.id }} · Finca {{ d.finca_nombre }}</div>
              </div>
              <span class="estado" [class.on]="d.en_linea" [class.nunca]="!d.ultima_lectura">
                <span class="punto"></span>
                {{ d.en_linea ? 'En línea' : (d.ultima_lectura ? 'Sin conexión' : 'Sin datos aún') }}
              </span>
            </header>

            @if (d.ultima_lectura; as l) {
              <div class="grid grid-cols-4 gap-2 mt-4 text-center">
                <div class="mini"><span>pH</span><b>{{ l.ph !== null ? (l.ph | number:'1.0-2') : '—' }}</b></div>
                <div class="mini"><span>Suelo</span><b>{{ l.humedad !== null ? (l.humedad | number:'1.0-1') + '%' : '—' }}</b></div>
                <div class="mini"><span>Temp.</span><b>{{ l.temperatura !== null ? (l.temperatura | number:'1.0-1') + '°' : '—' }}</b></div>
                <div class="mini"><span>Aire</span><b>{{ l.humedad_aire != null ? (l.humedad_aire | number:'1.0-0') + '%' : '—' }}</b></div>
              </div>
              <div class="text-xs text-[var(--texto-suave)] mt-2">Última lectura: {{ l.fecha | date:'yyyy-MM-dd HH:mm:ss' }} · {{ d.total_lecturas }} en total</div>
            } @else {
              <p class="text-xs text-[var(--texto-suave)] mt-4">Este dispositivo todavía no ha enviado lecturas. Genera su código y cárgalo en el Arduino.</p>
            }

            <div class="clave mt-4">
              <span class="text-[11px] font-semibold text-[var(--texto-suave)] uppercase tracking-wide">Clave (X-Arduino-Key)</span>
              <div class="flex items-center gap-2 mt-1">
                <code class="flex-1 truncate">{{ claveVisible() === d.id ? d.clave : '••••••••••••••••••••••••' }}</code>
                <button class="icon-btn" (click)="claveVisible.set(claveVisible() === d.id ? null : d.id)" [title]="claveVisible() === d.id ? 'Ocultar' : 'Mostrar'">
                  <app-icon [name]="claveVisible() === d.id ? 'eye-off' : 'eye'" [size]="16" />
                </button>
                <button class="icon-btn" (click)="copiar(d.clave, 'Clave copiada.')" title="Copiar"><app-icon name="copy" [size]="16" /></button>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 mt-4">
              <button class="btn btn-primary !py-2 !px-4 text-sm flex-1" (click)="seleccionar(d)"><app-icon name="tools" [size]="16" /> Código Arduino</button>
              <button class="btn btn-outline !py-2 !px-4 text-sm" (click)="regenerar(d)" title="Crear una clave nueva"><app-icon name="lock" [size]="16" /> Nueva clave</button>
              <button class="btn btn-danger !py-2 !px-3 text-sm" (click)="eliminar(d)" title="Eliminar"><app-icon name="trash" [size]="16" /></button>
            </div>
          </article>
        }
      </div>

      <!-- Generador de código -->
      @if (seleccionado(); as d) {
        <div id="generador" class="card p-5 mt-8 anim-fade-up">
          <div class="flex items-center justify-between gap-3 mb-4">
            <h2 class="font-display font-bold text-lg text-[var(--verde-primary)] flex items-center gap-2">
              <app-icon name="tools" [size]="20" /> Código para «{{ d.nombre || 'Arduino ' + d.id }}»
            </h2>
            <button class="text-[var(--rojo)]" (click)="seleccionado.set(null)" title="Cerrar"><app-icon name="close" [size]="22" /></button>
          </div>

          <div class="grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-6">
            <div class="space-y-3">
              <div>
                <label class="lbl">Nombre de la red WiFi</label>
                <input class="field" [ngModel]="red().wifiSsid" (ngModelChange)="cambiar('wifiSsid', $event)" placeholder="Ej. Daniel :)" />
              </div>
              <div>
                <label class="lbl">Contraseña del WiFi</label>
                <div class="relative">
                  <input class="field !pr-11" [type]="verPass() ? 'text' : 'password'" [ngModel]="red().wifiPassword" (ngModelChange)="cambiar('wifiPassword', $event)" autocomplete="off" />
                  <button class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--texto-suave)]" (click)="verPass.update(v => !v)" type="button"><app-icon [name]="verPass() ? 'eye-off' : 'eye'" [size]="18" /></button>
                </div>
                <p class="ayuda">Solo se usa para armar el código en tu navegador; no se envía ni se guarda en el servidor.</p>
              </div>
              <div class="grid grid-cols-[1fr_115px] gap-2">
                <div>
                  <label class="lbl">IP del servidor (este computador)</label>
                  <input class="field" [ngModel]="red().servidor" (ngModelChange)="cambiar('servidor', $event)" list="ips-servidor" placeholder="Ej. 172.20.10.6" />
                  <datalist id="ips-servidor">
                    @for (ip of conexion()?.ips ?? []; track ip) { <option [value]="ip"></option> }
                  </datalist>
                </div>
                <div>
                  <label class="lbl">Puerto</label>
                  <input class="field" type="number" [ngModel]="red().puerto" (ngModelChange)="cambiar('puerto', +$event)" />
                </div>
              </div>
              @if (conexion()?.ips?.length) {
                <p class="ayuda">IPs detectadas en este computador: {{ conexion()!.ips.join(', ') }}. Usa la de la misma red WiFi del Arduino.</p>
              }

              <p class="ayuda">Los sensores (DHT11, humedad del suelo y pH) se detectan solos: el Arduino solo envía los que estén conectados.</p>

              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" [ngModel]="red().usarIpFija" (ngModelChange)="cambiar('usarIpFija', $event)" />
                Usar IP fija en el Arduino (opcional)
              </label>
              @if (red().usarIpFija) {
                <div class="grid grid-cols-3 gap-2">
                  <div><label class="lbl">IP Arduino</label><input class="field" [ngModel]="red().ipFija" (ngModelChange)="cambiar('ipFija', $event)" placeholder="172.20.10.10" /></div>
                  <div><label class="lbl">Gateway</label><input class="field" [ngModel]="red().gateway" (ngModelChange)="cambiar('gateway', $event)" placeholder="172.20.10.1" /></div>
                  <div><label class="lbl">Máscara</label><input class="field" [ngModel]="red().mascara" (ngModelChange)="cambiar('mascara', $event)" placeholder="255.255.255.240" /></div>
                </div>
              }

              @if (errores().length) {
                <ul class="errores">
                  @for (e of errores(); track e) { <li><app-icon name="alert" [size]="14" /> {{ e }}</li> }
                </ul>
              }

              <div class="flex gap-2 pt-1">
                <button class="btn btn-primary flex-1" (click)="copiar(codigo(), 'Código copiado. Pégalo en el Arduino IDE.')" [disabled]="errores().length > 0"><app-icon name="copy" [size]="18" /> Copiar</button>
                <button class="btn btn-danger flex-1" (click)="descargar()" [disabled]="errores().length > 0"><app-icon name="download" [size]="18" /> Descargar .ino</button>
              </div>
            </div>

            <pre class="codigo">{{ codigo() }}</pre>
          </div>

          <details class="mt-5 ayuda-box">
            <summary class="font-semibold cursor-pointer">¿El Arduino no envía datos? Revisa esto</summary>
            <ul class="mt-2 space-y-1.5 text-sm text-[var(--texto-suave)] list-disc pl-5">
              <li>Django debe correr con <code>python manage.py runserver 0.0.0.0:{{ red().puerto }}</code>. Con <code>runserver</code> a secas solo responde al propio computador.</li>
              <li>El computador y el Arduino deben estar en la <b>misma red WiFi</b> (por ejemplo, el mismo punto de acceso del celular).</li>
              <li>El Firewall de Windows debe permitir conexiones entrantes al puerto {{ red().puerto }} (Python).</li>
              <li>Si el Monitor Serie muestra <b>403</b>, el ID o la clave no coinciden: vuelve a copiar el código desde aquí.</li>
              <li>Si muestra un número negativo, el Arduino no llega al servidor: revisa la IP del servidor.</li>
              <li>Abre el Monitor Serie a <b>115200</b> baudios para ver cada envío y la respuesta del servidor.</li>
            </ul>
          </details>
        </div>
      }
    </section>
  `,
  styles: [`
    .paso-num { display:grid; place-items:center; flex-shrink:0; width:30px; height:30px; border-radius:50%; background:var(--verde-primary); color:#fff; font-weight:700; font-size:.85rem; }
    .dispositivo { transition:border-color .2s, box-shadow .2s; }
    .dispositivo.sel { border-color:var(--verde-primary); box-shadow:0 0 0 2px var(--verde-soft); }
    .estado { display:inline-flex; align-items:center; gap:.4rem; flex-shrink:0; padding:.25rem .65rem; border-radius:999px; font-size:.72rem; font-weight:600; background:#fdecea; color:#c62828; }
    .estado .punto { width:8px; height:8px; border-radius:50%; background:currentColor; }
    .estado.on { background:var(--verde-soft); color:var(--verde-primary-dark); }
    .estado.on .punto { animation:pulso 1.6s infinite; }
    .estado.nunca { background:#f1f3f1; color:var(--texto-suave); }
    @keyframes pulso { 0%,100% { opacity:1; } 50% { opacity:.3; } }
    .mini { background:var(--verde-soft); border-radius:.7rem; padding:.45rem .25rem; display:flex; flex-direction:column; }
    .mini span { font-size:.65rem; color:var(--texto-suave); }
    .mini b { font-size:.9rem; color:var(--verde-primary-dark); }
    .clave { background:#f7faf7; border:1px dashed var(--borde); border-radius:.8rem; padding:.6rem .8rem; }
    .clave code { font-size:.78rem; color:var(--texto); }
    .icon-btn { display:inline-grid; place-items:center; width:28px; height:28px; border-radius:8px; color:var(--verde-primary); background:transparent; border:none; cursor:pointer; flex-shrink:0; }
    .icon-btn:hover { background:var(--verde-soft); }
    .lbl { display:block; font-size:.75rem; font-weight:600; color:var(--texto-suave); margin-bottom:.25rem; }
    .ayuda { font-size:.72rem; color:var(--texto-suave); margin-top:.3rem; line-height:1.4; }
    .errores { background:#fdecea; color:#b71c1c; border-radius:.7rem; padding:.6rem .8rem; font-size:.8rem; }
    .errores li { display:flex; align-items:center; gap:.4rem; }
    .codigo { background:#0f1f15; color:#d6f5dc; border-radius:.9rem; padding:1rem; font-size:.72rem; line-height:1.5; max-height:560px; overflow:auto; white-space:pre; }
    .ayuda-box { background:var(--verde-soft); border-radius:.9rem; padding:.8rem 1rem; }
    .ayuda-box code { background:#fff; padding:0 .3rem; border-radius:.3rem; font-size:.8rem; }
  `],
})
export class DispositivosComponent {
  state = inject(AppState);
  private servicio = inject(DispositivoService);
  private notify = inject(NotifyService);
  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  readonly pasos = [
    { n: 1, titulo: 'Registra el Arduino', texto: 'Ponle un nombre y elige la finca donde estará instalado.' },
    { n: 2, titulo: 'Genera su código', texto: 'Escribe tu red WiFi y la IP del servidor; copia o descarga el .ino.' },
    { n: 3, titulo: 'Cárgalo y verifica', texto: 'Súbelo con el Arduino IDE; el estado cambiará a «En línea».' },
  ];

  dispositivos = signal<Dispositivo[]>([]);
  conexion = signal<InfoConexion | null>(null);
  cargando = signal(false);
  creando = signal(false);
  seleccionado = signal<Dispositivo | null>(null);
  claveVisible = signal<number | null>(null);
  editando = signal<number | null>(null);
  verPass = signal(false);

  nuevoNombre = '';
  nuevaFinca: number | null = null;
  nombreEditado = '';

  red = signal<ConfigRed>({
    wifiSsid: '', wifiPassword: '', servidor: '', puerto: 8000,
    usarIpFija: false, ipFija: '', gateway: '', mascara: '255.255.255.0',
  });

  readonly errores = computed(() => {
    const r = this.red();
    const e: string[] = [];
    if (!r.wifiSsid.trim()) e.push('Escribe el nombre de la red WiFi.');
    if (!esIpValida(r.servidor)) e.push('Escribe una IP de servidor válida (ej. 172.20.10.6).');
    else if (r.servidor.startsWith('127.')) e.push('127.0.0.1 es el propio Arduino: usa la IP del computador en la red WiFi.');
    if (!(r.puerto > 0 && r.puerto < 65536)) e.push('El puerto no es válido.');
    if (r.usarIpFija && (!esIpValida(r.ipFija) || !esIpValida(r.gateway) || !esIpValida(r.mascara))) {
      e.push('Completa la IP fija, el gateway y la máscara con IPs válidas.');
    }
    return e;
  });

  readonly codigo = computed(() => {
    const d = this.seleccionado();
    if (!d) return '';
    const r = this.red();
    const cfg: ConfigSketch = {
      ...r,
      nombreDispositivo: d.nombre,
      nombreFinca: d.finca_nombre,
      arduinoId: d.id,
      clave: d.clave,
      ruta: this.conexion()?.ruta ?? '/api/ingesta/',
    };
    return generarSketch(cfg);
  });

  constructor() {
    if (!this.esNavegador) return;

    this.restaurarRed();
    this.cargar();
    this.servicio.conexion().subscribe({
      next: (c) => {
        this.conexion.set(c);
        if (!this.red().servidor && c.ips.length) this.cambiar('servidor', c.ips[0]);
      },
      error: () => this.conexion.set(null),
    });

    // Preselecciona la finca activa en el formulario de registro.
    effect(() => {
      const activa = this.state.fincaActiva();
      if (activa && this.nuevaFinca === null) this.nuevaFinca = activa.id;
    });

    // Refresca el estado (en línea / sin conexión) cada 10 segundos.
    const intervalo = setInterval(() => this.cargar(true), 10000);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalo));
  }

  cargar(silencioso = false) {
    if (!silencioso) this.cargando.set(true);
    this.servicio.listar().subscribe({
      next: (lista) => {
        this.dispositivos.set(lista);
        const sel = this.seleccionado();
        if (sel) this.seleccionado.set(lista.find((d) => d.id === sel.id) ?? null);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        if (!silencioso) this.notify.error('No se pudieron cargar los dispositivos.');
      },
    });
  }

  crear() {
    if (!this.nuevaFinca) return;
    this.creando.set(true);
    this.servicio.crear(this.nuevoNombre.trim(), this.nuevaFinca).subscribe({
      next: (d) => {
        this.creando.set(false);
        this.nuevoNombre = '';
        this.dispositivos.update((l) => [...l, d]);
        this.notify.exito('Ahora genera su código para cargarlo en el Arduino.', 'Dispositivo registrado');
        this.seleccionar(d);
      },
      error: (err) => {
        this.creando.set(false);
        this.notify.error(err?.error?.finca?.[0] ?? err?.error?.detail ?? 'No se pudo registrar el dispositivo.');
      },
    });
  }

  editar(d: Dispositivo) {
    this.editando.set(d.id);
    this.nombreEditado = d.nombre;
  }

  guardarNombre(d: Dispositivo) {
    this.servicio.renombrar(d.id, this.nombreEditado.trim()).subscribe({
      next: (act) => {
        this.editando.set(null);
        this.reemplazar(act);
      },
      error: () => this.notify.error('No se pudo cambiar el nombre.'),
    });
  }

  async regenerar(d: Dispositivo) {
    const ok = await this.notify.confirmar({
      titulo: '¿Crear una clave nueva?',
      mensaje: 'La clave actual dejará de funcionar al instante. Tendrás que volver a cargar el código en el Arduino.',
      confirmar: 'Crear clave nueva',
      peligro: true,
    });
    if (!ok) return;
    this.servicio.regenerarClave(d.id).subscribe({
      next: (act) => {
        this.reemplazar(act);
        this.notify.exito('Vuelve a cargar el código en el Arduino.', 'Clave nueva creada');
      },
      error: () => this.notify.error('No se pudo crear la clave nueva.'),
    });
  }

  async eliminar(d: Dispositivo) {
    const ok = await this.notify.confirmar({
      titulo: '¿Eliminar dispositivo?',
      mensaje: `Se eliminarán «${d.nombre || 'Arduino ' + d.id}» y sus ${d.total_lecturas} lecturas. Esta acción no se puede deshacer.`,
      confirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    this.servicio.eliminar(d.id).subscribe({
      next: () => {
        this.dispositivos.update((l) => l.filter((x) => x.id !== d.id));
        if (this.seleccionado()?.id === d.id) this.seleccionado.set(null);
        this.notify.exito('Dispositivo eliminado.');
      },
      error: () => this.notify.error('No se pudo eliminar el dispositivo.'),
    });
  }

  seleccionar(d: Dispositivo) {
    this.seleccionado.set(d);
    setTimeout(() => document.getElementById('generador')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  cambiar<K extends keyof ConfigRed>(campo: K, valor: ConfigRed[K]) {
    this.red.update((r) => ({ ...r, [campo]: valor }));
    this.guardarRed();
  }

  async copiar(texto: string, mensaje: string) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // navigator.clipboard solo funciona en HTTPS o localhost; respaldo para la red local.
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    this.notify.exito(mensaje);
  }

  descargar() {
    const d = this.seleccionado();
    if (!d) return;
    // El Arduino IDE exige que el .ino esté en una carpeta con su mismo nombre.
    const nombre = `sensor_cafe_${d.id}`;
    const url = URL.createObjectURL(new Blob([this.codigo()], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}.ino`;
    a.click();
    URL.revokeObjectURL(url);
    this.notify.info(`Guárdalo dentro de una carpeta llamada «${nombre}» y ábrelo con el Arduino IDE.`, 'Código descargado');
  }

  private reemplazar(act: Dispositivo) {
    this.dispositivos.update((l) => l.map((x) => (x.id === act.id ? act : x)));
    if (this.seleccionado()?.id === act.id) this.seleccionado.set(act);
  }

  /** Recuerda la red (sin la contraseña del WiFi) para no escribirla cada vez. */
  private guardarRed() {
    const { wifiPassword, ...resto } = this.red();
    try { localStorage.setItem(CLAVE_RED_GUARDADA, JSON.stringify(resto)); } catch { /* sin almacenamiento */ }
  }

  private restaurarRed() {
    try {
      const guardada = JSON.parse(localStorage.getItem(CLAVE_RED_GUARDADA) ?? 'null');
      if (guardada && typeof guardada === 'object') {
        this.red.update((r) => ({ ...r, ...guardada, wifiPassword: '' }));
      }
    } catch { /* sin almacenamiento */ }
  }
}
