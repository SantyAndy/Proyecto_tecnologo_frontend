import { Servicio, Temporada, Ventaja } from './models';

/** Contenido estático de las páginas públicas (textos del manual de usuario). */

export const SERVICIOS: Servicio[] = [
  { icono: 'chart', titulo: 'Medición de pH', descripcion: 'Medimos y controlamos los niveles de pH del suelo en tus cultivos.' },
  { icono: 'sprout', titulo: 'Recomendaciones', descripcion: 'Guías para ajustar el pH del suelo según los resultados.' },
  { icono: 'eye', titulo: 'Diagnóstico con IA', descripcion: 'Detectamos enfermedades del café, como la roya, a partir de una foto de la hoja usando inteligencia artificial.' },
  { icono: 'recycle', titulo: 'Optimización', descripcion: 'Contribuimos a cosechas saludables y eficientes.' },
];

export const VENTAJAS: Ventaja[] = [
  { icono: 'flag', titulo: 'Empresa colombiana', descripcion: 'Líder en desarrollo de soluciones para manejo del pH del suelo.' },
  { icono: 'team', titulo: 'Equipo profesional', descripcion: 'Asesoramiento técnico y acompañamiento en campo.' },
  { icono: 'check', titulo: 'Mejor calidad', descripcion: 'Aseguramos cosechas saludables y eficaces.' },
  { icono: 'tools', titulo: 'Tecnologías agrícolas', descripcion: 'Equipos eficientes para la medición de pH.' },
];

export const TEMPORADAS: Temporada[] = [
  {
    clave: 'cosecha', nombre: 'Cosecha',
    imagen: '/img/Cosecha.png',
    descripcion: 'La cosecha es la temporada principal del café en Colombia, cuando el grano alcanza su punto óptimo de maduración.',
  },
  {
    clave: 'mitaca', nombre: 'Mitaca',
    imagen: '/img/Mitaca.png',
    descripcion: 'La mitaca es la cosecha secundaria del año; menor en volumen pero clave para mantener la producción.',
  },
  {
    clave: 'florecencia', nombre: 'Floración',
    imagen: '/img/Florecencia.png',
    descripcion: 'En la floración aparecen las flores blancas del cafeto, etapa que determina la futura producción del grano.',
  },
  {
    clave: 'recuperacion', nombre: 'Recuperación',
    imagen: '/img/Recuperacion.png',
    descripcion: 'Etapa de recuperación de la planta tras la cosecha, donde se nutre el suelo para el siguiente ciclo.',
  },
];

export interface Paso { icono: string; titulo: string; texto: string; }
export const PASOS: Paso[] = [
  { icono: 'chip', titulo: '1. El sensor mide', texto: 'El Arduino UNO R4 WiFi con sensores capta el pH, la humedad y la temperatura del suelo en el cultivo.' },
  { icono: 'recycle', titulo: '2. Los datos se envían', texto: 'Las lecturas viajan por WiFi en tiempo real hasta la plataforma, sin intervención manual.' },
  { icono: 'chart', titulo: '3. Tú decides', texto: 'Visualizas datos, historial y recibes sugerencias de abono según la temporada para mejorar tu cosecha.' },
  { icono: 'camera', titulo: '4. Diagnostica con IA', texto: 'Subes o tomas una foto de la hoja y la inteligencia artificial detecta enfermedades como la roya, con su recomendación de tratamiento.' },
];

export interface Testimonio { nombre: string; finca: string; texto: string; }
export const TESTIMONIOS: Testimonio[] = [
  { nombre: 'José Gutiérrez', finca: 'Acevedo, Huila', texto: 'Antes fertilizaba a ojo. Ahora sé exactamente cuándo y con qué abono actuar. Mi cosecha mejoró notablemente.' },
  { nombre: 'María Fernanda Ruiz', finca: 'Pitalito, Huila', texto: 'Ver el pH y la humedad en el celular me ahorra ir al lote a cada rato. Es una herramienta muy práctica.' },
  { nombre: 'Carlos Andrés Peña', finca: 'Garzón, Huila', texto: 'El historial de 30 días me ayuda a entender cómo cambia mi suelo en cada temporada. Lo recomiendo.' },
];

export interface Miembro { nombre: string; rol: string; inicial: string; }
export const EQUIPO: Miembro[] = [
  { nombre: 'Daniel Rojas Arévalo', rol: 'Desarrollador — Backend & Hardware', inicial: 'D' },
  { nombre: 'Santiago Andrés Losada', rol: 'Desarrollador — Frontend & UX', inicial: 'S' },
  { nombre: 'Ing. Mauricio Rodríguez Bravo', rol: 'Tutor del proyecto', inicial: 'M' },
];

export interface Faq { pregunta: string; respuesta: string; }
export const FAQS: Faq[] = [
  { pregunta: '¿Qué mide exactamente el sistema?', respuesta: 'Mide tres variables clave del suelo: nivel de pH (acidez), humedad y temperatura, captadas por sensores conectados a un Arduino UNO R4 WiFi.' },
  { pregunta: '¿Necesito instalar algún programa?', respuesta: 'No. Es una aplicación web: solo necesitas un navegador (Chrome, Firefox, Edge o Safari) y conexión a internet, tanto en computador como en celular.' },
  { pregunta: '¿Cada cuánto se actualizan los datos?', respuesta: 'Las lecturas llegan en tiempo real a medida que el sensor las envía. En la sección Datos verás las más recientes y en Historial los últimos 30 días.' },
  { pregunta: '¿Cómo se generan las sugerencias de abono?', respuesta: 'El sistema calcula los promedios de pH, humedad y temperatura del rango de fechas elegido y, según la temporada del café (cosecha, mitaca, floración o recuperación), recomienda el abono más adecuado.' },
  { pregunta: '¿El sistema detecta enfermedades del café?', respuesta: 'Sí. En la sección Diagnóstico IA puedes subir o tomar una foto de la hoja y un modelo de inteligencia artificial (YOLOv8) identifica enfermedades como la roya, marca las zonas afectadas y te entrega una recomendación de tratamiento.' },
  { pregunta: '¿Mis datos están seguros?', respuesta: 'Sí. El acceso a la zona privada requiere iniciar sesión y cada finca solo es visible para su propietario. Usa una contraseña segura y no la compartas.' },
  { pregunta: '¿Puedo gestionar varias fincas?', respuesta: 'Sí. Al iniciar sesión puedes seleccionar entre tus fincas registradas o crear una nueva, cada una con sus propios sensores y lecturas.' },
];
