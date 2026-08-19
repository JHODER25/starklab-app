'use client'

import { useState, useEffect } from 'react';
import styles from './finance.module.css';
import { addTransaction } from '../actions';
import CategoryManagerClient from './CategoryManagerClient';

type Category = { id: string; name: string; type: string };

export default function QuickTransactionForm({ categories }: { categories: Category[] }) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const activeCategories = categories.filter(c => c.type === type);

  // Reset category when switching tabs or when categories change
  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.find(c => c.name === selectedCat)) {
      setSelectedCat(activeCategories[0].name);
    }
  }, [type, activeCategories, selectedCat]);

  return (
    <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: "0.2s" }}>
      
      {/* Tabs Inteligentes */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setType('EXPENSE')}
          type="button"
          style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', background: type === 'EXPENSE' ? 'rgba(239, 68, 68, 0.2)' : 'transparent', color: type === 'EXPENSE' ? '#ef4444' : '#666' }}
        >
          REGISTRAR GASTO
        </button>
        <button 
          onClick={() => setType('INCOME')}
          type="button"
          style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', background: type === 'INCOME' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: type === 'INCOME' ? '#10B981' : '#666' }}
        >
          REGISTRAR INGRESO
        </button>
      </div>
      
      <div className={styles.categorySelector} style={{ position: 'relative' }}>
        {activeCategories.map(c => (
          <div 
            key={c.id}
            onClick={() => setSelectedCat(c.name)}
            className={`${styles.categoryPill} ${selectedCat === c.name ? (type === 'EXPENSE' ? styles.categoryPillActive : styles.categoryPillActiveGreen) : ''}`}
          >
            {c.name}
          </div>
        ))}
        <button 
          onClick={() => setIsManagerOpen(true)}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#999', borderRadius: '20px', padding: '0.4rem 0.8rem', cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Gestionar Categorías"
        >
          ⚙️
        </button>
      </div>

      <form action={addTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="hidden" name="category" value={selectedCat} />
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: '1.2rem', color: 'white', fontFamily: 'var(--font-orbitron)', fontSize: '1.5rem' }}>$</span>
          <input 
            type="number" 
            step="0.01" 
            name="amount" 
            placeholder="0.00" 
            required 
            style={{ 
              width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '8px', padding: '1rem 1rem 1rem 3rem', color: 'white', fontSize: '1.5rem', outline: 'none'
            }} 
          />
        </div>
        
        <button type="submit" name="type" value={type} className={type === 'EXPENSE' ? styles.btnExpense : styles.btnIncome} style={{ padding: '1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
          {type === 'EXPENSE' ? '- GUARDAR GASTO' : '+ GUARDAR INGRESO'}
        </button>
      </form>

      {isManagerOpen && (
        <CategoryManagerClient 
          categories={categories} 
          onClose={() => setIsManagerOpen(false)} 
        />
      )}
    </div>
  );
}
