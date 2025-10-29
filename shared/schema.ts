import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - supports admin and salesperson roles
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().$type<'admin' | 'salesperson'>().default('salesperson'),
  status: text("status").notNull().$type<'active' | 'disabled'>().default('active'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  assignedSalespersonId: varchar("assigned_salesperson_id").references(() => users.id),
  salesforceOpportunityUrl: text("salesforce_opportunity_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Renewals table
export const renewals = pgTable("renewals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: 'cascade' }),
  serviceType: text("service_type").notNull().$type<'Infrared Thermography Analysis' | 'Arc Flash Hazard Assessment' | 'VUMO' | 'Training' | 'Switchgear Maintenance (EPM)'>().default('Infrared Thermography Analysis'),
  siteCode: text("site_code"),
  referenceId: integer("reference_id"),
  address: text("address"),
  lastServiceDate: timestamp("last_service_date").notNull(),
  nextDueDate: timestamp("next_due_date").notNull(),
  intervalType: text("interval_type").notNull().$type<'annual' | 'bi-annual' | '2-year' | '3-year' | '5-year' | 'custom'>().default('annual'),
  customIntervalMonths: integer("custom_interval_months"),
  status: text("status").notNull().$type<'pending' | 'contacted' | 'completed' | 'dead'>().default('contacted'),
  notes: text("notes"),
  assignedSalespersonId: varchar("assigned_salesperson_id").references(() => users.id),
  salesforceOpportunityUrl: text("salesforce_opportunity_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Attachments table - stores metadata for files uploaded to object storage
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  renewalId: varchar("renewal_id").notNull().references(() => renewals.id, { onDelete: 'cascade' }),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// Notifications table - tracks scheduled and sent notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  renewalId: varchar("renewal_id").notNull().references(() => renewals.id, { onDelete: 'cascade' }),
  salespersonId: varchar("salesperson_id").notNull().references(() => users.id),
  notificationType: text("notification_type").notNull().$type<'2_months' | '1_month' | '1_week'>(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  sentAt: timestamp("sent_at"),
  status: text("status").notNull().$type<'pending' | 'sent'>().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notification preferences - per salesperson defaults
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  enable2Months: boolean("enable_2_months").notNull().default(true),
  enable1Month: boolean("enable_1_month").notNull().default(true),
  enable1Week: boolean("enable_1_week").notNull().default(true),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedCustomers: many(customers),
  assignedRenewals: many(renewals),
  uploadedAttachments: many(attachments),
  notifications: many(notifications),
  notificationPreference: many(notificationPreferences),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  assignedSalesperson: one(users, {
    fields: [customers.assignedSalespersonId],
    references: [users.id],
  }),
  renewals: many(renewals),
}));

export const renewalsRelations = relations(renewals, ({ one, many }) => ({
  customer: one(customers, {
    fields: [renewals.customerId],
    references: [customers.id],
  }),
  assignedSalesperson: one(users, {
    fields: [renewals.assignedSalespersonId],
    references: [users.id],
  }),
  attachments: many(attachments),
  notifications: many(notifications),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  renewal: one(renewals, {
    fields: [attachments.renewalId],
    references: [renewals.id],
  }),
  uploadedByUser: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  renewal: one(renewals, {
    fields: [notifications.renewalId],
    references: [renewals.id],
  }),
  salesperson: one(users, {
    fields: [notifications.salespersonId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(['admin', 'salesperson']).default('salesperson'),
  status: z.enum(['active', 'disabled']).default('active'),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
}).extend({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().optional().or(z.literal('')),
  email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Invalid email address",
  }),
  phone: z.string().optional().or(z.literal('')),
  salesforceOpportunityUrl: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Invalid URL",
  }),
});

export const insertRenewalSchema = createInsertSchema(renewals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  customerId: z.string().min(1, "Customer is required"),
  serviceType: z.enum(['Infrared Thermography Analysis', 'Arc Flash Hazard Assessment', 'VUMO', 'Training', 'Switchgear Maintenance (EPM)']),
  siteCode: z.string().regex(/^\d{5}$/, "Site code must be exactly 5 digits").optional().or(z.literal('')),
  referenceId: z.number().int().positive().optional(),
  address: z.string().optional().or(z.literal('')),
  lastServiceDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  nextDueDate: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  intervalType: z.enum(['annual', 'bi-annual', '2-year', '3-year', '5-year', 'custom']),
  customIntervalMonths: z.number().int().positive().optional(),
  status: z.enum(['contacted', 'completed', 'dead']).default('contacted'),
  notes: z.string().optional(),
  assignedSalespersonId: z.string().optional(),
  salesforceOpportunityUrl: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Invalid URL",
  }),
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  uploadedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Renewal = typeof renewals.$inferSelect;
export type InsertRenewal = z.infer<typeof insertRenewalSchema>;

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

// Extended types with relations for frontend use
export type CustomerWithRelations = Customer & {
  assignedSalesperson?: User;
  renewals?: Renewal[];
};

export type RenewalWithRelations = Renewal & {
  customer?: Customer;
  assignedSalesperson?: User;
  attachments?: Attachment[];
  notifications?: Notification[];
};

export type NotificationWithRelations = Notification & {
  renewal?: RenewalWithRelations;
  salesperson?: User;
};
