'use client';

import { useEffect, useState } from 'react';
import styles from './DailyWelcomeScreen.module.css';

export default function DailyWelcomeScreen() {
  const [show, setShow] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    // Check if we should show the welcome screen
    const today = new Date().toLocaleDateString();
    const lastWelcome = localStorage.getItem('lastWelcomeDate');

    if (lastWelcome !== today) {
      setShow(true);
    }
  }, []);

  const handleStart = () => {
    setClicked(true);
    
    // Reproducir el archivo de audio de J.A.R.V.I.S.
    try {
      const audio = new Audio('/jarvis-welcome.mp3');
      audio.volume = 1.0;
      audio.play().catch(e => console.error("Error reproduciendo audio:", e));
    } catch (e) {
      console.error("Audio API not supported", e);
    }
    
    // Allow animation to play before dismissing
    setTimeout(() => {
      setDismissing(true);
      
      // Save today's date so it doesn't show again today
      const today = new Date().toLocaleDateString();
      localStorage.setItem('lastWelcomeDate', today);
      
      // Remove from DOM after fade out
      setTimeout(() => {
        setShow(false);
      }, 1500);
    }, 400);
  };

  if (!show) return null;

  return (
    <div className={`${styles.overlay} ${dismissing ? styles.dismissing : ''}`}>
      <div className={styles.gridBg}></div>
      <div className={styles.scanline}></div>
      
      <div className={styles.content}>
        <div className={styles.logo}>J</div>
        
        <div>
          <div className={styles.systemText}>INICIALIZANDO EL SISTEMA...</div>
          <h1 className={styles.mainTitle} data-text="WELCOME PLAYER">WELCOME PLAYER</h1>
          <p className={styles.subtitle}>
            PROTOCOLO DE DESARROLLO PERSONAL ACTIVADO. CALIBRANDO MÓDULOS DE XP Y RECOMPENSAS.<br/>
            EL MUNDO ESPERA, TOMA EL CONTROL.
          </p>
        </div>
        
        <button 
          className={`${styles.actionButton} ${clicked ? styles.clicked : ''}`}
          onClick={handleStart}
          disabled={clicked}
        >
          {clicked ? 'SISTEMA ONLINE' : 'INICIAR CONEXIÓN'}
        </button>
      </div>
    </div>
  );
}
