'use client'

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './habits.module.css';
import { createHabit } from '../actions';

export default function NewHabitForm() {
  const [isQuant, setIsQuant] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ 
          background: 'transparent', 
          color: '#ff1a1a', 
          border: '1px solid rgba(255, 26, 26, 0.5)', 
          width: '24px', 
          height: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '4px', 
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: '1.2rem',
          lineHeight: '1'
        }}
        title="Añadir Hábito"
        onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 26, 26, 0.1)';
            e.currentTarget.style.borderColor = '#ff1a1a';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 26, 26, 0.5)';
        }}
      >
        +
      </button>

      {isOpen && mounted && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255, 26, 26, 0.3)', width: '90%', maxWidth: '450px', boxShadow: '0 0 30px rgba(255, 26, 26, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'white', fontSize: '1.2rem', fontFamily: 'var(--font-orbitron)' }}>Nuevo Hábito</h3>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            
            <form action={(formData) => { createHabit(formData); setIsOpen(false); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                name="title" 
                placeholder="Nombre del hábito" 
                className={styles.inputField} 
                required
              />
      
      <select 
        name="isQuantitative" 
        className={styles.inputField} 
        style={{ flex: 1, backgroundColor: '#0a0a0a', color: 'white' }}
        onChange={(e) => setIsQuant(e.target.value === 'true')}
      >
        <option value="false">Simple (Sí/No)</option>
        <option value="true">Medible (Horas, etc.)</option>
      </select>

      {isQuant && (
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
          <input 
            type="number" 
            name="targetHours" 
            placeholder="Horas" 
            min="0"
            className={styles.inputField} 
            style={{ width: '100%' }}
            required
          />
          <input 
            type="number" 
            name="targetMinutes" 
            placeholder="Min" 
            min="0"
            max="59"
            className={styles.inputField} 
            style={{ width: '100%' }}
            required
          />
        </div>
      )}

      <input 
        type="hidden" 
        name="baseXp" 
        value="50"
      />
      
      <input 
        type="hidden" 
        name="penaltyXp" 
        value="20"
      />

      <input 
        type="color" 
        name="color" 
        defaultValue="#00f3ff" 
        className={styles.colorPicker} 
        title="Pick a neon color"
      />
      
              <button type="submit" className={styles.saveBtn} style={{ marginTop: '1rem' }}>
                INICIAR PROTOCOLO
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
