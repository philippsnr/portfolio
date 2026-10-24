import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { startPenalty } from './PenaltyGame.jsx'
import { SECRETS, SECRET_COUNT, foundSecrets, unlock, startMatrix, celebrateGoal, selfDestruct, typingPrefix } from './easterEggs.jsx'

const SECRET = 'sudo hire philipp'
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
const EMAIL = 'contact@philipp-staudinger.com'
const PROMPT = 'guest@staudinger:~$'

const BANNER = [
  'Welcome to philipp-os 2.6 (tty1)',
  "You found the secret terminal. Type 'help' to get started.",
]

const COFFEE = [
  '      ( (',
  '       ) )',
  '    ........',
  '    |      |]',
  '    \\      /',
  "     `----'",
  'brewing… ☕ done. back to work.',
]

// returns the lines to print, plus an optional side effect for the terminal to run
function runCommand(raw, { projects, skills }) {
  const cmd = raw.trim().replace(/\s+/g, ' ')
  switch (cmd.toLowerCase()) {
    case '':
      return { lines: [] }
    case 'help':
      return { lines: [
        'available commands:',
        '  whoami            who is this guy?',
        '  ls                what is in here',
        '  ls projects       things I built',
        '  skills            what I work with',
        '  contact           how to reach me',
        '  cat resume.pdf    open my CV',
        '  coffee            take a break',
        '  play              snake, obviously',
        '  penalty           penalty shootout vs. Keeper FC',
        '  train             train a very serious model',
        '  matrix            follow the white rabbit',
        '  goal              ⚽',
        '  secrets           achievements found so far',
        '  sudo hire philipp you know you want to',
        '  clear / exit',
      ] }
    case 'whoami':
      return { lines: [
        'philipp staudinger',
        'M.Sc. Computer Science (AI & Data Science) @ OTH Regensburg',
        'Working Student @ nfaculty GmbH',
        'B.Sc. Intelligent Systems @ DHBW Ravensburg × Rolls-Royce Solutions',
      ] }
    case 'ls':
      return { lines: ['projects/   resume.pdf   secrets.txt'] }
    case 'ls projects':
    case 'ls projects/':
      return { lines: projects.map(p => `drwxr-xr-x  ${p.year.padEnd(11)} ${p.name}`) }
    case 'skills':
      return { lines: skills.map(s => `${s.cat.padEnd(15)} ${s.items.map(i => i.name).join(', ')}`) }
    case 'contact':
      return { lines: [`mail     ${EMAIL}`, 'github   github.com/philippsnr'] }
    case 'cat resume.pdf':
    case 'open resume.pdf':
      return { lines: ['opening resume.pdf…'], action: 'resume' }
    case 'cat secrets.txt':
    case 'secrets': {
      const found = foundSecrets()
      return { lines: [
        `${found.length}/${SECRET_COUNT} secrets found`,
        ...Object.entries(SECRETS).map(([id, name]) => found.includes(id) ? `  ✓ ${name}` : '  ? ???'),
      ] }
    }
    case 'coffee':
      return { lines: COFFEE, action: 'coffee' }
    case 'play':
    case 'snake':
      return { lines: ['starting snake… arrows / WASD to move, Q to quit'], action: 'play' }
    case 'matrix':
      return { lines: ['wake up, neo…'], action: 'matrix' }
    case 'penalty':
      return { lines: ['⚽ kicking off the penalty shootout…'], action: 'penalty' }
    case 'train':
      return { lines: ['loading dataset: candidates.csv (1 row)…'], action: 'train' }
    case 'goal':
      return { lines: ['⚽ GOOOAL!'], action: 'goal' }
    case 'sudo hire philipp':
      return { lines: ['[sudo] password for recruiter: ********', 'access granted ✓', 'opening mail client…'], action: 'hire' }
    case 'sudo':
      return { lines: ['usage: sudo hire philipp'] }
    case 'rm -rf /':
      return { lines: ['rm: permission denied. (did you mean sudo?)'] }
    case 'sudo rm -rf /':
      return { lines: ['deleting /home/philipp …', 'deleting /usr/bin/coffee …', 'deleting everything …'], action: 'destruct' }
    default:
      return { lines: [`command not found: ${cmd.split(' ')[0]}. Type 'help'.`] }
  }
}

// === Fake model training ===
function trainingScript() {
  const epochs = 10
  const losses = Array.from({ length: epochs }, (_, i) => +(1.4 * Math.exp(-0.42 * i) + 0.02 + Math.random() * 0.03).toFixed(3))
  const spark = '▁▂▃▄▅▆▇█'
  const max = losses[0]
  const lines = ['model: HireNet-v2 (1 parameter: philipp)', '']
  losses.forEach((loss, i) => {
    const bar = '█'.repeat(i + 1) + '░'.repeat(epochs - i - 1)
    const acc = (1 - loss / (max * 1.08)).toFixed(3)
    lines.push(`epoch ${String(i + 1).padStart(2, '0')}/${epochs}  [${bar}]  loss ${loss.toFixed(3)}  acc ${acc}`)
  })
  lines.push('', `loss curve  ${losses.map(l => spark[Math.min(7, Math.round((l / max) * 7))]).join('')}`)
  lines.push('', 'evaluating on test set… accuracy: 99.7%', 'model concluded: you should hire philipp. ✓')
  return lines
}

// === Snake, rendered as text inside the terminal ===
const COLS = 28, ROWS = 12
const DIRS = {
  ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0],
}

function Snake({ onExit }) {
  const randomFood = (snake) => {
    let f
    do { f = [Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)] }
    while (snake.some(([x, y]) => x === f[0] && y === f[1]))
    return f
  }
  const init = () => {
    const snake = [[6, 6], [5, 6], [4, 6]]
    return { snake, dir: [1, 0], food: randomFood(snake), score: 0, over: false }
  }
  const [game, setGame] = useState(init)
  const nextDir = useRef([1, 0])
  const exitRef = useRef(onExit)
  exitRef.current = onExit
  const scoreRef = useRef(0)
  scoreRef.current = game.score

  useEffect(() => {
    const onKey = (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === 'q' || key === 'Escape') {
        e.preventDefault(); e.stopImmediatePropagation()
        exitRef.current(scoreRef.current)
        return
      }
      const d = DIRS[key]
      if (!d) return
      e.preventDefault(); e.stopImmediatePropagation()
      setGame(g => {
        if (g.over) { nextDir.current = [1, 0]; return init() }
        // no turning back into yourself
        if (d[0] !== -g.dir[0] || d[1] !== -g.dir[1]) nextDir.current = d
        return g
      })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  useEffect(() => {
    if (game.over) return
    const id = setTimeout(() => {
      setGame(g => {
        const dir = nextDir.current
        const [hx, hy] = g.snake[0]
        const head = [(hx + dir[0] + COLS) % COLS, (hy + dir[1] + ROWS) % ROWS]
        if (g.snake.some(([x, y]) => x === head[0] && y === head[1])) return { ...g, over: true }
        const ate = head[0] === g.food[0] && head[1] === g.food[1]
        const snake = [head, ...g.snake]
        if (!ate) snake.pop()
        return { ...g, dir, snake, food: ate ? randomFood(snake) : g.food, score: g.score + (ate ? 1 : 0) }
      })
    }, Math.max(60, 130 - game.score * 4))
    return () => clearTimeout(id)
  }, [game])

  const rows = []
  for (let y = 0; y < ROWS; y++) {
    let row = ''
    for (let x = 0; x < COLS; x++) {
      const i = game.snake.findIndex(([sx, sy]) => sx === x && sy === y)
      row += i === 0 ? '@' : i > 0 ? 'o' : (game.food[0] === x && game.food[1] === y) ? '*' : '·'
    }
    rows.push(row)
  }
  return (
    <div className="snake">
      <div className="snake-head">
        <span>score {game.score}</span>
        <span>{game.over ? 'game over — arrow key to retry, Q to quit' : 'Q to quit'}</span>
      </div>
      <pre>{rows.join('\n')}</pre>
    </div>
  )
}

export const openTerminal = (cmd) => window.dispatchEvent(new CustomEvent('ps-terminal', { detail: { cmd } }))

export function SecretTerminal({ projects, skills }) {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState(BANNER)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const [playing, setPlaying] = useState(false)
  // 'busy' while output is still streaming in
  const [mode, setMode] = useState(null)
  const timers = useRef([])
  const inputRef = useRef(null)
  const bodyRef = useRef(null)

  // listen for the secret phrase or the Konami code anywhere on the page
  useEffect(() => {
    let typed = ''
    let konami = 0
    const onKey = (e) => {
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      konami = e.key === KONAMI[konami] ? konami + 1 : (e.key === KONAMI[0] ? 1 : 0)
      if (e.key.length === 1) typed = (typed + e.key.toLowerCase()).slice(-SECRET.length)
      // don't let the space bar scroll the page while someone is typing the phrase
      if (e.key === ' ' && typingPrefix(typed, SECRET, 4)) e.preventDefault()
      if (konami === KONAMI.length || typed === SECRET) {
        e.preventDefault() // keep the triggering key out of the terminal input
        konami = 0; typed = ''
        setOpen(true)
        unlock('terminal')
      }
    }
    window.addEventListener('keydown', onKey)
    console.log('%c psst… type "sudo hire philipp" anywhere on the page.', 'color:#a3e635;font-family:monospace')
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // opened from the nav button or the secrets counter, optionally running a command
  useEffect(() => {
    const onOpen = (e) => {
      setOpen(true)
      unlock('terminal')
      const cmd = e.detail?.cmd
      if (cmd) setLines(l => [...l, `${PROMPT} ${cmd}`, ...runCommand(cmd, { projects, skills }).lines])
    }
    window.addEventListener('ps-terminal', onOpen)
    return () => window.removeEventListener('ps-terminal', onOpen)
  }, [projects, skills])

  useEffect(() => {
    if (!open || playing) return
    inputRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, playing])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines, open, playing])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const streamLines = (out, onDone) => {
    setMode('busy')
    out.forEach((line, i) => {
      timers.current.push(setTimeout(() => {
        setLines(l => [...l, line])
        if (i === out.length - 1) { setMode(null); onDone?.() }
      }, 260 * (i + 1)))
    })
  }

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'busy') return
    const cmd = input.trim().toLowerCase()
    setInput('')
    setHistIdx(-1)
    if (cmd) setHistory(h => [...h, input])
    if (cmd === 'clear') { setLines([]); return }
    if (cmd === 'exit') { setOpen(false); setLines(BANNER); return }
    const { lines: output, action } = runCommand(input, { projects, skills })
    setLines(l => [...l, `${PROMPT} ${input}`, ...output])
    if (action) runAction(action)
  }

  const runAction = (action) => {
    switch (action) {
      case 'play': setPlaying(true); unlock('snake'); break
      case 'penalty': setTimeout(() => { setOpen(false); startPenalty() }, 600); break
      case 'train': streamLines(trainingScript(), () => unlock('train')); break
      case 'coffee': unlock('coffee'); break
      case 'matrix': setTimeout(() => { setOpen(false); startMatrix() }, 700); break
      case 'goal': setTimeout(() => { setOpen(false); celebrateGoal() }, 400); break
      case 'destruct': setTimeout(() => { setOpen(false); selfDestruct() }, 900); break
      case 'resume': window.open(`${import.meta.env.BASE_URL}assets/resume.pdf`, '_blank', 'noopener'); break
      case 'hire':
        setTimeout(() => { window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Let's work together")}` }, 1200)
        break
    }
  }

  const endGame = (score) => {
    setPlaying(false)
    setLines(l => [...l, `snake: game over, score ${score}`])
  }

  const onInputKey = (e) => {
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault()
      const i = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(i); setInput(history[i])
    } else if (e.key === 'ArrowDown' && histIdx !== -1) {
      e.preventDefault()
      const i = histIdx + 1
      if (i >= history.length) { setHistIdx(-1); setInput('') } else { setHistIdx(i); setInput(history[i]) }
    }
  }

  if (!open) return null
  return createPortal(
    <div className="terminal" role="dialog" aria-label="Secret terminal" onClick={() => inputRef.current?.focus()}>
      <div className="terminal-bar">
        <span className="dots"><i onClick={() => setOpen(false)}></i><i></i><i></i></span>
        <span>philipp-os — bash</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close terminal">×</button>
      </div>
      <div className="terminal-body" ref={bodyRef}>
        {lines.map((l, i) => <div key={i} className={l.startsWith(PROMPT) ? 'cmd' : ''}>{l || ' '}</div>)}
        {playing ? <Snake onExit={endGame} /> : <form onSubmit={submit} className="terminal-input">
          <span className="prompt">{mode === 'busy' ? '' : PROMPT}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onInputKey}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="Terminal input"
          />
        </form>}
      </div>
    </div>,
    document.body
  )
}
