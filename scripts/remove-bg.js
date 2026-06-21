/**
 * remove-bg.js — Preprocesamiento batch de frames
 * ================================================
 *
 * Lee JPGs de raw_frames/, los convierte a PNG (1600×1600),
 * aplica remplazo de píxeles cercanos al blanco por alpha,
 * y guarda en public/frames/ con padding dinámico.
 *
 * USO:
 *   node scripts/remove-bg.js
 *
 * REQUISITOS:
 *   npm install sharp
 *
 * ADVERTENCIA:
 *   El reemplazo por umbral de blanco funciona cuando el fondo
 *   original es blanco uniforme. Si la luz de la bombilla aparece
 *   blanca, se borrará parte del objeto. Para casos complejos,
 *   usa remove.bg o Photoshop con máscara.
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const rawDir = path.resolve('raw_frames')
const outDir = path.resolve('public/frames')
const SIZE = 1600

if (!fs.existsSync(rawDir)) {
  console.error('ERROR: No existe raw_frames/. Copia ahí tus JPGs fuente.')
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const files = fs.readdirSync(rawDir)
  .filter(f => /\.jpe?g$/i.test(f))
  .sort()

const total = files.length
const pad = String(total).length

for (let i = 0; i < files.length; i++) {
  const idx = String(i + 1).padStart(pad, '0')
  const outName = `frame_${idx}.png`
  const inp = path.join(rawDir, files[i])
  const out = path.join(outDir, outName)

  // Convierte a PNG con fondo blanco → alpha por umbral RGB > 240
  await sharp(inp)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const pixels = Buffer.alloc(info.width * info.height * 4)
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          const off = (y * info.width + x) * 4
          const r = data[off], g = data[off + 1], b = data[off + 2]
          // Si los tres canales superan 240 → fondo → alpha 0
          if (r > 240 && g > 240 && b > 240) {
            pixels[off] = r; pixels[off + 1] = g; pixels[off + 2] = b; pixels[off + 3] = 0
          } else {
            pixels[off] = r; pixels[off + 1] = g; pixels[off + 2] = b; pixels[off + 3] = data[off + 3]
          }
        }
      }
      return sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png({ compressionLevel: 9, palette: false })
        .toFile(out)
    })

  const pct = Math.round(((i + 1) / total) * 100)
  console.log(`[${pct}%] ${outName}`)
}

console.log(`\n✓ Listo. ${total} frames → ${outDir}`)
