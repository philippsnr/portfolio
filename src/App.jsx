import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Cursor, Magnetic, Reveal, BgGlow, Clock, makeAscii, ScrambleOnView, BitGlitch, HeroSpotlight, GridBg, NowStatus, SkillBar, LVL_MAP, ParticleNet } from './components.jsx'

const asset = (f) => `${import.meta.env.BASE_URL}assets/${f}`

const PROJECTS = [
  {
    num: '01',
    name: 'Manager United',
    sub: 'Real-Time Football Manager',
    role: 'Full-Stack / Cloud',
    tags: ['Next.js', 'Expo', 'Laravel'],
    year: '2023 – Now',
    preview: asset('preview-manager-united.png'),
    description: 'A real-time football manager game with one codebase and one design system for web and mobile, backed by a Laravel API and an internal ops portal.',
    highlights: [
      'Shared Tamagui design system across the Next.js web app and the Expo mobile app',
      'Laravel 11 API with Filament admin, MariaDB and Redis',
      'Turborepo monorepo with strict TypeScript, tested core logic and CI quality gates',
      'Hosted on Vercel (web, ops) and Cloudways (backend), mobile builds via Expo EAS',
    ],
    stack: ['TypeScript', 'Next.js', 'Expo', 'Tamagui', 'Laravel', 'MariaDB', 'Redis', 'Vercel', 'Cloudways'],
    links: [{ label: 'Visit manager-united.de', url: 'https://manager-united.de' }],
  },
  {
    num: '02',
    name: 'Location Based Service',
    sub: 'Map Explorer PWA',
    role: 'Web / Mobile',
    tags: ['React', 'Leaflet', 'PWA'],
    year: '2026',
    preview: asset('preview-location-based-service.png'),
    description: 'A mobile-first map app built as a Progressive Web App. Tap anywhere on the map to learn about a place: address, Wikipedia summary, key facts, weather, air quality and elevation.',
    highlights: [
      'Place details from Wikipedia and Wikidata, live weather and air quality',
      'Search and nearby points of interest: restaurants, cafés, supermarkets and more',
      'Route planning for car, foot and bike with an elevation profile',
      'Installable and offline-ready; runs entirely on free public APIs, no keys needed',
    ],
    stack: ['React', 'Vite', 'Framework7', 'MUI', 'Leaflet', 'PWA'],
    links: [
      { label: 'Open live demo', url: 'https://philippsnr.github.io/location-based-service/' },
      { label: 'GitHub', url: 'https://github.com/philippsnr/location-based-service' },
    ],
  },
  {
    num: '03',
    name: 'ANNA',
    sub: 'AI Vision System',
    role: 'Deep Learning',
    tags: ['Python', 'Deep Learning', 'Image Processing'],
    year: '2025–26',
    preview: null,
    description: 'An AI vision system for the automated visual inspection of industrial pistons, built as my bachelor thesis at Rolls-Royce Solutions in Friedrichshafen.',
    highlights: [
      'Bachelor thesis in the dual programme with Rolls-Royce Solutions',
      'Deep learning and image processing for industrial quality inspection',
      'Developed in a real production context; the code is proprietary',
    ],
    stack: ['Python', 'PyTorch', 'OpenCV', 'Deep Learning'],
    links: [],
  },
  {
    num: '04',
    name: 'Fitness Tracker',
    sub: 'Android App',
    role: 'Mobile / Java',
    tags: ['Java', 'Android', 'SQLite'],
    year: '2025',
    preview: asset('preview-fitness-tracker.png'),
    description: 'An Android app to track nutrition, body weight and workouts, with a library of foods, exercises and muscle groups. Built as a team software project.',
    highlights: [
      'Meal logging with calorie and macronutrient tracking',
      'Weight tracking with charts to visualise progress',
      'Custom training plans and workout logging',
      'Exercise library with the targeted muscle groups',
    ],
    stack: ['Java', 'Android', 'SQLite', 'Android Studio'],
    links: [{ label: 'GitHub', url: 'https://github.com/philippsnr/Fitness-Tracker' }],
  },
  {
    num: '05',
    name: 'Advance Wars',
    sub: 'Turn-Based Strategy Game',
    role: 'Game Dev / Java',
    tags: ['Java', 'OOP', 'Game Design'],
    year: '2024',
    preview: null,
    description: 'A JavaFX remake of the turn-based strategy classic, built as a group project.',
    highlights: [
      'Six playable maps and ten unit types, from infantry to bombers',
      'Turn-based movement and combat with attack targeting',
      'Object-oriented game model with a JavaFX / FXML interface',
    ],
    stack: ['Java', 'JavaFX', 'Maven', 'OOP'],
    links: [{ label: 'GitHub', url: 'https://github.com/philippsnr/AdvanceWars' }],
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
    { name: 'NumPy', lvl: 'Comfortable', icon: 'devicon-numpy-plain' },
    { name: 'Pandas', lvl: 'Comfortable', icon: 'devicon-pandas-plain' },
    { name: 'Jupyter', lvl: 'Comfortable', icon: 'devicon-jupyter-plain' },
  ]},
  { cat: 'DevOps & Cloud', items: [
    { name: 'Docker', lvl: 'Daily', icon: 'devicon-docker-plain' },
    { name: 'Kubernetes', lvl: 'Comfortable', icon: 'devicon-kubernetes-plain' },
    { name: 'Rancher', lvl: 'Comfortable', icon: 'devicon-rancher-original' },
    { name: 'OpenShift', lvl: 'Comfortable', icon: null, iconText: 'OS' },
    { name: 'Azure DevOps', lvl: 'Comfortable', icon: 'devicon-azuredevops-plain' },
    { name: 'GitHub Actions', lvl: 'Comfortable', icon: 'devicon-github-plain' },
    { name: 'Vercel', lvl: 'Comfortable', icon: null, img: asset('logo-vercel.svg') },
    { name: 'Cloudways', lvl: 'Comfortable', icon: null, img: asset('logo-cloudways.svg') },
  ]},
  { cat: 'Tools', items: [
    { name: 'Git', lvl: 'Daily', icon: 'devicon-git-plain' },
    { name: 'Linux', lvl: 'Native', icon: 'devicon-linux-plain' },
    { name: 'Bash', lvl: 'Comfortable', icon: 'devicon-bash-plain' },
    { name: 'MySQL', lvl: 'Comfortable', icon: 'devicon-mysql-original' },
    { name: 'Android Studio', lvl: 'Comfortable', icon: 'devicon-androidstudio-plain' },
    { name: 'Ollama', lvl: 'Comfortable', icon: null, iconText: 'OL' },
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
  'NumPy': 'devicon-numpy-plain',
  'Pandas': 'devicon-pandas-plain',
  'Jupyter': 'devicon-jupyter-plain',
  'Docker': 'devicon-docker-plain',
  'Kubernetes': 'devicon-kubernetes-plain',
  'Rancher': 'devicon-rancher-original',
  'OpenShift': null,
  'Azure DevOps': 'devicon-azuredevops-plain',
  'GitHub Actions': 'devicon-github-plain',
  'Vercel': null,
  'Cloudways': null,
  'Git': 'devicon-git-plain',
  'Linux': 'devicon-linux-plain',
  'Bash': 'devicon-bash-plain',
  'MySQL': 'devicon-mysql-original',
  'Android Studio': 'devicon-androidstudio-plain',
  'Ollama': null,
  'Laravel': 'devicon-laravel-plain',
  'MariaDB': 'devicon-mariadb-plain',
}

const IMG_MAP = {
  'Vercel': asset('logo-vercel.svg'),
  'Cloudways': asset('logo-cloudways.svg'),
}

const ICON_TEXT_MAP = {
  'OpenShift': 'OS',
  'Ollama': 'OL',
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
            <p>M.Sc. Computer Science student at <em>OTH Regensburg</em>, focusing on <em>AI & Data Science</em>: machine learning, computer vision, and backend engineering.</p>
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
          <div className="cell-value">Working Student at nfaculty GmbH, alongside an M.Sc. in Computer Science (AI & Data Science) at OTH Regensburg.</div>
        </div>
        <div className="cell">
          <div className="cell-label">Based in</div>
          <div className="cell-value">
            Regensburg, Germany<br/>
            <span style={{ color: 'var(--muted)' }}>49.01°N&nbsp;&nbsp;12.10°E</span>
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
        <h2 className="title">A <BitGlitch /> about <em>me.</em></h2>
        <div className="meta">OTH REGENSBURG · NFACULTY<br/>REGENSBURG · DE</div>
      </Reveal>

      <div className="about-grid">
        <PhotoCard />

        <div className="about-copy">
          <Reveal as="h3">— Background</Reveal>
          <Reveal delay={100}><p>
            I'm <em>Philipp</em>, a Master's student in Computer Science at <em>OTH Regensburg</em>, specializing in <em>AI & Data Science</em>, working alongside my studies as a working student at <em>nfaculty GmbH</em>.
          </p></Reveal>
          <Reveal delay={200}><p>
            Before that, I completed my B.Sc. in Intelligent Systems at DHBW Ravensburg in a dual programme with Rolls-Royce Solutions — finishing with an AI vision system for industrial piston inspection as my bachelor thesis. My work sits between machine learning, computer vision, data and backend engineering.
          </p></Reveal>
          <Reveal as="div" className="affiliations" delay={300}>
            <a className="affil-card" href="https://www.oth-regensburg.de" target="_blank" rel="noreferrer">
              <span className="affil-lbl">Studying at</span>
              <span className="affil-logo oth-mark" aria-label="OTH Regensburg">
                <span className="oth-letters">OTH</span>
                <span className="oth-city">Regensburg</span>
              </span>
              <span className="affil-sub">M.Sc. Computer Science · AI & Data Science</span>
            </a>
            <a className="affil-card" href="https://nfaculty.com" target="_blank" rel="noreferrer">
              <span className="affil-lbl">Working at</span>
              <span className="affil-logo">
                <img src={asset('logo-nfaculty.svg')} alt="nfaculty" />
              </span>
              <span className="affil-sub">Working Student</span>
            </a>
          </Reveal>
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

function ProjectModal({ project, onClose }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => setShown(true))
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      cancelAnimationFrame(raf)
    }
  }, [onClose])

  const p = project
  return createPortal(
    <div className={`project-modal${shown ? ' open' : ''}`} onClick={onClose} role="dialog" aria-modal="true" aria-label={p.name}>
      <div className="pm-panel" onClick={(e) => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose} aria-label="Close">×</button>
        <div className="pm-media">
          {p.preview ? (
            <img src={p.preview} alt={`${p.name} preview`} />
          ) : (
            <div className="pm-ascii">
              <pre>{makeAscii(Number(p.num) * 7919 + 13)}</pre>
              <span>No public preview</span>
            </div>
          )}
        </div>
        <div className="pm-info">
          <div className="pm-meta"><span>{p.num} / {p.role}</span><span>{p.year}</span></div>
          <h3 className="pm-title">{p.name}<em>{p.sub}</em></h3>
          <p className="pm-desc">{p.description}</p>
          <ul className="pm-highlights">
            {p.highlights.map(h => <li key={h}>{h}</li>)}
          </ul>
          <div className="pm-stack">
            {p.stack.map(t => <span key={t}>{t}</span>)}
          </div>
          <div className="pm-links">
            {p.links.length > 0 ? p.links.map((l, i) => (
              <a key={l.url} className={`btn${i > 0 ? ' btn-ghost' : ''}`} href={l.url} target="_blank" rel="noreferrer">
                <span>{l.label}</span><span className="arrow">↗</span>
              </a>
            )) : <span className="pm-nolink">Proprietary project, no public link</span>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Projects() {
  const [open, setOpen] = useState(null)
  const close = useCallback(() => setOpen(null), [])

  return (
    <section className="section shell projects" id="work">
      <Reveal as="div" className="section-header">
        <div className="index">03 / Selected Work</div>
        <h2 className="title">Things I'm <em>building.</em></h2>
        <div className="meta">2023 — 2026<br/>05 PROJECTS</div>
      </Reveal>

      <div className="project-list">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.num} delay={i * 60}>
            <button type="button" className="project-row" onClick={() => setOpen(i)}>
              <span className="num">{p.num}</span>
              <span className="name">{p.name}<em>— {p.sub}</em></span>
              <span className="role">{p.role}</span>
              <span className="tags">{p.tags.map(t => <span key={t}>{t}</span>)}</span>
              <span className="year">{p.year} <span className="open-hint">+</span></span>
            </button>
          </Reveal>
        ))}
      </div>

      {open !== null && <ProjectModal project={PROJECTS[open]} onClose={close} />}
    </section>
  )
}

function Skills() {
  const tags = ['Python', 'Java', 'JavaScript', 'PHP', 'HTML', 'CSS', 'PyTorch', 'TensorFlow', 'OpenCV', 'NumPy', 'Pandas', 'Jupyter', 'Docker', 'Kubernetes', 'Rancher', 'OpenShift', 'Azure DevOps', 'GitHub Actions', 'Vercel', 'Cloudways', 'Git', 'Linux', 'Bash', 'MySQL', 'Android Studio', 'Ollama', 'Laravel', 'MariaDB']
  const items = [...tags, ...tags]
  return (
    <section className="section shell" id="stack">
      <Reveal as="div" className="section-header">
        <div className="index">04 / Stack</div>
        <h2 className="title">What I <em>work with.</em></h2>
        <div className="meta">UPDATED · 10.26</div>
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
                    {it.img && <img className="sk-img" src={it.img} alt="" />}
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
              {IMG_MAP[t] && <img className="sk-img" src={IMG_MAP[t]} alt="" />}
              {!ICON_MAP[t] && ICON_TEXT_MAP[t] && <span className="icon-text">{ICON_TEXT_MAP[t]}</span>}
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
        <span>REGENSBURG · <Clock /></span>
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
