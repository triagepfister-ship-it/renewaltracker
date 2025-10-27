// Referenced from javascript_object_storage and javascript_database blueprints
import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, requireAdmin, generateToken, hashPassword, comparePassword, type AuthRequest } from "./auth";
import { insertUserSchema, insertCustomerSchema, insertRenewalSchema, insertAttachmentSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { addMonths, subMonths, subWeeks } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Parse JSON bodies
  app.use(express.json());

  // ============================================
  // Authentication Routes
  // ============================================
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: "Your account has been disabled" });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      res.json({ token, user: userWithoutPassword });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // User Management Routes (Admin only)
  // ============================================

  app.get("/api/users", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Create user error:", error);
      res.status(400).json({ error: error.message || "Failed to create user" });
    }
  });

  app.put("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updateData: any = { ...req.body };

      if (updateData.email) {
        const existingUser = await storage.getUserByEmail(updateData.email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ error: "Email already in use" });
        }
      }

      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      } else {
        delete updateData.password;
      }

      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(400).json({ error: error.message || "Failed to update user" });
    }
  });

  app.patch("/api/users/:id/status", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'disabled'].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const user = await storage.updateUserStatus(id, status);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Update user status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      if (id === req.user?.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // Customer Routes
  // ============================================

  app.get("/api/customers", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error: any) {
      console.error("Get customers error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/customers", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error: any) {
      console.error("Create customer error:", error);
      res.status(400).json({ error: error.message || "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.updateCustomer(id, validatedData);
      
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(customer);
    } catch (error: any) {
      console.error("Update customer error:", error);
      res.status(400).json({ error: error.message || "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCustomer(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete customer error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // Renewal Routes
  // ============================================

  app.get("/api/renewals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const renewals = await storage.getAllRenewals();
      res.json(renewals);
    } catch (error: any) {
      console.error("Get renewals error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/renewals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertRenewalSchema.parse(req.body);
      const renewal = await storage.createRenewal(validatedData);

      // Auto-generate notifications based on renewal interval
      await generateNotificationsForRenewal(renewal);

      res.status(201).json(renewal);
    } catch (error: any) {
      console.error("Create renewal error:", error);
      res.status(400).json({ error: error.message || "Failed to create renewal" });
    }
  });

  app.put("/api/renewals/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertRenewalSchema.parse(req.body);
      const renewal = await storage.updateRenewal(id, validatedData);
      
      if (!renewal) {
        return res.status(404).json({ error: "Renewal not found" });
      }

      // Delete old notifications and regenerate
      await storage.deleteNotificationsByRenewal(id);
      await generateNotificationsForRenewal(renewal);

      res.json(renewal);
    } catch (error: any) {
      console.error("Update renewal error:", error);
      res.status(400).json({ error: error.message || "Failed to update renewal" });
    }
  });

  app.delete("/api/renewals/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRenewal(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete renewal error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // Attachment Routes
  // ============================================

  app.get("/api/renewals/:renewalId/attachments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { renewalId } = req.params;
      const attachments = await storage.getAttachmentsByRenewal(renewalId);
      res.json(attachments);
    } catch (error: any) {
      console.error("Get attachments error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/attachments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertAttachmentSchema.parse(req.body);
      
      // Normalize the file path using object storage service
      const objectStorageService = new ObjectStorageService();
      const normalizedPath = await objectStorageService.trySetObjectEntityAclPolicy(
        validatedData.filePath,
        {
          owner: req.user!.id,
          visibility: "private",
        }
      );

      const attachment = await storage.createAttachment({
        ...validatedData,
        filePath: normalizedPath,
      });

      res.status(201).json(attachment);
    } catch (error: any) {
      console.error("Create attachment error:", error);
      res.status(400).json({ error: error.message || "Failed to create attachment" });
    }
  });

  app.get("/api/attachments/:id/download", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const attachment = await storage.getAttachment(id);
      
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }

      // Generate a short-lived download URL for the object
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(attachment.filePath);
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: req.user?.id,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Generate a signed download URL (valid for 1 hour)
      const downloadURL = await generateSignedDownloadURL(attachment.filePath);
      res.json({ downloadURL });
    } catch (error: any) {
      console.error("Get download URL error:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      res.status(500).json({ error: "Failed to generate download URL" });
    }
  });

  app.delete("/api/attachments/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAttachment(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Delete attachment error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // Notification Routes
  // ============================================

  app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error: any) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // Notification Preferences Routes
  // ============================================

  app.get("/api/notification-preferences/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      let preferences = await storage.getNotificationPreference(userId);
      
      // Create default preferences if they don't exist
      if (!preferences) {
        preferences = await storage.createOrUpdateNotificationPreference({
          userId,
          enable2Months: true,
          enable1Month: true,
          enable1Week: true,
        });
      }

      res.json(preferences);
    } catch (error: any) {
      console.error("Get notification preferences error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/notification-preferences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId, enable2Months, enable1Month, enable1Week } = req.body;
      
      const preferences = await storage.createOrUpdateNotificationPreference({
        userId,
        enable2Months,
        enable1Month,
        enable1Week,
      });

      res.json(preferences);
    } catch (error: any) {
      console.error("Update notification preferences error:", error);
      res.status(400).json({ error: error.message || "Failed to update preferences" });
    }
  });

  // ============================================
  // Object Storage Routes
  // ============================================

  app.get("/objects/:objectPath(*)", authenticateToken, async (req: AuthRequest, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: req.user?.id,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(401);
      }

      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Get upload URL error:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // ============================================
  // Helper Functions
  // ============================================

  async function generateSignedDownloadURL(objectPath: string): Promise<string> {
    // This generates a time-limited signed URL for downloading objects
    // The URL will be valid for 1 hour
    const { bucketName, objectName } = parseObjectPath(objectPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "GET",
      ttlSec: 3600, // 1 hour
    });
  }

  function parseObjectPath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }
    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");
    return { bucketName, objectName };
  }

  async function signObjectURL({
    bucketName,
    objectName,
    method,
    ttlSec,
  }: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
  }): Promise<string> {
    const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}`
      );
    }
    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }

  async function generateNotificationsForRenewal(renewal: any) {
    if (!renewal.assignedSalespersonId) {
      return;
    }

    // Get salesperson's notification preferences
    let preferences = await storage.getNotificationPreference(renewal.assignedSalespersonId);
    if (!preferences) {
      preferences = await storage.createOrUpdateNotificationPreference({
        userId: renewal.assignedSalespersonId,
        enable2Months: true,
        enable1Month: true,
        enable1Week: true,
      });
    }

    const dueDate = new Date(renewal.nextDueDate);

    // Create notifications based on preferences
    if (preferences.enable2Months) {
      const scheduledDate = subMonths(dueDate, 2);
      if (scheduledDate > new Date()) {
        await storage.createNotification({
          renewalId: renewal.id,
          salespersonId: renewal.assignedSalespersonId,
          notificationType: '2_months',
          scheduledDate,
          status: 'pending',
        });
      }
    }

    if (preferences.enable1Month) {
      const scheduledDate = subMonths(dueDate, 1);
      if (scheduledDate > new Date()) {
        await storage.createNotification({
          renewalId: renewal.id,
          salespersonId: renewal.assignedSalespersonId,
          notificationType: '1_month',
          scheduledDate,
          status: 'pending',
        });
      }
    }

    if (preferences.enable1Week) {
      const scheduledDate = subWeeks(dueDate, 1);
      if (scheduledDate > new Date()) {
        await storage.createNotification({
          renewalId: renewal.id,
          salespersonId: renewal.assignedSalespersonId,
          notificationType: '1_week',
          scheduledDate,
          status: 'pending',
        });
      }
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
