import React from 'react'
import styles from '../styles/BookingResult.module.css'

export default function BookingSuccess() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={`${styles.icon} ${styles.iconSuccess}`}>✓</div>
        <h1 className={styles.title}>Pagamento Confirmado!</h1>
        <p className={styles.msg}>
          O seu pagamento foi processado com sucesso e a sua consulta foi registada.
          Entraremos em contacto brevemente para confirmar todos os detalhes.
        </p>
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>📧</span>
          <span>Receberá um email de confirmação em breve.</span>
        </div>
        <a href="/" className={styles.btn}>← Voltar ao site</a>
      </div>
    </div>
  )
}
