import React, { useState, useEffect } from 'react';
import styles from '../styles/CookieBanner.module.css';

const STORAGE_KEY = 'madeira_prime_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.banner} role="dialog" aria-label="Aviso de cookies">
      <p className={styles.text}>
        Utilizamos cookies para melhorar a sua experiência de navegação e analisar o tráfego do site.
        Ao continuar, aceita a nossa utilização de cookies em conformidade com o{' '}
        <strong>RGPD</strong>.
      </p>
      <button className={styles.btn} onClick={accept}>
        Aceitar
      </button>
    </div>
  );
}
