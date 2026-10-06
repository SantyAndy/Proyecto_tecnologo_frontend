import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  // Zona pública
  {
    path: '',
    loadComponent: () => import('./layout/public-layout').then((m) => m.PublicLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/inicio').then((m) => m.InicioComponent), title: 'Inicio · Agroindustria Cafetera' },
      { path: 'nosotros', loadComponent: () => import('./pages/nosotros').then((m) => m.NosotrosComponent), title: 'Nosotros' },
      { path: 'contactanos', loadComponent: () => import('./pages/contactanos').then((m) => m.ContactanosComponent), title: 'Contáctanos' },
      { path: 'faq', loadComponent: () => import('./pages/faq').then((m) => m.FaqComponent), title: 'Preguntas frecuentes' },
      { path: 'resenas', loadComponent: () => import('./pages/resenas').then((m) => m.ResenasComponent), title: 'Opiniones' },
    ],
  },

  // Autenticación
  { path: 'login', loadComponent: () => import('./pages/auth/login').then((m) => m.LoginComponent), title: 'Iniciar sesión' },
  { path: 'crear-cuenta', loadComponent: () => import('./pages/auth/crear-cuenta').then((m) => m.CrearCuentaComponent), title: 'Crear cuenta' },
  { path: 'recuperar-contrasena', loadComponent: () => import('./pages/auth/recuperar').then((m) => m.RecuperarComponent), title: 'Recuperar contraseña' },
  { path: 'restablecer-contrasena', loadComponent: () => import('./pages/auth/restablecer').then((m) => m.RestablecerComponent), title: 'Restablecer contraseña' },

  // Zona privada (panel)
  {
    path: 'app',
    loadComponent: () => import('./pages/app/app-layout').then((m) => m.AppLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'datos' },
      { path: 'datos', loadComponent: () => import('./pages/app/datos').then((m) => m.DatosComponent), title: 'Datos' },
      { path: 'dispositivos', loadComponent: () => import('./pages/app/dispositivos').then((m) => m.DispositivosComponent), title: 'Dispositivos' },
      { path: 'historial', loadComponent: () => import('./pages/app/historial').then((m) => m.HistorialComponent), title: 'Historial' },
      { path: 'sugerencias', loadComponent: () => import('./pages/app/sugerencias').then((m) => m.SugerenciasComponent), title: 'Sugerencias' },
      { path: 'diagnostico', loadComponent: () => import('./pages/app/diagnostico-ia').then((m) => m.DiagnosticoIaComponent), title: 'Diagnóstico IA' },
      { path: 'resultado', loadComponent: () => import('./pages/app/resultado').then((m) => m.ResultadoComponent), title: 'Resultados' },
    ],
  },

  // Panel de administración (solo staff)
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin-panel').then((m) => m.AdminPanelComponent),
    title: 'Panel de administración',
  },

  { path: '**', redirectTo: '' },
];
