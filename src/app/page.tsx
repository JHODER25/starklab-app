import styles from "./page.module.css";
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { habits, habitLogs, users, financialTransactions, xpHistory, quests, rewards } from '@/db/schema'
import { eq, and, gte, asc } from 'drizzle-orm'
import { completeHabit, addTransaction, registerWakeUp, autoFailHabits } from './actions'
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import QuestModalClient from './QuestModalClient';
import ContractWidgetClient from './ContractWidgetClient';

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Ejecutar procesos en segundo plano
  await autoFailHabits();

  // Cargar datos del perfil
  const [userProfile] = await db.select().from(users).where(eq(users.id, user.id));

  // Cargar hábitos
  let userHabits = await db.select().from(habits).where(eq(habits.userId, user.id));

  // Cálculo de XP y Niveles
  const currentXp = userProfile?.totalXp || 0;
  const currentLevel = userProfile?.currentLevel || 1;
  const xpInCurrentLevel = currentXp - ((currentLevel - 1) * 1000);
  const xpNeeded = 1000;
  const progressPercent = Math.min((xpInCurrentLevel / xpNeeded) * 100, 100);

  // Consultar logs de hoy
  const peruMidnightUTC = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
  const logicalDateString = Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(peruMidnightUTC);
  const todayLogs = await db.select().from(habitLogs)
    .where(and(eq(habitLogs.userId, user.id), eq(habitLogs.logicalDate, logicalDateString)));
  
  const completedHabitIds = new Set(todayLogs.map(log => log.habitId));

  // Cargar transacciones financieras y calcular balance
  const transactions = await db.select().from(financialTransactions).where(eq(financialTransactions.userId, user.id));
  const balance = transactions.reduce((acc, t) => {
    const amt = parseFloat(t.amount);
    return t.transactionType === 'INCOME' ? acc + amt : acc - amt;
  }, 0);
  const formattedBalance = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance);

  // Contrato Semanal (Weekly XP)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diffToMonday));
  monday.setHours(0, 0, 0, 0);

  const weeklyXpLogs = await db.select().from(xpHistory)
    .where(and(eq(xpHistory.userId, user.id), gte(xpHistory.createdAt, monday)));
    
  const weeklyXp = weeklyXpLogs.reduce((acc, log) => acc + log.amount, 0);

  // Contrato Mensual (Monthly XP)
  const currentNow = new Date();
  const firstDayOfMonth = new Date(currentNow.getFullYear(), currentNow.getMonth(), 1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const monthlyXpLogs = await db.select().from(xpHistory)
    .where(and(eq(xpHistory.userId, user.id), gte(xpHistory.createdAt, firstDayOfMonth)));
    
  const monthlyXp = monthlyXpLogs.reduce((acc, log) => acc + log.amount, 0);

  // Expirar Misiones pasadas
  const pendingQuests = await db.select().from(quests).where(and(eq(quests.userId, user.id), eq(quests.status, 'PENDING')));
  const nowUtc = new Date();
  let latestXp = currentXp;
  for (const q of pendingQuests) {
    if (new Date(q.deadline) < nowUtc) {
      latestXp = Math.max(0, latestXp - q.xpPenalty);
      await db.update(quests).set({ status: 'FAILED' }).where(eq(quests.id, q.id));
      await db.update(users).set({ totalXp: latestXp }).where(eq(users.id, user.id));
      await db.insert(xpHistory).values({
        userId: user.id,
        amount: -q.xpPenalty,
        sourceModule: 'QUESTS',
        description: `Misión expirada: ${q.title}`
      });
    }
  }

  // Misiones activas (Quests)
  const activeQuests = await db.select().from(quests)
    .where(and(eq(quests.userId, user.id), eq(quests.status, 'PENDING')))
    .orderBy(asc(quests.deadline));

  // Recompensas
  const userRewards = await db.select().from(rewards)
    .where(eq(rewards.userId, user.id));

  return (
    <div className={styles.dashboard}>
      <header className={`${styles.header} animate-fade-in`}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Economía Unificada: Controla tu tiempo, dinero y disciplina.</p>
      </header>

      <div className={styles.grid}>
        
        {/* LEFT COLUMN */}
        <div className={styles.leftColumn}>
          {/* SUMMARY WIDGET */}
          <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: "0.1s", display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{formattedBalance}</span>
              <span className={styles.summaryLabel}>Balance Total</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue} style={{ color: '#ffaa00' }}>{weeklyXp} XP</span>
              <span className={styles.summaryLabel}>XP Semanal</span>
            </div>
          </div>

          <ContractWidgetClient 
            weeklyXp={weeklyXp} 
            monthlyXp={monthlyXp} 
            rewards={userRewards} 
            dailyMaxXp={userHabits.reduce((acc, h) => acc + h.baseXp, 0)}
            daysInMonth={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}
          />

          {/* HABITS WIDGET */}
          <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: "0.5s" }}>
            <div className={styles.cardHeader}>Misiones de Hoy</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {userHabits.filter(habit => !completedHabitIds.has(habit.id)).length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', margin: '1rem 0' }}>No tienes misiones pendientes para hoy. ¡Buen trabajo!</p>
              ) : (
                userHabits.filter(habit => !completedHabitIds.has(habit.id)).map((habit) => {
                  const actionId = habit.id;
                  
                  return (
                    <div key={habit.id} className={styles.habitRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <form action={async () => { 'use server'; await completeHabit(actionId); }}>
                          <button type="submit" className={styles.completeBtn}></button>
                        </form>
                        <span className={styles.habitName} style={{ textDecoration: 'none', color: 'white' }}>
                          {habit.title}
                        </span>
                      </div>
                      <span className={styles.habitXP}>+{habit.baseXp} XP</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightColumn}>
          {/* LEVEL WIDGET */}
          <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: "0.4s", alignItems: 'center', justifyContent: 'center' }}>
            <div className={styles.cardHeader} style={{ alignSelf: 'flex-start' }}>NIVEL {currentLevel}</div>
            <div className={styles.xpRingContainer} style={{ "--progress": `${progressPercent}%` } as React.CSSProperties}>
              <div className={styles.xpRingInner}>
                 <span className={styles.xpRingValue}>{xpInCurrentLevel}</span>
                 <span className={styles.xpRingLabel}>/ {xpNeeded} XP</span>
              </div>
            </div>
          </div>

          {/* QUESTS WIDGET (EVENTOS ESPORÁDICOS) */}
          <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: "0.55s" }}>
            <div className={styles.cardHeader} style={{ color: '#00f3ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none', paddingBottom: 0 }}>
              <span>EVENTOS DE TIEMPO LIMITADO</span>
              <QuestModalClient />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {activeQuests.length === 0 ? (
                <p style={{ color: '#666', fontSize: '0.85rem' }}>No hay eventos activos.</p>
              ) : (
                activeQuests.map((quest) => {
                  const complete = completeHabit.bind(null, quest.id);
                  return (
                    <div key={quest.id} style={{ background: 'rgba(0, 243, 255, 0.05)', border: '1px solid rgba(0, 243, 255, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>{quest.title}</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span style={{ color: '#10B981', fontSize: '0.8rem', fontWeight: 'bold' }}>+{quest.xpReward} XP</span>
                          <span style={{ color: '#ff3333', fontSize: '0.8rem', fontWeight: 'bold' }}>-{quest.xpPenalty} XP</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>
                          Vence: {new Date(quest.deadline).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <form action={async () => { 'use server'; const { completeQuest } = await import('./actions'); await completeQuest(quest.id); }}>
                          <button type="submit" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', border: '1px solid #10B981', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                            Completar
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
