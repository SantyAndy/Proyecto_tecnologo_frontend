import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin.service';
import { DJANGO_ADMIN_URL } from '../../core/api.config';
import { AppState } from '../../core/app-state';
import { NotifyService } from '../../core/notify.service';
import { IconComponent } from '../../shared/icon';

interface Campo {
  name: string;
  label: string;
  tipo: 'text' | 'number' | 'textarea' | 'select' | 'checkbox' | 'datetime' | 'password' | 'file';
  ref?: string;          // recurso del que se cargan las opciones (FK)
  requerido?: boolean;
}
interface Columna { name: string; label: string; }
interface Recurso {
  key: string;
  label: string;
  icono: string;
  labelField: string;    // campo a mostrar cuando se usa como FK
  columnas: Columna[];
  campos: Campo[];
}

const RECURSOS: Recurso[] = [
  {
    key: 'fincas', label: 'Fincas', icono: 'pin', labelField: 'nombre',
    columnas: [{ name: 'nombre', label: 'Nombre' }, { name: 'ubicacion', label: 'Ubicación' }, { name: 'hectareas', label: 'Hectáreas' }, { name: 'usuario_nombre', label: 'Usuario' }],
    campos: [
      { name: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
      { name: 'ubicacion', label: 'Ubicación', tipo: 'text' },
      { name: 'hectareas', label: 'Hectáreas', tipo: 'number' },
      { name: 'usuario', label: 'Usuario', tipo: 'select', ref: 'usuarios', requerido: true },
    ],
  },
  {
    key: 'arduinos', label: 'Dispositivos', icono: 'chip', labelField: 'nombre',
    columnas: [{ name: 'id', label: 'ID' }, { name: 'nombre', label: 'Nombre' }, { name: 'finca_nombre', label: 'Finca' }, { name: 'clave', label: 'Clave (X-Arduino-Key)' }],
    campos: [
      { name: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
      { name: 'finca', label: 'Finca', tipo: 'select', ref: 'fincas', requerido: true },
    ],
  },
  {
    key: 'datos', label: 'Lecturas', icono: 'chart', labelField: 'id',
    columnas: [{ name: 'fecha', label: 'Fecha' }, { name: 'ph', label: 'pH' }, { name: 'humedad', label: 'Humedad' }, { name: 'temperatura', label: 'Temp.' }, { name: 'arduino_nombre', label: 'Sensor' }],
    campos: [
      { name: 'fecha', label: 'Fecha y hora', tipo: 'datetime', requerido: true },
      { name: 'ph', label: 'pH', tipo: 'number' },
      { name: 'humedad', label: 'Humedad (%)', tipo: 'number' },
      { name: 'temperatura', label: 'Temperatura (°C)', tipo: 'number' },
      { name: 'arduino', label: 'Sensor', tipo: 'select', ref: 'arduinos', requerido: true },
    ],
  },
  {
    key: 'tipo-abonos', label: 'Tipos de abono', icono: 'leaf', labelField: 'nombre',
    columnas: [{ name: 'imagen_actual', label: 'Imagen' }, { name: 'nombre', label: 'Nombre' }],
    campos: [
      { name: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
      { name: 'imagen', label: 'Imagen del abono (opcional)', tipo: 'file' },
    ],
  },
  {
    key: 'abono-imagenes', label: 'Imágenes de abono', icono: 'box', labelField: 'titulo',
    columnas: [{ name: 'url', label: 'Imagen' }, { name: 'tipo_abono_nombre', label: 'Abono' }, { name: 'titulo', label: 'Título' }, { name: 'es_principal', label: 'Principal' }],
    campos: [
      { name: 'tipo_abono', label: 'Abono', tipo: 'select', ref: 'tipo-abonos', requerido: true },
      { name: 'titulo', label: 'Título', tipo: 'text' },
      { name: 'es_principal', label: 'Imagen principal', tipo: 'checkbox' },
      { name: 'imagen', label: 'Archivo de imagen', tipo: 'file', requerido: true },
    ],
  },
  {
    key: 'productos', label: 'Productos', icono: 'box', labelField: 'nombre',
    columnas: [{ name: 'nombre', label: 'Nombre' }, { name: 'tipo_abono_nombre', label: 'Tipo de abono' }],
    campos: [
      { name: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
      { name: 'descripcion', label: 'Descripción', tipo: 'textarea' },
      { name: 'tipo_abono', label: 'Tipo de abono', tipo: 'select', ref: 'tipo-abonos' },
      { name: 'finca', label: 'Finca', tipo: 'select', ref: 'fincas' },
    ],
  },
  {
    key: 'usuarios', label: 'Usuarios', icono: 'user', labelField: 'username',
    columnas: [{ name: 'username', label: 'Usuario' }, { name: 'email', label: 'Email' }, { name: 'is_staff', label: 'Admin' }],
    campos: [
      { name: 'username', label: 'Usuario', tipo: 'text', requerido: true },
      { name: 'email', label: 'Email', tipo: 'text' },
      { name: 'first_name', label: 'Nombre', tipo: 'text' },
      { name: 'last_name', label: 'Apellido', tipo: 'text' },
      { name: 'password', label: 'Contraseña (dejar vacío para no cambiar)', tipo: 'password' },
      { name: 'is_staff', label: 'Es administrador', tipo: 'checkbox' },
      { name: 'is_active', label: 'Activo', tipo: 'checkbox' },
    ],
  },
];

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Topbar -->
      <header class="topbar">
        <div class="flex items-center gap-3">
          <button class="lg:hidden text-white p-1" (click)="sidebarOpen.set(!sidebarOpen())"><app-icon name="menu" [size]="24" /></button>
          <span class="logo-badge"><img src="/img/logo_empresa.png" alt="Logo" /></span>
          <div class="leading-tight">
            <div class="font-display font-bold text-white text-sm">Panel de administración</div>
            <div class="text-[11px] text-white/70">{{ state.usuario()?.email }}</div>
          </div>
        </div>
      </header>

      <div class="flex flex-1">
        <!-- Sidebar -->
        <aside class="sidebar" [class.open]="sidebarOpen()">
          <!-- Administrador (principal) -->
          <button class="side-item princ" (click)="toggleCross('adm')">
            <app-icon name="shield" [size]="20" /> <span class="flex-1 text-left">Administrador</span>
            <app-icon name="chevron" [size]="15" class="chev" [class.rot]="cross()==='adm'" />
          </button>
          @if (cross()==='adm') {
            @for (r of recursos; track r.key) {
              <button class="side-sub" [class.activo]="r.key === activo().key" (click)="seleccionar(r)">{{ r.label }}</button>
            }
          }
          <div class="my-2 border-t border-[var(--borde)]"></div>
          <a routerLink="/app/datos" class="side-item"><app-icon name="chart" [size]="20" /> <span>Panel café</span></a>
          <a routerLink="/app/diagnostico" class="side-item"><app-icon name="brain" [size]="20" /> <span>Diagnóstico IA</span></a>
          <a routerLink="/resenas" class="side-item"><app-icon name="star" [size]="20" /> <span>Reseñas</span></a>
          <a routerLink="/" class="side-item"><app-icon name="home" [size]="20" /> <span>Inicio</span></a>
          @if (state.esSuperusuario()) {
            <a [href]="djangoAdminUrl" target="_blank" rel="noopener" class="side-item django"><app-icon name="shield" [size]="20" /> <span>Entrar a Django</span></a>
          }
          <div class="my-2 border-t border-[var(--borde)]"></div>
          <button class="side-item salir" (click)="salir()"><app-icon name="logout" [size]="20" /> <span>Salir</span></button>
        </aside>

        <!-- Contenido -->
        <main class="flex-1 p-4 sm:p-8 bg-[var(--crema)] min-w-0">
          <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h1 class="font-display font-extrabold text-2xl sm:text-3xl text-[var(--verde-primary)] flex items-center gap-3">
              <app-icon [name]="activo().icono" [size]="26" /> {{ activo().label }}
              <span class="text-sm font-medium text-[var(--texto-suave)]">({{ filasFiltradas().length }}/{{ filas().length }})</span>
            </h1>
            <button (click)="nuevo()" class="btn btn-primary"><app-icon name="plus" [size]="18" /> Nuevo</button>
          </div>

          <!-- Barra de herramientas -->
          <div class="flex flex-wrap items-center gap-3 mb-5">
            <div class="search-box flex-1 min-w-[200px]">
              <app-icon name="search" [size]="18" />
              <input class="search-input" [(ngModel)]="filtro" (ngModelChange)="filtroSig.set($event)" placeholder="Buscar en {{ activo().label.toLowerCase() }}…" />
              @if (filtro) { <button (click)="limpiarBusqueda()" class="text-[var(--texto-suave)]"><app-icon name="close" [size]="16" /></button> }
            </div>
            <button (click)="recargar()" class="btn btn-outline !py-2.5"><app-icon name="recycle" [size]="16" /> Actualizar</button>
            <button (click)="exportarExcel()" class="btn btn-outline !py-2.5"><app-icon name="download" [size]="16" /> Exportar Excel</button>
          </div>

          @if (cargando()) {
            <div class="text-center py-16 text-[var(--texto-suave)]">Cargando…</div>
          } @else {
            <div class="card overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-[var(--verde-primary)] text-white text-left">
                      @for (c of activo().columnas; track c.name) { <th class="th">{{ c.label }}</th> }
                      <th class="th text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (fila of filasFiltradas(); track fila.id) {
                      <tr class="row">
                        @for (c of activo().columnas; track c.name) {
                          <td class="td">
                            @if ((c.name === 'url' || c.name === 'imagen_actual') && fila[c.name]) {
                              <img [src]="fila[c.name]" alt="" class="w-12 h-12 rounded-lg object-cover" />
                            } @else if (c.name === 'url' || c.name === 'imagen_actual') {
                              <span class="text-[var(--texto-suave)]">—</span>
                            } @else {
                              {{ mostrar(fila[c.name]) }}
                            }
                          </td>
                        }
                        <td class="td text-right whitespace-nowrap">
                          <button (click)="editar(fila)" class="ico-btn" title="Editar"><app-icon name="edit" [size]="17" /></button>
                          <button (click)="eliminar(fila)" class="ico-btn !text-[var(--rojo)]" title="Eliminar"><app-icon name="trash" [size]="17" /></button>
                        </td>
                      </tr>
                    } @empty {
                      <tr><td [attr.colspan]="activo().columnas.length + 1" class="td text-center py-10 text-[var(--texto-suave)]">Sin registros.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </main>
      </div>
    </div>

    <!-- Modal formulario -->
    @if (modal()) {
      <div class="fixed inset-0 z-[100] grid place-items-center p-4 anim-fade-in" (click)="modal.set(false)">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div class="relative w-full max-w-lg card p-6 anim-pop max-h-[90vh] overflow-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-display font-bold text-xl text-[var(--verde-primary)]">{{ editando() ? 'Editar' : 'Nuevo' }} — {{ activo().label }}</h3>
            <button (click)="modal.set(false)" class="text-[var(--rojo)]"><app-icon name="close" [size]="22" /></button>
          </div>

          @if (errorModal()) { <p class="text-[var(--rojo)] text-sm mb-3">{{ errorModal() }}</p> }

          <form (ngSubmit)="guardar()" class="space-y-3.5">
            @for (campo of activo().campos; track campo.name) {
              <div>
                <label class="lbl">{{ campo.label }}</label>
                @switch (campo.tipo) {
                  @case ('textarea') {
                    <textarea class="field field-area" [(ngModel)]="form[campo.name]" [name]="campo.name"></textarea>
                  }
                  @case ('select') {
                    <select class="field" [(ngModel)]="form[campo.name]" [name]="campo.name">
                      <option [ngValue]="null">— Selecciona —</option>
                      @for (op of refs()[campo.ref!] || []; track op.id) {
                        <option [ngValue]="op.id">{{ etiquetaRef(campo.ref!, op) }}</option>
                      }
                    </select>
                  }
                  @case ('checkbox') {
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" class="w-5 h-5 accent-[var(--verde-primary)]" [(ngModel)]="form[campo.name]" [name]="campo.name" />
                      <span class="text-sm text-[var(--texto-suave)]">Sí</span>
                    </label>
                  }
                  @case ('number') {
                    <input type="number" step="any" class="field" [(ngModel)]="form[campo.name]" [name]="campo.name" />
                  }
                  @case ('datetime') {
                    <input type="datetime-local" class="field" [(ngModel)]="form[campo.name]" [name]="campo.name" />
                  }
                  @case ('password') {
                    <input type="password" class="field" [(ngModel)]="form[campo.name]" [name]="campo.name" autocomplete="new-password" />
                  }
                  @case ('file') {
                    <input type="file" accept="image/*" class="field !py-2" (change)="onFile($event, campo.name)" />
                    @if (editando()) { <p class="text-xs text-[var(--texto-suave)] mt-1">Deja vacío para mantener la imagen actual.</p> }
                  }
                  @default {
                    <input type="text" class="field" [(ngModel)]="form[campo.name]" [name]="campo.name" />
                  }
                }
              </div>
            }
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="modal.set(false)" class="btn btn-outline flex-1">Cancelar</button>
              <button type="submit" [disabled]="guardando()" class="btn btn-primary flex-1 disabled:opacity-60">{{ guardando() ? 'Guardando…' : 'Guardar' }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .topbar { position:sticky; top:0; z-index:40; display:flex; align-items:center; justify-content:space-between; padding:0 1rem; height:60px; background:linear-gradient(120deg,var(--verde-hero),var(--verde-hero-2)); }
    .logo-badge { display:grid; place-items:center; width:38px; height:38px; border-radius:50%; background:#fff; overflow:hidden; }
    .logo-badge img { width:100%; height:100%; object-fit:cover; }
    .btn-top { display:inline-flex; align-items:center; gap:.4rem; padding:.45rem .9rem; border-radius:999px; font-size:.85rem; font-weight:600; color:#fff; background:rgba(255,255,255,.16); transition:background .2s, transform .2s; }
    .btn-top:hover { transform:translateY(-2px); filter:brightness(1.1); }
    .sidebar { width:230px; flex-shrink:0; background:#fff; border-right:1px solid var(--borde); padding:1rem .75rem; display:flex; flex-direction:column; gap:.25rem; }
    .side-item { display:flex; align-items:center; gap:.7rem; padding:.7rem .9rem; border-radius:.8rem; font-weight:500; color:var(--texto); text-align:left; transition:.2s; }
    .side-item:hover { background:var(--verde-soft); }
    .side-item.active { background:var(--verde-primary); color:#fff; }
    .side-item.princ { font-family:'Poppins',sans-serif; font-weight:700; }
    .side-item.django { color:#0c4b33; font-weight:700; }
    .side-item.django:hover { background:#e6f2ec; }
    .side-item.salir { color:var(--rojo); }
    .side-item.salir:hover { background:#fdecea; }
    .side-sub { display:block; width:100%; text-align:left; padding:.5rem .9rem .5rem 2.7rem; border-radius:.7rem; font-size:.88rem; color:var(--texto-suave); transition:.18s; }
    .side-sub:hover { background:var(--verde-soft); color:var(--texto); }
    .side-sub.activo { background:var(--verde-primary); color:#fff; font-weight:600; }
    .chev { transition:transform .25s; margin-left:auto; }
    .chev.rot { transform:rotate(180deg); }
    .th { padding:.85rem 1rem; font-weight:600; font-family:'Poppins',sans-serif; white-space:nowrap; }
    .td { padding:.7rem 1rem; border-bottom:1px solid var(--borde); }
    .row:hover { background:var(--verde-soft); }
    .ico-btn { padding:.4rem; border-radius:.6rem; color:var(--verde-primary); transition:background .2s; }
    .ico-btn:hover { background:var(--verde-soft); }
    .lbl { display:block; font-size:.82rem; font-weight:500; margin-bottom:.3rem; color:var(--texto); }
    .search-box { display:flex; align-items:center; gap:.5rem; padding:.5rem .9rem; background:#fff; border:1.5px solid var(--borde); border-radius:999px; }
    .search-box app-icon { color:var(--verde-primary); }
    .search-input { flex:1; border:none; outline:none; background:transparent; font-size:.9rem; }
    @media (max-width: 1023px) {
      .sidebar { position:fixed; top:60px; bottom:0; left:0; z-index:30; transform:translateX(-100%); transition:transform .3s; box-shadow:0 10px 40px rgba(0,0,0,.2); }
      .sidebar.open { transform:none; }
    }
  `],
})
export class AdminPanelComponent implements OnInit {
  state = inject(AppState);
  private api = inject(AdminService);
  private router = inject(Router);
  private notify = inject(NotifyService);
  private route = inject(ActivatedRoute);

  readonly recursos = RECURSOS;
  activo = signal<Recurso>(RECURSOS[0]);
  filas = signal<any[]>([]);
  refs = signal<Record<string, any[]>>({});
  cargando = signal(false);
  sidebarOpen = signal(false);

  filtro = '';
  filtroSig = signal('');
  filasFiltradas = computed(() => {
    const q = this.filtroSig().trim().toLowerCase();
    if (!q) return this.filas();
    const cols = this.activo().columnas.map((c) => c.name);
    return this.filas().filter((f) =>
      cols.some((c) => String(f[c] ?? '').toLowerCase().includes(q)));
  });

  modal = signal(false);
  editando = signal<number | null>(null);
  guardando = signal(false);
  errorModal = signal('');
  form: Record<string, any> = {};

  // Menú lateral agrupado (principales desplegables)
  cross = signal<'adm' | null>('adm');
  toggleCross(g: 'adm') { this.cross.update((v) => (v === g ? null : g)); }
  ngOnInit() {
    this.route.queryParamMap.subscribe((p) => {
      const key = p.get('recurso');
      const r = key ? RECURSOS.find((x) => x.key === key) : null;
      if (r && r.key !== this.activo().key) { this.seleccionar(r); return; }
      this.cargar();
    });
  }

  seleccionar(r: Recurso) {
    this.activo.set(r);
    this.sidebarOpen.set(false);
    this.limpiarBusqueda();
    this.cargar();
  }

  limpiarBusqueda() { this.filtro = ''; this.filtroSig.set(''); }
  recargar() { this.refs.set({}); this.cargar(); }

  /** Valor de una celda para Excel (textos limpios, sin '—' ni binarios de imagen). */
  private valorExcel(fila: any, col: string): string {
    const v = fila[col];
    if (v === true) return 'Sí';
    if (v === false) return 'No';
    if (v === null || v === undefined || v === '') return '';
    return String(v);
  }

  /** Exporta el recurso actual a un Excel (.xlsx) con la estética de la página. */
  async exportarExcel() {
    const recurso = this.activo();
    const cols = recurso.columnas;
    const filas = this.filasFiltradas();

    const ExcelMod: any = await import('exceljs');
    const ExcelJS = ExcelMod.default ?? ExcelMod;
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Agroindustria Cafetera';

    const VERDE = 'FF2E7D32', VERDE_SUAVE = 'FFE8F3EA', CEBRA = 'FFF6F8F3', blanco = { argb: 'FFFFFFFF' };
    const bf: any = { style: 'thin', color: { argb: 'FFD7E2D7' } };
    const bordes = { top: bf, left: bf, bottom: bf, right: bf };
    const nCols = cols.length;

    const ws = wb.addWorksheet(recurso.label.slice(0, 28));

    // Título (franja verde, igual que la cabecera de las tablas del front)
    ws.mergeCells(1, 1, 1, nCols);
    const t = ws.getCell(1, 1);
    t.value = `Agroindustria Cafetera — ${recurso.label}`;
    t.font = { size: 15, bold: true, color: blanco };
    t.alignment = { vertical: 'middle', horizontal: 'center' };
    t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
    ws.getRow(1).height = 28;

    // Subtítulo con el conteo y la fecha
    ws.mergeCells(2, 1, 2, nCols);
    const sub = ws.getCell(2, 1);
    sub.value = `${filas.length} registro(s) · exportado ${new Date().toLocaleString('es-CO')}`;
    sub.font = { italic: true, color: { argb: 'FF5B6B61' } };
    sub.alignment = { horizontal: 'center' };

    // Encabezados
    const enc = ws.addRow(cols.map((c) => c.label));
    enc.height = 22;
    enc.eachCell((c: any) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } };
      c.font = { bold: true, color: blanco };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.border = bordes;
    });

    // Filas (con cebra, como el hover/orden de la tabla)
    filas.forEach((f, idx) => {
      const fila = ws.addRow(cols.map((c) => this.valorExcel(f, c.name)));
      fila.eachCell((c: any) => {
        c.border = bordes;
        c.alignment = { horizontal: 'left', vertical: 'middle' };
        if (idx % 2 === 1) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CEBRA } };
      });
    });

    if (!filas.length) {
      const vacio = ws.addRow(['Sin registros.']);
      ws.mergeCells(vacio.number, 1, vacio.number, nCols);
      vacio.getCell(1).alignment = { horizontal: 'center' };
      vacio.getCell(1).font = { italic: true, color: { argb: 'FF5B6B61' } };
    }

    // Ancho de columnas ajustado al contenido
    cols.forEach((c, i) => {
      const maxLen = filas.reduce(
        (m, f) => Math.max(m, this.valorExcel(f, c.name).length), c.label.length);
      ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 2, 12), 42);
    });

    // Fija el título + encabezados al hacer scroll
    ws.views = [{ state: 'frozen', ySplit: 3 }];

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recurso.key}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    this.notify.exito(`Excel descargado (${filas.length} registro(s)).`, 'Exportación lista');
  }

  private cargar() {
    this.cargando.set(true);
    this.api.list(this.activo().key).subscribe({
      next: (data) => { this.filas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
    // Carga opciones de las FK necesarias
    for (const campo of this.activo().campos) {
      if (campo.ref && !this.refs()[campo.ref]) {
        this.api.list(campo.ref).subscribe((data) =>
          this.refs.update((r) => ({ ...r, [campo.ref!]: data })));
      }
    }
  }

  etiquetaRef(ref: string, op: any): string {
    const def = RECURSOS.find((r) => r.key === ref);
    return def ? op[def.labelField] : op.id;
  }

  mostrar(v: any): string {
    if (v === true) return 'Sí';
    if (v === false) return 'No';
    if (v === null || v === undefined) return '—';
    return String(v);
  }

  nuevo() {
    this.editando.set(null);
    this.errorModal.set('');
    const f: Record<string, any> = {};
    for (const c of this.activo().campos) {
      if (c.tipo === 'checkbox') f[c.name] = (c.name === 'is_active' || c.name === 'es_principal');
      else if (c.tipo === 'select' || c.tipo === 'file') f[c.name] = null;
      else f[c.name] = '';
    }
    this.form = f;
    this.modal.set(true);
  }

  onFile(ev: Event, name: string) {
    const input = ev.target as HTMLInputElement;
    this.form[name] = input.files?.[0] ?? null;
  }

  editar(fila: any) {
    this.editando.set(fila.id);
    this.errorModal.set('');
    const f: Record<string, any> = {};
    for (const c of this.activo().campos) {
      if (c.tipo === 'password' || c.tipo === 'file') { f[c.name] = c.tipo === 'file' ? null : ''; continue; }
      if (c.tipo === 'datetime' && fila[c.name]) { f[c.name] = String(fila[c.name]).slice(0, 16); continue; }
      f[c.name] = fila[c.name];
    }
    this.form = f;
    this.modal.set(true);
  }

  guardar() {
    this.guardando.set(true);
    this.errorModal.set('');

    const campos = this.activo().campos;
    const tieneArchivo = campos.some((c) => c.tipo === 'file');
    let payload: any;

    if (tieneArchivo) {
      // Envío multipart (para subir el archivo de imagen al servidor).
      const fd = new FormData();
      for (const c of campos) {
        const v = this.form[c.name];
        if (c.tipo === 'file') {
          if (v instanceof File) fd.append(c.name, v);   // si no hay archivo nuevo, se omite
        } else if (c.tipo === 'checkbox') {
          fd.append(c.name, v ? 'true' : 'false');
        } else if (v !== null && v !== undefined && v !== '') {
          fd.append(c.name, String(v));
        }
      }
      payload = fd;
    } else {
      payload = { ...this.form };
      if ('password' in payload && !payload['password']) delete payload['password'];
    }

    const key = this.activo().key;
    const id = this.editando();
    const obs = id ? this.api.update(key, id, payload) : this.api.create(key, payload);
    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modal.set(false);
        this.refs.set({});
        this.cargar();
        this.notify.exito(id ? 'Cambios guardados correctamente.' : 'Registro creado correctamente.');
      },
      error: (e) => {
        this.guardando.set(false);
        const err = e?.error;
        const msg = typeof err === 'object' && err ? Object.values(err).flat().join(' ') : 'No se pudo guardar. Revisa los datos.';
        this.errorModal.set(msg);
        this.notify.error(msg);
      },
    });
  }

  async eliminar(fila: any) {
    const ok = await this.notify.confirmar({
      titulo: 'Eliminar registro',
      mensaje: `¿Seguro que deseas eliminar este registro de ${this.activo().label}? Esta acción no se puede deshacer.`,
      confirmar: 'Sí, eliminar', peligro: true,
    });
    if (!ok) return;
    this.api.remove(this.activo().key, fila.id).subscribe({
      next: () => { this.cargar(); this.notify.exito('Registro eliminado.'); },
      error: () => this.notify.error('No se pudo eliminar el registro.'),
    });
  }

  readonly djangoAdminUrl = DJANGO_ADMIN_URL;
  salir() { this.state.cerrarSesion(); this.router.navigate(['/']); }
}
