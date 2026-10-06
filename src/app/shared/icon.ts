import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Set de iconos SVG (stroke) usados en toda la app. */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" [attr.stroke-width]="stroke" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true">
      @switch (name) {
        @case ('chart')   { <path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12" y="7" width="3" height="10" rx="1"/><rect x="17" y="13" width="3" height="4" rx="1"/> }
        @case ('sprout')  { <path d="M7 20h10"/><path d="M12 20c0-6 0-8 0-10"/><path d="M12 10C12 6 9 4 4 4c0 5 3 6 8 6Z"/><path d="M12 13c0-3 2-5 6-5 0 4-2 5-6 5Z"/> }
        @case ('recycle') { <path d="M7 19H4.8a2 2 0 0 1-1.7-3l1.3-2.2"/><path d="m9.3 5.4 1.1-1.9a2 2 0 0 1 3.4 0l1.4 2.3"/><path d="M14.7 19H19a2 2 0 0 0 1.7-3l-1-1.7"/><path d="m7 19 2-3.5L5.5 14"/><path d="m17 8-2 3.5 3.5 1"/><path d="m9.3 5.4-3.5 1 1 3.5"/> }
        @case ('flag')    { <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/> }
        @case ('team')    { <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/> }
        @case ('check')   { <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/> }
        @case ('tools')   { <path d="M14.7 6.3a4 4 0 0 0-5.6 5.3L3 18l3 3 6.4-6.1a4 4 0 0 0 5.3-5.6l-2.5 2.5-2.1-.4-.4-2.1z"/> }
        @case ('coffee')  { <path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/> }
        @case ('drop')    { <path d="M12 2.7S6 9.5 6 14a6 6 0 0 0 12 0c0-4.5-6-11.3-6-11.3Z"/> }
        @case ('thermo')  { <path d="M14 14.76V4a2 2 0 1 0-4 0v10.76a4 4 0 1 0 4 0Z"/> }
        @case ('ph')      { <circle cx="12" cy="12" r="9"/><path d="M9 8h2.5a2 2 0 0 1 0 4H9V8Zm0 4v4"/><path d="M15 8v8m-2-4h4"/> }
        @case ('download'){ <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/> }
        @case ('search')  { <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/> }
        @case ('logout')  { <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/> }
        @case ('menu')    { <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/> }
        @case ('close')   { <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/> }
        @case ('user')    { <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/> }
        @case ('userplus'){ <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/> }
        @case ('lock')    { <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/> }
        @case ('mail')    { <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/> }
        @case ('calendar'){ <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/> }
        @case ('pin')     { <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/> }
        @case ('plus')    { <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/> }
        @case ('arrow')   { <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/> }
        @case ('facebook'){ <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/> }
        @case ('x')       { <path d="M4 4l16 16M20 4 4 20"/> }
        @case ('instagram'){ <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4Z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/> }
        @case ('leaf')    { <path d="M11 20A7 7 0 0 1 4 13c0-6 7-11 16-11 0 9-5 16-11 16Z"/><path d="M4 20c4-5 7-7 11-9"/> }
        @case ('rocket')  { <path d="M5 13c-2 1-3 5-3 5s4-1 5-3"/><path d="M12 15l-3-3a16 16 0 0 1 8-9c3 0 5 2 5 5a16 16 0 0 1-9 8Z"/><circle cx="15" cy="9" r="1.5"/> }
        @case ('shield')  { <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/> }
        @case ('eye')     { <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/> }
        @case ('eye-off') { <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.06 6.06A13.5 13.5 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 4.94-1.06"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><line x1="2" y1="2" x2="22" y2="22"/> }
        @case ('home')    { <path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/> }
        @case ('grid')    { <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/> }
        @case ('edit')    { <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/> }
        @case ('trash')   { <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/> }
        @case ('chip')    { <rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/> }
        @case ('box')     { <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/> }
        @case ('clock')   { <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/> }
        @case ('phone')   { <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/> }
        @case ('star')    { <polygon points="12 2 15 9 22 9.3 16.5 14 18.3 21 12 17 5.7 21 7.5 14 2 9.3 9 9"/> }
        @case ('help')    { <circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2.5 2-2.5 3.5"/><line x1="12" y1="17" x2="12" y2="17"/> }
        @case ('dots')    { <circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/> }
        @case ('chevron') { <polyline points="6 9 12 15 18 9"/> }
        @case ('pdf')     { <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8.5 13.5h1a1.2 1.2 0 0 1 0 2.4h-1V13.5Zm0 4.5v-2.1"/><path d="M13 13.5v4.5h1a1.4 1.4 0 0 0 1.4-1.4v-1.7a1.4 1.4 0 0 0-1.4-1.4z"/> }
        @case ('brain')   { <path d="M9.5 3A2.5 2.5 0 0 0 7 5.5 2.5 2.5 0 0 0 4.5 8 2.5 2.5 0 0 0 4 13a2.5 2.5 0 0 0 1 4 2.5 2.5 0 0 0 4 2"/><path d="M14.5 3A2.5 2.5 0 0 1 17 5.5 2.5 2.5 0 0 1 19.5 8 2.5 2.5 0 0 1 20 13a2.5 2.5 0 0 1-1 4 2.5 2.5 0 0 1-4 2"/><line x1="12" y1="4" x2="12" y2="21"/> }
        @case ('camera')  { <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/> }
        @case ('sparkles'){ <path d="M12 3l1.6 4.8L18 9.5l-4.4 1.7L12 16l-1.6-4.8L6 9.5l4.4-1.7z"/><path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/> }
        @case ('upload')  { <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/> }
        @case ('image')   { <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/> }
        @case ('alert')   { <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/> }
        @case ('copy')    { <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/> }
        @case ('save')    { <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/> }
        @default          { <circle cx="12" cy="12" r="9"/> }
      }
    </svg>
  `,
})
export class IconComponent {
  @Input() name = '';
  @Input() size = 24;
  @Input() stroke = 2;
}
