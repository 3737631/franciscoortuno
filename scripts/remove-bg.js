/**
 * Script de preprocesado con remoción de fondo por umbral de color
 * Útil si los fondos son claros/blancos (típico en renders de producto)
 *
 * Uso: node scripts/remove-bg.js
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const INPUT_DIR = path.join(PROJECT_ROOT, 'raw_frames')
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'frames')
const TARGET_SIZE = 1600
const TOTAL_FRAMES = 126

// ─── CONFIGURACIÓN DEL UMBRAL DE FONDO ────────────────────────────
// Si el fondo de tus imágenes es blanco o gris claro,
// estos valores controlan qué píxeles se vuelven transparentes:
const BG_THRESHOLD = 200  // Píxeles con R,G,B > este valor → transparentes
const EDGE_FEATHER = 30   // Suavizado en bordes (transición gradual)
// ─────────────────────────────────────────────────────────────────

async function removeBackground(inputBuffer) {
  const { data, info } = await sharp(inputBuffer)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = new Uint8ClampedArray(data.buffer)
  const w = info.width
  const h = info.height
  const output = Buffer.alloc(w * h * 4)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 3
      const r = pixels[idx]
      const g = pixels[idx + 1]
      const b = pixels[idx + 2]
      const oIdx = (y * w + x) * 4

      output[oIdx] = r
      output[oIdx + 1] = g
      output[oIdx + 2] = b

      // Calcular qué tan lejos está del umbral de fondo
      const minChannel = Math.min(r, g, b)
      if (minChannel > BG_THRESHOLD) {
        // Muy probablemente fondo → completamente transparente
        output[oIdx + 3] = 0
      } else if (minChannel > BG_THRESHOLD - EDGE_FEATHER) {
        // Zona de transición → alpha progresivo
        const t = (minChannel - (BG_THRESHOLD - EDGE_FEATHER)) / EDGE_FEATHER
        output[oIdx + 3] = Math.round((1 - t) * 255)
      } else {
        // Objeto → opaco
        output[oIdx + 3] = 255
      }
    }
  }

  return sharp(output, {
    raw: { width: w, height: h, channels: 4 }
  })
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => f.endsWith('.jpg'))
    .sort()
    .slice(0, TOTAL_FRAMES)

  console.log(`✓ Encontrados ${files.length} JPG. Procesando...`)

  for (let i = 0; i < files.length; i++) {
    const idx = i + 1
    const outputName = `frame_${String(idx).padStart(3, '0')}.png`
    const outputPath = path.join(OUTPUT_DIR, outputName)

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
      console.log(`  [${idx}/${TOTAL_FRAMES}] ⏭ Ya existe: ${outputName}`)
      continue
    }

    const inputPath = path.join(INPUT_DIR, files[i])
    console.log(`  [${idx}/${TOTAL_FRAMES}] Procesando: ${files[i]} → ${outputName}`)

    try {
      const inputBuffer = fs.readFileSync(inputPath)

      // Quitar fondo por umbral de color
      const imgNoBg = await removeBackground(inputBuffer)

      // Crear canvas transparente y centrar
      const meta = await imgNoBg.metadata()
      const result = await sharp({
        create: {
          width: TARGET_SIZE,
          height: TARGET_SIZE,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{
          input: await imgNoBg.png().toBuffer(),
          gravity: 'centre'
        }])
        .png({ compressionLevel: 9 })
        .toFile(outputPath)

      const sizeKB = (result.size / 1024).toFixed(1)
      console.log(`    ✓ Guardado (${sizeKB} KB)`)
    } catch (err) {
      console.error(`    ✗ Error: ${err.message}`)
    }
  }

  console.log(`\n✅ ¡Listo! ${TOTAL_FRAMES} frames procesados en: ${OUTPUT_DIR}`)
  console.log(`   Umbral de fondo: RGB > ${BG_THRESHOLD} = transparente`)
  console.log('   Si el resultado no es bueno, ajusta BG_THRESHOLD en el script.')
}

main().catch(console.error)
