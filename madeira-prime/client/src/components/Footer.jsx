import React from 'react'
import styles from '../styles/Footer.module.css'
import { useLang } from '../contexts/LanguageContext'

const SOCIAL = [
  { name: 'Instagram', href: 'https://instagram.com', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
  { name: 'Facebook',  href: 'https://facebook.com', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
  { name: 'LinkedIn',  href: 'https://linkedin.com', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
  { name: 'YouTube',   href: 'https://youtube.com',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg> },
]

const SERVICE_TARGETS = ['proprietarios','investidores','testemunhos','galeria','garantia','marcacao']

const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export default function Footer() {
  const { t } = useLang()
  const f = t.footer

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>

          <div className={styles.col}>
            <div className={styles.logo}>MADEIRA <span className={styles.prime}>PRIME</span></div>
            <p className={styles.tagline}>{f.tagline}</p>
            <div className={styles.social}>
              {SOCIAL.map(s => (
                <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label={s.name}>{s.icon}</a>
              ))}
            </div>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>{f.services}</h4>
            <ul className={styles.linkList}>
              {f.serviceLinks.map((lbl, i) => (
                <li key={i}><span className={styles.link} onClick={() => scrollTo(SERVICE_TARGETS[i])}>{lbl}</span></li>
              ))}
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>{f.contacts}</h4>
            <ul className={styles.contactList}>
              <li><span className={styles.contactIcon}>📞</span><a href="tel:+351291000000" className={styles.contactLink}>+351 291 000 000</a></li>
              <li><span className={styles.contactIcon}>✉️</span><a href="mailto:info@madeiraprime.pt" className={styles.contactLink}>info@madeiraprime.pt</a></li>
              <li><span className={styles.contactIcon}>💬</span><a href="https://wa.me/351912000000" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>WhatsApp: +351 912 000 000</a></li>
              <li><span className={styles.contactIcon}>📍</span><span className={styles.contactText}>Rua do Comércio 42<br />9000-061 Funchal, Madeira</span></li>
            </ul>
          </div>

          <div className={styles.col}>
            <h4 className={styles.colTitle}>{f.legal}</h4>
            <ul className={styles.linkList}>
              {f.legalLinks.map((lbl, i) => <li key={i}><a href="#" className={styles.link}>{lbl}</a></li>)}
            </ul>
            <div className={styles.certBadge}>
              <span className={styles.certIcon}>🏅</span>
              <div>
                <span className={styles.certTitle}>{f.certTitle}</span>
                <span className={styles.certSub}>{f.certSub}</span>
              </div>
            </div>
          </div>

        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>{f.copyright}</p>
          <p className={styles.taxInfo}>{f.tax}</p>
        </div>
      </div>
    </footer>
  )
}
