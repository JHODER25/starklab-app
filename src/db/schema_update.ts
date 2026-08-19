import { pgTable, uuid, varchar, timestamp, integer, boolean, numeric } from 'drizzle-orm/pg-core';
import { users } from './schema.js';

export const habits = pgTable('habits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }),
  currentStreak: integer('current_streak').default(0),
  isActive: boolean('is_active').default(true),
  targetValue: numeric('target_value').default('1'),
  baseXp: integer('base_xp').default(50),
  isQuantitative: boolean('is_quantitative').default(false), // NEW FIELD
  createdAt: timestamp('created_at').defaultNow(),
});
