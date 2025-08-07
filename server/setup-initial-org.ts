import { db } from "./db";
import { companies, users } from "@shared/schema";
import { hashPassword } from "./auth";

async function setupInitialOrg() {
  try {
    console.log("Setting up initial organization...");
    
    // Create Webware company
    const [company] = await db
      .insert(companies)
      .values({
        name: "Webware",
        domain: "webware.io",
      })
      .returning();
    
    console.log("Created company:", company.name);
    
    // Hash the password
    const hashedPassword = await hashPassword("Cyber123!");
    
    // Create Cory York as the owner
    const [user] = await db
      .insert(users)
      .values({
        username: "cory@webware.io",
        email: "cory@webware.io",
        password: hashedPassword,
        firstName: "Cory",
        lastName: "York",
        companyId: company.id,
        role: "owner",
      })
      .returning();
    
    console.log("Created user:", user.email, "with role:", user.role);
    console.log("\n✅ Initial organization setup complete!");
    console.log("\nYou can now login with:");
    console.log("Username: cory@webware.io");
    console.log("Password: Cyber123!");
    
    process.exit(0);
  } catch (error) {
    console.error("Error setting up initial organization:", error);
    process.exit(1);
  }
}

setupInitialOrg();