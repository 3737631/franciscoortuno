/**
 * hero-text.js — Comportamiento del bloque de texto del hero
 * Al empezar el scroll, el texto hace fade out + slide up
 */

const heroText = document.getElementById('heroText')

export function init() {
  // El hero text se controla desde el render loop según scrollProgress
}

export function render(progress) {
  if (!heroText) return
  // En los primeros 0.15 de progreso, el texto se desvanece y sube
  const t = Math.min(1, progress / 0.15)
  heroText.style.opacity = 1 - t
  heroText.style.transform = `translateY(${-t * 40}px)`
}
