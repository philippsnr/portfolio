import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const SECRET = 'sudo hire philipp'
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
const EMAIL = 'contact@philipp-staudinger.com'
const PROMPT = 'guest@staudinger:~$'

const BANNER = [
  'Welcome to philipp-os 2.6 (tty1)',
  "You found the secret terminal. Type 'help' to get started.",
]

// true once the last few typed characters are the start of the secret phrase
function typingSecret(typed) {
  for (let k = typed.length; k >= 4; k--) {
    if (SECRET.startsWith(typed.slice(-k))) return true
  }
  return false
}

function runCommand(raw, { projects, skills }) {
  const cmd = raw.trim().replace(/\s+/g, ' ')
  switch (cmd.toLowerCase()) {
    case '':
      return []
    case 'help':
      return [
        'available commands:',
        '  whoami            who is this guy?',
        '  ls projects       things I built',
        '  skills            what I work with',
        '  contact           how to reach me',
        '  sudo hire philipp you know you want to',
        '  clear             clear the screen',
        '  exit              close the terminal',
      ]
    case 'whoami':
      return [
        'philipp staudinger',
        'M.Sc. Computer Science (AI & Data Science) @ OTH Regensburg',
        'Working Student @ nfaculty GmbH',
        'B.Sc. Intelligent Systems @ DHBW Ravensburg × Rolls-Royce Solutions',
      ]
    case 'ls':
    case 'ls projects':
      return projects.map(p => `drwxr-xr-x  ${p.year.padEnd(11)} ${p.name}`)
    case 'skills':
      return skills.map(s => `${s.cat.padEnd(15)} ${s.items.map(i => i.name).join(', ')}`)
    case 'contact':
      return [`mail     ${EMAIL}`, 'github   github.com/philippsnr']
    case 'sudo hire philipp':
      setTimeout(() => { window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Let's work together")}` }, 1200)
      return ['[sudo] password for recruiter: ********', 'access granted ✓', 'opening mail client…']
    case 'sudo':
      return ['usage: sudo hire philipp']
    case 'rm -rf /':
    case 'sudo rm -rf /':
      return ['nice try.']
    default:
      return [`command not found: ${cmd.split(' ')[0]}. Type 'help'.`]
  }
}

export function SecretTerminal({ projects, skills }) {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState(BANNER)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
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
      if (e.key === ' ' && typingSecret(typed)) e.preventDefault()
      if (konami === KONAMI.length || typed === SECRET) {
        e.preventDefault() // keep the triggering key out of the terminal input
        konami = 0; typed = ''
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    console.log('%c psst… type "sudo hire philipp" anywhere on the page.', 'color:#a3e635;font-family:monospace')
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [lines, open])

  const submit = (e) => {
    e.preventDefault()
    const cmd = input.trim().toLowerCase()
    setInput('')
    setHistIdx(-1)
    if (cmd) setHistory(h => [...h, input])
    if (cmd === 'clear') { setLines([]); return }
    if (cmd === 'exit') { setOpen(false); setLines(BANNER); return }
    const output = runCommand(input, { projects, skills })
    setLines(l => [...l, `${PROMPT} ${input}`, ...output])
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
        <form onSubmit={submit} className="terminal-input">
          <span className="prompt">{PROMPT}</span>
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
        </form>
      </div>
    </div>,
    document.body
  )
}
