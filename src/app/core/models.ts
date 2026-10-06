export interface Lectura {
  id?: number;
  fecha: string;
  humedad: number;
  temperatura: number;
  /** Humedad del aire (%) del sensor DHT11; null si no se midió. */
  humedad_aire?: number | null;
  ph: number;
  dispositivo?: string;
}

/** Arduino registrado en una finca del usuario. */
export interface Dispositivo {
  id: number;
  nombre: string;
  finca: number;
  finca_nombre: string;
  /** Clave secreta que el Arduino envía en la cabecera X-Arduino-Key. */
  clave: string;
  ultima_lectura: Lectura | null;
  /** true si envió datos en el último minuto. */
  en_linea: boolean;
  total_lecturas: number;
}

/** Datos del servidor que necesita el código del Arduino. */
export interface InfoConexion {
  ips: string[];
  puerto: number;
  ruta: string;
}

export interface Finca {
  id: number;
  nombre: string;
  ubicacion: string;
  /** Área de la finca en hectáreas. */
  hectareas?: string | number;
}

export interface Servicio {
  icono: string;
  titulo: string;
  descripcion: string;
}

export interface Ventaja {
  icono: string;
  titulo: string;
  descripcion: string;
}

export interface Temporada {
  clave: 'cosecha' | 'mitaca' | 'florecencia' | 'recuperacion';
  nombre: string;
  imagen: string;
  descripcion: string;
}

export interface AbonoImagen {
  id: number;
  titulo: string;
  url: string | null;
}

export interface AbonoRecomendado {
  nombre: string;
  descripcion: string | null;
  imagenes: AbonoImagen[];
  /** true cuando es una sugerencia general (ninguna regla específica coincidió). */
  es_general?: boolean;
  situacion?: 'normal' | 'extraordinaria';
}

/** Diagnóstico de la IA que se arrastra hacia las sugerencias para combinarlo
 *  con los datos de los sensores y generar una única recomendación. */
export interface DiagnosticoContexto {
  estado: 'alert' | 'healthy' | 'deficiency';
  diagnostico: string;   // ej. "Detección positiva de Roya del Café"
  etiqueta: string;      // detección principal, ej. "Roya"
  /** Clase YOLO (ej. "def_potasio") y confianza visual 0-100, si se conocen. */
  clase?: string | null;
  confianza?: number | null;
}

/** Sugerencia única que une el diagnóstico de la IA con los datos del suelo. */
export interface SugerenciaIntegrada {
  estado: 'alert' | 'healthy' | 'deficiency';
  etiqueta: string;
  titulo_fito: string;
  tratamiento: string;
  abono: string | null;
  texto: string;
}

/** Respuesta del endpoint POST /api/fincas/{id}/sugerencias/ */
export interface ResultadoSugerencia {
  desde: string;
  hasta: string;
  temporada: string;
  lecturas: Lectura[];
  ph_promedio: number;
  humedad_promedio: number;
  temperatura_promedio: number;
  abonos_recomendados: AbonoRecomendado[];
  /** true si lo recomendado es la sugerencia general (sin coincidencia exacta). */
  recomendacion_general?: boolean;
  sugerencia_integrada?: SugerenciaIntegrada | null;
}

export interface Resena {
  id: number;
  nombre: string;
  ciudad: string;
  comentario: string;
  estrellas: number;
  fecha: string;
}

export interface ResumenResenas {
  total: number;
  promedio: number;
  porcentaje: number;
  distribucion: Record<string, number>;
}

// ============================================================
// RECOMENDACIÓN DE FERTILIZACIÓN (motor en dos etapas)
// Estructura tal como la devuelve el backend
// (tablas/motor_recomendacion.py).
// ============================================================

export type NivelConfianza = 'ALTA' | 'MEDIA' | 'BAJA' | 'NO CONCLUYENTE';

export interface ProductoFertilizante {
  id: number;
  nombre: string;
  marca: string;
  imagen: string | null;
  composicion: string;
  tipo: 'edafico' | 'foliar';
  categorias?: string[];
  composicion_confirmada?: boolean;
  etapas?: string[];
  observaciones?: string;
  fuente?: string;
}

export interface ProductoRecomendado {
  producto: ProductoFertilizante;
  compatibilidad: 'alta' | 'media' | 'baja';
  puntuacion: number;
  orden?: number;
  nutrientes_requeridos: string[];
  nutrientes_aportados: string[];
  nutrientes_cubiertos?: string[];
  razones: string[];
  advertencias: string[];
  dosis?: string;
  /** Solo en la recomendación visual preliminar. */
  nutrientes_detectados?: string[];
  tipo_recomendacion?: 'visual_preliminar' | 'apoyo_nutricional_preliminar';
  motivo?: string;
  advertencia?: string;
}

/** Recomendación preliminar basada solo en la deficiencia detectada por YOLO. */
export interface RecomendacionVisual {
  tipo_recomendacion: 'visual_preliminar' | 'apoyo_nutricional_preliminar';
  titulo: string;
  diagnostico_principal: string;
  nutrientes_detectados: { nutriente: string; nombre: string; rol: string; confianza_visual: number | null }[];
  productos: ProductoRecomendado[];
  foliares: ProductoRecomendado[];
  nutrientes_sin_producto: { nutriente: string; nombre: string }[];
  mensaje_sin_producto: string | null;
  advertencia: string;
  recomendacion_validacion: string;
  nota_enfermedad: string | null;
  dosis: string;
}

export interface HipotesisNutricional {
  nutriente: string;
  nombre: string;
  rol: 'primaria' | 'secundaria' | 'laboratorio';
  origen: string;
  estado: 'posible' | 'probable' | 'confirmado' | 'descartado';
  confianza_visual: number | null;
  validacion: string;
}

export interface RecomendacionFertilizacion {
  version: number;
  diagnostico_visual: {
    tipo: string;
    clase: string | null;
    etiqueta: string;
    descripcion: string;
    confianza_visual: number | null;
    nivel_visual: string;
    ambiguo: boolean;
  };
  nivel_confianza: NivelConfianza;
  hipotesis_nutricional: HipotesisNutricional[];
  validacion: {
    ph: number | null;
    ph_origen: string | null;
    humedad_suelo: number | null;
    temperatura: number | null;
    condicion_climatica: string | null;
    informacion_suficiente: boolean;
    resumen: string;
  };
  necesidad_nutricional: { nutriente: string; nombre: string; nivel: string; motivo: string }[];
  contexto: {
    temporada: string;
    etapas_fisiologicas: string[];
    variedad: string | null;
    variedad_nota: string | null;
  };
  decision: 'recomendar' | 'no_recomendar';
  mensaje: string;
  motivos_no_recomendacion: string[];
  recomendacion_validacion: string | null;
  productos_recomendados: ProductoRecomendado[];
  recomendaciones_foliares: ProductoRecomendado[];
  recomendacion_visual?: RecomendacionVisual | null;
  advertencias: string[];
  datos_faltantes: string[];
  dosis: string;
}
