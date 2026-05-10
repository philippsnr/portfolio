import { useEffect, useRef, useState } from 'react'

export function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  useEffect(() => {
    const dot = dotRef.current, ring = ringRef.current
    if (!dot || !ring) return
    let mx = window.innerWidth / 2, my = window.innerHeight / 2
    let rx = mx, ry = my
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`
    }
    window.addEventListener('mousemove', onMove)
    let raf
    const loop = () => {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`
      raf = requestAnimationFrame(loop)
    }
    loop()
    const targets = 'a, button, .project-row, .mag, .contact-email, .skill-cat li'
    const onOver = (e) => { if (e.target.closest(targets)) ring.classList.add('hover') }
    const onOut  = (e) => { if (e.target.closest(targets)) ring.classList.remove('hover') }
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <>
      <div className="cursor-ring" ref={ringRef}></div>
      <div className="cursor-dot" ref={dotRef}></div>
    </>
  )
}

export function Magnetic({ children, strength = 0.35 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - (r.left + r.width / 2)
      const y = e.clientY - (r.top + r.height / 2)
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`
    }
    const reset = () => { el.style.transform = 'translate(0,0)' }
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', reset)
    return () => {
      el.removeEventListener('mousemove', move)
      el.removeEventListener('mouseleave', reset)
    }
  }, [strength])
  return (
    <div className="mag" ref={ref} style={{ transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
      {children}
    </div>
  )
}

export function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => el.classList.add('visible'), delay)
        io.unobserve(el)
      }
    }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [delay])
  return <Tag ref={ref} className={`reveal ${className}`} {...rest}>{children}</Tag>
}

export function BgGlow() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let mx = window.innerWidth / 2, my = window.innerHeight / 2
    let rx = mx, ry = my
    const onMove = (e) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', onMove)
    let raf
    const loop = () => {
      rx += (mx - rx) * 0.04; ry += (my - ry) * 0.04
      el.style.transform = `translate(${rx - el.offsetWidth / 2}px, ${ry - el.offsetHeight / 2}px)`
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])
  return <div className="bg-glow" ref={ref}></div>
}

export function Clock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const f = (n) => String(n).padStart(2, '0')
  return <span className="clock">{f(t.getHours())}:{f(t.getMinutes())}:{f(t.getSeconds())} LOCAL</span>
}

export function makeAscii(seed) {
  const chars = ['▓','▒','░','█','▚','▞','◆','◇','○','◉','╱','╲']
  let str = '', s = seed
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 28; x++) {
      s = (s * 9301 + 49297) % 233280
      str += chars[Math.floor(s / 233280 * chars.length)]
    }
    str += '\n'
  }
  return str
}

// === Text scramble ===
const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#________'
function scrambleText(el, finalText, duration = 900) {
  if (!el) return
  const totalFrames = Math.round(duration / 16)
  const queue = [...finalText].map((c, i) => ({
    from: el.textContent[i] || '',
    to: c,
    start: Math.floor(Math.random() * (totalFrames * 0.4)),
    end: Math.floor(totalFrames * 0.4 + Math.random() * (totalFrames * 0.6)),
  }))
  let frame = 0, raf
  const update = () => {
    let out = '', done = 0
    for (const q of queue) {
      if (frame >= q.end) { out += q.to; done++ }
      else if (frame >= q.start) out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      else out += q.from
    }
    el.textContent = out
    if (done < queue.length) { frame++; raf = requestAnimationFrame(update) }
  }
  update()
  return () => cancelAnimationFrame(raf)
}

export function ScrambleOnView({ children, className = '', delay = 0, as: Tag = 'span' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const text = el.textContent
    const originalHTML = el.innerHTML
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.unobserve(el)
        setTimeout(() => {
          scrambleText(el, text, 1100)
          // restore original innerHTML (with <em> etc.) after scramble finishes
          setTimeout(() => { if (el) el.innerHTML = originalHTML }, 1200)
        }, delay)
      }
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [delay])
  return <Tag ref={ref} className={className}>{children}</Tag>
}

// === Hero spotlight ===
export function HeroSpotlight() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [])
  return <div className="hero-spotlight" ref={ref}></div>
}

// === Animated grid background ===
export function GridBg() {
  return (
    <div className="grid-bg" aria-hidden="true">
      <svg width="100%" height="100%" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  )
}

// === Now status ===
export function NowStatus() {
  const [text, setText] = useState('Available for work')
  useEffect(() => {
    const update = () => {
      const h = new Date().getHours()
      const day = new Date().getDay()
      let t = 'Available for work'
      if (h < 7) t = 'Probably asleep'
      else if (h < 9) t = 'Coffee in hand'
      else if (h < 12) t = 'Deep work mode'
      else if (h < 14) t = 'Lunch break'
      else if (h < 18) t = 'In a meeting / coding'
      else if (h < 21) t = 'Football training'
      else t = 'Reading / side projects'
      if (day === 0 || day === 6) t = h < 11 ? 'Out for a run' : 'Weekend mode'
      setText(t)
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [])
  return <span>{text}</span>
}

// === Skill bar ===
export const LVL_MAP = { Native: 100, Daily: 88, Advanced: 80, Comfortable: 65, Basic: 40, Learning: 35 }

export function SkillBar({ level }) {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setW(level); io.unobserve(el) }
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [level])
  return (
    <span className="skill-bar" ref={ref}>
      <span className="skill-bar-fill" style={{ width: `${w}%` }}></span>
    </span>
  )
}

// === Particle network ===
export function ParticleNet({ density = 0.00016, linkDist = 150, cursorLinkDist = 200 }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = window.innerWidth, h = window.innerHeight
    let particles = []
    let mx = -9999, my = -9999
    let running = true

    const accentColor = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent-hex').trim() || '#C8FF00'

    const hexToRgb = (hex) => {
      hex = hex.replace('#', '')
      if (hex.length === 3) hex = hex.split('').map(c => c+c).join('')
      const n = parseInt(hex, 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.min(220, Math.max(60, Math.round(w * h * density)))
      if (particles.length < target) {
        for (let i = particles.length; i < target; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 0.15 + Math.random() * 0.08
          particles.push({
            x: Math.random() * w, y: Math.random() * h,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: 1 + Math.random() * 1.6,
          })
        }
      } else if (particles.length > target) {
        particles.length = target
      }
    }

    const onMouseMove = (e) => { mx = e.clientX; my = e.clientY }
    const onMouseLeave = () => { mx = -9999; my = -9999 }

    const tick = () => {
      if (!running) return
      const [r, g, b] = hexToRgb(accentColor())
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx) }
        if (p.x > w) { p.x = w; p.vx = -Math.abs(p.vx) }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy) }
        if (p.y > h) { p.y = h; p.vy = -Math.abs(p.vy) }
        const dx = mx - p.x, dy = my - p.y
        const d2 = dx*dx + dy*dy
        if (d2 < cursorLinkDist*cursorLinkDist && d2 > 1) {
          const d = Math.max(1, Math.sqrt(d2))
          const f = 900 / (d * d)
          p.vx -= (dx / d) * f; p.vy -= (dy / d) * f
        }
        const sp = Math.sqrt(p.vx*p.vx + p.vy*p.vy)
        if (sp > 3.0) { p.vx *= 3.0/sp; p.vy *= 3.0/sp }
        else if (sp > 0.25) { p.vx *= 0.97; p.vy *= 0.97 }
      }

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const c = particles[j]
          const dx = a.x - c.x, dy = a.y - c.y
          const d = Math.sqrt(dx*dx + dy*dy)
          if (d < linkDist) {
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / linkDist) * 0.18})`
            ctx.lineWidth = 0.7
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke()
          }
        }
      }

      for (const p of particles) {
        const dx = p.x - mx, dy = p.y - my
        const d = Math.sqrt(dx*dx + dy*dy)
        if (d < cursorLinkDist) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / cursorLinkDist) * 0.32})`
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke()
        }
      }

      for (const p of particles) {
        const dx = p.x - mx, dy = p.y - my
        const near = Math.sqrt(dx*dx + dy*dy) < cursorLinkDist
        ctx.fillStyle = `rgba(${r},${g},${b},${near ? 0.5 : 0.25})`
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      }

      if (mx > 0) {
        ctx.fillStyle = `rgba(${r},${g},${b},1)`
        ctx.shadowColor = `rgba(${r},${g},${b},0.8)`
        ctx.shadowBlur = 12
        ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
      }

      requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseout', onMouseLeave)
    tick()
    return () => {
      running = false
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseout', onMouseLeave)
    }
  }, [density, linkDist, cursorLinkDist])

  return <canvas className="particle-net" ref={canvasRef}></canvas>
}
