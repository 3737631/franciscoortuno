/**
 * scroll-sequence.js — Núcleo genérico de precarga + mapeo scroll → frame + render
 * ==============================================================================
 * No asume NADA sobre el contenido de los frames. Solo carga imágenes,
 * calcula qué frame toca según scrollProgress, y lo dibuja en un canvas 2D.
 *
 * El canvas 2D se eligió sobre Three.js porque:
 *   - drawImage() es más directo y ligero para mostrar imágenes planas
 *   - No hay geometría 3D, iluminación ni materiales que gestionar
 *   - Menor consumo de CPU/GPU, importante en móviles con ~100 frames
 *   - Three.js quedaría reservado para un eventual fondo decorativo
 */

import { config } from './config.js'

// Referencias DOM
const canvas = document.getElementById('frameCanvas')
const ctx = canvas.getContext('2d')
const scrollTrack = document.getElementById('scrollTrack')
const loaderEl = document.getElementById('loader')
const loaderBar = document.getElementById('loaderBar')
const loaderPercent = document.getElementById('loaderPercent')

const TF = config.totalFrames
const padLength = String(TF).length

let frames = []
let loaded = 0
let targetScroll = 0
let smoothScroll = 0
let currentFrameIndex = -1
let canvasW = 0
let canvasH = 0
let frameAspect = 1

// Promesa que se resuelve cuando todas las imágenes están cargadas
export const ready = new Promise((resolve) => {
  const paths = []
  for (let i = 1; i <= TF; i++) {
    const p = String(i).padStart(padLength, '0')
    paths.push(`${config.framesPath}${config.framePrefix}${p}${config.frameExtension}`)
  }

  frames = new Array(TF)
  paths.forEach((src, idx) => {
    const img = new Image()
    img.onload = () => {
      loaded++
      const pct = Math.round((loaded / TF) * 100)
      loaderBar.style.width = `${pct}%`
      loaderPercent.textContent = pct
      if (loaded === TF) {
        frameAspect = img.naturalWidth / img.naturalHeight
        setTimeout(() => { loaderEl.classList.add('hidden'); resolve() }, 400)
      }
    }
    img.onerror = () => {
      loaded++
      if (loaded === TF) { loaderEl.classList.add('hidden'); resolve() }
    }
    img.src = src
    frames[idx] = img
  })
})

export function init() {
  setScrollHeight()
  resizeCanvas()
  window.addEventListener('resize', () => { setScrollHeight(); resizeCanvas() })
  window.addEventListener('scroll', () => {
    const rect = scrollTrack.getBoundingClientRect()
    const start = rect.top + window.scrollY
    const sh = scrollTrack.offsetHeight - window.innerHeight
    targetScroll = sh > 0 ? (window.scrollY - start) / sh : 0
    targetScroll = Math.max(0, Math.min(1, targetScroll))
  }, { passive: true })
}

function setScrollHeight() {
  scrollTrack.style.height = `${window.innerHeight * config.scrollSectionHeightMultiplier}px`
}

function resizeCanvas() {
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  canvasW = w
  canvasH = h
  canvas.width = w
  canvas.height = h
}

function drawFrame(index) {
  if (index === currentFrameIndex) return
  currentFrameIndex = index
  const img = frames[index]
  if (!img) return

  ctx.clearRect(0, 0, canvasW, canvasH)

  const imgAspect = img.naturalWidth / img.naturalHeight
  const canAspect = canvasW / canvasH
  let dw, dh, ox, oy

  if (imgAspect > canAspect) {
    dw = canvasW; dh = canvasW / imgAspect
    ox = 0; oy = (canvasH - dh) / 2
  } else {
    dh = canvasH; dw = canvasH * imgAspect
    ox = (canvasW - dw) / 2; oy = 0
  }
  ctx.drawImage(img, ox, oy, dw, dh)
}

export function getProgress() {
  return smoothScroll
}

export function render() {
  smoothScroll += (targetScroll - smoothScroll) * 0.1
  const fi = Math.min(TF - 1, Math.max(0, Math.floor(smoothScroll * TF)))
  drawFrame(fi)
}
