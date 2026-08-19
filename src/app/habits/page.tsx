import styles from "./habits.module.css";
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { habits, habitLogs, xpHistory } from '@/db/schema'
import { eq, desc, and, gte } from 'drizzle-orm'
import { redirect } from "next/navigation";
import HabitGridClient from "./HabitGridClient";
import TrendChart from "./TrendChart";
import { registerWakeUp, logPenalty } from "../actions";
import NewHabitForm from "./NewHabitForm";

export default async function HabitsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const userHabits = await db.select().from(habits)
    .where(eq(habits.userId, user.id))
    .orderBy(desc(habits.createdAt));
    
  const logs = await db.select().from(habitLogs).where(eq(habitLogs.userId, user.id));

  // Últimos 20 días (del más antiguo al hoy para leerlo de izq a der)
  const now = new Date();
  const peruTimeStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(now);
  const peruMidnightUTC = new Date(`${peruTimeStr}T05:00:00Z`);
  
  const days = Array.from({ length: 20 }).map((_, i) => {
    const d = new Date(peruMidnightUTC);
    d.setUTCDate(d.getUTCDate() - (19 - i));
    const dateStr = d.toISOString().split('T')[0];
    const label = `${d.getUTCDate()}`;
    return { dateStr, label };
  });

  // Calculate Today's completion
  const todayStr = peruTimeStr;
  const todaysLogs = logs.filter(l => l.logicalDate === todayStr);
  const totalActive = userHabits.filter(h => h.isActive).length;
  const completedToday = todaysLogs.length;
  const progressPercent = totalActive > 0 ? (completedToday / totalActive) * 100 : 0;

  // Chart Data: Completion count over the last 30 days
  const chartDays = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date(peruMidnightUTC);
    d.setUTCDate(d.getUTCDate() - (29 - i));
    return { dateStr: d.toISOString().split('T')[0], label: `${d.getUTCDate()}` };
  });

  const chartData = chartDays.map(d => {
    const dayLogs = logs.filter(l => l.logicalDate === d.dateStr).length;
    return { date: d.label, value: dayLogs };
  });

  // Check if wake up was already logged today
  const peruTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));
  // Midnight in Peru is 5:00 AM UTC
  const startOfToday = new Date(Date.UTC(peruTime.getUTCFullYear(), peruTime.getUTCMonth(), peruTime.getUTCDate(), 5, 0, 0, 0));

  const wakeUpLogs = await db.select().from(xpHistory)
    .where(and(
      eq(xpHistory.userId, user.id), 
      eq(xpHistory.sourceModule, 'TIME'),
      gte(xpHistory.createdAt, startOfToday)
    ));
    
  const hasWokenUpToday = wakeUpLogs.length > 0;

  return (
    <div className={styles.container}>
      <header className={`${styles.header} animate-fade-in`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff3333', fontSize: '0.9rem', fontWeight: 600 }}>
          <span>&lt;</span> <span>Matrix de Disciplina</span>
        </div>
        <h1 className={styles.title}>Habits</h1>
      </header>

      {/* Trend Graph (Now at the top) */}
      <div className={`${styles.card} ${styles.graphCard} animate-fade-in`} style={{ animationDelay: '0.1s', padding: '1.5rem 0 0 0' }}>
        <span className={styles.cardHeader} style={{ paddingLeft: '1.5rem' }}>Progress as of {todayStr}</span>
        <div className={styles.chartContainer}>
          <TrendChart data={chartData} maxDomain={totalActive} />
        </div>
      </div>

      {/* Habit Grid */}
      <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: '0.2s', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span className={styles.cardHeader} style={{ marginBottom: 0 }}>Habit Grid</span>
          <NewHabitForm />
        </div>
        
        {userHabits.length > 0 ? (
          <HabitGridClient habits={userHabits} logs={logs} days={days} />
        ) : (
          <p style={{ color: '#666', textAlign: 'center', margin: '2rem 0' }}>No habits tracked. Start building discipline below.</p>
        )}
      </div>

      {/* Progress Bar (Moved below Grid) */}
      <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
          <span>Today {completedToday}/{totalActive} habits completed</span>
          <span style={{ color: '#ff1a1a' }}>{Math.round(progressPercent)}%</span>
        </div>
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar} style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* TIME / WAKE UP WIDGET (Moved below Progress Bar) */}
      <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: '0.4s', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className={styles.cardHeader} style={{ marginBottom: '0.2rem', paddingBottom: '0.2rem', border: 'none' }}>DESPERTADOR XP</div>
          <span style={{ color: '#888', fontSize: '0.8rem' }}>Marcar al instante. Objetivo: 06:00 AM</span>
        </div>
        {hasWokenUpToday ? (
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 'bold' }}>
            ☀️ Ya marcado hoy
          </div>
        ) : (
          <form action={async (formData) => { 'use server'; await registerWakeUp(formData); }}>
            <button type="submit" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid #10B981', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
              ☀️ Marcar Despertar (AHORA)
            </button>
          </form>
        )}
      </div>

      {/* PENALTY WIDGET */}
      <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: '0.5s', padding: '1.5rem' }}>
        <div className={styles.cardHeader} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#ff3333' }}>
          ⚠️ REGISTRO DE PENALIZACIONES
        </div>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Registra un mal hábito que hayas cometido (ej. "Comí comida chatarra"). El sistema descontará XP automáticamente para mantener la disciplina.
        </p>
        <form action={async (formData) => { 'use server'; await logPenalty(formData); }} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            name="reason" 
            placeholder="¿En qué fallaste hoy?" 
            required 
            style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem 1rem', borderRadius: '8px', outline: 'none' }}
          />
          <button type="submit" style={{ background: 'rgba(255, 51, 51, 0.1)', color: '#ff3333', border: '1px solid #ff3333', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            Restar XP
          </button>
        </form>
      </div>

    </div>
  );
}
