import React, { useState, useEffect } from 'react'
import styles from '../styles/Navbar.module.css'
import { useLang } from '../contexts/LanguageContext'

const LANGS = ['PT', 'EN', 'DE', 'FR']

export default function Navbar() {
  const { lang, setLang, t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMenuOpen(false)
  }

  const NAV_LINKS = [
    { label: t.nav.proprietarios, target: 'proprietarios' },
    { label: t.nav.investidores,  target: 'investidores' },
    { label: t.nav.resultados,    target: 'testemunhos' },
    // { label: t.nav.galeria, target: 'galeria' },
    { label: t.nav.marcarReuniao, target: 'marcacao' },
  ]

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>

        <div className={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          MADEIRA <span className={styles.prime}>PRIME</span>
        </div>

        <ul className={`${styles.links} ${menuOpen ? styles.open : ''}`}>
          {NAV_LINKS.map(l => (
            <li key={l.target} onClick={() => scrollTo(l.target)}>{l.label}</li>
          ))}
        </ul>

        <div className={styles.actions}>
          <div className={styles.lang}>
            {LANGS.map((l, i) => (
              <React.Fragment key={l}>
                <span
                  className={lang === l ? styles.activeLang : ''}
                  onClick={() => setLang(l)}
                >{l}</span>
                {i < LANGS.length - 1 && <span className={styles.sep}>|</span>}
              </React.Fragment>
            ))}
          </div>
          <button className={styles.cta} onClick={() => scrollTo('marcacao')}>
            {t.nav.cta}
          </button>
        </div>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>

      </div>
    </nav>
  )
}
