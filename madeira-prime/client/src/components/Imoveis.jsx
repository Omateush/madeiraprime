import React, { useState, useEffect, useRef } from 'react'
import styles from '../styles/Imoveis.module.css'
import { useLang } from '../contexts/LanguageContext'
import { API_URL } from '../config'

const today = () => new Date().toISOString().slice(0, 10)

const IMOVEL_PH = (
  <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <rect width="80" height="60" fill="#1a2235" />
    <path d="M40 12L60 30H52V50H28V30H20L40 12Z" fill="rgba(201,168,76,0.3)" stroke="rgba(201,168,76,0.5)" strokeWidth="1" />
    <rect x="34" y="36" width="12" height="14" fill="rgba(201,168,76,0.2)" />
  </svg>
)

function calcNights(ci, co) {
  if (!ci || !co) return 0
  const d = Math.round((new Date(co) - new Date(ci)) / 86400000)
  return d > 0 ? d : 0
}

export default function Imoveis() {
  const { t } = useLang()
  const iv = t.imoveis
  const ref = useRef(null)

  const [properties, setProperties] = useState([])
  const [loading, setLoading]        = useState(true)
  const [bookingFor, setBookingFor]  = useState(null)   // property id with open form
  const [form, setForm]              = useState({ nome: '', email: '', telefone: '', check_in: '', check_out: '', notas: '' })
  const [submitting, setSubmitting]  = useState(false)
  const [error, setError]            = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/imoveis`)
      .then(r => r.json())
      .then(d => setProperties(d.data || []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting)
        entry.target.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('reveal-visible'), i * 80))
    }, { threshold: 0.05 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const handleFormChange = e => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError('') }

  const openBooking = (property) => {
    setBookingFor(bookingFor === property.id ? null : property.id)
    setForm({ nome: '', email: '', telefone: '', check_in: '', check_out: '', notas: '' })
    setError('')
  }

  const handleSubmit = async (property) => {
    const nights = calcNights(form.check_in, form.check_out)
    if (!form.check_in || !form.check_out) { setError(iv.form.errDates); return }
    if (nights < 1) { setError(iv.form.errOrder); return }
    if (!form.nome || !form.email || !form.telefone) { setError(iv.form.errRequired); return }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/checkout/reserva`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imovel_id: property.id,
          nome_hospede: form.nome,
          email_hospede: form.email,
          telefone_hospede: form.telefone,
          check_in: form.check_in,
          check_out: form.check_out,
          notas: form.notas,
        })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || iv.form.errRequired)
        setSubmitting(false)
      }
    } catch { setError(iv.form.errConn); setSubmitting(false) }
  }

  const statusLabel = (p) => {
    if (p.status === 'disponivel') return { label: iv.available, cls: styles.badgeAvailable }
    if (p.status === 'bloqueado')  return { label: iv.blocked,   cls: styles.badgeBlocked  }
    return { label: iv.occupied, cls: styles.badgeOccupied }
  }

  return (
    <section className={styles.section} id="imoveis" ref={ref}>
      <div className={styles.container}>

        {/* Header */}
        <div className={`${styles.header} reveal`}>
          <p className="section-label">{iv.label}</p>
          <h2 className={styles.title}>{iv.title}<br /><em className={styles.gold}>{iv.titleItalic}</em></h2>
          <p className={styles.subtitle}>{iv.subtitle}</p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={styles.loadingWrap}><span className={styles.loadingDot} /></div>
        ) : properties.length === 0 ? (
          <p className={styles.empty}>{iv.empty}</p>
        ) : (
          <div className={styles.grid}>
            {properties.map((p, idx) => {
              const { label: sLabel, cls: sCls } = statusLabel(p)
              const isOpen    = bookingFor === p.id
              const nights    = isOpen ? calcNights(form.check_in, form.check_out) : 0
              const totalAmt  = nights > 0 ? (nights * parseFloat(p.preco_por_noite)).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' }) : null

              return (
                <div key={p.id} className={`${styles.card} reveal`} style={{ animationDelay: `${idx * 60}ms` }}>
                  {/* Image */}
                  <div className={styles.cardImg}>
                    {p.imagem_url
                      ? <img src={p.imagem_url} alt={p.titulo} className={styles.img} />
                      : IMOVEL_PH}
                    <span className={`${styles.statusBadge} ${sCls}`}>{sLabel}</span>
                  </div>

                  {/* Info */}
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{p.titulo}</h3>
                    <p className={styles.cardLoc}>📍 {p.localizacao}</p>
                    <div className={styles.cardMeta}>
                      <span>🛏 {p.num_quartos} {p.num_quartos === 1 ? iv.bedroom : iv.bedrooms}</span>
                      <span className={styles.metaDot}>·</span>
                      <span>{p.tipo}</span>
                    </div>
                    {p.descricao && <p className={styles.cardDesc}>{p.descricao}</p>}

                    <div className={styles.cardFooter}>
                      <div className={styles.price}>
                        <span className={styles.priceVal}>{Number(p.preco_por_noite).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</span>
                        <span className={styles.priceUnit}>{iv.perNight}</span>
                      </div>

                      {p.status === 'ocupado' && p.ocupado_ate && (
                        <p className={styles.occupiedNote}>{iv.occupiedUntil}: {new Date(p.ocupado_ate).toLocaleDateString('pt-PT')}</p>
                      )}

                      {p.status === 'disponivel' && (
                        <button className={`${styles.bookBtn} ${isOpen ? styles.bookBtnOpen : ''}`}
                          onClick={() => openBooking(p)}>
                          {isOpen ? '✕ Fechar' : iv.bookBtn}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Booking Form */}
                  {isOpen && (
                    <div className={styles.bookingPanel}>
                      <h4 className={styles.bookingPanelTitle}>{iv.form.title} — {p.titulo}</h4>

                      <div className={styles.dateRow}>
                        <div className={styles.bookField}>
                          <label>{iv.form.checkIn}</label>
                          <input type="date" name="check_in" value={form.check_in} min={today()}
                            onChange={handleFormChange} className={styles.bookInput} />
                        </div>
                        <div className={styles.bookField}>
                          <label>{iv.form.checkOut}</label>
                          <input type="date" name="check_out" value={form.check_out}
                            min={form.check_in || today()}
                            onChange={handleFormChange} className={styles.bookInput} />
                        </div>
                      </div>

                      {nights > 0 && (
                        <div className={styles.nightsSummary}>
                          <span>🌙 {nights} {nights === 1 ? iv.nightSingular : iv.nightPlural}</span>
                          {totalAmt && <span className={styles.nightsTotal}>{iv.form.total}: <strong>{totalAmt}</strong></span>}
                        </div>
                      )}

                      <div className={styles.bookFields}>
                        {[
                          { name: 'nome',     label: iv.form.nome, ph: iv.form.ph.nome, type: 'text'  },
                          { name: 'email',    label: iv.form.email,ph: iv.form.ph.email,type: 'email' },
                          { name: 'telefone', label: iv.form.tel,  ph: iv.form.ph.tel,  type: 'text'  },
                        ].map(f => (
                          <div key={f.name} className={styles.bookField}>
                            <label>{f.label} *</label>
                            <input name={f.name} type={f.type} value={form[f.name]}
                              onChange={handleFormChange} placeholder={f.ph}
                              className={styles.bookInput} />
                          </div>
                        ))}
                        <div className={`${styles.bookField} ${styles.bookFieldFull}`}>
                          <label>{iv.form.notas}</label>
                          <textarea name="notas" value={form.notas} onChange={handleFormChange}
                            placeholder={iv.form.ph.notas} rows={2}
                            className={`${styles.bookInput} ${styles.bookTextarea}`} />
                        </div>
                      </div>

                      {error && <p className={styles.bookError}>{error}</p>}

                      <button className={styles.bookSubmit} onClick={() => handleSubmit(p)} disabled={submitting}>
                        {submitting ? iv.form.submitting : iv.form.submitPay}
                      </button>
                      <p className={styles.bookNote}>{iv.form.note}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
