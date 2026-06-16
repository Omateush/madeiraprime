import React, { useEffect, useRef } from 'react'
import styles from '../styles/Testimonials.module.css'
import { useLang } from '../contexts/LanguageContext'

const NAMES   = ['Carolina Mendes', 'James Whitmore', 'Sofia Câmara', 'Rui Vasconcelos', 'Margarida Pinto', 'André Braga']
const BADGES  = ['+€38.4K / 6M', '47% ROI', '3.2× Revenue', '3 Deals', 'Convertida', 'Multi-país']

const BASE = 'https://images.unsplash.com/'
const Q    = '?auto=format&fit=crop&crop=faces&w=88&h=88&q=85'
const AVATARS = [
  BASE + 'photo-1487412720507-e7ab37603c6f' + Q, // Carolina — professional woman
  BASE + 'photo-1507003211169-0a1dd7228f2d' + Q, // James    — professional man
  BASE + 'photo-1573496359142-b8d87734a5a2' + Q, // Sofia    — professional woman
  BASE + 'photo-1472099645785-5658abf4ff4e' + Q, // Rui      — professional man
  BASE + 'photo-1580489944761-15a19d654956' + Q, // Margarida — professional woman
  BASE + 'photo-1519085360753-af0119f7cbe7' + Q, // André    — professional man
]

function Stars() {
  return (
    <div className={styles.stars}>
      {[1,2,3,4,5].map(i => <span key={i} className={styles.star}>★</span>)}
    </div>
  )
}

export default function Testimonials() {
  const { t } = useLang()
  const tm = t.testimonials
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.reveal').forEach((el, i) => {
          setTimeout(() => el.classList.add('reveal-visible'), i * 80)
        })
      }
    }, { threshold: 0.05 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.section} id="testemunhos" ref={ref}>
      <div className={styles.container}>
        <div className={`${styles.header} reveal`}>
          <p className="section-label">{tm.label}</p>
          <h2 className={styles.title}>
            {tm.title}<br /><em className={styles.gold}>{tm.titleItalic}</em>
          </h2>
          <p className={styles.subtitle}>{tm.subtitle}</p>
        </div>

        <div className={styles.grid}>
          {tm.items.map((item, i) => (
            <div key={i} className={`${styles.card} reveal reveal-delay-${(i % 3) + 1}`}>
              <div className={styles.quoteIcon}>"</div>
              <p className={styles.text}>{item.text}</p>
              <Stars />
              <div className={styles.footer}>
                <div className={styles.avatar}>
                  <img src={AVATARS[i]} alt={NAMES[i]} />
                </div>
                <div className={styles.info}>
                  <span className={styles.name}>{NAMES[i]}</span>
                  <span className={styles.role}>{item.role}</span>
                </div>
                <div className={styles.badge}>{BADGES[i]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
