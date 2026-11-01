/**
 * Renders the link-preview images (1200×630) shown when someone shares a Visualout Kids link
 * on WhatsApp, Facebook, X and so on. Run once after changing them: `node scripts/make-og-images.mjs`.
 * The PNGs are committed in public/og/, so the build itself doesn't need these fonts.
 */
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const FONT = `ui-rounded, 'Nunito', 'Arial Rounded MT Bold', 'DejaVu Sans', sans-serif`
const tile = (x, y, size, bg, ink, ch, rotate = 0) => `
  <g transform="rotate(${rotate} ${x + size / 2} ${y + size / 2})">
    <rect x="${x}" y="${y + 10}" width="${size}" height="${size}" rx="${size * 0.28}" fill="#2B2240" opacity="0.08"/>
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.28}" fill="${bg}"/>
    <text x="${x + size / 2}" y="${y + size * 0.73}" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="${size * 0.66}" fill="${ink}">${ch}</text>
  </g>`

function card({ eyebrow, title, subtitle }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#FFF4E6"/>
  <circle cx="1130" cy="70" r="120" fill="#FFC94D" opacity="0.35"/>
  <circle cx="80" cy="600" r="90" fill="#C9F2DF"/>
  ${tile(850, 105, 170, '#FFD8C2', '#8A3412', 'A', -6)}
  ${tile(1035, 160, 135, '#CFE7FF', '#12457A', 'b', 7)}
  ${tile(870, 315, 150, '#C9F2DF', '#0F5C3C', 'C', 5)}
  ${tile(1045, 335, 120, '#E5DBFF', '#4B2A91', 'd', -8)}
  <text x="80" y="150" font-family="${FONT}" font-weight="800" font-size="30" letter-spacing="5" fill="#FF8A6B">${eyebrow}</text>
  ${title.map((line, i) => `<text x="76" y="${245 + i * 78}" font-family="${FONT}" font-weight="800" font-size="66" fill="#2B2240">${line}</text>`).join('')}
  <text x="80" y="${265 + title.length * 78}" font-family="${FONT}" font-size="30" fill="#5B5170">${subtitle}</text>
  <rect x="80" y="520" width="58" height="58" rx="16" fill="#FFD8C2"/>
  <text x="109" y="565" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="40" fill="#8A3412">A</text>
  <text x="156" y="560" font-family="${FONT}" font-weight="800" font-size="32" fill="#2B2240">Visualout Kids</text>
  <text x="440" y="560" font-family="${FONT}" font-size="26" fill="#5B5170">kids.visualout.com</text>
</svg>`
}

const images = {
  'public/og/visualout-kids.png': card({
    eyebrow: 'FREE · NO ADS · OFFLINE',
    title: ['Gentle learning', 'games for toddlers'],
    subtitle: 'Made with care by Visualout',
  }),
  'public/og/my-first-abc.png': card({
    eyebrow: 'AGES 2–3 · FREE · NO ADS',
    title: ['My First ABC'],
    subtitle: 'Hear, find and match all 26 letters',
  }),
}

await mkdir('public/og', { recursive: true })
for (const [file, svg] of Object.entries(images)) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(file)
  console.log('wrote', file)
}
