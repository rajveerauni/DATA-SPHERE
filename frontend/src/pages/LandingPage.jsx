import { motion } from 'framer-motion'
import { BarChart2, Database, Filter, GitMerge, Globe, Moon, Sun, Upload, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'

const FEATURES = [
  {
    icon: <Database size={22} />,
    title: 'Multi-Source Data',
    desc: 'Pull live datasets from Kaggle, World Bank, UCI, and Data.gov in seconds.',
  },
  {
    icon: <GitMerge size={22} />,
    title: 'Drag & Drop Canvas',
    desc: 'Drop dataset cards onto the workspace to load, tab, and compare side by side.',
  },
  {
    icon: <Filter size={22} />,
    title: 'Live Transformations',
    desc: 'Filter, group, normalize, and correlate data without writing a single line of code.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: '7 Chart Types',
    desc: 'Bar, line, scatter, histogram, heatmap, box, and pie — all rendered with Plotly.',
  },
  {
    icon: <Upload size={22} />,
    title: 'CSV / XLSX Upload',
    desc: 'Drag your own file from the desktop and it enters the same analytics pipeline.',
  },
  {
    icon: <Globe size={22} />,
    title: 'Export & Share',
    desc: 'Download charts as PNG or copy Plotly JSON for embedding anywhere.',
  },
]

const STATS = [
  { value: '5+', label: 'Data Sources' },
  { value: '7', label: 'Chart Types' },
  { value: '5', label: 'Transform Ops' },
  { value: '∞', label: 'Datasets' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useAppStore()

  return (
    <div className="landing">
      {/* ── Nav ── */}
      <nav className="landing-nav">
        <div className="landing-nav__logo">
          <Zap size={20} className="logo-icon" />
          <span>DataSphere</span>
        </div>
        <div className="landing-nav__actions">
          <button className="icon-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn btn--ghost" onClick={() => navigate('/app')}>
            Launch App
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <motion.h1
          className="hero__title"
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
        >
          Explore. Transform.
          <br />
          <span className="gradient-text">Visualize Everything.</span>
        </motion.h1>

        <motion.p
          className="hero__sub"
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
        >
          A multi-source analytics dashboard that connects to real datasets, lets you drag
          and drop data onto a live canvas, apply transformations, and render beautiful
          Plotly charts — all in your browser.
        </motion.p>

        <motion.div
          className="hero__cta"
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
        >
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/app')}>
            <Zap size={17} /> Get Started
          </button>
          <a
            className="btn btn--ghost btn--lg"
            href="https://github.com/rajveerauni/DATA-SPHERE"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
        </motion.div>

        <motion.div
          className="hero__orb hero__orb--1"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="hero__orb hero__orb--2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </section>

      {/* ── Stats ── */}
      <section className="stats-band">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            className="stat-item"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={i}
            variants={fadeUp}
          >
            <span className="stat-item__value">{s.value}</span>
            <span className="stat-item__label">{s.label}</span>
          </motion.div>
        ))}
      </section>

      {/* ── Features ── */}
      <section className="features">
        <motion.h2
          className="section-title"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          Everything a data analyst needs
        </motion.h2>
        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="feature-card__icon">{f.icon}</div>
              <h3 className="feature-card__title">{f.title}</h3>
              <p className="feature-card__desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="cta-band">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <h2>Ready to explore your data?</h2>
          <p>No setup required. Just open the dashboard and start dragging datasets.</p>
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/app')}>
            Open Dashboard
          </button>
        </motion.div>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} DataSphere</span>
      </footer>
    </div>
  )
}
