import { AfterViewInit, Directive, ElementRef, inject, Input, numberAttribute, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Aplica la clase .is-visible cuando el elemento entra en el viewport. */
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  @Input({ alias: 'appReveal', transform: numberAttribute }) delay = 0;
  private el = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const node = this.el.nativeElement as HTMLElement;
    node.classList.add('reveal');
    if (this.delay) node.style.transitionDelay = `${this.delay}ms`;

    if (!isPlatformBrowser(this.platformId)) {
      node.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          // Un elemento más alto que la pantalla (ej. la tabla con muchas filas)
          // nunca llega a tener el 15% visible, así que lo revelamos apenas entra.
          const masAltoQuePantalla = e.boundingClientRect.height > window.innerHeight * 0.8;
          if (e.isIntersecting && (e.intersectionRatio >= 0.15 || masAltoQuePantalla)) {
            node.classList.add('is-visible');
            this.observer?.unobserve(node);
          }
        }
      },
      { threshold: [0, 0.15] },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
