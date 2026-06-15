import React from 'react'
import styles from '../styles/BookingResult.module.css'

export default function BookingCancelled() {
  const scrollToBooking = () => {
    document.getElementById('marcacao')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={`${styles.icon} ${styles.iconCancelled}`}>✕</div>
        <h1 className={styles.title}>Pagamento Cancelado</h1>
        <p className={styles.msg}>
          O pagamento foi cancelado e a sua reserva não foi confirmada.
          Pode tentar novamente quando quiser — os seus dados não foram guardados.
        </p>
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>💡</span>
          <span>Nenhum valor foi cobrado.</span>
        </div>
        <div className={styles.btnRow}>
          <a href="/" className={styles.btn} onClick={e => { e.preventDefault(); window.location.href = '/' }}>← Voltar ao site</a>
          <a href="/?#marcacao" className={`${styles.btn} ${styles.btnGold}`}
            onClick={e => { e.preventDefault(); window.location.href = '/'; setTimeout(scrollToBooking, 500) }}>
            Tentar novamente
          </a>
        </div>
      </div>
    </div>
  )
}
