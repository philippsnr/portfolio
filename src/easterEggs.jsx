import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const emit = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }))

// === Achievements ===
export const SECRETS = {
  terminal: 'Found the secret terminal',
  matrix: 'Entered the Matrix',
  goal: 'GOOOAL!',
  snake: 'Played Snake',
  coffee: 'Coffee break',
  selfdestruct: 'Survived the self-destruct',
  bottom: 'Scrolled all the way down',
}
const STORAGE_KEY = 'ps-secrets'

export function foundSecrets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}

export function unlock(id) {
  const found = foundSecrets()
  if (!SECRETS[id] || found.includes(id)) return
  const next = [...found, id]
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  emit('ps-achievement', { id, count: next.length })
}

export function Achievements() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    const onUnlock = (e) => {
      const toast = { ...e.detail, key: `${e.detail.id}-${Date.now()}` }
      setToasts(t => [...t, toast])
      setTimeout(() => setToasts(t => t.filter(x => x.key !== toast.key)), 4200)
    }
    window.addEventListener('ps-achievement', onUnlock)
    return () => window.removeEventListener('ps-achievement', onUnlock)
  }, [])
  return createPortal(
    <div className="achievements" aria-live="polite">
      {toasts.map(t => (
        <div key={t.key} className="achievement">
          <span className="trophy">🏆</span>
          <div>
            <div className="ach-lbl">Achievement unlocked</div>
            <div className="ach-name">{SECRETS[t.id]}</div>
            <div className="ach-count">{t.count}/{Object.keys(SECRETS).length} secrets found</div>
          </div>
        </div>
      ))}
    </div>,
    document.body
  )
}

// === Typed phrase anywhere on the page ===
export function useTypedPhrase(phrase, onMatch) {
  const cb = useRef(onMatch)
  cb.current = onMatch
  useEffect(() => {
    let typed = ''
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.key.length !== 1) return
      typed = (typed + e.key.toLowerCase()).slice(-phrase.length)
      if (typed === phrase) { typed = ''; cb.current() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phrase])
}

// === Matrix mode ===
export const startMatrix = () => emit('ps-matrix')

export function MatrixRain({ duration = 7000 }) {
  const [active, setActive] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    const on = () => { setActive(true); unlock('matrix') }
    window.addEventListener('ps-matrix', on)
    return () => window.removeEventListener('ps-matrix', on)
  }, [])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const size = 16
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF01'
    let w, h, drops, raf
    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      drops = Array.from({ length: Math.ceil(w / size) }, () => Math.random() * -50)
    }
    resize()
    window.addEventListener('resize', resize)
    document.documentElement.classList.add('matrix-mode')
    const accent = cssVar('--accent')
    let last = 0
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 45) return
      last = now
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.fillRect(0, 0, w, h)
      ctx.font = `${size}px 'JetBrains Mono', monospace`
      for (let i = 0; i < drops.length; i++) {
        const y = drops[i] * size
        ctx.fillStyle = Math.random() < 0.05 ? '#fff' : accent
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, y)
        if (y > h && Math.random() > 0.97) drops[i] = 0
        drops[i]++
      }
    }
    raf = requestAnimationFrame(frame)
    const stop = setTimeout(() => setActive(false), reducedMotion() ? 1500 : duration)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(stop)
      window.removeEventListener('resize', resize)
      document.documentElement.classList.remove('matrix-mode')
    }
  }, [active, duration])

  if (!active) return null
  return createPortal(<canvas ref={canvasRef} className="matrix-rain" aria-hidden="true" />, document.body)
}

// === Goal celebration ===
export const celebrateGoal = () => emit('ps-goal')

export function GoalCelebration() {
  const [active, setActive] = useState(false)
  const canvasRef = useRef(null)
  useTypedPhrase('goal', celebrateGoal)

  useEffect(() => {
    const on = () => { setActive(false); requestAnimationFrame(() => setActive(true)); unlock('goal') }
    window.addEventListener('ps-goal', on)
    return () => window.removeEventListener('ps-goal', on)
  }, [])

  useEffect(() => {
    if (!active) return
    const stop = setTimeout(() => setActive(false), 3200)
    const canvas = canvasRef.current
    if (reducedMotion() || !canvas) return () => clearTimeout(stop)
    const ctx = canvas.getContext('2d')
    const w = canvas.width = window.innerWidth
    const h = canvas.height = window.innerHeight
    const colors = [cssVar('--accent'), '#ffffff', cssVar('--muted')]
    // two confetti cannons from the bottom corners
    const parts = Array.from({ length: 220 }, (_, i) => {
      const left = i % 2 === 0
      const angle = (left ? -60 : -120) * Math.PI / 180 + (Math.random() - 0.5) * 0.7
      const speed = 12 + Math.random() * 10
      return {
        x: left ? 0 : w, y: h,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      }
    })
    let raf
    const frame = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of parts) {
        p.vy += 0.28; p.vx *= 0.99
        p.x += p.vx; p.y += p.vy; p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y); ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); clearTimeout(stop) }
  }, [active])

  if (!active) return null
  return createPortal(
    <div className="goal-celebration" aria-live="polite">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="goal-text">GOOOAL<em>!</em></div>
    </div>,
    document.body
  )
}

// === Self-destruct: every piece of text decays into 0s and 1s, then rebuilds ===
export function selfDestruct() {
  const root = document.getElementById('root')
  if (!root || document.documentElement.classList.contains('destructing')) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    // glitch words animate their own text; leave them alone
    acceptNode: (n) => n.nodeValue.trim() && !n.parentElement.closest('.glitch-word')
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  })
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  const originals = nodes.map(n => n.nodeValue)
  // decay order: roughly top to bottom, with noise per character
  const thresholds = nodes.map((n, i) => [...n.nodeValue].map(() => 0.5 * (i / nodes.length) + 0.5 * Math.random()))
  const render = (p) => {
    nodes.forEach((n, i) => {
      const chars = [...originals[i]]
      n.nodeValue = chars.map((c, j) => (c.trim() && thresholds[i][j] < p) ? (Math.random() < 0.5 ? '0' : '1') : c).join('')
    })
  }
  const html = document.documentElement
  html.classList.add('destructing')
  const decay = 1400, hold = 800, rebuild = 1100
  const total = decay + hold + rebuild
  const start = performance.now()
  const frame = (now) => {
    const t = now - start
    if (t < decay) render(t / decay)
    else if (t < decay + hold) render(1.01)
    else if (t < total) render(1 - (t - decay - hold) / rebuild)
    if (t < total) return requestAnimationFrame(frame)
    nodes.forEach((n, i) => { n.nodeValue = originals[i] })
    html.classList.remove('destructing')
    unlock('selfdestruct')
  }
  requestAnimationFrame(frame)
}
