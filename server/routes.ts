import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { 
  insertLeadSchema, 
  insertDocumentSchema, 
  insertTaskSchema, 
  insertCompanySchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Company routes
  app.post("/api/companies", isAuthenticated, async (req: any, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      
      // Update user with company ID
      await storage.upsertUser({
        id: req.user.claims.sub,
        companyId: company.id,
        email: req.user.claims.email,
        firstName: req.user.claims.first_name,
        lastName: req.user.claims.last_name,
        profileImageUrl: req.user.claims.profile_image_url,
        role: "owner",
      });
      
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.get("/api/companies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Lead routes
  app.get("/api/leads", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }
      
      const leads = await storage.getLeads(user.companyId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const leadData = insertLeadSchema.parse({
        ...req.body,
        companyId: user.companyId,
        assignedUserId: req.user.claims.sub,
      });
      
      const lead = await storage.createLead(leadData);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.claims.sub,
        type: "lead_created",
        description: `Created new lead: ${lead.name}`,
        entityType: "lead",
        entityId: lead.id,
      });
      
      res.json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const updates = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(req.params.id, user.companyId, updates);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.claims.sub,
        type: "lead_updated",
        description: `Updated lead: ${lead.name}`,
        entityType: "lead",
        entityId: lead.id,
      });
      
      res.json(lead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const lead = await storage.getLead(req.params.id, user.companyId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      await storage.deleteLead(req.params.id, user.companyId);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.claims.sub,
        type: "lead_deleted",
        description: `Deleted lead: ${lead.name}`,
        entityType: "lead",
        entityId: lead.id,
      });
      
      res.json({ message: "Lead deleted successfully" });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Document routes
  app.get("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }
      
      const documents = await storage.getDocuments(user.companyId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const documentData = insertDocumentSchema.parse({
        ...req.body,
        companyId: user.companyId,
        uploadedBy: req.user.claims.sub,
      });
      
      const document = await storage.createDocument(documentData);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.claims.sub,
        type: "document_uploaded",
        description: `Uploaded document: ${document.title}`,
        entityType: "document",
        entityId: document.id,
      });
      
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Task routes
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }
      
      const tasks = await storage.getTasks(user.companyId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const taskData = insertTaskSchema.parse({
        ...req.body,
        companyId: user.companyId,
        createdBy: req.user.claims.sub,
        assignedTo: req.body.assignedTo || req.user.claims.sub,
      });
      
      const task = await storage.createTask(taskData);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.claims.sub,
        type: "task_created",
        description: `Created task: ${task.title}`,
        entityType: "task",
        entityId: task.id,
      });
      
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const updates = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, user.companyId, updates);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.claims.sub,
        type: "task_updated",
        description: `Updated task: ${task.title}`,
        entityType: "task",
        entityId: task.id,
      });
      
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }
      
      const activities = await storage.getActivities(user.companyId, 20);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // AI search routes
  app.post("/api/ai/search", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const { query } = req.body;
      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      const searchResults = await aiService.searchBusinessData(user.companyId, query);
      res.json(searchResults);
    } catch (error) {
      console.error("Error performing AI search:", error);
      res.status(500).json({ message: "Failed to perform AI search" });
    }
  });

  app.post("/api/ai/chat", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await aiService.chatWithAI(user.companyId, message);
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
