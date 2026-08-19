'use client';

import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import styles from './finance.module.css';
import { createCategory, editCategory, deleteCategory } from '../actions';

type Category = {
  id: string;
  name: string;
  type: string;
};

export default function CategoryManagerClient({ categories, onClose }: { categories: Category[], onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    startTransition(() => {
      createCategory(newCatName, activeTab);
      setNewCatName('');
    });
  };

  const handleEditSave = (id: string) => {
    if (!editCatName.trim()) return;
    startTransition(() => {
      editCategory(id, editCatName);
      setEditingCatId(null);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta categoría?")) {
      startTransition(() => {
        deleteCategory(id);
      });
    }
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Gestor de Categorías</h3>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button 
            style={{ flex: 1, padding: '0.5rem', background: activeTab === 'EXPENSE' ? '#ff1a1a' : '#1a1a1a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => setActiveTab('EXPENSE')}
          >
            Gastos
          </button>
          <button 
            style={{ flex: 1, padding: '0.5rem', background: activeTab === 'INCOME' ? '#00f3ff' : '#1a1a1a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => setActiveTab('INCOME')}
          >
            Ingresos
          </button>
        </div>

        <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1rem' }}>
          {filteredCategories.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#1a1a1a', marginBottom: '0.5rem', borderRadius: '4px' }}>
              {editingCatId === c.id ? (
                <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                  <input 
                    type="text" 
                    value={editCatName} 
                    onChange={e => setEditCatName(e.target.value)} 
                    style={{ flex: 1, background: 'black', color: 'white', border: '1px solid #333', padding: '0.2rem 0.5rem' }} 
                  />
                  <button onClick={() => handleEditSave(c.id)} style={{ background: '#00cc00', color: 'white', border: 'none', padding: '0 0.5rem', cursor: 'pointer', borderRadius: '2px' }}>✓</button>
                  <button onClick={() => setEditingCatId(null)} style={{ background: '#333', color: 'white', border: 'none', padding: '0 0.5rem', cursor: 'pointer', borderRadius: '2px' }}>✗</button>
                </div>
              ) : (
                <>
                  <span>{c.name}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => { setEditingCatId(c.id); setEditCatName(c.name); }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7 }}
                      disabled={isPending}
                    >✏️</button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7 }}
                      disabled={isPending}
                    >🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <p style={{ color: '#666', textAlign: 'center' }}>No hay categorías de este tipo.</p>
          )}
        </div>

        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="Nueva Categoría (ej: 🎬 Cine)" 
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            style={{ flex: 1, background: 'black', color: 'white', border: '1px solid #333', padding: '0.5rem', borderRadius: '4px' }}
          />
          <button type="submit" disabled={isPending || !newCatName.trim()} style={{ background: activeTab === 'EXPENSE' ? '#ff1a1a' : '#00f3ff', color: activeTab === 'EXPENSE' ? 'white' : 'black', border: 'none', padding: '0 1rem', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
            +
          </button>
        </form>

        <button 
          onClick={onClose}
          style={{ width: '100%', padding: '0.8rem', background: 'transparent', color: '#666', border: '1px solid #333', borderRadius: '8px', marginTop: '1rem', cursor: 'pointer' }}
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
}
