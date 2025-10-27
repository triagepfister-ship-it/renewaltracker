import { storage } from "./storage";
import { hashPassword } from "./auth";
import "./db";

async function seed() {
  console.log("Starting database seed...");

  try {
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail("admin@example.com");
    
    if (existingAdmin) {
      console.log("Admin user already exists. Skipping seed.");
      return;
    }

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

    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Error during seed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
