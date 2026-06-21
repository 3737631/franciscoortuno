/**
 * main.js
 * =======
 * Punto de entrada de la aplicación.
 * Inicializa el fondo Three.js, la secuencia de frames y arranca
 * el loop principal con requestAnimationFrame.
 */

import * as sequence from './scroll-sequence.js'
import * as background from './background-scene.js'
import './style.css'

// ─── Inicialización ───────────────────────────────────────────────
const bgCanvas = document.getElementById('bg-canvas')

// Iniciar fondo Three.js inmediatamente (no necesita precarga)
background.init(bgCanvas)

// Inicializar la lógica de scroll y frames (altura del track, canvas)
sequence.init()

// ─── Loop principal ───────────────────────────────────────────────
// Usamos un reloj de rendimiento para evitar acumulación de frames
let lastTime = 0

function loop(time) {
  requestAnimationFrame(loop)

  // Convertir a segundos
  const t = time * 0.001

  // Renderizar fondo Three.js
  background.render(t)

  // Renderizar frame actual (canvas 2D)
  sequence.render()
}

// Esperar a que todas las imágenes estén precargadas y arrancar
sequence.ready.then(() => {
  document.body.classList.add('loaded')
  loop(0)
})
