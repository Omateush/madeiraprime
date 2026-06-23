import React from 'react'
import styles from '../styles/BookingResult.module.css'

export default function BookingSuccess() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>MADEIRA <span className={styles.prime}>PRIME</span></div>
        <div className={`${styles.icon} ${styles.iconSuccess}`}>✓</div>
        <h1 className={styles.title}>Pagamento Confirmado!</h1>
        <p className={styles.msg}>
          O seu pagamento foi processado com sucesso e a sua consulta foi registada.
          A nossa equipa entrará em contacto brevemente para confirmar todos os detalhes.
        </p>
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>📧</span>
          <span>Receberá um email de confirmação em breve. Verifique também a pasta de spam.</span>
        </div>
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>📞</span>
          <span>Dúvidas? Contacte-nos: <strong>+351 968 188 909</strong></span>
        </div>
        <a href="/" className={`${styles.btn} ${styles.btnGold}`}>← Voltar ao site</a>
      </div>
    </div>
  )
}
