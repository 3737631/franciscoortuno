const heroText = document.getElementById('heroText')

export function render(progress) {
  if (!heroText) return
  const t = Math.min(1, progress / 0.15)
  heroText.style.opacity = 1 - t
  heroText.style.transform = `translateY(${-t * 40}px)`
}
