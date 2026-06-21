/**
 * remove-bg.js — Conversión JPG → PNG (sin eliminación de fondo)
 * ==============================================================
 * Convierte frames JPG a PNG con fondo blanco opaco.
 * El fondo blanco se funde visualmente con el fondo blanco
 * del hero, por lo que no se necesita transparencia real.
 *
 * Para transparencia real con bombilla blanca, usa rembg:
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

if (!fs.existsSync(rawDir)) {
  console.error('Crea raw_frames/ y copia tus JPGs.')
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

  await sharp(inp)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(out)

  const pct = Math.round(((i+1)/total)*100)
  console.log(`[${pct}%] ${outName}`)
}

console.log(`\nListo. ${total} frames en ${outDir}`)
