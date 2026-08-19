import { pgTable, uuid, varchar, text, timestamp, boolean, integer, numeric, date, time } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  timezone: varchar("timezone", { length: 50 }).default("UTC").notNull(),
  dayStartTime: time("day_start_time").default("00:00").notNull(),
  currentLevel: integer("current_level").default(1).notNull(),
  totalXp: integer("total_xp").default(0).notNull(),
  freezeDaysAvailable: integer("freeze_days_available").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  currentStreak: integer("current_streak").default(0).notNull(),
  targetValue: numeric("target_value", { precision: 10, scale: 2 }).default("1").notNull(),
  baseXp: integer("base_xp").default(50).notNull(),
  color: varchar("color", { length: 20 }).default("#00f3ff").notNull(),
  isQuantitative: boolean("is_quantitative").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const habitLogs = pgTable("habit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  habitId: uuid("habit_id").references(() => habits.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  logicalDate: date("logical_date").notNull(),
  isCompleted: boolean("is_completed").notNull(),
  completedValue: numeric("completed_value", { precision: 10, scale: 2 }).default("1").notNull(),
  earnedXp: integer("earned_xp").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const financialTransactions = pgTable("financial_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  transactionType: varchar("transaction_type", { length: 10 }).notNull(), // "INCOME" | "EXPENSE"
  category: varchar("category", { length: 50 }).notNull(),
  logicalDate: date("logical_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const xpHistory = pgTable("xp_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  sourceModule: varchar("source_module", { length: 50 }).notNull(), // "HABITS" | "FINANCE" | "SYSTEM"
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quests = pgTable("quests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  xpReward: integer("xp_reward").notNull(),
  xpPenalty: integer("xp_penalty").notNull(),
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 20 }).default("PENDING").notNull(), // PENDING, COMPLETED, FAILED
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  requiredXp: integer("required_xp").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // WEEKLY, MONTHLY
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'GENERAL' for general budget, or specific names
  limitAmount: numeric("limit_amount", { precision: 12, scale: 2 }).notNull(),
  period: varchar("period", { length: 20 }).default("MONTHLY").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const transactionCategories = pgTable("transaction_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(), // "INCOME" | "EXPENSE"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
