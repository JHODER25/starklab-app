'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function RewardModalClient({ period = 'WEEKLY', existingRewards = [] }: { period?: 'WEEKLY' | 'MONTHLY', existingRewards?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState('1');
  const [titleValue, setTitleValue] = useState('');

  // Handle opening modal
  const handleOpen = () => {
    const existing = existingRewards.find(r => r.requiredXp === 1);
    setTitleValue(existing ? existing.title : '');
    setSelectedTier('1');
    setIsOpen(true);
  };

  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tierId = e.target.value;
    setSelectedTier(tierId);
    const existing = existingRewards.find(r => r.requiredXp === parseInt(tierId));
    setTitleValue(existing ? existing.title : '');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append('period', period);
    
    const { createReward } = await import('./actions');
    await createReward(formData);
    
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={handleOpen}
        style={{ 
          background: 'transparent', 
          color: '#ffaa00', 
          border: '1px solid rgba(255, 170, 0, 0.5)', 
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
        title="Añadir/Editar Recompensa"
        onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 170, 0, 0.1)';
            e.currentTarget.style.borderColor = '#ffaa00';
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(255, 170, 0, 0.5)';
        }}
      >
        +
      </button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'white', fontSize: '1.2rem', fontFamily: 'var(--font-orbitron)' }}>Editar Recompensa</h2>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select 
                name="tierId" 
                value={selectedTier}
                onChange={handleTierChange}
                required 
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '4px', outline: 'none' }}
              >
                <option value="1" style={{ color: 'black' }}>Botín Legendario (100% XP)</option>
                <option value="2" style={{ color: 'black' }}>Botín Épico (85% XP)</option>
                <option value="3" style={{ color: 'black' }}>Botín Raro (70% XP)</option>
              </select>

              <input 
                type="text" 
                name="title" 
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                placeholder="Título (ej. Comprar un videojuego)" 
                required 
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem', borderRadius: '4px', outline: 'none' }} 
              />
              
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  background: 'transparent', 
                  color: '#ffaa00', 
                  border: '1px solid #ffaa00', 
                  padding: '0.8rem', 
                  borderRadius: '4px', 
                  fontWeight: 'bold', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginTop: '0.5rem'
                }}
              >
                {loading ? 'Guardando...' : 'Crear Recompensa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
