import './style.css'
import { config } from './config.js'
import * as seq from './scroll-sequence.js'
import * as heroText from './hero-text.js'

document.documentElement.style.setProperty('--color-accent', config.accentColor)

async function boot() {
  const images = await seq.ready
  seq.init(images)
  seq.startLoop(images)

  function loop() {
    heroText.render(seq.getProgress())
    requestAnimationFrame(loop)
  }
  loop()
}

boot()
