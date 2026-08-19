'use server'

import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { habits, habitLogs, users, financialTransactions, xpHistory, budgets, transactionCategories, quests, rewards } from '@/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function completeHabit(habitId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("No autorizado")

  // 1. Guardar el registro de la acción en la base de datos temporal
  const logicalDateString = new Date().toISOString().split('T')[0]; // Simple logical date for MVP
  
  await db.insert(habitLogs).values({
    habitId,
    userId: user.id,
    logicalDate: logicalDateString,
    isCompleted: true,
  })

  // 2. Obtener el estado actual del hábito
  const [habit] = await db.select().from(habits).where(eq(habits.id, habitId))
  
  if (habit) {
    // 3. Aumentar la racha (Condicionamiento operante)
    const newStreak = (habit.currentStreak || 0) + 1;
    await db.update(habits)
      .set({ currentStreak: newStreak })
      .where(eq(habits.id, habitId))

    // 4. Otorgar XP al perfil del usuario
    const [userData] = await db.select().from(users).where(eq(users.id, user.id))
    if (userData) {
      await db.update(users)
        .set({ totalXp: userData.totalXp + 50 })
        .where(eq(users.id, user.id))
    }
  }

  // Refrescar la pantalla
  revalidatePath('/')
}

export async function addTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado")

  const amountStr = formData.get('amount') as string;
  const amount = parseFloat(amountStr);
  const type = formData.get('type') as 'INCOME' | 'EXPENSE';
  const category = formData.get('category') as string || 'General';

  if (isNaN(amount) || amount <= 0 || !type) return;

  // Obtenemos la fecha local (Perú/local) en formato YYYY-MM-DD
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  const logicalDateString = localDate.toISOString().split('T')[0];

  await db.insert(financialTransactions).values({
    userId: user.id,
    amount: amount.toString(),
    transactionType: type,
    category,
    logicalDate: logicalDateString
  });

  // GAMIFICACION FINANCIERA
  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
  if (dbUser) {
    if (type === 'EXPENSE') {
      // Find limits in dynamic budgets
      const userBudgets = await db.select().from(budgets).where(eq(budgets.userId, user.id));
      const categoryBudget = userBudgets.find(b => b.category === category);
      
      if (categoryBudget) {
        const limit = parseFloat(categoryBudget.limitAmount);
        
        // Calculate spent in the current week (Monday to Sunday)
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const startOfWeek = new Date(now.setDate(diff)).toISOString().split('T')[0];
        
        const allTx = await db.select().from(financialTransactions).where(
          and(
            eq(financialTransactions.userId, user.id), 
            eq(financialTransactions.category, category), 
            eq(financialTransactions.transactionType, 'EXPENSE'),
            gte(financialTransactions.logicalDate, startOfWeek)
          )
        );
        
        const spent = allTx.reduce((acc, t) => acc + parseFloat(t.amount), 0);
        
        if (spent > limit) {
          const penalty = 50;
          const newXp = Math.max(0, dbUser.totalXp - penalty);
          await db.update(users).set({ totalXp: newXp }).where(eq(users.id, user.id));
          await db.insert(xpHistory).values({ userId: user.id, amount: -penalty, sourceModule: 'FINANCE', description: `Presupuesto de ${category} superado` });
        }
      }
    } else if (type === 'INCOME') {
       // El usuario aprobó quitar el XP directo por ingresos para no romper la economía.
       // Solo guardamos la transacción.
       // (Podemos añadir lógica para evaluar metas semanales de presupuesto después)
    }
  }

  revalidatePath('/');
  revalidatePath('/finance');
}

export async function registerWakeUp(formData?: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
  if (!dbUser) return { error: "User not found" };

  // Convert current server time to Peru time (UTC-5)
  const now = new Date();
  const peruTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));
  
  // Midnight in Peru is 5:00 AM UTC
  const startOfToday = new Date(Date.UTC(peruTime.getUTCFullYear(), peruTime.getUTCMonth(), peruTime.getUTCDate(), 5, 0, 0, 0));

  const wakeUpLogs = await db.select().from(xpHistory)
    .where(and(
      eq(xpHistory.userId, user.id), 
      eq(xpHistory.sourceModule, 'TIME'),
      gte(xpHistory.createdAt, startOfToday)
    ));

  if (wakeUpLogs.length > 0) {
    return { error: "Already logged today" };
  }

  const hReal = peruTime.getUTCHours();
  const mReal = peruTime.getUTCMinutes();

  const hTarget = 6;
  const mTarget = 0;
  
  const realMins = hReal * 60 + mReal;
  const targetMins = hTarget * 60 + mTarget;
  const diffMins = targetMins - realMins;

  let xpChange = 0;
  let description = "";

  if (diffMins > 0) {
    // Woke up early
    xpChange = diffMins; // 1 XP per minute early
    description = `Despertaste temprano: ${diffMins} mins antes`;
  } else if (diffMins < 0) {
    // Woke up late
    xpChange = diffMins; // -1 XP per minute late (diffMins is negative)
    description = `Despertaste tarde: ${Math.abs(diffMins)} mins de retraso`;
  } else {
    xpChange = 10;
    description = "Despertaste a la hora exacta";
  }

  // Cap rewards to avoid farming
  if (xpChange > 200) xpChange = 200;
  if (xpChange < -200) xpChange = -200;

  let newXp = Math.max(0, dbUser.totalXp + xpChange);
  let newLevel = dbUser.currentLevel;
  if (newXp >= newLevel * 1000) newLevel += 1;

  await db.update(users).set({ totalXp: newXp, currentLevel: newLevel }).where(eq(users.id, user.id));
  await db.insert(xpHistory).values({ userId: user.id, amount: xpChange, sourceModule: 'TIME', description });

  revalidatePath('/');
  revalidatePath('/habits');
  return { success: true, xpChange, newXp };
}

export async function toggleHabitLog(habitId: string, logicalDate: string, currentState: boolean, completedValue: number = 1) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
  const [habit] = await db.select().from(habits).where(eq(habits.id, habitId));
  if (!dbUser || !habit) return;

  if (currentState) {
    // Find the log to know how much XP to deduct
    const [log] = await db.select().from(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.logicalDate, logicalDate)));

    const xpToDeduct = log ? log.earnedXp : 50;

    await db.delete(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.logicalDate, logicalDate)));
    
    // Penalización
    const newXp = Math.max(0, dbUser.totalXp - xpToDeduct);
    await db.update(users).set({ totalXp: newXp }).where(eq(users.id, user.id));
    await db.update(habits).set({ currentStreak: Math.max(0, habit.currentStreak - 1) }).where(eq(habits.id, habitId));
    
    await db.insert(xpHistory).values({
      userId: user.id,
      amount: -xpToDeduct,
      sourceModule: 'HABITS',
      description: `Hábito desmarcado: ${habit.title}`
    });
  } else {
    const targetValue = parseFloat(habit.targetValue);
    const baseXp = habit.baseXp;
    const ratio = completedValue / targetValue;
    
    let baseEarned = Math.floor(Math.min(ratio, 1) * baseXp);
    let description = `Hábito parcial: ${habit.title} (${completedValue}/${targetValue})`;

    let bonus = 0;
    if (completedValue >= targetValue) {
      if (completedValue > targetValue) {
         const extraMinutes = (completedValue - targetValue) * 60;
         bonus = Math.floor(extraMinutes * 0.5);
         description = `Hábito superado: ${habit.title} (${completedValue}/${targetValue}) + Bono Extra`;
      } else {
         description = `Hábito cumplido: ${habit.title} (${completedValue}/${targetValue})`;
      }
    }

    const streak = habit.currentStreak || 0;
    const multiplier = streak >= 7 ? 2 : (streak >= 3 ? 1.5 : 1);
    
    // Apply multiplier to the whole earning
    const finalEarned = Math.round((baseEarned + bonus) * multiplier);

    await db.insert(habitLogs).values({
      habitId,
      userId: user.id,
      logicalDate,
      isCompleted: true,
      completedValue: completedValue.toString(),
      earnedXp: finalEarned
    });

    let newXp = dbUser.totalXp + finalEarned;
    let newLevel = dbUser.currentLevel;

    const xpNeededForNextLevel = newLevel * 1000;
    if (newXp >= xpNeededForNextLevel) {
      newLevel += 1;
    }

    await db.update(users).set({ 
      totalXp: newXp,
      currentLevel: newLevel
    }).where(eq(users.id, user.id));
    
    // Only increment streak if they reached the target
    if (completedValue >= targetValue) {
       await db.update(habits).set({ currentStreak: habit.currentStreak + 1 }).where(eq(habits.id, habitId));
    }
    
    await db.insert(xpHistory).values({
      userId: user.id,
      amount: finalEarned,
      sourceModule: 'HABITS',
      description: `${description} (x${multiplier})`
    });
  }
  revalidatePath('/habits');
  revalidatePath('/');
}

export async function createHabit(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const title = formData.get('title') as string;
  const color = formData.get('color') as string;
  const isQuantitative = formData.get('isQuantitative') === 'true';
  let targetValue = '1';
  if (isQuantitative) {
    const hours = parseInt(formData.get('targetHours') as string || '0');
    const minutes = parseInt(formData.get('targetMinutes') as string || '0');
    targetValue = (hours + (minutes / 60)).toString();
  }
  const baseXp = parseInt(formData.get('baseXp') as string || '50');

  if (!title) return;

  await db.insert(habits).values({
    userId: user.id,
    title,
    color,
    targetValue,
    baseXp,
    isQuantitative
  });

  revalidatePath('/habits');
  revalidatePath('/');
}

export async function deleteHabit(habitId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await db.delete(habitLogs).where(eq(habitLogs.habitId, habitId));
  await db.delete(habits).where(and(eq(habits.id, habitId), eq(habits.userId, user.id)));

  revalidatePath('/habits');
  revalidatePath('/');
}

export async function setBudget(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const category = formData.get('category') as string;
  const amountStr = formData.get('amount') as string;
  const amount = parseFloat(amountStr);

  if (!category || isNaN(amount) || amount <= 0) return { error: "Datos inválidos" };

  const existing = await db.select().from(budgets).where(
    and(eq(budgets.userId, user.id), eq(budgets.category, category))
  );

  if (existing.length > 0) {
    await db.update(budgets)
      .set({ limitAmount: amount.toString() })
      .where(eq(budgets.id, existing[0].id));
  } else {
    await db.insert(budgets).values({
      userId: user.id,
      category,
      limitAmount: amount.toString(),
      period: 'WEEKLY'
    });
  }

  revalidatePath('/finance');
  return { success: true };
}

export async function createCategory(name: string, type: 'INCOME' | 'EXPENSE') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  await db.insert(transactionCategories).values({
    userId: user.id,
    name,
    type
  });
  revalidatePath('/finance');
}

export async function editCategory(categoryId: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  await db.update(transactionCategories)
    .set({ name })
    .where(and(eq(transactionCategories.id, categoryId), eq(transactionCategories.userId, user.id)));
  revalidatePath('/finance');
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await db.delete(transactionCategories).where(and(eq(transactionCategories.id, id), eq(transactionCategories.userId, user.id)));
  revalidatePath('/finance');
}

export async function logPenalty(formData: FormData) {
  const reason = formData.get('reason') as string;
  if (!reason) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
  if (!dbUser) return;

  const penalty = 80; // System managed XP
  const newXp = Math.max(0, dbUser.totalXp - penalty);

  await db.update(users).set({ totalXp: newXp }).where(eq(users.id, user.id));
  
  await db.insert(xpHistory).values({
    userId: user.id,
    amount: -penalty,
    sourceModule: 'HABITS',
    description: `Penalización: ${reason}`
  });

  revalidatePath('/');
  revalidatePath('/habits');
}

export async function createQuest(formData: FormData) {
  const title = formData.get('title') as string;
  const xpReward = parseInt(formData.get('xpReward') as string);
  const xpPenalty = parseInt(formData.get('xpPenalty') as string);
  const deadlineStr = formData.get('deadline') as string;

  if (!title || !xpReward || !xpPenalty || !deadlineStr) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const deadline = new Date(deadlineStr);

  await db.insert(quests).values({
    userId: user.id,
    title,
    xpReward,
    xpPenalty,
    deadline
  });

  revalidatePath('/');
}

export async function completeQuest(questId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [quest] = await db.select().from(quests).where(and(eq(quests.id, questId), eq(quests.userId, user.id)));
  if (!quest || quest.status !== 'PENDING') return;

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
  if (!dbUser) return;

  // Complete quest
  await db.update(quests).set({ status: 'COMPLETED' }).where(eq(quests.id, questId));

  // Grant XP
  let newXp = dbUser.totalXp + quest.xpReward;
  let newLevel = dbUser.currentLevel;
  if (newXp >= newLevel * 1000) newLevel += 1;

  await db.update(users).set({ totalXp: newXp, currentLevel: newLevel }).where(eq(users.id, user.id));
  
  await db.insert(xpHistory).values({
    userId: user.id,
    amount: quest.xpReward,
    sourceModule: 'QUESTS',
    description: `Misión completada: ${quest.title}`
  });

  revalidatePath('/');
}

export async function failQuest(questId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const [quest] = await db.select().from(quests).where(and(eq(quests.id, questId), eq(quests.userId, user.id)));
  if (!quest || quest.status !== 'PENDING') return;

  const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
  if (!dbUser) return;

  // Fail quest
  await db.update(quests).set({ status: 'FAILED' }).where(eq(quests.id, questId));

  // Deduct XP
  const newXp = Math.max(0, dbUser.totalXp - quest.xpPenalty);
  await db.update(users).set({ totalXp: newXp }).where(eq(users.id, user.id));
  
  await db.insert(xpHistory).values({
    userId: user.id,
    amount: -quest.xpPenalty,
    sourceModule: 'QUESTS',
    description: `Misión fallida: ${quest.title}`
  });

  revalidatePath('/');
}

export async function createReward(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const title = formData.get('title') as string;
  const tierId = parseInt(formData.get('tierId') as string, 10);
  const period = formData.get('period') as string;

  // Delete existing reward for this tier and period
  await db.delete(rewards).where(
    and(
      eq(rewards.userId, user.id),
      eq(rewards.period, period),
      eq(rewards.requiredXp, tierId)
    )
  );

  await db.insert(rewards).values({
    userId: user.id,
    title,
    requiredXp: tierId,
    period
  });

  revalidatePath('/');
}

export async function autoFailHabits() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const peruMidnightUTC = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Lima' }));
  peruMidnightUTC.setDate(peruMidnightUTC.getDate() - 1);
  const yesterdayStr = Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(peruMidnightUTC);

  // Check if we already processed yesterday
  const existingPenalties = await db.select().from(xpHistory)
    .where(
      and(
        eq(xpHistory.userId, user.id),
        eq(xpHistory.sourceModule, 'SYSTEM_PENALTY'),
        eq(xpHistory.description, `Penalización por hábitos no completados (${yesterdayStr})`)
      )
    );

  if (existingPenalties.length > 0) return;

  // Process yesterday
  const userHabits = await db.select().from(habits).where(eq(habits.userId, user.id));
  const yesterdayLogs = await db.select().from(habitLogs).where(
    and(
      eq(habitLogs.userId, user.id),
      eq(habitLogs.logicalDate, yesterdayStr)
    )
  );

  const completedHabitIds = new Set(yesterdayLogs.map(log => log.habitId));
  const missedHabits = userHabits.filter(h => !completedHabitIds.has(h.id));

  if (missedHabits.length > 0) {
    const totalPenalty = missedHabits.length * 20;

    const [dbUser] = await db.select().from(users).where(eq(users.id, user.id));
    if (dbUser) {
      const newXp = Math.max(0, dbUser.totalXp - totalPenalty);
      await db.update(users).set({ totalXp: newXp }).where(eq(users.id, user.id));

      await db.insert(xpHistory).values({
        userId: user.id,
        amount: -totalPenalty,
        sourceModule: 'SYSTEM_PENALTY',
        description: `Penalización por hábitos no completados (${yesterdayStr})`
      });
      
      // Reset streaks
      for (const mh of missedHabits) {
        await db.update(habits).set({ currentStreak: 0 }).where(eq(habits.id, mh.id));
      }
    }
  }
}
