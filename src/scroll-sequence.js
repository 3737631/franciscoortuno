/**
 * scroll-sequence.js
 * ===================
 * Lógica de precarga de frames, mapeo scroll → índice y renderizado
 * en canvas 2D.
 *
 * DECISIÓN DE ARQUITECTURA:
 * Usamos Canvas 2D (drawImage) en lugar de un plano de Three.js para
 * los frames porque:
 *   - drawImage() es más rápido y ligero para cambiar imágenes
 *   - No necesitamos materiales, texturas ni render 3D solo para mostrar
 *     imágenes planas
 *   - Reservamos Three.js exclusivamente para el fondo decorativo
 *   - Menor uso de memoria y GPU
 */

// ─── CONFIGURACIÓN ───────────────────────────────────────────────────────────
// CAMBIA AQUÍ el número total de frames si tienes más o menos
const TOTAL_FRAMES = 126

// Padding de ceros (3 = 001, 002, ..., 999). Cambia si tienes 1000+ frames
const PAD = 3

// Factor de altura de la pista de scroll:
//   scrollHeight = viewportHeight * TOTAL_FRAMES * SCROLL_MULTIPLIER
// Un valor de 0.8 significa que cada frame ocupa ~0.8 pantallas de scroll.
// A mayor valor, más scroll necesario para avanzar entre frames (más lento).
const SCROLL_MULTIPLIER = 0.8

// Factor de suavizado (lerp). 0.08 = transición muy suave. 0.15 = más rápida.
const LERP_FACTOR = 0.08
// ─── FIN CONFIGURACIÓN ───────────────────────────────────────────────────────

// Referencias del DOM
const scrollTrack = document.getElementById('scroll-track')
const frameCanvas = document.getElementById('frame-canvas')
const ctx = frameCanvas.getContext('2d')

// Array donde se almacenan las imágenes precargadas
let frames = []
let totalLoaded = 0

// Elementos de loader
const loaderEl = document.getElementById('loader')
const loaderBar = document.getElementById('loaderBar')
const loaderPercent = document.getElementById('loaderPercent')

// Estado del scroll
let targetScroll = 0
let smoothScroll = 0
let currentFrameIndex = -1
let canvasWidth = 0
let canvasHeight = 0

// Promesa que se resuelve cuando todas las imágenes están cargadas
export const ready = new Promise((resolve) => {
  /**
   * Genera las rutas dinámicamente y precarga las imágenes.
   * Las rutas son relativas a /public/frames/ (servido por Vite).
   */
  const base = import.meta.env.BASE_URL || '/'
  const paths = []
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const padded = String(i).padStart(PAD, '0')
    paths.push(`${base}frames/frame_${padded}.png`)
  }

  totalLoaded = 0
  paths.forEach((src, idx) => {
    const img = new Image()
    img.onload = () => {
      totalLoaded++
      const pct = Math.round((totalLoaded / TOTAL_FRAMES) * 100)
      loaderBar.style.width = `${pct}%`
      loaderPercent.textContent = pct

      if (totalLoaded === TOTAL_FRAMES) {
        // Pequeña pausa para que se vea el 100% en el loader
        setTimeout(() => {
          loaderEl.classList.add('hidden')
          resolve()
        }, 400)
      }
    }
    img.onerror = () => {
      // Si una imagen falla, igualmente contamos para no bloquear
      console.warn(`⚠ No se pudo cargar: ${src}`)
      totalLoaded++
      if (totalLoaded === TOTAL_FRAMES) {
        loaderEl.classList.add('hidden')
        resolve()
      }
    }
    img.src = src
    frames[idx] = img
  })
})

/**
 * Inicializa el canvas 2D y establece la altura de la pista de scroll.
 */
export function init() {
  calcularAlturaScroll()
  redimensionarCanvas()
  window.addEventListener('resize', () => {
    redimensionarCanvas()
    calcularAlturaScroll()
  })
  window.addEventListener('scroll', actualizarScrollObjetivo, { passive: true })
}

/**
 * Calcula la altura de la pista de scroll en función del número de frames.
 * La fórmula: viewportHeight * TOTAL_FRAMES * SCROLL_MULTIPLIER
 * Esto hace que cada frame requiera SCROLL_MULTIPLIER * viewportHeight
 * píxeles de scroll para avanzar.
 */
function calcularAlturaScroll() {
  const vh = window.innerHeight
  scrollTrack.style.height = `${vh * TOTAL_FRAMES * SCROLL_MULTIPLIER}px`
}

/**
 * Redimensiona el canvas para que coincida con el viewport,
 * pero manteniendo el aspect ratio de las imágenes real.
 * Usamos la primera imagen cargada como referencia de aspect ratio.
 */
function redimensionarCanvas() {
  const w = window.innerWidth
  const h = window.innerHeight

  frameCanvas.style.width = `${w}px`
  frameCanvas.style.height = `${h}px`

  // El canvas interno tiene la resolución exacta del viewport
  // para que drawImage se vea nítido en pantallas retina.
  canvasWidth = w
  canvasHeight = h
  frameCanvas.width = w
  frameCanvas.height = h
}

/**
 * Actualiza la variable objetivo según la posición del scroll real.
 * Se llama desde el evento scroll con { passive: true }.
 */
function actualizarScrollObjetivo() {
  const rect = scrollTrack.getBoundingClientRect()
  const sectionStart = rect.top + window.scrollY
  const scrollableHeight = scrollTrack.offsetHeight - window.innerHeight

  if (scrollableHeight <= 0) {
    targetScroll = 0
    return
  }

  targetScroll = (window.scrollY - sectionStart) / scrollableHeight
  targetScroll = Math.max(0, Math.min(1, targetScroll))
}

/**
 * Dibuja el frame correspondiente al índice dado.
 * Solo se ejecuta si el índice cambió respecto a la última llamada.
 */
function dibujarFrame(index) {
  if (index === currentFrameIndex) return
  currentFrameIndex = index

  const img = frames[index]
  if (!img || !img.complete) return

  // Limpiar canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // Calcular dimensiones manteniendo aspect ratio
  const imgAspect = img.naturalWidth / img.naturalHeight
  const canvasAspect = canvasWidth / canvasHeight

  let drawW, drawH, offsetX, offsetY

  if (imgAspect > canvasAspect) {
    // Imagen más ancha que el canvas: ajustar por ancho
    drawW = canvasWidth
    drawH = canvasWidth / imgAspect
    offsetX = 0
    offsetY = (canvasHeight - drawH) / 2
  } else {
    // Imagen más alta que el canvas: ajustar por alto
    drawH = canvasHeight
    drawW = canvasHeight * imgAspect
    offsetX = (canvasWidth - drawW) / 2
    offsetY = 0
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
}

/**
 * Render loop: se llama desde requestAnimationFrame.
 * Toma el scroll objetivo, lo suaviza con lerp y dibuja el frame.
 */
export function render() {
  // Suavizado (lerp) entre el scroll real y el scroll suavizado
  smoothScroll += (targetScroll - smoothScroll) * LERP_FACTOR

  // Mapear progreso suavizado a índice de frame
  const frameIndex = Math.min(
    TOTAL_FRAMES - 1,
    Math.max(0, Math.floor(smoothScroll * TOTAL_FRAMES))
  )

  dibujarFrame(frameIndex)

  // Actualizar opacidad de los bloques de texto según scrollProgress
  actualizarTextos(smoothScroll)

  // Ocultar indicador de scroll si ya se avanzó
  const indicator = document.getElementById('scroll-indicator')
  if (indicator) {
    indicator.style.opacity = Math.max(0, 1 - smoothScroll * 5)
    indicator.style.pointerEvents = smoothScroll > 0.2 ? 'none' : 'auto'
  }
}

/**
 * Recorre todos los .text-block y ajusta su opacidad según el rango
 * definido en data-start y data-end.
 *
 * Para añadir o modificar bloques de texto:
 *   1. Ve a index.html y busca los <div class="text-block">
 *   2. Cambia el contenido HTML
 *   3. Ajusta data-start y data-end (valores de 0.0 a 1.0)
 *   4. Opcional: añade estilos en style.css para animaciones extra
 */
function actualizarTextos(progress) {
  document.querySelectorAll('.text-block').forEach((block) => {
    const start = parseFloat(block.dataset.start)
    const end = parseFloat(block.dataset.end)
    const range = end - start

    if (range <= 0) {
      block.style.opacity = progress >= start ? '1' : '0'
      return
    }

    // Fade in en los primeros 10% del rango, fade out en el último 10%
    const entryPoint = 0.1
    const exitPoint = 0.9

    let opacity
    if (progress < start) {
      opacity = 0
    } else if (progress < start + range * entryPoint) {
      // Fade in
      const t = (progress - start) / (range * entryPoint)
      opacity = t
    } else if (progress < start + range * exitPoint) {
      // Plena visibilidad
      opacity = 1
    } else if (progress < end) {
      // Fade out
      const t = (progress - (start + range * exitPoint)) / (range * (1 - exitPoint))
      opacity = 1 - t
    } else {
      opacity = 0
    }

    block.style.opacity = Math.max(0, Math.min(1, opacity))
  })
}
