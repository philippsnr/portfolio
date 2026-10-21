import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { unlock, useTypedPhrase } from './easterEggs.jsx'

export const startPenalty = () => window.dispatchEvent(new CustomEvent('ps-penalty'))

// scene geometry (SVG units, viewBox 800 × 520)
const GOAL = { l: 224, r: 576, top: 134, bottom: 330 }
const POST = 9 // a shot this close to the frame hits the woodwork
const SPOT = { x: 400, y: 446 }
const FEET = { x: 400, y: 330 }
const ARM = 100 // feet → hands
const AIM_X = { mid: 400, amp: 218 } // swings a little wider than the posts…
const AIM_Y = { mid: 222, amp: 112 } // …and a little higher than the bar
const KEEPER_ZONES = [
  { x: 285, y: 185 }, { x: 400, y: 170 }, { x: 515, y: 185 },
  { x: 275, y: 290 }, { x: 400, y: 280 }, { x: 525, y: 290 },
]
const KEY_ZONES = {
  ArrowLeft: { x: 270, y: 255 }, ArrowRight: { x: 530, y: 255 },
  ArrowUp: { x: 400, y: 165 }, ArrowDown: { x: 400, y: 295 },
}
const STANDING = { x: 400, y: 238 }

const rand = (a, b) => a + Math.random() * (b - a)
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const lerp = (a, b, t) => a + (b - a) * t

function outcome(target, hands, reach) {
  const { x, y } = target
  const inside = x > GOAL.l && x < GOAL.r && y > GOAL.top && y < GOAL.bottom
  const nearFrame = (Math.abs(x - GOAL.l) < POST || Math.abs(x - GOAL.r) < POST) && y > GOAL.top - POST && y < GOAL.bottom
    || Math.abs(y - GOAL.top) < POST && x > GOAL.l - POST && x < GOAL.r + POST
  if (nearFrame) return 'post'
  if (!inside) return 'miss'
  return dist(target, hands) < reach ? 'save' : 'goal'
}

// rotate the keeper around his feet so that his hands end up at `h`
function diveTransform(h) {
  if (!h) return ''
  const angle = Math.max(-82, Math.min(82, Math.atan2(h.x - FEET.x, FEET.y - h.y) * 180 / Math.PI))
  const rad = angle * Math.PI / 180
  const hx = FEET.x + Math.sin(rad) * ARM, hy = FEET.y - Math.cos(rad) * ARM
  const tx = Math.max(-190, Math.min(190, h.x - hx))
  const ty = Math.max(-70, Math.min(0, h.y - hy))
  return `translate(${tx}px, ${ty}px) rotate(${angle}deg)`
}

const BANNERS = {
  you: { goal: 'GOAL!', save: 'SAVED!', miss: 'MISSED!', post: 'OFF THE POST!' },
  cpu: { goal: 'They score.', save: 'WHAT A SAVE!', miss: 'WIDE!', post: 'OFF THE POST!' },
}
const GOOD = { you: ['goal'], cpu: ['save', 'miss', 'post'] }

function decided(s) {
  const y = s.you.length, c = s.cpu.length
  const yg = s.you.filter(r => r === 'goal').length, cg = s.cpu.filter(r => r === 'goal').length
  if (y <= 5 && c <= 5) {
    if (yg > cg + (5 - c) || cg > yg + (5 - y)) return yg > cg ? 'win' : 'lose'
    if (y === 5 && c === 5 && yg !== cg) return yg > cg ? 'win' : 'lose'
    return null
  }
  // sudden death: decided after each complete round
  if (y === c && yg !== cg) return yg > cg ? 'win' : 'lose'
  return null
}

function Ball({ x, y, r }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 14})`}>
      <ellipse cx="0" cy="13" rx="13" ry="3.5" fill="black" opacity="0.25" />
      <circle r="14" fill="#f5f5f5" stroke="#0b0b0f" strokeWidth="1.2" />
      <path d="M0 -5 L4.8 -1.5 L3 4 L-3 4 L-4.8 -1.5 Z" fill="#0b0b0f" />
      <path d="M0 -14 L0 -5 M4.8 -1.5 L13 -4.5 M3 4 L8 11 M-3 4 L-8 11 M-4.8 -1.5 L-13 -4.5" stroke="#0b0b0f" strokeWidth="1.2" />
    </g>
  )
}

function Keeper({ hands, idle }) {
  return (
    <g className={`pk-keeper${idle ? ' idle' : ''}`} style={{ transform: diveTransform(hands) }}>
      <g transform={`translate(${FEET.x} ${FEET.y})`}>
        <ellipse cx="0" cy="2" rx="34" ry="6" fill="black" opacity="0.35" />
        {/* legs */}
        <rect x="-15" y="-46" width="11" height="46" rx="4" fill="#1f2937" />
        <rect x="4" y="-46" width="11" height="46" rx="4" fill="#1f2937" />
        {/* arms */}
        <path d="M-17 -78 L-44 -98" stroke="#f97316" strokeWidth="10" strokeLinecap="round" />
        <path d="M17 -78 L44 -98" stroke="#f97316" strokeWidth="10" strokeLinecap="round" />
        {/* torso */}
        <rect x="-20" y="-86" width="40" height="44" rx="9" fill="#f97316" />
        <text x="0" y="-57" textAnchor="middle" fontSize="16" fontWeight="700" fill="#0b0b0f" fontFamily="JetBrains Mono, monospace">1</text>
        {/* head */}
        <circle cx="0" cy="-98" r="11" fill="#e8b48a" />
        <path d="M-11 -101 Q0 -116 11 -101" fill="#3b2a1d" />
        {/* gloves */}
        <circle cx="-46" cy="-100" r="8" className="pk-glove" />
        <circle cx="46" cy="-100" r="8" className="pk-glove" />
      </g>
    </g>
  )
}

function Dots({ results }) {
  const n = Math.max(5, results.length)
  return (
    <span className="pk-dots">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={results[i] === 'goal' ? 'goal' : results[i] ? 'miss' : ''} />
      ))}
    </span>
  )
}

export function PenaltyGame() {
  const [active, setActive] = useState(false)
  useTypedPhrase('penalty', startPenalty)
  useEffect(() => {
    const on = () => setActive(true)
    window.addEventListener('ps-penalty', on)
    return () => window.removeEventListener('ps-penalty', on)
  }, [])
  if (!active) return null
  return createPortal(<Shootout onClose={() => setActive(false)} />, document.body)
}

function Shootout({ onClose }) {
  const svgRef = useRef(null)
  const [score, setScore] = useState({ you: [], cpu: [] })
  const [phase, setPhase] = useState('intro') // intro | aimX | aimY | shot | keep | cpuShot | banner | over
  const [banner, setBanner] = useState(null)
  const [, setTick] = useState(0)
  const g = useRef({
    aim: { x: AIM_X.mid, y: AIM_Y.mid }, ball: { ...SPOT, r: 14 }, hands: null,
    t0: 0, shot: null, kicks: 0, dove: false,
  }).current
  const timers = useRef([])
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // lock page scroll while playing
  useEffect(() => {
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    return () => { root.style.overflow = prev }
  }, [])

  const resetBall = () => { g.ball = { ...SPOT, r: 14 }; g.hands = null; g.dove = false; g.shot = null }

  const startShoot = useCallback(() => {
    resetBall()
    g.t0 = performance.now()
    setPhase('aimX')
  }, [])

  const startKeep = useCallback(() => {
    resetBall()
    setPhase('keep')
    // run-up, then the kick
    later(() => {
      const miss = Math.random() < 0.12
      const target = miss
        ? (Math.random() < 0.5
          ? { x: Math.random() < 0.5 ? rand(150, 205) : rand(595, 650), y: rand(150, 320) } // wide
          : { x: rand(250, 550), y: rand(85, 115) }) // over the bar
        : { x: rand(GOAL.l + 14, GOAL.r - 14), y: rand(GOAL.top + 14, GOAL.bottom - 12) }
      g.shot = { from: { ...SPOT }, to: target, start: performance.now(), dur: 620, by: 'cpu' }
      setPhase('cpuShot')
    }, 1100)
  }, [])

  const finishKick = useCallback((by, result) => {
    setBanner({ text: BANNERS[by][result], good: GOOD[by].includes(result) })
    setPhase('banner')
    setScore(s => {
      const next = { ...s, [by]: [...s[by], result === 'goal' ? 'goal' : 'miss'] }
      const verdict = decided(next)
      later(() => {
        setBanner(null)
        if (verdict) {
          setPhase('over')
          if (verdict === 'win') unlock('penalty')
          g.verdict = verdict
        } else if (by === 'you') startKeep()
        else startShoot()
      }, 1500)
      return next
    })
  }, [startKeep, startShoot])

  // animation loop: aiming swings and ball flight
  useEffect(() => {
    if (!['aimX', 'aimY', 'shot', 'cpuShot', 'banner', 'keep'].includes(phase)) return
    let raf
    const speed = 1 + g.kicks * 0.07
    const frame = (now) => {
      const t = (now - g.t0) / 1000
      if (phase === 'aimX') g.aim = { x: AIM_X.mid + Math.sin(t * 2.7 * speed) * AIM_X.amp, y: AIM_Y.mid }
      if (phase === 'aimY') g.aim = { ...g.aim, y: AIM_Y.mid + Math.sin(t * 3.4 * speed) * AIM_Y.amp }
      if (g.shot) {
        const s = g.shot
        const p = Math.min(1, (now - s.start) / s.dur)
        const e = 1 - Math.pow(1 - p, 2)
        g.ball = {
          x: lerp(s.from.x, s.to.x, e),
          y: lerp(s.from.y, s.to.y, e) - Math.sin(Math.PI * e) * 34,
          r: lerp(14, 8, e),
        }
        if (p >= 1 && !s.done) {
          s.done = true
          const reach = s.by === 'you' ? 60 : (g.dove ? 72 : 52)
          const result = outcome(s.to, g.hands || STANDING, reach)
          // after the moment of truth: into the net, off a glove, or away
          if (result === 'save') g.shot = { from: { ...s.to }, to: { x: s.to.x + (s.to.x < 400 ? -90 : 90), y: s.to.y + 60 }, start: now, dur: 450, by: s.by, done: true, after: true }
          else if (result === 'goal') g.shot = { from: { ...s.to }, to: { x: lerp(s.to.x, 400, 0.15), y: s.to.y + 12 }, start: now, dur: 300, by: s.by, done: true, after: true }
          else if (result === 'post') g.shot = { from: { ...s.to }, to: { x: s.to.x + (s.to.x < 400 ? -70 : 70), y: s.to.y + 140 }, start: now, dur: 500, by: s.by, done: true, after: true }
          else g.shot = null
          finishKick(s.by === 'you' ? 'you' : 'cpu', result)
        }
        if (s.after && p >= 1) g.shot = null
      }
      setTick(n => n + 1)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [phase, finishKick])

  const shoot = () => {
    const target = { ...g.aim }
    g.kicks++
    // the keeper reads some shots, guesses on the rest
    const read = Math.random() < 0.28
    const guess = read
      ? { x: Math.max(GOAL.l + 40, Math.min(GOAL.r - 40, target.x + rand(-45, 45))), y: Math.max(GOAL.top + 30, Math.min(GOAL.bottom - 25, target.y + rand(-40, 40))) }
      : KEEPER_ZONES[Math.floor(Math.random() * KEEPER_ZONES.length)]
    later(() => { g.hands = guess; g.dove = true }, 140)
    g.shot = { from: { ...SPOT }, to: target, start: performance.now(), dur: 560, by: 'you' }
    setPhase('shot')
  }

  const toSvg = (e) => {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    return pt.matrixTransform(svg.getScreenCTM().inverse())
  }

  const dive = (point) => {
    if (g.dove) return
    g.dove = true
    g.hands = {
      x: Math.max(GOAL.l + 20, Math.min(GOAL.r - 20, point.x)),
      y: Math.max(GOAL.top + 15, Math.min(GOAL.bottom - 20, point.y)),
    }
  }

  const act = (e) => {
    if (phase === 'intro') { startShoot(); return }
    if (phase === 'aimX') { g.t0 = performance.now(); setPhase('aimY'); return }
    if (phase === 'aimY') { shoot(); return }
    if ((phase === 'keep' || phase === 'cpuShot') && e?.clientX !== undefined) dive(toSvg(e))
  }

  const rematch = () => { setScore({ you: [], cpu: [] }); g.kicks = 0; g.verdict = null; startShoot() }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (phase === 'over') rematch()
        else act()
      }
      if ((phase === 'keep' || phase === 'cpuShot') && KEY_ZONES[e.key]) { e.preventDefault(); dive(KEY_ZONES[e.key]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const you = score.you.filter(r => r === 'goal').length
  const cpu = score.cpu.filter(r => r === 'goal').length
  const sudden = score.you.length >= 5 && score.cpu.length >= 5
  const hint = {
    intro: 'Click or press Space to start',
    aimX: 'Click / Space to lock the direction',
    aimY: 'Click / Space to lock the height — and shoot',
    shot: '', banner: '',
    keep: 'Keeper FC steps up… click in the goal (or ←↑→↓) to dive',
    cpuShot: 'Dive!',
    over: '',
  }[phase]
  const showAim = phase === 'aimX' || phase === 'aimY'

  return (
    <div className="penalty" role="dialog" aria-label="Penalty shootout">
      <div className="pk-board">
        <span className="pk-team">YOU</span>
        <Dots results={score.you} />
        <span className="pk-score">{you} – {cpu}</span>
        <Dots results={score.cpu} />
        <span className="pk-team">KEEPER FC</span>
      </div>
      <div className="pk-sub">{sudden ? 'Sudden death' : phase === 'keep' || phase === 'cpuShot' ? 'You are in goal' : 'You are shooting'}</div>

      <svg ref={svgRef} className="pk-scene" viewBox="0 0 800 520" onPointerDown={act}>
        <defs>
          <linearGradient id="pk-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#05060a" />
            <stop offset="1" stopColor="#10141c" />
          </linearGradient>
          <pattern id="pk-crowd" width="14" height="12" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="2.2" fill="#2a3040" />
            <circle cx="11" cy="9" r="2.2" fill="#232836" />
          </pattern>
          <pattern id="pk-net" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 0 L16 16 M16 0 L0 16" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
          </pattern>
          <radialGradient id="pk-light" cx="0.5" cy="0" r="0.8">
            <stop offset="0" stopColor="rgba(190,255,120,0.12)" />
            <stop offset="1" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>

        {/* stadium */}
        <rect width="800" height="330" fill="url(#pk-sky)" />
        <rect y="22" width="800" height="70" fill="url(#pk-crowd)" />
        <rect y="92" width="800" height="8" fill="#0d1017" />
        <rect y="100" width="800" height="22" fill="#141a24" />
        <text x="400" y="115" textAnchor="middle" className="pk-ad">PHILIPP-STAUDINGER.COM · MANAGER-UNITED.DE · OTH REGENSBURG · NFACULTY</text>

        {/* pitch with mowing stripes in perspective */}
        {Array.from({ length: 8 }, (_, i) => {
          const y0 = 330 + Math.pow(i / 8, 1.4) * 190, y1 = 330 + Math.pow((i + 1) / 8, 1.4) * 190
          return <rect key={i} x="0" y={y0} width="800" height={y1 - y0 + 0.5} fill={i % 2 ? '#1b3a1f' : '#1f4223'} />
        })}
        <rect y="140" width="800" height="190" fill="url(#pk-light)" />
        <path d="M120 372 L680 372 L640 330 M160 330 L120 372" stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" />
        <path d="M0 470 L800 470" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
        <path d="M0 330 L800 330" stroke="rgba(255,255,255,0.55)" strokeWidth="2" />
        <ellipse cx={SPOT.x} cy={SPOT.y + 12} rx="6" ry="2" fill="rgba(255,255,255,0.7)" />

        {/* goal: net, then frame */}
        <path d={`M${GOAL.l} ${GOAL.top} L${GOAL.l + 26} ${GOAL.top + 18} L${GOAL.r - 26} ${GOAL.top + 18} L${GOAL.r} ${GOAL.top} Z`} fill="url(#pk-net)" />
        <rect x={GOAL.l + 26} y={GOAL.top + 18} width={GOAL.r - GOAL.l - 52} height={GOAL.bottom - GOAL.top - 22} fill="url(#pk-net)" />
        <path d={`M${GOAL.l} ${GOAL.top} L${GOAL.l + 26} ${GOAL.top + 18} L${GOAL.l + 26} ${GOAL.bottom - 4} L${GOAL.l} ${GOAL.bottom} Z`} fill="url(#pk-net)" />
        <path d={`M${GOAL.r} ${GOAL.top} L${GOAL.r - 26} ${GOAL.top + 18} L${GOAL.r - 26} ${GOAL.bottom - 4} L${GOAL.r} ${GOAL.bottom} Z`} fill="url(#pk-net)" />
        <path d={`M${GOAL.l + 26} ${GOAL.top + 18} L${GOAL.r - 26} ${GOAL.top + 18} M${GOAL.l + 26} ${GOAL.bottom - 4} L${GOAL.r - 26} ${GOAL.bottom - 4}`} stroke="rgba(255,255,255,0.25)" />

        <Keeper hands={g.hands} idle={!g.hands} />

        <path d={`M${GOAL.l} ${GOAL.bottom} L${GOAL.l} ${GOAL.top} L${GOAL.r} ${GOAL.top} L${GOAL.r} ${GOAL.bottom}`} stroke="#f4f4f5" strokeWidth="8" fill="none" strokeLinejoin="round" />

        <Ball {...g.ball} />

        {showAim && (
          <g className="pk-aim">
            {phase === 'aimX'
              ? <line x1={g.aim.x} y1="100" x2={g.aim.x} y2="335" />
              : <line x1={AIM_X.mid - AIM_X.amp} y1={g.aim.y} x2={AIM_X.mid + AIM_X.amp} y2={g.aim.y} />}
            <circle cx={g.aim.x} cy={g.aim.y} r="17" />
            <path d={`M${g.aim.x - 26} ${g.aim.y} h14 M${g.aim.x + 12} ${g.aim.y} h14 M${g.aim.x} ${g.aim.y - 26} v14 M${g.aim.x} ${g.aim.y + 12} v14`} />
          </g>
        )}
      </svg>

      {banner && <div className={`pk-banner ${banner.good ? 'good' : 'bad'}`} key={`${score.you.length}-${score.cpu.length}`}>{banner.text}</div>}

      {phase === 'over' && (
        <div className="pk-over">
          <div className={`pk-verdict ${g.verdict}`}>{g.verdict === 'win' ? 'You win the shootout! 🏆' : 'Keeper FC wins.'}</div>
          <div className="pk-final">{you} – {cpu}</div>
          <div className="pk-actions">
            <button type="button" className="btn" onClick={rematch}><span>Rematch</span></button>
            <button type="button" className="btn btn-ghost" onClick={onClose}><span>Close</span></button>
          </div>
        </div>
      )}

      <div className="pk-hint">{hint}</div>
      <button type="button" className="pk-close" onClick={onClose} aria-label="Close">×</button>
    </div>
  )
}
