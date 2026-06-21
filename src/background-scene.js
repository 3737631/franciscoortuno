/**
 * background-scene.js
 * ====================
 * Escena de Three.js para el fondo decorativo.
 *
 * Combina dos elementos visuales:
 *   1. Un gradiente animado con ShaderMaterial (cielo cambiante)
 *   2. Un sistema de partículas suaves flotando
 *
 * El resultado es un fondo premium, sutil y no intrusivo,
 * que no compite con el objeto animado en primer plano.
 */

import * as THREE from 'three'

// Configuración de partículas
const PARTICLE_COUNT = 800
const PARTICLE_SPREAD = 40
const PARTICLE_SIZE = 0.08

let scene, camera, renderer
let particleSystem
let uniforms

/**
 * Inicializa la escena de Three.js.
 * @param {HTMLCanvasElement} canvas - El elemento <canvas> del DOM
 */
export function init(canvas) {
  // ─── Escena ─────────────────────────────────────────────────
  scene = new THREE.Scene()

  // ─── Cámara ortográfica (fondo 2D, sin perspectiva) ────────
  const w = window.innerWidth
  const h = window.innerHeight
  camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100)
  camera.position.z = 10

  // ─── Renderer ───────────────────────────────────────────────
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: true,
  })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // ─── Fondo con gradiente animado (ShaderMaterial) ──────────
  uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(w, h) },
  }

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    precision highp float;
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    void main() {
      // Colores base: azul oscuro a púrpura (estilo premium oscuro)
      vec3 colorA = vec3(0.04, 0.04, 0.08);
      vec3 colorB = vec3(0.10, 0.04, 0.18);
      vec3 colorC = vec3(0.02, 0.06, 0.14);

      // Posición centrada
      vec2 pos = vUv - 0.5;

      // Noise pseudo-aleatorio con seno para animación sutil
      float noise = sin(pos.x * 3.0 + pos.y * 2.0 + uTime * 0.15) * 0.5 + 0.5;
      float noise2 = sin(pos.x * 5.0 - pos.y * 4.0 + uTime * 0.1) * 0.5 + 0.5;

      // Mezcla de colores basada en posición + tiempo
      vec3 grad = mix(colorA, colorB, noise);
      grad = mix(grad, colorC, noise2);

      // Vigneta sutil
      float vignette = 1.0 - length(pos) * 0.6;
      grad *= vignette;

      gl_FragColor = vec4(grad, 1.0);
    }
  `

  const bgMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    depthWrite: false,
    depthTest: false,
  })

  const bgGeometry = new THREE.PlaneGeometry(w * 2, h * 2)
  const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial)
  bgMesh.position.z = -5
  scene.add(bgMesh)

  // ─── Partículas ─────────────────────────────────────────────
  const particleGeo = new THREE.BufferGeometry()
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const velocities = []

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * PARTICLE_SPREAD
    positions[i * 3 + 1] = (Math.random() - 0.5) * PARTICLE_SPREAD
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5
    velocities.push({
      x: (Math.random() - 0.5) * 0.01,
      y: (Math.random() - 0.5) * 0.01,
    })
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  const particleMat = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    color: new THREE.Color(0x8888ff),
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  })

  particleSystem = new THREE.Points(particleGeo, particleMat)
  particleSystem.position.z = 0
  particleSystem._velocities = velocities
  scene.add(particleSystem)

  // ─── Resize ─────────────────────────────────────────────────
  window.addEventListener('resize', onResize)
}

function onResize() {
  const w = window.innerWidth
  const h = window.innerHeight

  camera.left = -w / 2
  camera.right = w / 2
  camera.top = h / 2
  camera.bottom = -h / 2
  camera.updateProjectionMatrix()

  renderer.setSize(w, h)

  if (uniforms) {
    uniforms.uResolution.value.set(w, h)
  }
}

/**
 * Renderiza un frame del fondo.
 * @param {number} time - Tiempo en segundos (para animaciones)
 */
export function render(time) {
  if (!renderer) return

  // Actualizar uniformes del shader de fondo
  if (uniforms) {
    uniforms.uTime.value = time
  }

  // Animar partículas
  if (particleSystem) {
    const positions = particleSystem.geometry.attributes.position.array
    const vel = particleSystem._velocities

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] += vel[i].x
      positions[i * 3 + 1] += vel[i].y

      // Reposicionar si se salen de los límites
      if (Math.abs(positions[i * 3]) > PARTICLE_SPREAD / 2) {
        positions[i * 3] = (Math.random() - 0.5) * PARTICLE_SPREAD * 0.5
        vel[i].x = (Math.random() - 0.5) * 0.01
      }
      if (Math.abs(positions[i * 3 + 1]) > PARTICLE_SPREAD / 2) {
        positions[i * 3 + 1] = (Math.random() - 0.5) * PARTICLE_SPREAD * 0.5
        vel[i].y = (Math.random() - 0.5) * 0.01
      }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true
  }

  renderer.render(scene, camera)
}
