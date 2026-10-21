import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { unlock, useTypedPhrase } from './easterEggs.jsx'

export const startPenalty = () => window.dispatchEvent(new CustomEvent('ps-penalty'))

// scene geometry (SVG units, viewBox 800 × 480)
const GOAL = { l: 226, r: 574, top: 120, bottom: 316 }
const POST = 8 // a shot this close to the frame hits the woodwork
const SPOT = { x: 400, y: 430 }
const FEET = { x: 400, y: 316 }
const ARM = 100 // feet → hands
const AIM_X = { mid: 400, amp: 216 } // swings a little wider than the posts…
const AIM_Y = { mid: 208, amp: 112 } // …and a little higher than the bar
const STANDING = { x: 400, y: 222 }
const KEEPER_ZONES = [
  { x: 290, y: 170 }, { x: 400, y: 160 }, { x: 510, y: 170 },
  { x: 280, y: 275 }, { x: 400, y: 265 }, { x: 520, y: 275 },
]
const KEY_ZONES = {
  ArrowLeft: { x: 275, y: 240 }, ArrowRight: { x: 525, y: 240 },
  ArrowUp: { x: 400, y: 150 }, ArrowDown: { x: 400, y: 285 },
}
const HEAD = `${import.meta.env.BASE_URL}assets/keeper-head.png`

const rand = (a, b) => a + Math.random() * (b - a)
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const lerp = (a, b, t) => a + (b - a) * t
const clampToGoal = (p, mx = 20, my = 16) => ({
  x: Math.max(GOAL.l + mx, Math.min(GOAL.r - mx, p.x)),
  y: Math.max(GOAL.top + my, Math.min(GOAL.bottom - my, p.y)),
})

function outcome(target, hands, reach) {
  const { x, y } = target
  const inside = x > GOAL.l && x < GOAL.r && y > GOAL.top && y < GOAL.bottom
  const onPost = (Math.abs(x - GOAL.l) < POST || Math.abs(x - GOAL.r) < POST) && y > GOAL.top - POST && y < GOAL.bottom
  const onBar = Math.abs(y - GOAL.top) < POST && x > GOAL.l - POST && x < GOAL.r + POST
  if (onPost || onBar) return 'post'
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
  you: { goal: 'Goal!', save: 'Saved.', miss: 'Wide.', post: 'Off the post!' },
  cpu: { goal: 'They score.', save: 'What a save!', miss: 'Wide!', post: 'Off the post!' },
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
      <circle r="14" fill="#f4f4f5" />
      <path d="M0 -5 L4.8 -1.5 L3 4 L-3 4 L-4.8 -1.5 Z" fill="#16181d" />
      <path d="M0 -14 L0 -5 M4.8 -1.5 L13 -4.5 M3 4 L8 11 M-3 4 L-8 11 M-4.8 -1.5 L-13 -4.5" stroke="#16181d" strokeWidth="1.3" />
    </g>
  )
}

function Keeper({ hands }) {
  return (
    <g className={`pk-keeper${hands ? '' : ' idle'}`} style={{ transform: diveTransform(hands) }}>
      <g transform={`translate(${FEET.x} ${FEET.y})`}>
        <ellipse cx="0" cy="1" rx="30" ry="4" fill="black" opacity="0.4" />
        <rect x="-14" y="-44" width="11" height="44" rx="5" className="pk-kit-dark" />
        <rect x="3" y="-44" width="11" height="44" rx="5" className="pk-kit-dark" />
        <path d="M-16 -80 L-44 -98" className="pk-arm" />
        <path d="M16 -80 L44 -98" className="pk-arm" />
        <rect x="-19" y="-88" width="38" height="48" rx="10" className="pk-kit" />
        <text x="0" y="-57" textAnchor="middle" className="pk-number">1</text>
        <circle cx="-46" cy="-100" r="8.5" className="pk-glove" />
        <circle cx="46" cy="-100" r="8.5" className="pk-glove" />
        <image href={HEAD} x="-20" y="-138" width="40" height="52" />
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
  // intro | aimX | aimY | shot | keep | banner | over
  const [phase, setPhase] = useState('intro')
  const [banner, setBanner] = useState(null)
  const [, setTick] = useState(0)
  const g = useRef({
    aim: { x: AIM_X.mid, y: AIM_Y.mid }, ball: { ...SPOT, r: 14 }, hands: null,
    t0: 0, shot: null, tele: null, kicks: 0, dove: false, verdict: null,
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

  const resetKick = () => { g.ball = { ...SPOT, r: 14 }; g.hands = null; g.dove = false; g.shot = null; g.tele = null }

  const startShoot = useCallback(() => {
    resetKick()
    g.t0 = performance.now()
    setPhase('aimX')
  }, [])

  // the shooter shows where he's going (the closing ring), then kicks
  const startKeep = useCallback(() => {
    resetKick()
    const r = Math.random()
    const target = r < 0.08
      ? { x: Math.random() < 0.5 ? rand(170, 205) : rand(595, 630), y: rand(150, 300) } // wide
      : r < 0.12
        ? { x: rand(260, 540), y: rand(92, 108) } // over the bar
        : clampToGoal({ x: Math.random() < 0.75 ? (Math.random() < 0.5 ? rand(240, 320) : rand(480, 560)) : rand(330, 470), y: rand(140, 300) }, 14, 14)
    const warn = Math.max(520, 950 - g.kicks * 45)
    g.tele = { target, start: performance.now(), dur: warn }
    setPhase('keep')
    later(() => {
      g.shot = { from: { ...SPOT }, to: target, start: performance.now(), dur: 620, by: 'cpu' }
    }, warn)
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
          g.verdict = verdict
          setPhase('over')
          if (verdict === 'win') unlock('penalty')
        } else if (by === 'you') startKeep()
        else startShoot()
      }, 1400)
      return next
    })
  }, [startKeep, startShoot])

  // animation loop: aiming swings, warning ring and ball flight
  useEffect(() => {
    if (!['aimX', 'aimY', 'shot', 'keep', 'banner'].includes(phase)) return
    let raf
    const speed = 1 + g.kicks * 0.06
    const frame = (now) => {
      const t = (now - g.t0) / 1000
      if (phase === 'aimX') g.aim = { x: AIM_X.mid + Math.sin(t * 2.6 * speed) * AIM_X.amp, y: AIM_Y.mid }
      if (phase === 'aimY') g.aim = { ...g.aim, y: AIM_Y.mid + Math.sin(t * 3.2 * speed) * AIM_Y.amp }
      if (g.shot) {
        const s = g.shot
        const p = Math.min(1, (now - s.start) / s.dur)
        const e = 1 - Math.pow(1 - p, 2)
        g.ball = {
          x: lerp(s.from.x, s.to.x, e),
          y: lerp(s.from.y, s.to.y, e) - (s.after ? 0 : Math.sin(Math.PI * e) * 30),
          r: s.after ? 8 : lerp(14, 8, e),
        }
        if (p >= 1 && !s.after) {
          const reach = s.by === 'you' ? 58 : (g.dove ? 64 : 46)
          const result = outcome(s.to, g.hands || STANDING, reach)
          g.tele = null
          // after the moment of truth: into the net, off a glove, or away
          const away = s.to.x < 400 ? -1 : 1
          const next = {
            save: { x: s.to.x + away * 90, y: s.to.y + 70, dur: 420 },
            goal: { x: lerp(s.to.x, 400, 0.12), y: s.to.y + 10, dur: 260 },
            post: { x: s.to.x + away * 60, y: s.to.y + 130, dur: 480 },
          }[result]
          g.shot = next ? { from: { ...s.to }, to: next, start: now, dur: next.dur, by: s.by, after: true } : null
          finishKick(s.by, result)
        } else if (s.after && p >= 1) g.shot = null
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
    // the keeper reads some shots and guesses on the rest
    const guess = Math.random() < 0.28
      ? clampToGoal({ x: target.x + rand(-45, 45), y: target.y + rand(-40, 40) }, 40, 28)
      : KEEPER_ZONES[Math.floor(Math.random() * KEEPER_ZONES.length)]
    later(() => { g.hands = guess; g.dove = true }, 150)
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
    if (g.dove || (g.shot && g.shot.after)) return
    g.dove = true
    g.hands = clampToGoal(point)
  }

  const start = () => { setScore({ you: [], cpu: [] }); g.kicks = 0; g.verdict = null; startShoot() }

  const act = (e) => {
    if (phase === 'aimX') { g.t0 = performance.now(); setPhase('aimY') }
    else if (phase === 'aimY') shoot()
    else if (phase === 'keep' && e?.clientX !== undefined) dive(toSvg(e))
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (phase === 'intro' || phase === 'over') start()
        else act()
      }
      if (phase === 'keep' && KEY_ZONES[e.key]) { e.preventDefault(); dive(KEY_ZONES[e.key]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const you = score.you.filter(r => r === 'goal').length
  const cpu = score.cpu.filter(r => r === 'goal').length
  const keeping = phase === 'keep' || (phase === 'banner' && score.cpu.length === score.you.length && score.you.length > 0)
  const sudden = score.you.length >= 5 && score.cpu.length >= 5
  const hint = {
    aimX: 'Click or Space: lock direction',
    aimY: 'Click or Space: lock height and shoot',
    keep: 'Watch the ring, then click there (or ← ↑ → ↓) to dive',
  }[phase] || ' '
  const showAim = phase === 'aimX' || phase === 'aimY'
  const tele = g.tele
  const teleP = tele ? Math.min(1, (performance.now() - tele.start) / tele.dur) : 0

  return (
    <div className="penalty" role="dialog" aria-label="Penalty shootout">
      <div className="pk-panel">
        <div className="pk-head">
          <div className="pk-board">
            <span className="pk-team">You</span>
            <Dots results={score.you} />
            <span className="pk-score">{you}<i>:</i>{cpu}</span>
            <Dots results={score.cpu} />
            <span className="pk-team">Keeper FC</span>
          </div>
          <button type="button" className="pk-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="pk-stage">
          <svg ref={svgRef} className="pk-scene" viewBox="0 0 800 480" onPointerDown={act}>
            <defs>
              <pattern id="pk-net" width="14" height="14" patternUnits="userSpaceOnUse">
                <path d="M14 0 L0 0 L0 14" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
              </pattern>
              <linearGradient id="pk-grass" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#163020" />
                <stop offset="1" stopColor="#0f1f15" />
              </linearGradient>
              <radialGradient id="pk-glow" cx="0.5" cy="0.25" r="0.7">
                <stop offset="0" stopColor="rgba(190,255,120,0.07)" />
                <stop offset="1" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>

            <rect width="800" height="480" fill="#0b0d12" />
            <rect y={GOAL.bottom} width="800" height={480 - GOAL.bottom} fill="url(#pk-grass)" />
            <rect width="800" height="480" fill="url(#pk-glow)" />
            <g className="pk-lines">
              <path d={`M0 ${GOAL.bottom} H800`} />
              <path d={`M150 ${GOAL.bottom} L118 352 H682 L650 ${GOAL.bottom}`} />
              <ellipse cx={SPOT.x} cy={SPOT.y + 12} rx="5" ry="1.6" />
            </g>

            {/* net: back plane and sides, then the frame on top of the keeper */}
            <rect x={GOAL.l + 22} y={GOAL.top + 16} width={GOAL.r - GOAL.l - 44} height={GOAL.bottom - GOAL.top - 18} fill="url(#pk-net)" />
            <path d={`M${GOAL.l} ${GOAL.top} L${GOAL.l + 22} ${GOAL.top + 16} V${GOAL.bottom - 2} M${GOAL.r} ${GOAL.top} L${GOAL.r - 22} ${GOAL.top + 16} V${GOAL.bottom - 2} M${GOAL.l + 22} ${GOAL.top + 16} H${GOAL.r - 22}`} className="pk-net-edge" />

            <Keeper hands={g.hands} />

            <path d={`M${GOAL.l} ${GOAL.bottom} V${GOAL.top} H${GOAL.r} V${GOAL.bottom}`} className="pk-frame" />

            {tele && (
              <g className="pk-tele" transform={`translate(${tele.target.x} ${tele.target.y})`}>
                <circle r={lerp(52, 15, teleP)} className="ring" />
                <circle r="4" className="dot" />
              </g>
            )}

            <Ball {...g.ball} />

            {showAim && (
              <g className="pk-aim">
                {phase === 'aimX'
                  ? <line x1={g.aim.x} y1="86" x2={g.aim.x} y2={GOAL.bottom + 6} />
                  : <line x1={AIM_X.mid - AIM_X.amp} y1={g.aim.y} x2={AIM_X.mid + AIM_X.amp} y2={g.aim.y} />}
                <circle cx={g.aim.x} cy={g.aim.y} r="16" />
                <circle cx={g.aim.x} cy={g.aim.y} r="2.5" className="dot" />
              </g>
            )}
          </svg>

          {banner && <div className={`pk-banner ${banner.good ? 'good' : 'bad'}`} key={`${score.you.length}-${score.cpu.length}`}>{banner.text}</div>}

          {phase === 'intro' && (
            <div className="pk-card">
              <div className="pk-kicker">Penalty shootout</div>
              <h3>You vs. <em>Keeper FC</em></h3>
              <ul>
                <li><b>Shoot</b> Click once to lock the direction, again to lock the height.</li>
                <li><b>Keep</b> A ring shows where they'll shoot. Click it (or use the arrows) before the ball arrives.</li>
                <li><b>Win</b> Best of five, then sudden death.</li>
              </ul>
              <button type="button" className="btn" onClick={start}><span>Kick off</span><span className="arrow">→</span></button>
            </div>
          )}

          {phase === 'over' && (
            <div className="pk-card">
              <div className="pk-kicker">{sudden ? 'After sudden death' : 'Full time'}</div>
              <h3>{g.verdict === 'win' ? <>You <em>win.</em></> : <>Keeper FC <em>wins.</em></>}</h3>
              <div className="pk-final">{you} : {cpu}</div>
              <div className="pk-actions">
                <button type="button" className="btn" onClick={start}><span>Rematch</span></button>
                <button type="button" className="pk-text-btn" onClick={onClose}>Close</button>
              </div>
            </div>
          )}
        </div>

        <div className="pk-foot">
          <span className="pk-turn">{phase === 'intro' || phase === 'over' ? '' : keeping ? 'You keep' : 'You shoot'}{sudden && phase !== 'over' ? ' · Sudden death' : ''}</span>
          <span className="pk-hint">{hint}</span>
        </div>
      </div>
    </div>
  )
}
