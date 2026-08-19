'use client'

import { setBudget } from "../actions";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function BudgetManagerClient({ categories, budgets }: { categories: string[], budgets: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,0,0,0.3)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', zIndex: 10000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'white', margin: 0, fontFamily: 'var(--font-orbitron)' }}>Gestor de Presupuestos</h3>
          <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
        </div>

        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Establece límites semanales para controlar tus gastos. Las penalizaciones de XP aplican automáticamente.</p>

        <form action={async (formData) => {
          await setBudget(formData);
          setIsOpen(false);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '8px' }}>Categoría a Limitar</label>
            <select name="category" required style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', outline: 'none' }}>
              <option value="GENERAL" style={{ background: '#0a0a0a' }}>🌍 PRESUPUESTO GENERAL TOTAL</option>
              {categories.map(c => <option key={c} value={c} style={{ background: '#0a0a0a' }}>{c}</option>)}
            </select>
            <span style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px', display: 'block' }}>Si deseas una nueva, registra una transacción con ese nombre primero.</span>
          </div>

          <div>
            <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '8px' }}>Límite Semanal ($)</label>
            <input type="number" name="amount" required min="1" step="0.01" placeholder="Ej. 100.00" style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', outline: 'none', fontSize: '1.2rem' }} />
          </div>

          <button type="submit" style={{ padding: '1rem', background: '#ff1a1a', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginTop: '0.5rem' }}>
            Guardar Límite
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
      >
        ⚙️ Configurar Presupuestos
      </button>
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
