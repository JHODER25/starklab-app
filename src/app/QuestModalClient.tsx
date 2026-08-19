'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function QuestModalClient() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Dynamically import the server action
    const { createQuest } = await import('./actions');
    await createQuest(formData);
    
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ 
          background: 'transparent', 
          color: '#00f3ff', 
          border: '1px solid rgba(0, 243, 255, 0.5)', 
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
        title="Añadir Evento"
        onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(0, 243, 255, 0.1)';
            e.currentTarget.style.borderColor = '#00f3ff';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(0, 243, 255, 0.5)';
        }}
      >
        +
      </button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'white', fontSize: '1.2rem', fontFamily: 'var(--font-orbitron)' }}>Nuevo Evento</h2>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                name="title" 
                placeholder="Nuevo Evento (ej. Examen Final)" 
                required 
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '4px', outline: 'none' }} 
              />
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  name="xpReward" 
                  placeholder="Recompensa XP" 
                  defaultValue={200} 
                  required 
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '4px', outline: 'none' }} 
                />
                <input 
                  type="number" 
                  name="xpPenalty" 
                  placeholder="Castigo XP" 
                  defaultValue={100} 
                  required 
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '4px', outline: 'none' }} 
                />
              </div>
              
              <input 
                type="datetime-local" 
                name="deadline" 
                required 
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '4px', outline: 'none', colorScheme: 'dark' }} 
              />
              
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  background: 'transparent', 
                  color: '#00f3ff', 
                  border: '1px solid #00f3ff', 
                  padding: '0.8rem', 
                  borderRadius: '4px', 
                  fontWeight: 'bold', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginTop: '0.5rem'
                }}
              >
                {loading ? 'Creando...' : 'Crear Evento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
