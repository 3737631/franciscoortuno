/**
 * main.js — Punto de entrada
 * Inicializa scroll-sequence y el loop de render.
 */

import './style.css'
import { config } from './config.js'
import * as seq from './scroll-sequence.js'
import * as heroText from './hero-text.js'

// Pasar accentColor al CSS
document.documentElement.style.setProperty('--accent', config.accentColor)

async function boot() {
  await seq.ready       // esperar precarga de frames
  seq.init()            // configurar scroll track, canvas, listeners
  heroText.init()

  function loop() {
    seq.render()
    heroText.render(seq.getProgress ? seq.getProgress() : 0)
    requestAnimationFrame(loop)
  }
  loop()
}

boot()

// Helper por si hero-text necesita el progreso exacto
// (se podría reemplazar por un observable, pero así es más simple)
