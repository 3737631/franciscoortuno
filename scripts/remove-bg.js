/**
 * remove-bg.js — Convierte JPG → PNG (sin eliminación de fondo)
 * ==============================================================
 * El fondo blanco de las imágenes se funde con el fondo blanco
 * del hero. La bombilla apagada es invisible (blanco sobre blanco),
 * al encenderse aparece. Efecto visual correcto sin transparencia.
 *
 * Para transparencia REAL (bombilla blanca sobre fondo blanco),
 * necesitas rembg (Python):
 *   pip install rembg
 *   python scripts/remove-bg.py
 *
 * USO:
 *   node scripts/remove-bg.js
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const rawDir = path.resolve('raw_frames')
const outDir = path.resolve('public/frames')
const SIZE = 1600

fs.mkdirSync(outDir, { recursive: true })

const files = fs.readdirSync(rawDir).filter(f => /\.jpe?g$/i.test(f)).sort()
const total = files.length
const pad = String(total).length

for (let i = 0; i < files.length; i++) {
  const idx = String(i + 1).padStart(pad, '0')
  const outName = `frame_${idx}.png`
  await sharp(path.join(rawDir, files[i]))
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, outName))
  const pct = Math.round(((i + 1) / total) * 100)
  console.log(`[${pct}%] ${outName}`)
}
console.log(`\nListo. ${total} frames en ${outDir}`)
