import { db } from "../db";
import { users, companies } from "@shared/schema";
import { hashPassword } from "../auth";
import { randomUUID } from "crypto";

async function createDemoUser() {
  try {
    // Check if demo user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "demo")
    });

    if (existingUser) {
      console.log("Demo user already exists");
      console.log("Username: demo");
      console.log("Password: demo123");
      return;
    }

    // Create a demo company first
    const companyId = randomUUID();
    const [demoCompany] = await db.insert(companies)
      .values({
        id: companyId,
        name: "Demo Company",
        industry: "Technology",
        size: "1-10",
        website: "https://demo.company.com",
        description: "A demo company for testing purposes"
      })
      .returning();

    // Create demo user with hashed password
    const hashedPassword = await hashPassword("demo123");
    const userId = randomUUID();
    
    const [demoUser] = await db.insert(users)
      .values({
        id: userId,
        username: "demo",
        email: "demo@example.com",
        password: hashedPassword,
        firstName: "Demo",
        lastName: "User",
        companyId: demoCompany.id,
        role: "owner"
      })
      .returning();

    if (demoUser) {
      console.log("Demo user created successfully!");
      console.log("Username: demo");
      console.log("Password: demo123");
    } else {
      console.log("Demo user already exists");
    }

  } catch (error) {
    console.error("Error creating demo user:", error);
  } finally {
    process.exit(0);
  }
}

createDemoUser();