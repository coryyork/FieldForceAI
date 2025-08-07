import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  companyId: uuid("company_id").references(() => companies.id),
  role: varchar("role").default("user"), // user, admin, owner
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Companies table for multi-tenant architecture
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  domain: varchar("domain").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leads table for CRM functionality
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  assignedUserId: varchar("assigned_user_id").references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  title: varchar("title"),
  website: varchar("website"),
  source: varchar("source"), // website, referral, cold_call, etc.
  stage: varchar("stage").notNull().default("new"), // new, qualified, proposal, negotiation, closed_won, closed_lost
  value: decimal("value", { precision: 12, scale: 2 }),
  probability: integer("probability").default(0), // 0-100
  notes: text("notes"),
  // Address fields
  street: varchar("street"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  country: varchar("country"),
  placeId: varchar("place_id"), // Google Places ID for reference
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge base documents
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  content: text("content"),
  fileType: varchar("file_type"),
  fileSize: integer("file_size"),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks and todos
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  priority: varchar("priority").default("medium"), // low, medium, high, urgent
  dueDate: timestamp("due_date"),
  leadId: uuid("lead_id").references(() => leads.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity log for tracking all user actions
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // lead_created, task_completed, document_uploaded, etc.
  description: text("description").notNull(),
  entityType: varchar("entity_type"), // lead, task, document, etc.
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  assignedLeads: many(leads),
  assignedTasks: many(tasks),
  createdTasks: many(tasks),
  uploadedDocuments: many(documents),
  activities: many(activities),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  leads: many(leads),
  documents: many(documents),
  tasks: many(tasks),
  activities: many(activities),
  aiSettings: many(aiSettings),
  jobOpenings: many(jobOpenings),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  company: one(companies, {
    fields: [leads.companyId],
    references: [companies.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedUserId],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  company: one(companies, {
    fields: [documents.companyId],
    references: [companies.id],
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  company: one(companies, {
    fields: [tasks.companyId],
    references: [companies.id],
  }),
  assignedToUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
  lead: one(leads, {
    fields: [tasks.leadId],
    references: [leads.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  company: one(companies, {
    fields: [activities.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Notes table for lead notes and comments
export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: varchar("type").notNull().default("note"), // note, call, meeting, email
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Settings table for company-specific AI configuration
export const aiSettings = pgTable("ai_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().unique().references(() => companies.id),
  aiName: varchar("ai_name").default("AI Assistant"),
  personalityKeywords: text("personality_keywords"), // JSON array of keywords
  autoSuggestions: boolean("auto_suggestions").default(true),
  voiceEnabled: boolean("voice_enabled").default(false),
  voiceId: varchar("voice_id").default("alloy"), // alloy, echo, fable, onyx, nova, shimmer
  voiceSpeed: decimal("voice_speed", { precision: 3, scale: 2 }).default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job openings table for recruitment management
export const jobOpenings = pgTable("job_openings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  department: varchar("department"),
  location: varchar("location"),
  employmentType: varchar("employment_type").notNull().default("full_time"), // full_time, part_time, contract, internship
  experienceLevel: varchar("experience_level").default("mid_level"), // entry_level, mid_level, senior_level, executive
  salaryMin: decimal("salary_min", { precision: 12, scale: 2 }),
  salaryMax: decimal("salary_max", { precision: 12, scale: 2 }),
  requirements: text("requirements").array(),
  benefits: text("benefits").array(),
  calendarBookingUrl: varchar("calendar_booking_url"),
  status: varchar("status").notNull().default("active"), // active, paused, closed, draft
  publishedOnPortal: boolean("published_on_portal").default(false), // Controls visibility on public job portal
  applicationDeadline: timestamp("application_deadline"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job applications table for candidate submissions
export const jobApplications = pgTable("job_applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  jobOpeningId: uuid("job_opening_id").notNull().references(() => jobOpenings.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  address: text("address").notNull(),
  linkedinUrl: varchar("linkedin_url"),
  videoUrl: varchar("video_url"), // Stored video file URL or blob reference
  status: varchar("status").notNull().default("applied"), // applied, 1st_round, 2nd_round, offered, accepted, rejected
  stageUpdatedAt: timestamp("stage_updated_at").defaultNow(),
  notes: text("notes"), // Internal notes from recruiters
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiSettingsRelations = relations(aiSettings, ({ one }) => ({
  company: one(companies, {
    fields: [aiSettings.companyId],
    references: [companies.id],
  }),
}));

export const jobOpeningsRelations = relations(jobOpenings, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobOpenings.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [jobOpenings.createdBy],
    references: [users.id],
  }),
  applications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  jobOpening: one(jobOpenings, {
    fields: [jobApplications.jobOpeningId],
    references: [jobOpenings.id],
  }),
  company: one(companies, {
    fields: [jobApplications.companyId],
    references: [companies.id],
  }),
}));

export const leadNotesRelations = relations(leadNotes, ({ one }) => ({
  lead: one(leads, {
    fields: [leadNotes.leadId],
    references: [leads.id],
  }),
  company: one(companies, {
    fields: [leadNotes.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [leadNotes.userId],
    references: [users.id],
  }),
}));

export const insertLeadNoteSchema = createInsertSchema(leadNotes).omit({
  id: true,
  companyId: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLeadNote = z.infer<typeof insertLeadNoteSchema>;
export type LeadNote = typeof leadNotes.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export const insertAISettingsSchema = createInsertSchema(aiSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobOpeningSchema = createInsertSchema(jobOpenings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AISettings = typeof aiSettings.$inferSelect;
export type InsertAISettings = z.infer<typeof insertAISettingsSchema>;
export type JobOpening = typeof jobOpenings.$inferSelect;
export type InsertJobOpening = z.infer<typeof insertJobOpeningSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
