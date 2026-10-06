import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppState } from './core/app-state';
import { NotificationsComponent } from './shared/notifications';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NotificationsComponent],
  template: '<router-outlet /><app-notifications />',
})
export class App implements OnInit {
  private state = inject(AppState);
  ngOnInit() {
    // Restaura la sesión si hay un token guardado.
    this.state.restaurarSesion();
  }
}
