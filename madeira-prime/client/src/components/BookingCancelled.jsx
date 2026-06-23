import React from 'react'
import styles from '../styles/BookingResult.module.css'

export default function BookingCancelled() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>MADEIRA <span className={styles.prime}>PRIME</span></div>
        <div className={`${styles.icon} ${styles.iconCancelled}`}>✕</div>
        <h1 className={styles.title}>Pagamento Cancelado</h1>
        <p className={styles.msg}>
          O pagamento foi cancelado e a sua consulta não foi confirmada.
          Pode tentar novamente quando quiser — nenhum valor foi cobrado.
        </p>
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>💡</span>
          <span>Nenhum valor foi debitado no seu cartão.</span>
        </div>
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>💬</span>
          <span>Problemas com o pagamento? Contacte-nos: <strong>+351 968 188 909</strong></span>
        </div>
        <div className={styles.btnRow}>
          <a href="/" className={styles.btn}>← Voltar ao site</a>
          <a href="/#marcacao" className={`${styles.btn} ${styles.btnGold}`}>Tentar novamente</a>
        </div>
      </div>
    </div>
  )
}
