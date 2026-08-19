import styles from "../page.module.css";
import { createClient } from '@/utils/supabase/server';
import { db } from '@/db';
import { xpHistory, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from "next/navigation";
import { getRankInfo } from "@/utils/ranks";

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login');
  }

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
  const { currentRank } = getRankInfo(dbUser?.totalXp || 0);
  
  const historyLogs = await db.select()
    .from(xpHistory)
    .where(eq(xpHistory.userId, user.id))
    .orderBy(desc(xpHistory.createdAt))
    .limit(15);

  const logout = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  };

  return (
    <div className={styles.dashboard}>
      <header className={`${styles.header} animate-fade-in`}>
        <h1 className={styles.title}>Perfil de Operador</h1>
        <p className={styles.subtitle}>Tu expediente personal en el Sistema Starklab.</p>
      </header>
      <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: "0.1s", borderColor: currentRank.color, boxShadow: `0 0 20px ${currentRank.color}20` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.cardHeader} style={{ color: currentRank.color, borderColor: `${currentRank.color}40`, textShadow: `0 0 10px ${currentRank.color}` }}>Datos del Usuario</h2>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: currentRank.color, fontWeight: 'bold', fontFamily: 'var(--font-orbitron)', textShadow: `0 0 10px ${currentRank.color}` }}>RANGO: {currentRank.name}</div>
            <div style={{ color: '#888', fontSize: '0.8rem' }}>Total XP: {dbUser?.totalXp || 0}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <p style={{ color: "#fff", fontSize: '0.9rem' }}>
            <strong>Email Autenticado:</strong> {user.email}
          </p>
          <form action={logout}>
            <button 
              type="submit" 
              style={{
                background: 'rgba(255,0,0,0.1)',
                border: '1px solid #ff1a1a',
                color: '#ff1a1a',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontFamily: 'var(--font-orbitron)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              CERRAR SESIÓN
            </button>
          </form>
        </div>
      </div>

      <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: "0.2s", marginTop: "2rem" }}>
        <h2 className={styles.cardHeader} style={{ marginBottom: '1rem' }}>Historial de XP (Auditoría)</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Registro detallado de todas las transacciones de experiencia de tu cuenta para verificar que el sistema de recompensas y penalizaciones funcione correctamente.</p>
        
        {historyLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {historyLogs.map(log => {
              const isPositive = log.amount > 0;
              const dateObj = new Date(log.createdAt);
              const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
              const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', borderLeft: `3px solid ${isPositive ? '#10B981' : '#ff1a1a'}` }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{log.description}</span>
                    <span style={{ color: '#666', fontSize: '0.75rem', marginTop: '4px' }}>Módulo: {log.sourceModule} • {dateStr} a las {timeStr}</span>
                  </div>
                  <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-orbitron)', fontSize: '1.1rem', color: isPositive ? '#10B981' : '#ff1a1a', textShadow: `0 0 10px ${isPositive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 26, 26, 0.4)'}` }}>
                    {isPositive ? '+' : ''}{log.amount} XP
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: '#666' }}>No hay registros de XP todavía.</div>
        )}
      </div>
    </div>
  );
}
