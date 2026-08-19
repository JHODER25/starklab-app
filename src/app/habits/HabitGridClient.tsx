'use client'

import styles from './habits.module.css';
import { toggleHabitLog, deleteHabit } from '../actions';
import { useTransition, useState } from 'react';
import { createPortal } from 'react-dom';

type GridProps = {
  habits: any[];
  logs: any[];
  days: { dateStr: string, label: string }[];
};

export default function HabitGridClient({ habits, logs, days }: GridProps) {
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<'grid' | 'daily'>('grid');
  const [modalState, setModalState] = useState<{ habitId: string, dateStr: string, habitName: string, targetValue: number } | null>(null);
  const [inputHours, setInputHours] = useState('0');
  const [inputMinutes, setInputMinutes] = useState('0');

  const handleToggle = (habitId: string, dateStr: string, isCompleted: boolean, completedValue: number = 1) => {
    startTransition(() => {
      toggleHabitLog(habitId, dateStr, isCompleted, completedValue);
    });
  };

  const handleCellClick = (habitId: string, dateStr: string, isCompleted: boolean, habitName: string, targetValue: number, isQuantitative: boolean) => {
    if (isCompleted) {
      // Uncheck it directly
      handleToggle(habitId, dateStr, true);
    } else {
      if (isQuantitative) {
        setModalState({ habitId, dateStr, habitName, targetValue });
        const hrs = Math.floor(targetValue);
        const mins = Math.round((targetValue - hrs) * 60);
        setInputHours(hrs.toString());
        setInputMinutes(mins.toString());
      } else {
        handleToggle(habitId, dateStr, false, targetValue); // just mark it with targetValue
      }
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalState) {
      const hrs = parseInt(inputHours) || 0;
      const mins = parseInt(inputMinutes) || 0;
      const val = hrs + (mins / 60);
      if (val > 0) {
        handleToggle(modalState.habitId, modalState.dateStr, false, val);
      }
      setModalState(null);
    }
  };

  const handleDelete = (habitId: string) => {
    if (confirm('¿Estás seguro de eliminar este hábito y todo su progreso? (Esta acción no se puede deshacer)')) {
      startTransition(() => {
        deleteHabit(habitId);
      });
    }
  };

  // For daily view, we only show today (the last element in days array)
  const displayDays = viewMode === 'grid' ? days : [days[days.length - 1]];

  return (
    <div className={styles.gridContainer}>
      {/* View Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <span style={{ color: '#888', fontSize: '0.9rem' }}>Gestiona tus hábitos</span>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
          <button 
            onClick={() => setViewMode('daily')}
            style={{ padding: '6px 12px', background: viewMode === 'daily' ? '#ff1a1a' : 'transparent', color: viewMode === 'daily' ? 'white' : '#888', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', fontWeight: viewMode === 'daily' ? 'bold' : 'normal' }}
          >
            Vista Diaria
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            style={{ padding: '6px 12px', background: viewMode === 'grid' ? '#ff1a1a' : 'transparent', color: viewMode === 'grid' ? 'white' : '#888', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', fontWeight: viewMode === 'grid' ? 'bold' : 'normal' }}
          >
            Vista 14 Días
          </button>
        </div>
      </div>

      <div className={styles.dayLabels}>
        {displayDays.map(d => (
          <div key={d.dateStr} className={styles.dayLabel} style={{ width: viewMode === 'daily' ? '60px' : '24px', textAlign: 'center' }}>
            {viewMode === 'daily' ? 'HOY' : d.label}
          </div>
        ))}
      </div>

      {habits.map(habit => (
        <div key={habit.id} className={styles.gridRow} style={{ marginBottom: viewMode === 'daily' ? '15px' : '0' }}>
          <div className={styles.habitInfo}>
            <button 
              onClick={() => handleDelete(habit.id)}
              disabled={isPending}
              style={{ background: 'transparent', border: 'none', color: '#ff3333', fontSize: '1.2rem', cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.2s', padding: '0' }}
              title="Eliminar hábito"
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              ×
            </button>
            <div className={styles.habitIcon} style={{ color: habit.color || '#ff1a1a' }}>
              {habit.title.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {habit.title}
              </span>
              {habit.isQuantitative && (
                <span style={{ color: '#888', fontSize: '0.7rem' }}>
                  Meta: {Math.floor(habit.targetValue)}h {Math.round((habit.targetValue - Math.floor(habit.targetValue)) * 60)}m
                </span>
              )}
            </div>
          </div>

          <div className={styles.daysScroll}>
            {displayDays.map(d => {
              const log = logs.find(l => l.habitId === habit.id && l.logicalDate === d.dateStr);
              const isCompleted = !!log;
              const habitColor = habit.color || '#ff1a1a';
              
              return (
                <div 
                  key={d.dateStr}
                  onClick={() => handleCellClick(habit.id, d.dateStr, isCompleted, habit.title, parseFloat(habit.targetValue || '1'), habit.isQuantitative)}
                  className={`${styles.daySquare} ${isCompleted ? styles.daySquareActive : ''}`}
                  style={{
                    width: viewMode === 'daily' ? '60px' : '24px',
                    height: viewMode === 'daily' ? '60px' : '24px',
                    borderRadius: viewMode === 'daily' ? '12px' : '6px',
                    backgroundColor: isCompleted ? habitColor : '#161616',
                    boxShadow: isCompleted 
                      ? `0 0 5px ${habitColor}, 0 0 ${viewMode === 'daily' ? '25px' : '15px'} ${habitColor}, inset 0 0 8px rgba(255,255,255,0.4)` 
                      : 'inset 0 4px 6px rgba(0,0,0,0.3)',
                    opacity: isPending ? 0.7 : 1,
                    border: isCompleted ? `1px solid rgba(255,255,255,0.3)` : `1px solid rgba(255,255,255,0.05)`,
                    filter: isCompleted ? 'saturate(1.5) brightness(1.15)' : 'none'
                  }}
                  title={`${habit.title} - ${d.dateStr}`}
                />
              );
            })}
          </div>
        </div>
      ))}

      {modalState && typeof window !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#111', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255, 26, 26, 0.3)', width: '90%', maxWidth: '400px', boxShadow: '0 0 30px rgba(255, 26, 26, 0.2)' }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.2rem', fontFamily: 'var(--font-orbitron)' }}>Completar Hábito</h3>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {modalState.habitName} (Meta: {Math.floor(modalState.targetValue)}h {Math.round((modalState.targetValue - Math.floor(modalState.targetValue)) * 60)}m)
            </p>
            
            <form onSubmit={handleModalSubmit}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Horas:</label>
                  <input 
                    type="number" 
                    min="0"
                    value={inputHours} 
                    onChange={e => setInputHours(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '1rem' }}
                    required
                    autoFocus
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Minutos:</label>
                  <input 
                    type="number" 
                    min="0"
                    max="59"
                    value={inputMinutes} 
                    onChange={e => setInputMinutes(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '1rem' }}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setModalState(null)}
                  style={{ flex: 1, padding: '0.8rem', background: 'transparent', border: '1px solid #666', color: '#ccc', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: '0.8rem', background: '#ff1a1a', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 0 15px rgba(255, 26, 26, 0.4)' }}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
