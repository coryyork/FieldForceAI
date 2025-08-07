import {
  users,
  companies,
  leads,
  documents,
  tasks,
  activities,
  leadNotes,
  aiSettings,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type Lead,
  type InsertLead,
  type Document,
  type InsertDocument,
  type Task,
  type InsertTask,
  type Activity,
  type InsertActivity,
  type LeadNote,
  type InsertLeadNote,
  type AISettings,
  type InsertAISettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Company operations
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  getCompanyByDomain(domain: string): Promise<Company | undefined>;
  
  // Lead operations
  getLeads(companyId: string): Promise<Lead[]>;
  getLead(id: string, companyId: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, companyId: string, updates: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string, companyId: string): Promise<void>;
  
  // Document operations
  getDocuments(companyId: string): Promise<Document[]>;
  getDocument(id: string, companyId: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, companyId: string, updates: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: string, companyId: string): Promise<void>;
  searchDocuments(companyId: string, query: string): Promise<Document[]>;
  
  // Task operations
  getTasks(companyId: string): Promise<Task[]>;
  getTask(id: string, companyId: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, companyId: string, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string, companyId: string): Promise<void>;
  
  // Activity operations
  getActivities(companyId: string, limit?: number): Promise<Activity[]>;

  // Lead notes operations
  getLeadNotes(leadId: string, companyId: string): Promise<any[]>;
  createLeadNote(data: any): Promise<any>;
  updateLeadNote(id: string, companyId: string, updates: any): Promise<any>;
  deleteLeadNote(id: string, companyId: string): Promise<void>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // AI Settings operations
  getAISettings(companyId: string): Promise<AISettings | undefined>;
  upsertAISettings(companyId: string, settings: Partial<InsertAISettings>): Promise<AISettings>;
  
  // Search operations
  searchAll(companyId: string, query: string): Promise<{
    leads: Lead[];
    documents: Document[];
    tasks: Task[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Company operations
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async getCompanyByDomain(domain: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.domain, domain));
    return company;
  }

  // Lead operations
  async getLeads(companyId: string): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(eq(leads.companyId, companyId))
      .orderBy(desc(leads.createdAt));
  }

  async getLead(id: string, companyId: string): Promise<Lead | undefined> {
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.companyId, companyId)));
    return lead;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db
      .insert(leads)
      .values(lead)
      .returning();
    return newLead;
  }

  async updateLead(id: string, companyId: string, updates: Partial<InsertLead>): Promise<Lead> {
    const [updatedLead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(leads.id, id), eq(leads.companyId, companyId)))
      .returning();
    return updatedLead;
  }

  async deleteLead(id: string, companyId: string): Promise<void> {
    await db
      .delete(leads)
      .where(and(eq(leads.id, id), eq(leads.companyId, companyId)));
  }

  // Document operations
  async getDocuments(companyId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.companyId, companyId))
      .orderBy(desc(documents.updatedAt));
  }

  async getDocument(id: string, companyId: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.companyId, companyId)));
    return document;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values(document)
      .returning();
    return newDocument;
  }

  async updateDocument(id: string, companyId: string, updates: Partial<InsertDocument>): Promise<Document> {
    const [updatedDocument] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(documents.id, id), eq(documents.companyId, companyId)))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: string, companyId: string): Promise<void> {
    await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.companyId, companyId)));
  }

  async searchDocuments(companyId: string, query: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.companyId, companyId),
          sql`(title ILIKE ${`%${query}%`} OR content ILIKE ${`%${query}%`})`
        )
      )
      .orderBy(desc(documents.updatedAt));
  }

  // Task operations
  async getTasks(companyId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.companyId, companyId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string, companyId: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.companyId, companyId)));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTask(id: string, companyId: string, updates: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.companyId, companyId)))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: string, companyId: string): Promise<void> {
    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.companyId, companyId)));
  }

  async getLeadTasks(leadId: string, companyId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.leadId, leadId), eq(tasks.companyId, companyId)))
      .orderBy(desc(tasks.createdAt));
  }

  // Activity operations
  async getActivities(companyId: string, limit = 50): Promise<Activity[]> {
    const regularActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.companyId, companyId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
    
    // Also get recent notes as activities
    const recentNotes = await db
      .select({
        id: leadNotes.id,
        companyId: leadNotes.companyId,
        userId: leadNotes.userId,
        type: sql<string>`CONCAT('note_', ${leadNotes.type})`.as('type'),
        description: sql<string>`CONCAT('Added ', ${leadNotes.type}, ' to lead')`.as('description'),
        entityType: sql<string>`'lead'`.as('entityType'),
        entityId: leadNotes.leadId,
        metadata: sql<any>`NULL`.as('metadata'),
        createdAt: leadNotes.createdAt,
        updatedAt: leadNotes.updatedAt,
      })
      .from(leadNotes)
      .where(eq(leadNotes.companyId, companyId))
      .orderBy(desc(leadNotes.createdAt))
      .limit(10);
    
    // Combine and sort all activities
    const allActivities = [...regularActivities, ...recentNotes as any];
    allActivities.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
    
    return allActivities.slice(0, limit);
  }

  // Lead notes operations
  async getLeadNotes(leadId: string, companyId: string): Promise<any[]> {
    return await db
      .select({
        id: leadNotes.id,
        content: leadNotes.content,
        type: leadNotes.type,
        createdAt: leadNotes.createdAt,
        updatedAt: leadNotes.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(leadNotes)
      .leftJoin(users, eq(leadNotes.userId, users.id))
      .where(and(eq(leadNotes.leadId, leadId), eq(leadNotes.companyId, companyId)))
      .orderBy(desc(leadNotes.createdAt));
  }

  async createLeadNote(data: any): Promise<any> {
    const [note] = await db
      .insert(leadNotes)
      .values(data)
      .returning();
    
    // Get the note with user details
    const [noteWithUser] = await db
      .select({
        id: leadNotes.id,
        content: leadNotes.content,
        type: leadNotes.type,
        createdAt: leadNotes.createdAt,
        updatedAt: leadNotes.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(leadNotes)
      .leftJoin(users, eq(leadNotes.userId, users.id))
      .where(eq(leadNotes.id, note.id));
    
    return noteWithUser;
  }

  async updateLeadNote(id: string, companyId: string, updates: any): Promise<any> {
    const [note] = await db
      .update(leadNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(leadNotes.id, id), eq(leadNotes.companyId, companyId)))
      .returning();
    
    if (!note) {
      throw new Error("Note not found or access denied");
    }
    
    return note;
  }

  async deleteLeadNote(id: string, companyId: string): Promise<void> {
    await db
      .delete(leadNotes)
      .where(and(eq(leadNotes.id, id), eq(leadNotes.companyId, companyId)));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  // AI Settings operations
  async getAISettings(companyId: string): Promise<AISettings | undefined> {
    const [settings] = await db
      .select()
      .from(aiSettings)
      .where(eq(aiSettings.companyId, companyId));
    return settings;
  }

  async upsertAISettings(companyId: string, settingsData: Partial<InsertAISettings>): Promise<AISettings> {
    const [settings] = await db
      .insert(aiSettings)
      .values({
        ...settingsData,
        companyId,
      })
      .onConflictDoUpdate({
        target: aiSettings.companyId,
        set: {
          ...settingsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }

  // Search operations
  async searchAll(companyId: string, query: string): Promise<{
    leads: Lead[];
    documents: Document[];
    tasks: Task[];
  }> {
    const [searchedLeads, searchedDocuments, searchedTasks] = await Promise.all([
      db
        .select()
        .from(leads)
        .where(
          and(
            eq(leads.companyId, companyId),
            sql`(name ILIKE ${`%${query}%`} OR company ILIKE ${`%${query}%`} OR notes ILIKE ${`%${query}%`})`
          )
        )
        .orderBy(desc(leads.updatedAt))
        .limit(10),
      
      this.searchDocuments(companyId, query),
      
      db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.companyId, companyId),
            sql`(title ILIKE ${`%${query}%`} OR description ILIKE ${`%${query}%`})`
          )
        )
        .orderBy(desc(tasks.updatedAt))
        .limit(10),
    ]);

    return {
      leads: searchedLeads,
      documents: searchedDocuments,
      tasks: searchedTasks,
    };
  }
}

export const storage = new DatabaseStorage();
