import { storage } from "./storage";
import { hashPassword } from "./auth";
import "./db";

async function seed() {
  console.log("Starting database seed...");

  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail("admin@example.com");
    
    if (!existingAdmin) {
      // Create admin user
      const hashedPassword = await hashPassword("admin123");
      const admin = await storage.createUser({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
        status: "active",
      });

      console.log("✅ Admin user created:");
      console.log("   Email: admin@example.com");
      console.log("   Password: admin123");
      console.log("   Role: admin");
    } else {
      console.log("ℹ️  Admin user already exists, skipping.");
    }

    // Check if salesperson user already exists
    const existingSales = await storage.getUserByEmail("sales@example.com");
    
    if (!existingSales) {
      // Create a sample salesperson user
      const salesPassword = await hashPassword("sales123");
      const salesperson = await storage.createUser({
        name: "John Sales",
        email: "sales@example.com",
        password: salesPassword,
        role: "salesperson",
        status: "active",
      });

      console.log("✅ Salesperson user created:");
      console.log("   Email: sales@example.com");
      console.log("   Password: sales123");
      console.log("   Role: salesperson");
    } else {
      console.log("ℹ️  Salesperson user already exists, skipping.");
    }

    // Check if Stephen user already exists
    const existingStephen = await storage.getUserByEmail("stephen@viewpoint.com");
    
    if (!existingStephen) {
      // Create hardcoded user Stephen
      const stephenPassword = await hashPassword("viewpoint");
      const stephen = await storage.createUser({
        name: "Stephen",
        email: "stephen@viewpoint.com",
        password: stephenPassword,
        role: "admin",
        status: "active",
      });

      console.log("✅ Stephen user created:");
      console.log("   Email: stephen@viewpoint.com");
      console.log("   Password: viewpoint");
      console.log("   Role: admin");
    } else {
      console.log("ℹ️  Stephen user already exists, skipping.");
    }

    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Error during seed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
