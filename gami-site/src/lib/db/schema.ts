import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const waitlist = pgTable('waitlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  walletAddress: text('wallet_address'),
  referralCode: text('referral_code'),
  source: text('source').default('web'),
  country: text('country'),
  company: text('company'),
  role: text('role'),
  interests: text('interests'),
  status: text('status').default('registered'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const waitlistAlertSubscribers = pgTable('waitlist_alert_subscribers', {
  email: text('email').primaryKey(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
