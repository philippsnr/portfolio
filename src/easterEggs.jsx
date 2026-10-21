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
  redcard: 'Sent off for click spamming',
  penalty: 'Won the penalty shootout',
  formation: 'Lined up in a 3-6-1',
  lights: 'Lights off',
  train: 'Trained the model',
  vision: 'Ran object detection',
  gravity: 'Broke gravity',
}
export const SECRET_COUNT = Object.keys(SECRETS).length
export const allSecretsFound = () => foundSecrets().length >= SECRET_COUNT
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
      const add = (toast) => {
        setToasts(t => [...t, toast])
        setTimeout(() => setToasts(t => t.filter(x => x.key !== toast.key)), 4200)
      }
      add({ ...e.detail, name: SECRETS[e.detail.id], key: `${e.detail.id}-${Date.now()}` })
      if (e.detail.count >= SECRET_COUNT) {
        setTimeout(() => add({ id: 'all', name: "Found everything. You're hired.", count: e.detail.count, key: `all-${Date.now()}`, gold: true }), 1500)
      }
    }
    window.addEventListener('ps-achievement', onUnlock)
    return () => window.removeEventListener('ps-achievement', onUnlock)
  }, [])
  return createPortal(
    <div className="achievements" aria-live="polite">
      {toasts.map(t => (
        <div key={t.key} className={`achievement${t.gold ? ' gold' : ''}`}>
          <span className="trophy">🏆</span>
          <div>
            <div className="ach-lbl">Achievement unlocked</div>
            <div className="ach-name">{t.name}</div>
            <div className="ach-count">{t.count}/{SECRET_COUNT} secrets found</div>
          </div>
        </div>
      ))}
    </div>,
    document.body
  )
}

// === Typed phrase anywhere on the page ===
// true once the last few typed characters are the start of the phrase
export function typingPrefix(typed, phrase, min = 3) {
  for (let k = typed.length; k >= min; k--) {
    if (phrase.startsWith(typed.slice(-k))) return true
  }
  return false
}

export function useTypedPhrase(phrase, onMatch) {
  const cb = useRef(onMatch)
  cb.current = onMatch
  useEffect(() => {
    let typed = ''
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.key.length !== 1) return
      typed = (typed + e.key.toLowerCase()).slice(-phrase.length)
      // a space in the middle of the phrase shouldn't scroll the page
      if (e.key === ' ' && typingPrefix(typed, phrase)) e.preventDefault()
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

// === Red card for click spamming ===
export function RedCard() {
  const [active, setActive] = useState(false)
  const [left, setLeft] = useState(3)
  useEffect(() => {
    let clicks = []
    const onClick = () => {
      const now = Date.now()
      clicks = [...clicks.filter(t => now - t < 2000), now]
      if (clicks.length >= 10) { clicks = []; setActive(true); unlock('redcard') }
    }
    window.addEventListener('click', onClick, true)
    return () => window.removeEventListener('click', onClick, true)
  }, [])
  useEffect(() => {
    if (!active) return
    setLeft(3)
    const id = setInterval(() => setLeft(l => {
      if (l <= 1) { clearInterval(id); setActive(false) }
      return l - 1
    }), 1000)
    return () => clearInterval(id)
  }, [active])
  if (!active) return null
  return createPortal(
    <div className="red-card" role="alert" onClickCapture={(e) => e.stopPropagation()}>
      <div className="card"></div>
      <div className="rc-text">
        <strong>Red card.</strong>
        <span>Sent off for click spamming. Back on the pitch in {Math.max(left, 1)}…</span>
      </div>
    </div>,
    document.body
  )
}

// === 3-6-1 formation built from the skill list ===
const LINEUP = [
  { name: 'Python', pos: 'ST', num: 9, x: 50, y: 11 },
  { name: 'PyTorch', pos: 'MID', num: 10, x: 33, y: 29 },
  { name: 'Java', pos: 'MID', num: 8, x: 67, y: 29 },
  { name: 'OpenCV', pos: 'MID', num: 7, x: 13, y: 47 },
  { name: 'JavaScript', pos: 'MID', num: 6, x: 37, y: 47 },
  { name: 'PHP', pos: 'MID', num: 14, x: 63, y: 47 },
  { name: 'Kubernetes', pos: 'MID', num: 11, x: 87, y: 47 },
  { name: 'Docker', pos: 'DEF', num: 4, x: 22, y: 67 },
  { name: 'Linux', pos: 'DEF', num: 5, x: 50, y: 67 },
  { name: 'MySQL', pos: 'DEF', num: 3, x: 78, y: 67 },
  { name: 'Git', pos: 'GK', num: 1, x: 50, y: 86 },
]
export const showFormation = () => emit('ps-formation')

export function Formation({ skills }) {
  const [active, setActive] = useState(false)
  const [placed, setPlaced] = useState(false)
  const pitchRef = useRef(null)
  const cardRefs = useRef([])
  useTypedPhrase('formation', showFormation)

  useEffect(() => {
    const on = () => { setPlaced(false); setActive(true); unlock('formation') }
    window.addEventListener('ps-formation', on)
    return () => window.removeEventListener('ps-formation', on)
  }, [])

  // FLIP: start every card where its skill sits in the list, then let it run to its position
  useEffect(() => {
    if (!active) return
    const items = [...document.querySelectorAll('.skill-cat li')]
    cardRefs.current.forEach((card, i) => {
      if (!card) return
      const li = items.find(el => el.querySelector('.sk-name')?.textContent.trim() === LINEUP[i].name)
      if (!li) return
      const from = li.getBoundingClientRect(), to = card.getBoundingClientRect()
      card.style.transition = 'none'
      card.style.transform = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(0.6)`
      card.style.opacity = '0'
    })
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setPlaced(true)))
    const onKey = (e) => { if (e.key === 'Escape') setActive(false) }
    window.addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [active])

  useEffect(() => {
    if (!placed) return
    cardRefs.current.forEach((card, i) => {
      if (!card) return
      card.style.transition = `transform 0.9s var(--ease-out-expo) ${i * 60}ms, opacity 0.5s ease ${i * 60}ms`
      card.style.transform = ''
      card.style.opacity = '1'
    })
  }, [placed])

  if (!active) return null
  const all = skills.flatMap(s => s.items)
  return createPortal(
    <div className="formation" onClick={() => setActive(false)}>
      <div className="pitch" ref={pitchRef}>
        <div className="pitch-line half"></div>
        <div className="pitch-line circle"></div>
        <div className="pitch-line box top"></div>
        <div className="pitch-line box bottom"></div>
        {LINEUP.map((p, i) => {
          const skill = all.find(s => s.name === p.name)
          return (
            <div key={p.name} className="fm-card" ref={el => { cardRefs.current[i] = el }} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <span className="fm-pos">{p.pos}</span>
              {skill?.icon && <i className={`${skill.icon} colored fm-icon`}></i>}
              <span className="fm-num">{p.num}</span>
              <span className="fm-name">{p.name}</span>
            </div>
          )
        })}
      </div>
      <div className="formation-label">3-6-1 · Formation <span>click or Esc to close</span></div>
    </div>,
    document.body
  )
}

// === Lights off: only a flashlight cone around the cursor ===
export const toggleLights = (on) => emit('ps-lights', on)

// remember where the pointer is, so the flashlight starts at the cursor rather than the centre
const lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
window.addEventListener('pointermove', (e) => { lastPointer.x = e.clientX; lastPointer.y = e.clientY }, { passive: true })

export function LightsOff() {
  const [dark, setDark] = useState(false)
  const ref = useRef(null)
  useTypedPhrase('lights off', () => toggleLights(false))
  useTypedPhrase('lights on', () => toggleLights(true))

  useEffect(() => {
    const on = (e) => {
      setDark(d => {
        const next = e.detail === undefined ? !d : !e.detail
        if (next) unlock('lights')
        return next
      })
    }
    window.addEventListener('ps-lights', on)
    return () => window.removeEventListener('ps-lights', on)
  }, [])

  useEffect(() => {
    if (!dark) return
    const el = ref.current
    const place = (x, y) => {
      el.style.setProperty('--lx', `${x}px`)
      el.style.setProperty('--ly', `${y}px`)
    }
    place(lastPointer.x, lastPointer.y)
    const move = (e) => place(e.clientX, e.clientY)
    const onKey = (e) => { if (e.key === 'Escape') setDark(false) }
    window.addEventListener('pointermove', move)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('keydown', onKey) }
  }, [dark])

  if (!dark) return null
  return createPortal(
    <div className="lights-off" ref={ref} aria-hidden="true">
      <span className="lights-hint">type “lights on” or press Esc</span>
    </div>,
    document.body
  )
}

// === Gravity: visible blocks fall, stack up and can be thrown around ===
const GRAVITY_TARGETS = [
  '.hero-name', '.hero-title .line', '.hero-tagline', '.hero-eyebrow', '.hero-meta .cell',
  '.section-header .title', '.section-header .index', '.section-header .meta',
  '.about-photo', '.about-copy h3', '.about-copy p', '.affil-card', '.stat',
  '.project-row', '.skill-cat .cat-label', '.skill-cat li', '.skills-strip',
  '.contact-eyebrow', '.contact-headline', '.contact-email', '.social-card', '.footer span',
].join(', ')

export const startGravity = () => emit('ps-gravity')

export function Gravity() {
  const [active, setActive] = useState(false)
  const world = useRef(null)
  useTypedPhrase('gravity', startGravity)

  useEffect(() => {
    const on = () => setActive(true)
    window.addEventListener('ps-gravity', on)
    return () => window.removeEventListener('ps-gravity', on)
  }, [])

  useEffect(() => {
    if (!active) return
    const W = () => window.innerWidth, H = () => window.innerHeight
    const candidates = [...document.querySelectorAll(GRAVITY_TARGETS)]
    const visible = candidates.filter(el => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < H() && r.right > 0 && r.left < W()
    })
    // only the outermost targets move; nested ones ride along
    const els = visible.filter(el => !visible.some(o => o !== el && o.contains(el)))
    if (!els.length) { setActive(false); return }

    const html = document.documentElement
    html.classList.add('gravity-mode')
    const bodies = els.map(el => {
      const r = el.getBoundingClientRect()
      const saved = { transform: el.style.transform, transition: el.style.transition, position: el.style.position, zIndex: el.style.zIndex }
      el.style.transition = 'none'
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
      el.style.zIndex = '4500'
      return { el, saved, ox: r.left, oy: r.top, x: r.left, y: r.top, w: r.width, h: r.height,
        vx: (Math.random() - 0.5) * 14, vy: -2 - Math.random() * 8,
        tilt: (Math.random() - 0.5) * 16, rot: 0 }
    })
    let drag = null, raf
    const step = () => {
      for (const b of bodies) {
        if (b === drag?.body) continue
        b.vy += 0.6
        b.vx *= 0.995
        b.x += b.vx; b.y += b.vy
        if (b.y + b.h > H()) { b.y = H() - b.h; b.vy *= -0.25; b.vx *= 0.85 }
        if (b.x < 0) { b.x = 0; b.vx *= -0.5 }
        if (b.x + b.w > W()) { b.x = W() - b.w; b.vx *= -0.5 }
      }
      // resolve overlaps along the axis of least penetration so blocks stack;
      // a single soft pass lets the pile settle into a slightly crumpled heap
      for (let it = 0; it < 1; it++) {
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i], c = bodies[j]
            const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x)
            const oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y)
            if (ox <= 0 || oy <= 0) continue
            const aFixed = a === drag?.body, cFixed = c === drag?.body
            if (oy < ox) {
              const [top, bottom] = a.y < c.y ? [a, c] : [c, a]
              if (top === drag?.body) { bottom.y += oy } else if (bottom === drag?.body) { top.y -= oy }
              else { top.y -= oy * 0.35; bottom.y += oy * 0.15 }
              if (top.vy > 0) top.vy = 0
              top.vx *= 0.9
            } else {
              const [l, r] = a.x < c.x ? [a, c] : [c, a]
              const push = ox * (aFixed || cFixed ? 1 : 0.5)
              if (l !== drag?.body) l.x -= push
              if (r !== drag?.body) r.x += push
              l.vx = Math.min(l.vx, 0); r.vx = Math.max(r.vx, 0)
            }
          }
        }
      }
      for (const b of bodies) {
        b.rot += (b.tilt - b.rot) * 0.05
        b.el.style.transform = `translate(${b.x - b.ox}px, ${b.y - b.oy}px) rotate(${b.rot}deg)`
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)

    const down = (e) => {
      if (e.target.closest('.gravity-reset')) return
      const body = bodies.find(b => b.el.contains(e.target))
      if (!body) return
      e.preventDefault()
      drag = { body, dx: e.clientX - body.x, dy: e.clientY - body.y, lx: e.clientX, ly: e.clientY }
    }
    const move = (e) => {
      if (!drag) return
      const b = drag.body
      b.vx = e.clientX - drag.lx; b.vy = e.clientY - drag.ly
      drag.lx = e.clientX; drag.ly = e.clientY
      b.x = e.clientX - drag.dx; b.y = e.clientY - drag.dy
    }
    const up = () => { drag = null }
    // while gravity is on, nothing on the page should navigate or open
    const swallow = (e) => { if (!e.target.closest('.gravity-reset')) { e.preventDefault(); e.stopPropagation() } }
    const onKey = (e) => { if (e.key === 'Escape') setActive(false) }
    window.addEventListener('pointerdown', down, true)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('click', swallow, true)
    window.addEventListener('keydown', onKey)
    const timer = setTimeout(() => unlock('gravity'), 600)
    world.current = { bodies }

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      window.removeEventListener('pointerdown', down, true)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('click', swallow, true)
      window.removeEventListener('keydown', onKey)
      // fly everything back home, then restore the original inline styles
      for (const b of bodies) {
        b.el.style.transition = 'transform 0.9s var(--ease-out-expo)'
        b.el.style.transform = b.saved.transform
      }
      setTimeout(() => {
        for (const b of bodies) Object.assign(b.el.style, b.saved)
        html.classList.remove('gravity-mode')
      }, 950)
    }
  }, [active])

  if (!active) return null
  return createPortal(
    <button type="button" className="gravity-reset btn" onClick={() => setActive(false)}>
      <span>↺ Reset gravity</span>
    </button>,
    document.body
  )
}
