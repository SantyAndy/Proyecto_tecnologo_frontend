import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicNavbarComponent } from './public-navbar';
import { SiteFooterComponent } from './site-footer';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, PublicNavbarComponent, SiteFooterComponent],
  template: `
    <app-public-navbar />
    <main class="pt-16 min-h-screen"><router-outlet /></main>
    <app-site-footer />
  `,
})
export class PublicLayoutComponent {}
