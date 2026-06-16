import React, { useState, useEffect, useRef } from 'react'
import styles from '../styles/Booking.module.css'
import { useLang } from '../contexts/LanguageContext'
import { API_URL } from '../config'

const HORAS = ['09:00','10:00','11:00','14:00','15:00','16:00','17:00']

// Returns the current date and time in Madeira's timezone (Atlantic/Madeira).
// This is WET (UTC+0) in winter and WEST (UTC+1) in summer — never use plain
// UTC here or slots near the DST boundary will be wrongly blocked/allowed.
function getMadeiraDateTime() {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Atlantic/Madeira',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now)
  const get = type => parts.find(p => p.type === type).value
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    hour: parseInt(get('hour'), 10),
    minute: parseInt(get('minute'), 10),
  }
}

function getCalendarDays(year, month) {
  const first = new Date(year, month, 1).getDay()
  const total = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 0; i < first; i++) days.push(null)
  for (let d = 1; d <= total; d++) days.push(d)
  return days
}

function fmtDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

export default function Booking() {
  const { t } = useLang()
  const bk = t.booking
  const ref = useRef(null)
  const madeiraNow = getMadeiraDateTime()
  const todayStr = madeiraNow.dateStr
  const [todayYear, todayMonthNum] = todayStr.split('-').map(Number)
  const todayMonth0 = todayMonthNum - 1 // 0-indexed for React state / Date API

  const [viewYear, setViewYear] = useState(todayYear)
  const [viewMonth, setViewMonth] = useState(todayMonth0)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedHora, setSelectedHora] = useState('')
  const [tipoCliente, setTipoCliente] = useState('proprietario')
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', notas: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const days = getCalendarDays(viewYear, viewMonth)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting)
        entry.target.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('reveal-visible'), i * 80))
    }, { threshold: 0.05 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // Clear a previously selected time slot if the user picks today and the slot
  // is now disabled (already past or within the 30-minute buffer).
  useEffect(() => {
    if (selectedHora && isSlotDisabled(selectedHora)) setSelectedHora('')
  }, [selectedDate])

  const prevMonth = () => {
    const newMonth = viewMonth === 0 ? 11 : viewMonth - 1
    const newYear  = viewMonth === 0 ? viewYear - 1 : viewYear
    // Prevent navigating to a month that is entirely in the past
    const newMonthStr  = `${newYear}-${String(newMonth + 1).padStart(2, '0')}`
    const todayMonthStr = todayStr.slice(0, 7)
    if (newMonthStr < todayMonthStr) return
    setViewMonth(newMonth); setViewYear(newYear); setSelectedDate(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1)
    setSelectedDate(null)
  }

  // A calendar day is in the past if its ISO date string is before today in Madeira.
  const isPast = (day) => {
    if (!day) return false
    return fmtDate(viewYear, viewMonth, day) < todayStr
  }
  const isToday = (day) => fmtDate(viewYear, viewMonth, day) === todayStr

  // A time slot is disabled when the selected date is today AND the slot falls
  // within the next 30 minutes or is already past (30-min booking buffer).
  const isSlotDisabled = (hora) => {
    if (selectedDate !== todayStr) return false
    const [h, m] = hora.split(':').map(Number)
    return (h * 60 + m) <= (madeiraNow.hour * 60 + madeiraNow.minute + 30)
  }

  const handleChange = e => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError('') }

  const handleSubmit = async () => {
    if (!selectedDate) { setError(bk.errDate); return }
    if (!selectedHora)  { setError(bk.errTime); return }
    if (!form.nome || !form.email || !form.telefone) { setError(bk.errRequired); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/checkout/marcacao`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: form.nome, email: form.email, telefone: form.telefone, data_preferida: selectedDate, hora_preferida: selectedHora, tipo_cliente: tipoCliente, notas: form.notas })
      })
      const data = await res.json()
      if (data.url) {
        // Redirecionar para Stripe Checkout
        window.location.href = data.url
      } else {
        setError(data.error || bk.errRequired)
        setSubmitting(false)
      }
    } catch { setError(bk.errConn); setSubmitting(false) }
  }

  return (
    <section className={styles.section} id="marcacao" ref={ref}>
      <div className={styles.container}>
        <div className={`${styles.header} reveal`}>
          <p className="section-label">{bk.label}</p>
          <h2 className={styles.title}>{bk.title}<br /><em className={styles.gold}>{bk.titleItalic}</em></h2>
          <p className={styles.subtitle}>{bk.subtitle}</p>
        </div>

        {success ? (
          <div className={`${styles.successCard} reveal`}>
            <div className={styles.successIcon}>✓</div>
            <h3>{bk.successTitle}</h3>
            <p>{bk.successMsg}</p>
            <div className={styles.successDetails}>
              <span>📅 {selectedDate}</span>
              <span>🕐 {selectedHora}</span>
              <span>👤 {tipoCliente === 'proprietario' ? bk.toggleOwner : bk.toggleInvestor}</span>
            </div>
          </div>
        ) : (
          <div className={styles.bookingGrid}>

            {/* Left — Calendar */}
            <div className={`${styles.calendarCol} reveal`}>
              <div className={styles.toggle}>
                <button className={`${styles.toggleBtn} ${tipoCliente === 'proprietario' ? styles.toggleActive : ''}`} onClick={() => setTipoCliente('proprietario')}>{bk.toggleOwner}</button>
                <button className={`${styles.toggleBtn} ${tipoCliente === 'investidor' ? styles.toggleActive : ''}`} onClick={() => setTipoCliente('investidor')}>{bk.toggleInvestor}</button>
              </div>

              <div className={styles.calendar}>
                <div className={styles.calNav}>
                  <button className={styles.calNavBtn} onClick={prevMonth}>‹</button>
                  <span className={styles.calMonthYear}>{bk.months[viewMonth]} {viewYear}</span>
                  <button className={styles.calNavBtn} onClick={nextMonth}>›</button>
                </div>
                <div className={styles.calGrid}>
                  {bk.days.map(d => <div key={d} className={styles.calDayHeader}>{d}</div>)}
                  {days.map((day, i) => {
                    const ds = day ? fmtDate(viewYear, viewMonth, day) : null
                    const sel = ds === selectedDate
                    const past = isPast(day)
                    return (
                      <div key={i} onClick={() => day && !past && setSelectedDate(ds)}
                        className={`${styles.calDay} ${!day ? styles.calDayEmpty : ''} ${past ? styles.calDayPast : ''} ${isToday(day) ? styles.calDayToday : ''} ${sel ? styles.calDaySelected : ''} ${day && !past ? styles.calDayActive : ''}`}>
                        {day || ''}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={styles.timeSection}>
                <p className={styles.timeSectionTitle}>{bk.timeTitle}</p>
                <div className={styles.timeGrid}>
                  {HORAS.map(h => {
                    const disabled = isSlotDisabled(h)
                    return (
                      <button
                        key={h}
                        onClick={() => !disabled && setSelectedHora(h)}
                        disabled={disabled}
                        className={`${styles.timeSlot} ${selectedHora === h ? styles.timeSlotActive : ''} ${disabled ? styles.timeSlotDisabled : ''}`}
                      >{h}</button>
                    )
                  })}
                </div>
              </div>

              {selectedDate && selectedHora && (
                <div className={styles.selectionSummary}>
                  <span>📅 {selectedDate}</span><span>🕐 {selectedHora}</span>
                </div>
              )}
            </div>

            {/* Right — Form */}
            <div className={`${styles.formCol} reveal reveal-delay-2`}>
              <h3 className={styles.formTitle}>{bk.form.title}</h3>
              <p className={styles.formDesc}>{bk.form.desc}</p>
              <div className={styles.formFields}>
                {[
                  { name: 'nome',     label: bk.form.fields.nome, ph: bk.form.ph.nome, type: 'text' },
                  { name: 'email',    label: bk.form.fields.email, ph: bk.form.ph.email, type: 'email' },
                  { name: 'telefone', label: bk.form.fields.tel,  ph: bk.form.ph.tel,  type: 'text' },
                ].map(f => (
                  <div key={f.name} className={styles.field}>
                    <label className={styles.fieldLabel}>{f.label} *</label>
                    <input name={f.name} type={f.type} value={form[f.name]} onChange={handleChange} placeholder={f.ph} className={styles.input} />
                  </div>
                ))}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{bk.form.fields.notas}</label>
                  <textarea name="notas" value={form.notas} onChange={handleChange} placeholder={bk.form.ph.notas} rows={4} className={`${styles.input} ${styles.textarea}`} />
                </div>
                {error && <p className={styles.errorMsg}>{error}</p>}
                <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? bk.form.submitting : bk.form.submitPay || bk.form.submit}
                </button>
                <p className={styles.formNote}>{bk.form.note}</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </section>
  )
}
