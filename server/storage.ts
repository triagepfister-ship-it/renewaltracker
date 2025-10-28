// Referenced from javascript_database blueprint
import {
  users,
  customers,
  renewals,
  attachments,
  notifications,
  notificationPreferences,
  type User,
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type Renewal,
  type InsertRenewal,
  type Attachment,
  type InsertAttachment,
  type Notification,
  type InsertNotification,
  type NotificationPreference,
  type InsertNotificationPreference,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  updateUserStatus(id: string, status: 'active' | 'disabled'): Promise<User | undefined>;

  // Customers
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<void>;

  // Renewals
  getAllRenewals(): Promise<Renewal[]>;
  getRenewal(id: string): Promise<Renewal | undefined>;
  createRenewal(renewal: InsertRenewal): Promise<Renewal>;
  updateRenewal(id: string, renewal: Partial<InsertRenewal>): Promise<Renewal | undefined>;
  deleteRenewal(id: string): Promise<void>;

  // Attachments
  getAttachmentsByRenewal(renewalId: string): Promise<Attachment[]>;
  getAttachment(id: string): Promise<Attachment | undefined>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: string): Promise<void>;

  // Notifications
  getAllNotifications(): Promise<Notification[]>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  deleteNotificationsByRenewal(renewalId: string): Promise<void>;

  // Notification Preferences
  getNotificationPreference(userId: string): Promise<NotificationPreference | undefined>;
  createOrUpdateNotificationPreference(pref: InsertNotificationPreference): Promise<NotificationPreference>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async updateUserStatus(id: string, status: 'active' | 'disabled'): Promise<User | undefined> {
    const [user] = await db.update(users).set({ status }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Customers
  async getAllCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers).set(updateData).where(eq(customers.id, id)).returning();
    return customer || undefined;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Renewals
  async getAllRenewals(): Promise<any[]> {
    return db.query.renewals.findMany({
      orderBy: desc(renewals.nextDueDate),
      with: {
        customer: true,
        assignedSalesperson: true,
      },
    });
  }

  async getRenewal(id: string): Promise<Renewal | undefined> {
    const [renewal] = await db.select().from(renewals).where(eq(renewals.id, id));
    return renewal || undefined;
  }

  async createRenewal(insertRenewal: InsertRenewal): Promise<Renewal> {
    const [renewal] = await db.insert(renewals).values(insertRenewal).returning();
    return renewal;
  }

  async updateRenewal(id: string, updateData: Partial<InsertRenewal>): Promise<Renewal | undefined> {
    const [renewal] = await db.update(renewals).set({ ...updateData, updatedAt: new Date() }).where(eq(renewals.id, id)).returning();
    return renewal || undefined;
  }

  async deleteRenewal(id: string): Promise<void> {
    await db.delete(renewals).where(eq(renewals.id, id));
  }

  // Attachments
  async getAttachmentsByRenewal(renewalId: string): Promise<Attachment[]> {
    return db.select().from(attachments).where(eq(attachments.renewalId, renewalId)).orderBy(desc(attachments.uploadedAt));
  }

  async getAttachment(id: string): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
    return attachment || undefined;
  }

  async createAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const [attachment] = await db.insert(attachments).values(insertAttachment).returning();
    return attachment;
  }

  async deleteAttachment(id: string): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  // Notifications
  async getAllNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.scheduledDate));
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.salespersonId, userId)).orderBy(desc(notifications.scheduledDate));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async deleteNotificationsByRenewal(renewalId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.renewalId, renewalId));
  }

  // Notification Preferences
  async getNotificationPreference(userId: string): Promise<NotificationPreference | undefined> {
    const [pref] = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId));
    return pref || undefined;
  }

  async createOrUpdateNotificationPreference(insertPref: InsertNotificationPreference): Promise<NotificationPreference> {
    const existing = await this.getNotificationPreference(insertPref.userId);
    if (existing) {
      const [pref] = await db.update(notificationPreferences)
        .set(insertPref)
        .where(eq(notificationPreferences.userId, insertPref.userId))
        .returning();
      return pref;
    } else {
      const [pref] = await db.insert(notificationPreferences).values(insertPref).returning();
      return pref;
    }
  }
}

export const storage = new DatabaseStorage();

