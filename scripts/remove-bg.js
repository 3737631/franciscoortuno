/**
 * Script de preprocesado — conversión simple JPG → PNG
 * Sin remoción de fondo (la bombilla se ve completa con su fondo original)
 *
 * Uso: node scripts/remove-bg.js
 * Requisito: npm install sharp
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

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => f.endsWith('.jpg'))
    .sort()
    .slice(0, TOTAL_FRAMES)

  if (files.length === 0) {
    console.error(`No se encontraron JPG en: ${INPUT_DIR}`)
    process.exit(1)
  }

  console.log(`Encontrados ${files.length} JPG. Procesando...`)

  for (let i = 0; i < files.length; i++) {
    const idx = i + 1
    const outputName = `frame_${String(idx).padStart(3, '0')}.png`
    const outputPath = path.join(OUTPUT_DIR, outputName)

    const inputPath = path.join(INPUT_DIR, files[i])
    console.log(`  [${idx}/${TOTAL_FRAMES}] ${files[i]} -> ${outputName}`)

    try {
      await sharp(inputPath)
        .resize({
          width: TARGET_SIZE,
          height: TARGET_SIZE,
          fit: 'inside',
          withoutEnlargement: true,
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        })
        .flatten({ background: { r: 10, g: 10, b: 20 } })
        .png({ compressionLevel: 9 })
        .toFile(outputPath)
    } catch (err) {
      console.error(`    Error: ${err.message}`)
    }
  }

  console.log(`\nListo! ${TOTAL_FRAMES} PNG en: ${OUTPUT_DIR}`)
}

main().catch(console.error)
