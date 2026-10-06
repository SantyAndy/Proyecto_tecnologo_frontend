import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppState } from './app-state';

/** Permite el acceso solo a usuarios con is_staff (administradores). */
export const adminGuard: CanActivateFn = async () => {
  const state = inject(AppState);
  const router = inject(Router);
  const usuario = await state.asegurarUsuario();
  if (usuario?.is_staff) return true;
  return router.parseUrl(usuario ? '/app/datos' : '/login');
};
