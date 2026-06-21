/**
 * config.js — ÚNICO archivo de configuración
 * ============================================
 * Cambia aquí textos, colores, rutas y número de frames.
 * No necesitas tocar ningún otro archivo para personalizar.
 */
export const config = {
  // ─── FRAMES ──────────────────────────────────────────────────
  totalFrames: 126,
  framesPath: '/franciscoortuno/frames/',
  framePrefix: 'frame_',
  frameExtension: '.png',
  // Altura de la pista de scroll = viewportHeight * scrollSectionHeightMultiplier
  scrollSectionHeightMultiplier: 20,

  // ─── HERO ────────────────────────────────────────────────────
  hero: {
    eyebrow: 'COLECCIÓN 2025',
    title: ['Nombre del', 'Producto'],
    tagline: 'TAGLINE EDITABLE',
  },

  // ─── COLORES ─────────────────────────────────────────────────
  accentColor: '#b8975a',
  // ─── FIN CONFIGURACIÓN ───────────────────────────────────────
}
