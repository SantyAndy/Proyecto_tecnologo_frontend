// Genera los iconos PWA a partir del logo de la empresa.
// Uso puntual (build-time): `node scripts/generate-pwa-icons.mjs`
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'public', 'img', 'logo_empresa.png');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const BG = { r: 246, g: 248, b: 243, alpha: 1 }; // --crema

for (const size of SIZES) {
  // Icono normal: logo centrado sobre fondo crema, ocupando todo el lienzo.
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(join(outDir, `icon-${size}.png`));
}

// Iconos maskable: el logo ya es un círculo con su propio fondo crema, así que
// lo dejamos ocupar ~92% del lienzo. Con la máscara redonda de Android el
// círculo llena casi todo el área visible (se va el anillo crema sobrante) y
// su borde queda justo dentro del recorte, sin clipping.
for (const size of [192, 512]) {
  const logoSize = Math.round(size * 0.92);
  const pad = Math.round((size - logoSize) / 2);
  const logo = await sharp(src)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logo, top: pad, left: pad }])
    .png()
    .toFile(join(outDir, `icon-maskable-${size}.png`));
}

console.log('Iconos PWA generados en public/icons/');
