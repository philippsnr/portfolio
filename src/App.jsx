import { useEffect, useRef, useState } from 'react'
import { Cursor, Magnetic, Reveal, BgGlow, Clock, makeAscii, ScrambleOnView, HeroSpotlight, GridBg, NowStatus, SkillBar, LVL_MAP, ParticleNet } from './components.jsx'

const PROJECTS = [
  {
    num: '01',
    name: 'Manager United',
    sub: 'Real-Time Football Manager',
    role: 'Backend / Cloud',
    tags: ['Laravel', 'Kubernetes', 'MariaDB'],
    year: '2023 – Now',
    preview: `${import.meta.env.BASE_URL}assets/preview-manager-united.png`,
    link: 'https://manager-united.de',
  },
  {
    num: '02',
    name: 'ANNA',
    sub: 'AI Vision System',
    role: 'Deep Learning',
    tags: ['Python', 'Deep Learning', 'Image Processing'],
    year: '2025–26',
    preview: null,
    link: 'https://github.com/philippsnr',
  },
  {
    num: '03',
    name: 'Fitness Tracker',
    sub: 'Android App',
    role: 'Mobile / Java',
    tags: ['Java', 'Android', 'SQLite'],
    year: '2025',
    preview: null,
    link: 'https://github.com/philippsnr',
  },
  {
    num: '04',
    name: 'Advance Wars',
    sub: 'Turn-Based Strategy Game',
    role: 'Game Dev / Java',
    tags: ['Java', 'OOP', 'Game Design'],
    year: '2024',
    preview: null,
    link: 'https://github.com/philippsnr',
  },
]

const SKILLS = [
  { cat: 'Programming', items: [
    { name: 'Python', lvl: 'Daily', icon: 'devicon-python-plain' },
    { name: 'Java', lvl: 'Daily', icon: 'devicon-java-plain' },
    { name: 'JavaScript', lvl: 'Comfortable', icon: 'devicon-javascript-plain' },
    { name: 'PHP', lvl: 'Comfortable', icon: 'devicon-php-plain' },
    { name: 'HTML', lvl: 'Comfortable', icon: 'devicon-html5-plain' },
    { name: 'CSS', lvl: 'Comfortable', icon: 'devicon-css3-plain' },
  ]},
  { cat: 'AI & Data', items: [
    { name: 'PyTorch', lvl: 'Daily', icon: 'devicon-pytorch-original' },
    { name: 'TensorFlow', lvl: 'Comfortable', icon: 'devicon-tensorflow-original' },
    { name: 'OpenCV', lvl: 'Daily', icon: 'devicon-opencv-plain' },
    { name: 'Databricks', lvl: 'Comfortable', icon: null, iconText: 'DB' },
    { name: 'NumPy', lvl: 'Comfortable', icon: 'devicon-numpy-plain' },
    { name: 'Pandas', lvl: 'Comfortable', icon: 'devicon-pandas-plain' },
  ]},
  { cat: 'DevOps & Cloud', items: [
    { name: 'Docker', lvl: 'Daily', icon: 'devicon-docker-plain' },
    { name: 'Kubernetes', lvl: 'Comfortable', icon: 'devicon-kubernetes-plain' },
    { name: 'Rancher', lvl: 'Comfortable', icon: 'devicon-rancher-original' },
    { name: 'Linux', lvl: 'Native', icon: 'devicon-linux-plain' },
    { name: 'Bash', lvl: 'Comfortable', icon: 'devicon-bash-plain' },
    { name: 'GitHub Actions', lvl: 'Comfortable', icon: 'devicon-github-plain' },
  ]},
]

const ICON_MAP = {
  'Python': 'devicon-python-plain',
  'Java': 'devicon-java-plain',
  'JavaScript': 'devicon-javascript-plain',
  'PHP': 'devicon-php-plain',
  'HTML': 'devicon-html5-plain',
  'CSS': 'devicon-css3-plain',
  'PyTorch': 'devicon-pytorch-original',
  'TensorFlow': 'devicon-tensorflow-original',
  'OpenCV': 'devicon-opencv-plain',
  'Databricks': null,
  'NumPy': 'devicon-numpy-plain',
  'Pandas': 'devicon-pandas-plain',
  'Docker': 'devicon-docker-plain',
  'Kubernetes': 'devicon-kubernetes-plain',
  'Rancher': 'devicon-rancher-original',
  'Linux': 'devicon-linux-plain',
  'Bash': 'devicon-bash-plain',
  'GitHub Actions': 'devicon-github-plain',
  'Laravel': 'devicon-laravel-plain',
  'MariaDB': 'devicon-mariadb-plain',
}


function Counter({ to, suffix = '', duration = 1400 }) {
  const ref = useRef(null)
  const [val, setVal] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.unobserve(el)
      const start = performance.now()
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - t, 3)
        setVal(Math.round(to * eased))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [to, duration])
  return <span ref={ref}>{val}{suffix}</span>
}

function PhotoCard() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); io.unobserve(el) }
    }, { threshold: 0.15 })
    io.observe(el)
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.setProperty('--rx', `${-y * 6}deg`)
      el.style.setProperty('--ry', `${x * 6}deg`)
    }
    const reset = () => {
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', reset)
    return () => {
      io.disconnect()
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', reset)
    }
  }, [])
  return (
    <div className="about-photo reveal" ref={ref}>
      <span className="corner tl"></span>
      <span className="corner tr"></span>
      <span className="corner bl"></span>
      <span className="corner br"></span>
      <img src={`${import.meta.env.BASE_URL}assets/philipp.png`} alt="Philipp Staudinger" />
      <div className="photo-meta">
        <span>P. STAUDINGER · 2005</span>
        <span className="accent">● 21</span>
      </div>
    </div>
  )
}

function useScrollIndicators() {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState('intro')
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? window.scrollY / max : 0)
      const sections = ['intro', 'about', 'work', 'stack', 'contact']
      const mid = window.scrollY + window.innerHeight * 0.4
      let cur = 'intro'
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= mid) cur = id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return { progress, active }
}

function Hero() {
  return (
    <section className="hero shell" id="intro">
      <HeroSpotlight />
      <div>
        <div className="hero-eyebrow"><span className="bar"></span><ScrambleOnView>PORTFOLIO / 2026</ScrambleOnView></div>
        <div className="hero-name-row">
          <div className="hero-name">
            <span className="line">
              <span className="word delay-1">Philipp Staudinger<span className="accent">.</span></span>
            </span>
          </div>
          <div className="hero-tagline">
            <span className="tag-label">— Short version</span>
            <p>CS student in <em>Friedrichshafen</em>. Specializing in <em>Intelligent Systems</em>: machine learning, computer vision, and backend engineering.</p>
          </div>
        </div>
        <h1 className="hero-title">
          <span className="line"><span className="word delay-1"><ScrambleOnView delay={300}>Code.</ScrambleOnView></span></span>
          <span className="line"><span className="word delay-2"><ScrambleOnView delay={600}>Software. <em>AI.</em></ScrambleOnView></span></span>
        </h1>
      </div>
      <div className="hero-meta">
        <div className="cell">
          <div className="cell-label">Currently</div>
          <div className="cell-value">Dual Student in Software Engineering & AI at Rolls-Royce Solutions, alongside a B.Sc. at DHBW Ravensburg.</div>
        </div>
        <div className="cell">
          <div className="cell-label">Based in</div>
          <div className="cell-value">
            Friedrichshafen, Germany<br/>
            <span style={{ color: 'var(--muted)' }}>47.65°N&nbsp;&nbsp;9.48°E</span>
          </div>
        </div>
        <div className="cell">
          <div className="cell-label">Get in touch</div>
          <div className="cell-value">
            <Magnetic strength={0.25}>
              <a href="#contact" className="btn">
                <span>Say hello</span>
                <span className="arrow">→</span>
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  )
}

function About() {
  return (
    <section className="section shell" id="about">
      <Reveal as="div" className="section-header">
        <div className="index">02 / About</div>
        <h2 className="title">A bit about <em>me.</em></h2>
        <div className="meta">DHBW · ROLLS-ROYCE<br/>FRIEDRICHSHAFEN · DE</div>
      </Reveal>

      <div className="about-grid">
        <PhotoCard />

        <div className="about-copy">
          <Reveal as="h3">— Background</Reveal>
          <Reveal delay={100}><p>
            I'm <em>Philipp</em>, a CS student specializing in <em>Intelligent Systems</em> at DHBW Ravensburg, paired with a dual programme at Rolls-Royce Solutions in Friedrichshafen.
          </p></Reveal>
          <Reveal delay={200}><p>
            My work sits between machine learning, computer vision and backend engineering — currently building an AI vision system for industrial piston inspection as my bachelor thesis.
          </p></Reveal>
          <Reveal as="div" className="about-stats" delay={400}>
            <div className="stat"><div className="num"><Counter to={3} suffix="" /></div><div className="lbl">Years studying CS</div></div>
            <div className="stat"><div className="num"><Counter to={2} /></div><div className="lbl">Active projects</div></div>
            <div className="stat"><div className="num"><Counter to={100} suffix="k+" /></div><div className="lbl">Lines of code</div></div>
          </Reveal>

        </div>
      </div>
    </section>
  )
}

function Projects() {
  const [hover, setHover] = useState(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const onMove = (e) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section className="section shell projects" id="work">
      <Reveal as="div" className="section-header">
        <div className="index">03 / Selected Work</div>
        <h2 className="title">Things I'm <em>building.</em></h2>
        <div className="meta">2023 — 2026<br/>04 PROJECTS</div>
      </Reveal>

      <div className="project-list">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.num} delay={i * 60}>
            <a
              className="project-row"
              href={p.link || '#'}
              target={p.link ? '_blank' : undefined}
              rel={p.link ? 'noreferrer' : undefined}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="num">{p.num}</span>
              <span className="name">{p.name}<em>— {p.sub}</em></span>
              <span className="role">{p.role}</span>
              <span className="tags">{p.tags.map(t => <span key={t}>{t}</span>)}</span>
              <span className="year">{p.year} ↗</span>
            </a>
          </Reveal>
        ))}
      </div>

      <div
        className={`project-preview ${hover !== null ? 'visible' : ''}`}
        style={{ left: pos.x, top: pos.y }}
      >
        {hover !== null && PROJECTS[hover].preview ? (
          <img
            src={PROJECTS[hover].preview}
            alt={PROJECTS[hover].name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        ) : (
          <div className="frame">
            <pre className="ascii">{hover !== null ? makeAscii(hover * 7919 + 13) : ''}</pre>
          </div>
        )}
        <div className="label">{hover !== null ? `${PROJECTS[hover].name} / preview` : ''}</div>
      </div>
    </section>
  )
}

function Skills() {
  const tags = ['Python', 'Java', 'JavaScript', 'PHP', 'HTML', 'CSS', 'PyTorch', 'TensorFlow', 'OpenCV', 'Databricks', 'NumPy', 'Pandas', 'Docker', 'Kubernetes', 'Rancher', 'Linux', 'Bash', 'Laravel', 'MariaDB']
  const items = [...tags, ...tags]
  return (
    <section className="section shell" id="stack">
      <Reveal as="div" className="section-header">
        <div className="index">04 / Stack</div>
        <h2 className="title">What I <em>work with.</em></h2>
        <div className="meta">UPDATED · 05.26</div>
      </Reveal>

      <Reveal as="div" className="skills-grid">
        {SKILLS.map((s) => (
          <div key={s.cat} className="skill-cat">
            <div className="cat-label"><span>{s.cat}</span></div>
            <ul>
              {s.items.map(it => (
                <li key={it.name}>
                  <span className="sk-name">
                    {it.icon && <i className={`${it.icon} colored`}></i>}
                    {!it.icon && it.iconText && <span className="icon-text">{it.iconText}</span>}
                    {it.name}
                  </span>
                  <SkillBar level={LVL_MAP[it.lvl] || 50} />
                  <span className="lvl">{it.lvl}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Reveal>

      <div className="skills-strip">
        <div className="track">
          {items.map((t, i) => (
            <span key={i} className="pill">
              {ICON_MAP[t] && <i className={`${ICON_MAP[t]} colored`}></i>}
              {ICON_MAP[t] === null && <span className="icon-text">DB</span>}
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section className="contact shell" id="contact">
      <Reveal as="div" className="contact-eyebrow">05 / Contact</Reveal>
      <Reveal>
        <h2 className="contact-headline">
          Got a project<br/>in mind? <em>Let's talk.</em>
        </h2>
      </Reveal>

      <Reveal delay={150}>
        <a className="contact-email" href="mailto:contact@philipp-staudinger.com">
          <span>contact@philipp-staudinger.com</span>
          <span className="arrow">↗</span>
        </a>
      </Reveal>

      <div className="contact-grid">
        <Reveal delay={50}>
          <a className="social-card" href="https://github.com/philippsnr" target="_blank" rel="noreferrer">
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <div className="social-info">
              <span className="lbl">GitHub</span>
              <span className="val">@philippsnr</span>
            </div>
            <span className="arrow">↗</span>
          </a>
        </Reveal>
        <Reveal delay={120}>
          <a className="social-card" href="https://www.linkedin.com/in/philipp-staudinger-a6b079178/" target="_blank" rel="noreferrer">
            <svg className="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <div className="social-info">
              <span className="lbl">LinkedIn</span>
              <span className="val">Philipp Staudinger</span>
            </div>
            <span className="arrow">↗</span>
          </a>
        </Reveal>
      </div>
    </section>
  )
}

const NAV_ITEMS = [['intro','Intro'],['about','About'],['work','Work'],['stack','Stack'],['contact','Contact']]

export default function App() {
  const { progress, active } = useScrollIndicators()
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <>
      <BgGlow />
      <GridBg />
      <ParticleNet />
      <Cursor />
      <div className="grain"></div>

      <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }}></div>

      <nav className="nav">
        <div className="nav-logo">
          <span className="dot"></span>
          <span>P.STAUDINGER / DEV</span>
        </div>
        <div className="nav-links">
          {NAV_ITEMS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? 'active' : ''}>{label}</a>
          ))}
        </div>
        <button
          className={`nav-hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span></span><span></span><span></span>
        </button>
      </nav>

      <div className={`nav-mobile-overlay${menuOpen ? ' open' : ''}`}>
        {NAV_ITEMS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={active === id ? 'active' : ''} onClick={() => setMenuOpen(false)}>
            {label}
          </a>
        ))}
      </div>

      <Hero />
      <About />
      <Projects />
      <Skills />
      <Contact />

      <footer className="footer shell">
        <span>© 2026 — PHILIPP STAUDINGER</span>
        <span>FRIEDRICHSHAFEN · <Clock /></span>
        <span>BUILT WITH CARE</span>
      </footer>

      <div className="status-strip">
        <span className="live"><NowStatus /></span>
        <span>SECTION · {active.toUpperCase()}</span>
        <span>{Math.round(progress * 100)}% scrolled</span>
      </div>
    </>
  )
}
