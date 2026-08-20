import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["athlete", "admin"]);
export const userStatus = pgEnum("user_status", [
  "pending",
  "approved",
  "rejected",
]);
export const bookingStatus = pgEnum("booking_status", [
  "confirmed",
  "cancelled",
  "no_show",
  "attended",
]);
export const slotStatus = pgEnum("slot_status", ["active", "cancelled"]);
export const waitlistStatus = pgEnum("waitlist_status", [
  "waiting",
  "offered",
  "expired",
  "converted",
]);
export const messagePriority = pgEnum("message_priority", [
  "info",
  "important",
  "urgent",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("athlete"),
  status: userStatus("status").notNull().default("pending"),
  notifyEmailBookings: boolean("notify_email_bookings").notNull().default(true),
  notifyEmailMessages: boolean("notify_email_messages").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  instructor: text("instructor").notNull().default("Dott. Carlo Poggioli"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const slots = pgTable("slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  capacity: integer("capacity").notNull().default(10),
  notes: text("notes"),
  status: slotStatus("status").notNull().default("active"),
  cancelWindowHours: integer("cancel_window_hours").notNull().default(2),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id").notNull().references(() => slots.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: bookingStatus("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
});

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id").notNull().references(() => slots.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: waitlistStatus("status").notNull().default("waiting"),
  position: integer("position").notNull(),
  offeredAt: timestamp("offered_at", { withTimezone: true }),
  offerExpiresAt: timestamp("offer_expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  priority: messagePriority("priority").notNull().default("info"),
  sentBy: uuid("sent_by").notNull().references(() => users.id),
  audience: text("audience").notNull().default("all"), // "all" | "single"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messageRecipients = pgTable(
  "message_recipients",
  {
    messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.userId] })],
);

// Relations

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  waitlistEntries: many(waitlist),
  messageInbox: many(messageRecipients),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  slots: many(slots),
}));

export const slotsRelations = relations(slots, ({ one, many }) => ({
  course: one(courses, { fields: [slots.courseId], references: [courses.id] }),
  bookings: many(bookings),
  waitlist: many(waitlist),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  slot: one(slots, { fields: [bookings.slotId], references: [slots.id] }),
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  slot: one(slots, { fields: [waitlist.slotId], references: [slots.id] }),
  user: one(users, { fields: [waitlist.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ many, one }) => ({
  recipients: many(messageRecipients),
  sender: one(users, { fields: [messages.sentBy], references: [users.id] }),
}));

export const messageRecipientsRelations = relations(messageRecipients, ({ one }) => ({
  message: one(messages, { fields: [messageRecipients.messageId], references: [messages.id] }),
  user: one(users, { fields: [messageRecipients.userId], references: [users.id] }),
}));
