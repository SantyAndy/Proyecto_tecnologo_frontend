/**
 * Generación de PDFs de tablas con jsPDF (sin dependencias extra).
 * Maneja paginación automática, encabezado de marca y filas alternadas.
 */

export interface TablaPdfOpciones {
  titulo: string;
  subtitulo?: string;
  columnas: string[];
  /** Pesos relativos del ancho de cada columna (por defecto, iguales). */
  pesos?: number[];
  filas: (string | number)[][];
  /** Nombre del archivo a descargar (con o sin .pdf). */
  archivo: string;
}

const VERDE: [number, number, number] = [46, 125, 50]; // --verde-primary

/** Formatea una fecha ISO como `yyyy-MM-dd HH:mm:ss`. */
export function fmtFechaHora(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Formatea un número con `dec` decimales; vacío si es nulo/NaN. */
export function fmtNum(v: number | null | undefined, dec = 1): string {
  if (v === null || v === undefined || isNaN(Number(v))) return '';
  return Number(v).toFixed(dec);
}

export async function descargarTablaPdf(opts: TablaPdfOpciones): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const usableW = pageW - margin * 2;
  const headerH = 22;
  const rowH = 18;

  // Anchos de columna a partir de los pesos.
  const pesos = opts.pesos?.length === opts.columnas.length
    ? opts.pesos
    : opts.columnas.map(() => 1);
  const sumP = pesos.reduce((a, b) => a + b, 0);
  const anchos = pesos.map((p) => (usableW * p) / sumP);

  let y = margin;

  // Título.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...VERDE);
  doc.text(opts.titulo, margin, y + 6);
  y += 26;

  // Subtítulo.
  if (opts.subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(opts.subtitulo, margin, y);
    y += 16;
  }
  // Fecha de generación + total de registros.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generado: ${fmtFechaHora(new Date().toISOString())}  ·  ${opts.filas.length} registro(s)`, margin, y);
  y += 14;

  const dibujarEncabezado = () => {
    doc.setFillColor(...VERDE);
    doc.rect(margin, y, usableW, headerH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    let x = margin;
    opts.columnas.forEach((c, i) => {
      doc.text(c, x + 5, y + headerH - 7);
      x += anchos[i];
    });
    y += headerH;
  };

  const estiloCelda = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
  };

  dibujarEncabezado();
  estiloCelda();

  if (!opts.filas.length) {
    doc.setTextColor(120, 120, 120);
    doc.text('Sin registros.', margin + 5, y + rowH - 6);
  }

  opts.filas.forEach((fila, idx) => {
    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin;
      dibujarEncabezado();
      estiloCelda();
    }
    if (idx % 2 === 1) {
      doc.setFillColor(240, 245, 240);
      doc.rect(margin, y, usableW, rowH, 'F');
    }
    let x = margin;
    fila.forEach((cell, i) => {
      doc.text(String(cell ?? ''), x + 5, y + rowH - 6);
      x += anchos[i];
    });
    doc.setDrawColor(225, 225, 225);
    doc.line(margin, y + rowH, margin + usableW, y + rowH);
    y += rowH;
  });

  // Número de página en el pie.
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${p} de ${total}`, pageW - margin, pageH - 20, { align: 'right' });
  }

  const nombre = opts.archivo.endsWith('.pdf') ? opts.archivo : `${opts.archivo}.pdf`;
  doc.save(nombre);
}
