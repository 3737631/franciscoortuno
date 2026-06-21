import * as THREE from 'three'
import { config } from './config.js'

const container = document.getElementById('frameContainer')
const scrollTrack = document.getElementById('scrollTrack')
const loaderEl = document.getElementById('loader')
const loaderBar = document.getElementById('loaderBar')
const loaderPct = document.getElementById('loaderPercent')

const TF = config.totalFrames
const pad = String(TF).length

// ── precarga imágenes ──────────────────────────────────────────
export const ready = new Promise(resolve => {
  const base = import.meta.env.BASE_URL || '/'
  const dir = base + config.framesPath
  const imgs = []
  let loaded = 0

  for (let i = 1; i <= TF; i++) {
    const name = config.framePrefix + String(i).padStart(pad, '0') + config.frameExtension
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = img.onerror = () => {
      loaded++
      const pct = Math.round((loaded / TF) * 100)
      loaderBar.style.width = pct + '%'
      loaderPct.textContent = pct
      if (loaded === TF) {
        setTimeout(() => { loaderEl.classList.add('hidden'); resolve(imgs) }, 400)
      }
    }
    img.src = dir + name
    imgs.push(img)
  }
})

// ── Three.js ───────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0xffffff, 1)
container.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
camera.position.z = 1

const geo = new THREE.PlaneGeometry(2, 2)
const tex = new THREE.Texture()
const mat = new THREE.MeshBasicMaterial({ map: tex })
const mesh = new THREE.Mesh(geo, mat)
scene.add(mesh)

let imgAspect = 1

// ── init ────────────────────────────────────────────────────────
export function init(images) {
  if (images[0]) {
    imgAspect = images[0].naturalWidth / images[0].naturalHeight
    tex.image = images[0]
    tex.needsUpdate = true
  }
  setScrollHeight()
  resize()
  window.addEventListener('resize', resize)
  window.addEventListener('scroll', onScroll, { passive: true })
}

// ── scroll track ────────────────────────────────────────────────
function setScrollHeight() {
  scrollTrack.style.height = window.innerHeight * config.scrollSectionHeightMultiplier + 'px'
}

// ── resize ──────────────────────────────────────────────────────
function resize() {
  const w = container.clientWidth
  const h = container.clientHeight
  if (w === 0 || h === 0) return
  renderer.setSize(w, h)

  const ca = w / h
  if (imgAspect > ca) {
    mesh.scale.set(1, ca / imgAspect, 1)
  } else {
    mesh.scale.set(imgAspect / ca, 1, 1)
  }
}

// ── scroll → frame ──────────────────────────────────────────────
let targetScroll = 0
let smoothScroll = 0
let currentIndex = -1
let images

function onScroll() {
  const rect = scrollTrack.getBoundingClientRect()
  const start = rect.top + window.scrollY
  const sh = scrollTrack.offsetHeight - window.innerHeight
  targetScroll = sh > 0 ? (window.scrollY - start) / sh : 0
  targetScroll = Math.max(0, Math.min(1, targetScroll))
}

// ── render loop ─────────────────────────────────────────────────
export function startLoop(imgs) {
  images = imgs
  function loop() {
    smoothScroll += (targetScroll - smoothScroll) * 0.1
    const fi = Math.min(TF - 1, Math.floor(smoothScroll * TF))
    if (fi !== currentIndex) {
      currentIndex = fi
      const img = images[fi]
      if (img && img.complete) {
        tex.image = img
        tex.needsUpdate = true
      }
    }
    renderer.render(scene, camera)
    requestAnimationFrame(loop)
  }
  loop()
}

// ── helpers ─────────────────────────────────────────────────────
export function getProgress() { return smoothScroll }
