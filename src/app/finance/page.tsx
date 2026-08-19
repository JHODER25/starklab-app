import styles from "./finance.module.css";
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { financialTransactions, budgets, transactionCategories } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { redirect } from "next/navigation";
import FinanceChart from "./FinanceChart";
import DonutChart from "./DonutChart";
import QuickTransactionForm from "./QuickTransactionForm";
import BudgetManagerClient from "./BudgetManagerClient";

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const transactions = await db.select().from(financialTransactions)
    .where(eq(financialTransactions.userId, user.id))
    .orderBy(desc(financialTransactions.createdAt));

  const userBudgets = await db.select().from(budgets).where(eq(budgets.userId, user.id));

  const categories = await db.select().from(transactionCategories).where(eq(transactionCategories.userId, user.id));

  // Extract unique categories for the dropdown (from dynamic categories)
  const uniqueCategories = Array.from(new Set(
    categories.filter(c => c.type === 'EXPENSE').map(c => c.name)
  ));

  // 1. Cálculos Generales (Ingreso, Gasto, Restante)
  const totalIncome = transactions
    .filter(t => t.transactionType === 'INCOME')
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);
    
  // Filter expenses for CURRENT WEEK for budget calculation
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(now.setDate(diff)).toISOString().split('T')[0];
  const weeklyExpenses = transactions.filter(t => t.transactionType === 'EXPENSE' && t.logicalDate >= startOfWeek);
  
  const totalExpense = transactions
    .filter(t => t.transactionType === 'EXPENSE')
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  const currentPeriodExpense = weeklyExpenses.reduce((acc, t) => acc + parseFloat(t.amount), 0);
    
  const remainingMoney = totalIncome - totalExpense;

  // General Budget check
  const generalBudget = userBudgets.find(b => b.category === 'GENERAL');
  const generalLimit = generalBudget ? parseFloat(generalBudget.limitAmount) : 0;
  const generalProgress = generalLimit > 0 ? Math.min((currentPeriodExpense / generalLimit) * 100, 100) : 0;

  // 2. Datos para Gráfica de Dona (Agrupación de Gastos por Categoría)
  const expenseByCategory: Record<string, number> = {};
  transactions.filter(t => t.transactionType === 'EXPENSE').forEach(t => {
    expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + parseFloat(t.amount);
  });
  const donutData = Object.keys(expenseByCategory)
    .map(key => ({ name: key, value: expenseByCategory[key] }))
    .sort((a, b) => b.value - a.value);

  // 3. Gráfica de Líneas
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    
    const dayTotal = transactions
      .filter(t => t.logicalDate === ds && t.transactionType === 'EXPENSE')
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);

    return {
      date: `${d.getDate()}/${d.getMonth()+1}`,
      value: dayTotal
    };
  });

  return (
    <div className={styles.container}>
      <header className={`${styles.header} animate-fade-in`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff3333', fontSize: '0.9rem', fontWeight: 600 }}>
          <span>&lt;</span> <span>Finanzas Avanzadas</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className={styles.title}>Flujo de Caja</h1>
          <BudgetManagerClient categories={uniqueCategories} budgets={userBudgets} />
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* PRESUPUESTO GENERAL */}
        {generalBudget && (
          <div className={`${styles.card} animate-fade-in`} style={{ border: generalProgress >= 90 ? '1px solid rgba(255,0,0,0.5)' : '1px solid rgba(255,255,255,0.2)' }}>
             <span className={styles.cardHeader}>🌍 Presupuesto General (Semana Actual)</span>
             <div className={styles.budgetInfo}>
                <span style={{ fontSize: '1.5rem', color: 'white', fontWeight: 'bold' }}>Gastado: ${currentPeriodExpense.toFixed(2)}</span>
                <span style={{ color: '#888' }}>Límite: ${generalLimit.toFixed(2)}</span>
             </div>
             <div className={styles.progressBarContainer} style={{ height: '12px', background: 'rgba(255,255,255,0.05)' }}>
                <div 
                  className={styles.progressBar} 
                  style={{ 
                    width: `${generalProgress}%`, 
                    background: generalProgress >= 90 ? '#ff1a1a' : 'linear-gradient(90deg, #10B981, #34D399)',
                    boxShadow: generalProgress >= 90 ? '0 0 15px rgba(255,0,0,0.8)' : 'none'
                  }}>
                </div>
             </div>
          </div>
        )}

        {/* 1. TARJETAS DE RESUMEN GLOBAL */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }} className="animate-fade-in">
          <div className={styles.card} style={{ border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
            <span className={styles.cardHeader} style={{ color: '#10B981' }}>Ingreso Histórico</span>
            <span className={styles.amountSmall} style={{ color: '#10B981' }}>${totalIncome.toFixed(2)}</span>
          </div>
          <div className={styles.card} style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <span className={styles.cardHeader} style={{ color: '#ef4444' }}>Gasto Histórico</span>
            <span className={styles.amountSmall}>${totalExpense.toFixed(2)}</span>
          </div>
          <div className={styles.card} style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <span className={styles.cardHeader} style={{ color: 'white' }}>Dinero Restante</span>
            <span className={styles.amountSmall} style={{ color: 'white' }}>${remainingMoney.toFixed(2)}</span>
          </div>
        </div>

        {/* 3. GRÁFICAS (Grid layout para Dona y Líneas) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem' }} className="animate-fade-in">
          
          <div className={styles.card} style={{ animationDelay: "0.2s" }}>
            <div className={styles.cardHeader}>
              Resumen Semanal <span style={{ background: 'rgba(255,0,0,0.2)', color: '#ff3333', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', marginLeft: 'auto' }}>GASTOS</span>
            </div>
            <div className={styles.chartContainer}>
              <FinanceChart data={last7DaysData} />
            </div>
          </div>

          <div className={styles.card} style={{ animationDelay: "0.3s" }}>
            <div className={styles.cardHeader}>Distribución Histórica</div>
            <div className={styles.chartContainer}>
              {donutData.length > 0 ? (
                <DonutChart data={donutData} />
              ) : (
                <p style={{ color: '#666', textAlign: 'center', marginTop: '50px' }}>No hay datos suficientes</p>
              )}
            </div>
          </div>

        </div>

        {/* Registro Rápido */}
        <QuickTransactionForm categories={categories} />

        {/* Contadores por Categoría (Dinámicos) */}
        <span className={styles.cardHeader} style={{ marginTop: '1rem', color: 'white', display: 'block' }}>Presupuestos por Categoría (Semana Actual)</span>
        {userBudgets.filter(b => b.category !== 'GENERAL').length === 0 && (
          <p style={{ color: '#888' }}>No tienes presupuestos por categoría configurados. Usa el botón "Configurar Presupuestos".</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }} className="animate-fade-in">
          {userBudgets.filter(b => b.category !== 'GENERAL').map((budget, index) => {
            const limit = parseFloat(budget.limitAmount);
            const spent = weeklyExpenses
              .filter(t => t.category === budget.category)
              .reduce((acc, t) => acc + parseFloat(t.amount), 0);
            
            const progress = Math.min((spent / limit) * 100, 100);
            const isDanger = progress >= 90;

            return (
              <div key={budget.category} className={styles.card} style={{ padding: '1rem', animationDelay: `${0.3 + index * 0.1}s` }}>
                <span className={styles.cardHeader} style={{ fontSize: '0.8rem' }}>{budget.category}</span>
                <span className={styles.amountSmall}>${spent.toFixed(2)}</span>
                <div className={styles.budgetInfo}>
                  <span style={{ color: isDanger ? '#ff1a1a' : '#888' }}>{progress.toFixed(0)}%</span>
                  <span>/ ${limit.toFixed(2)}</span>
                </div>
                <div className={styles.progressBarContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ 
                      width: `${progress}%`, 
                      background: isDanger ? '#ff1a1a' : 'linear-gradient(90deg, #10B981, #34D399)',
                      boxShadow: isDanger ? '0 0 10px rgba(255, 26, 26, 0.8)' : '0 0 10px rgba(16, 185, 129, 0.5)'
                    }}>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Historial Reciente */}
        <div className={`${styles.card} animate-fade-in`} style={{ animationDelay: "0.6s", marginTop: '1rem' }}>
          <span className={styles.cardHeader}>Historial Reciente</span>
          <div className={styles.historyList}>
            {transactions.slice(0, 10).map(t => (
              <div key={t.id} className={styles.historyItem}>
                <div className={styles.historyIcon}>
                  {t.transactionType === 'EXPENSE' ? '📉' : '📈'}
                </div>
                <div className={styles.historyDetails}>
                  <span className={styles.historyTitle}>{t.category}</span>
                  <span className={styles.historyDate}>{t.logicalDate}</span>
                </div>
                <span className={`${styles.historyAmount} ${t.transactionType === 'EXPENSE' ? styles.expense : styles.income}`}>
                  {t.transactionType === 'EXPENSE' ? '-' : '+'} ${parseFloat(t.amount).toFixed(2)}
                </span>
              </div>
            ))}
            {transactions.length === 0 && <p style={{ color: '#666', textAlign: 'center' }}>No hay transacciones aún.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
