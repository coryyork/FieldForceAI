import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server, type IncomingMessage, type ServerResponse } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated, exportedSessionMiddleware, exportedPassportInit, exportedPassportSession } from "./auth";
import { aiService } from "./services/aiService";
import { 
  insertLeadSchema, 
  insertDocumentSchema, 
  insertTaskSchema, 
  insertCompanySchema,
  insertJobOpeningSchema,
  insertJobApplicationSchema,
  jobOpenings,
  jobApplications,
  companies,
  users
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
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
        id: req.user.id,
        companyId: company.id,
        username: req.user.username,
        email: req.user.email,
        password: req.user.password,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profileImageUrl: req.user.profileImageUrl,
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
      const user = req.user;
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

  app.get("/api/leads/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }
      
      const lead = await storage.getLead(req.params.id, user.companyId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const leadData = insertLeadSchema.parse({
        ...req.body,
        companyId: user.companyId,
        assignedUserId: user.id,
      });
      
      const lead = await storage.createLead(leadData);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: user.id,
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
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const updates = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(req.params.id, user.companyId, updates);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: user.id,
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
      const user = req.user;
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
        userId: user.id,
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
      const user = req.user;
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
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const documentData = insertDocumentSchema.parse({
        ...req.body,
        companyId: user.companyId,
        uploadedBy: user.id,
      });
      
      const document = await storage.createDocument(documentData);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: user.id,
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

  app.put("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const updates = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(req.params.id, user.companyId, updates);

      await storage.createActivity({
        companyId: user.companyId,
        userId: user.id,
        type: "document_updated",
        description: `Updated document: ${document.title}`,
        entityType: "document",
        entityId: document.id,
      });

      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      await storage.deleteDocument(req.params.id, user.companyId);

      await storage.createActivity({
        companyId: user.companyId,
        userId: user.id,
        type: "document_deleted",
        description: `Deleted document`,
        entityType: "document",
        entityId: req.params.id,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Task routes
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
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
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const taskData = insertTaskSchema.parse({
        ...req.body,
        companyId: user.companyId,
        createdBy: user.id,
        assignedTo: req.body.assignedTo || user.id,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      });
      
      const task = await storage.createTask(taskData);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.id,
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
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const updates = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, user.companyId, updates);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.id,
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

  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      await storage.deleteTask(req.params.id, user.companyId);

      await storage.createActivity({
        companyId: user.companyId,
        userId: user.id,
        type: "task_deleted",
        description: `Deleted task`,
        entityType: "task",
        entityId: req.params.id,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Activity routes
  app.get("/api/activities", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
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

  // Lead notes routes
  app.get("/api/leads/:leadId/notes", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const notes = await storage.getLeadNotes(req.params.leadId, user.companyId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching lead notes:", error);
      res.status(500).json({ message: "Failed to fetch lead notes" });
    }
  });

  app.post("/api/leads/:leadId/notes", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const noteData = {
        leadId: req.params.leadId,
        companyId: user.companyId,
        userId: req.user.id,
        content: req.body.content,
        type: req.body.type || "note",
      };

      const note = await storage.createLeadNote(noteData);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.id,
        type: "note_created",
        description: `Added ${noteData.type} to lead`,
        entityType: "lead",
        entityId: req.params.leadId,
      });

      res.json(note);
    } catch (error) {
      console.error("Error creating lead note:", error);
      res.status(500).json({ message: "Failed to create lead note" });
    }
  });

  app.put("/api/leads/:leadId/notes/:noteId", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const updates = {
        content: req.body.content,
        type: req.body.type,
      };

      const note = await storage.updateLeadNote(req.params.noteId, user.companyId, updates);
      res.json(note);
    } catch (error) {
      console.error("Error updating lead note:", error);
      res.status(500).json({ message: "Failed to update lead note" });
    }
  });

  app.delete("/api/leads/:leadId/notes/:noteId", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      await storage.deleteLeadNote(req.params.noteId, user.companyId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lead note:", error);
      res.status(500).json({ message: "Failed to delete lead note" });
    }
  });

  // Lead tasks routes
  app.get("/api/leads/:leadId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const tasks = await storage.getLeadTasks(req.params.leadId, user.companyId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching lead tasks:", error);
      res.status(500).json({ message: "Failed to fetch lead tasks" });
    }
  });

  app.post("/api/leads/:leadId/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const taskData = insertTaskSchema.parse({
        ...req.body,
        leadId: req.params.leadId,
        companyId: user.companyId,
        createdBy: req.user.id,
        assignedTo: req.body.assignedTo || req.user.id,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      });

      const task = await storage.createTask(taskData);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.id,
        type: "task_created",
        description: `Created task "${task.title}" for lead`,
        entityType: "lead",
        entityId: req.params.leadId,
      });

      res.json(task);
    } catch (error) {
      console.error("Error creating lead task:", error);
      res.status(500).json({ message: "Failed to create lead task" });
    }
  });

  // Google Places API search for company addresses
  app.get("/api/places/search", isAuthenticated, async (req: any, res) => {
    try {
      const { query } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Places API key not configured" });
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=establishment&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const results = data.results?.slice(0, 5).map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        formattedAddress: place.formatted_address,
        types: place.types,
        rating: place.rating,
      })) || [];

      res.json(results);
    } catch (error) {
      console.error("Error searching places:", error);
      res.status(500).json({ message: "Failed to search places" });
    }
  });

  app.get("/api/places/details/:placeId", isAuthenticated, async (req: any, res) => {
    try {
      const { placeId } = req.params;
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ message: "Google Places API key not configured" });
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,address_components,geometry&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`);
      }

      const place = data.result;
      const addressComponents = place.address_components || [];
      
      // Parse address components
      let street = '';
      let city = '';
      let state = '';
      let zipCode = '';
      let country = '';

      addressComponents.forEach((component: any) => {
        const types = component.types;
        if (types.includes('street_number')) {
          street = component.long_name + ' ';
        } else if (types.includes('route')) {
          street += component.long_name;
        } else if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (types.includes('postal_code')) {
          zipCode = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        }
      });

      const addressDetails = {
        placeId,
        name: place.name,
        formattedAddress: place.formatted_address,
        street: street.trim(),
        city,
        state,
        zipCode,
        country,
      };

      res.json(addressDetails);
    } catch (error) {
      console.error("Error getting place details:", error);
      res.status(500).json({ message: "Failed to get place details" });
    }
  });

  // AI search routes
  app.post("/api/ai/search", isAuthenticated, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "AI features are unavailable: OPENAI_API_KEY is not configured" });
    }
    try {
      const user = req.user;
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
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "AI features are unavailable: OPENAI_API_KEY is not configured" });
    }
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const response = await aiService.chatWithAI(
        user.companyId,
        message,
        Array.isArray(history) ? history : [],
      );
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat" });
    }
  });

  app.post("/api/voice/transcribe", isAuthenticated, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "AI features are unavailable: OPENAI_API_KEY is not configured" });
    }

    try {
      const { audio, mimeType, filename } = req.body;
      if (!audio || typeof audio !== "string") {
        return res.status(400).json({ message: "Audio data is required" });
      }

      const buffer = Buffer.from(audio, "base64");
      const { transcribeAudio } = await import("./services/transcriptionService");
      const text = await transcribeAudio(
        buffer,
        typeof mimeType === "string" ? mimeType : "",
        typeof filename === "string" ? filename : undefined,
      );

      res.json({ text });
    } catch (error: any) {
      console.error("Error transcribing voice comment:", error);
      const message =
        error?.error?.message ||
        error?.message ||
        "Failed to transcribe voice comment";
      res.status(400).json({ message });
    }
  });

  // AI Settings routes
  app.get("/api/ai-settings", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const settings = await storage.getAISettings(user.companyId);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching AI settings:", error);
      res.status(500).json({ message: "Failed to fetch AI settings" });
    }
  });

  app.post("/api/ai-settings", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const voiceSpeedRaw = req.body.voiceSpeed;
      const voiceSpeedNum =
        voiceSpeedRaw === undefined || voiceSpeedRaw === null || voiceSpeedRaw === ""
          ? 1
          : Number(voiceSpeedRaw);
      const clampedSpeed = Number.isFinite(voiceSpeedNum)
        ? Math.min(1.5, Math.max(0.7, voiceSpeedNum))
        : 1;

      const settingsData = {
        aiName: req.body.aiName,
        personalityKeywords: req.body.personalityKeywords,
        autoSuggestions: req.body.autoSuggestions,
        voiceEnabled: req.body.voiceEnabled,
        voiceId: req.body.voiceId,
        voiceSpeed: clampedSpeed.toFixed(2),
      };

      const settings = await storage.upsertAISettings(user.companyId, settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error saving AI settings:", error);
      res.status(500).json({ message: "Failed to save AI settings" });
    }
  });

  // Job Opening routes
  app.get("/api/job-openings", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const jobOpenings = await storage.getJobOpenings(user.companyId);
      res.json(jobOpenings);
    } catch (error) {
      console.error("Error fetching job openings:", error);
      res.status(500).json({ message: "Failed to fetch job openings" });
    }
  });

  app.get("/api/job-openings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const jobOpening = await storage.getJobOpening(req.params.id, user.companyId);
      if (!jobOpening) {
        return res.status(404).json({ message: "Job opening not found" });
      }
      res.json(jobOpening);
    } catch (error) {
      console.error("Error fetching job opening:", error);
      res.status(500).json({ message: "Failed to fetch job opening" });
    }
  });

  app.post("/api/job-openings", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const jobOpeningData = insertJobOpeningSchema.parse({
        ...req.body,
        companyId: user.companyId,
        createdBy: req.user.id,
        applicationDeadline: req.body.applicationDeadline ? new Date(req.body.applicationDeadline) : undefined,
      });

      const jobOpening = await storage.createJobOpening(jobOpeningData);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.id,
        type: "job_opening_created",
        description: `Created job opening "${jobOpening.title}"`,
        entityType: "job_opening",
        entityId: jobOpening.id,
      });

      res.json(jobOpening);
    } catch (error) {
      console.error("Error creating job opening:", error);
      res.status(500).json({ message: "Failed to create job opening" });
    }
  });

  app.put("/api/job-openings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const updateData = {
        ...req.body,
        applicationDeadline: req.body.applicationDeadline ? new Date(req.body.applicationDeadline) : undefined,
      };
      delete updateData.companyId; // Don't allow changing company
      delete updateData.createdBy; // Don't allow changing creator

      const jobOpening = await storage.updateJobOpening(req.params.id, user.companyId, updateData);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.id,
        type: "job_opening_updated",
        description: `Updated job opening "${jobOpening.title}"`,
        entityType: "job_opening",
        entityId: jobOpening.id,
      });

      res.json(jobOpening);
    } catch (error) {
      console.error("Error updating job opening:", error);
      res.status(500).json({ message: "Failed to update job opening" });
    }
  });

  app.delete("/api/job-openings/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      // Get job opening for logging before deletion
      const jobOpening = await storage.getJobOpening(req.params.id, user.companyId);
      if (!jobOpening) {
        return res.status(404).json({ message: "Job opening not found" });
      }

      await storage.deleteJobOpening(req.params.id, user.companyId);
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.id,
        type: "job_opening_deleted",
        description: `Deleted job opening "${jobOpening.title}"`,
        entityType: "job_opening",
        entityId: jobOpening.id,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting job opening:", error);
      res.status(500).json({ message: "Failed to delete job opening" });
    }
  });

  // Job Applications routes
  app.get("/api/job-applications", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const applications = await storage.getJobApplicationsWithJobDetails(user.companyId);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: "Failed to fetch job applications" });
    }
  });

  app.get("/api/job-applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const application = await storage.getJobApplication(req.params.id, user.companyId);
      if (!application) {
        return res.status(404).json({ message: "Job application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching job application:", error);
      res.status(500).json({ message: "Failed to fetch job application" });
    }
  });

  app.put("/api/job-applications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const applicationData = { 
        status: req.body.status,
        notes: req.body.notes,
        ...(req.body.status && { stageUpdatedAt: new Date() })
      };

      const updatedApplication = await storage.updateJobApplication(
        req.params.id, 
        user.companyId, 
        applicationData
      );
      
      // Log activity
      await storage.createActivity({
        companyId: user.companyId,
        userId: req.user.id,
        type: "job_application_updated",
        description: `Updated application from ${updatedApplication.firstName} ${updatedApplication.lastName}`,
        entityType: "job_application",
        entityId: updatedApplication.id,
      });

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating job application:", error);
      res.status(500).json({ message: "Failed to update job application" });
    }
  });

  // Public Job Portal routes (no authentication required)
  app.get("/api/public/job-openings", async (req: any, res) => {
    try {
      // Get all published job openings with company information
      const publicJobOpenings = await db
        .select({
          id: jobOpenings.id,
          title: jobOpenings.title,
          description: jobOpenings.description,
          department: jobOpenings.department,
          location: jobOpenings.location,
          employmentType: jobOpenings.employmentType,
          experienceLevel: jobOpenings.experienceLevel,
          salaryMin: jobOpenings.salaryMin,
          salaryMax: jobOpenings.salaryMax,
          requirements: jobOpenings.requirements,
          benefits: jobOpenings.benefits,
          calendarBookingUrl: jobOpenings.calendarBookingUrl,
          applicationDeadline: jobOpenings.applicationDeadline,
          createdAt: jobOpenings.createdAt,
          companyName: companies.name,
        })
        .from(jobOpenings)
        .innerJoin(companies, eq(jobOpenings.companyId, companies.id))
        .where(
          and(
            eq(jobOpenings.status, "active"),
            eq(jobOpenings.publishedOnPortal, true)
          )
        )
        .orderBy(desc(jobOpenings.createdAt));

      res.json(publicJobOpenings);
    } catch (error) {
      console.error("Error fetching public job openings:", error);
      res.status(500).json({ message: "Failed to fetch public job openings" });
    }
  });

  // Public job application submission (no authentication required)
  app.post("/api/public/job-applications", async (req: any, res) => {
    try {
      // Get job opening to verify it exists and get company ID
      const jobOpening = await db
        .select()
        .from(jobOpenings)
        .where(eq(jobOpenings.id, req.body.jobOpeningId))
        .limit(1);

      if (!jobOpening.length) {
        return res.status(404).json({ message: "Job opening not found" });
      }

      const applicationData = insertJobApplicationSchema.parse({
        ...req.body,
        companyId: jobOpening[0].companyId,
      });

      const newApplication = await storage.createJobApplication(applicationData);
      
      // Skip activity logging for public applications since we don't have a user context
      // Note: We could create a system user or handle this differently in the future

      res.json(newApplication);
    } catch (error) {
      console.error("Error submitting job application:", error);
      res.status(500).json({ message: "Failed to submit job application" });
    }
  });

  // Team management routes
  app.get("/api/team-members", isAuthenticated, async (req: any, res) => {
    try {
      const userCompanyId = req.user.companyId;
      
      // Get all users in the same company
      const teamMembers = await db
        .select()
        .from(users)
        .where(eq(users.companyId, userCompanyId))
        .orderBy(desc(users.createdAt));
      
      res.json(teamMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Invitation management routes (for admins/managers)
  app.get("/api/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userCompanyId = req.user.companyId;
      const userRole = req.user.role;
      
      // Only admins and owners can view invitations
      if (userRole !== 'admin' && userRole !== 'owner') {
        return res.status(403).json({ message: "Unauthorized to view invitations" });
      }
      
      const invitations = await storage.getInvitations(userCompanyId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const userCompanyId = req.user.companyId;
      const userRole = req.user.role;
      
      // Only admins and owners can send invitations
      if (userRole !== 'admin' && userRole !== 'owner') {
        return res.status(403).json({ message: "Unauthorized to send invitations" });
      }
      
      const { email, role = 'user' } = req.body;
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitation = await storage.createInvitation({
        companyId: userCompanyId,
        invitedBy: req.user.id,
        email,
        role,
        expiresAt,
      });
      
      // TODO: Send invitation email with the token
      // For now, just return the invitation with token
      
      res.json(invitation);
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  app.delete("/api/invitations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userCompanyId = req.user.companyId;
      const userRole = req.user.role;
      
      // Only admins and owners can delete invitations
      if (userRole !== 'admin' && userRole !== 'owner') {
        return res.status(403).json({ message: "Unauthorized to delete invitations" });
      }
      
      await storage.deleteInvitation(req.params.id, userCompanyId);
      res.json({ message: "Invitation deleted successfully" });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });

  // Public invitation routes (no authentication required)
  app.get("/api/invitation/:token", async (req: any, res) => {
    try {
      const invitation = await storage.getInvitationByToken(req.params.token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation token" });
      }
      
      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if invitation was already accepted
      if (invitation.status === 'accepted') {
        return res.status(400).json({ message: "Invitation has already been accepted" });
      }
      
      // Get company details for the invitation
      const company = await storage.getCompany(invitation.companyId);
      
      res.json({
        email: invitation.email,
        role: invitation.role,
        companyName: company?.name,
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  app.post("/api/invitation/:token/accept", async (req: any, res) => {
    try {
      const invitation = await storage.getInvitationByToken(req.params.token);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation token" });
      }
      
      // Check if invitation is expired
      if (new Date(invitation.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if invitation was already accepted
      if (invitation.status === 'accepted') {
        return res.status(400).json({ message: "Invitation has already been accepted" });
      }
      
      const { username, password, firstName, lastName } = req.body;
      
      // Hash password
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(password);
      
      // Create user account
      const user = await storage.createUser({
        username,
        email: invitation.email,
        password: hashedPassword,
        firstName,
        lastName,
        companyId: invitation.companyId,
        role: invitation.role,
      });
      
      // Mark invitation as accepted
      await storage.updateInvitation(invitation.id, {
        status: 'accepted',
        acceptedAt: new Date(),
      });
      
      res.json({ message: "Account created successfully", user });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server for voice conversations
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/voice/connect'
  });

  interface AuthenticatedUpgradeRequest extends IncomingMessage {
    user?: Express.User;
    session?: Record<string, unknown>;
  }

  wss.on('connection', async (ws, request) => {
    console.log('Voice WebSocket connection attempt');
    
    try {
      if (!exportedSessionMiddleware || !exportedPassportInit || !exportedPassportSession) {
        console.error('Voice WebSocket: auth middleware not initialised');
        ws.close(4401, 'Unauthorized');
        return;
      }

      const req = request as AuthenticatedUpgradeRequest;
      const res = {} as ServerResponse;

      await new Promise<void>((resolve, reject) => {
        exportedSessionMiddleware!(req as Request, res as Response, ((err?: unknown) => { err ? reject(err) : resolve(); }) as NextFunction);
      });
      await new Promise<void>((resolve, reject) => {
        exportedPassportInit!(req as Request, res as Response, ((err?: unknown) => { err ? reject(err) : resolve(); }) as NextFunction);
      });
      await new Promise<void>((resolve, reject) => {
        exportedPassportSession!(req as Request, res as Response, ((err?: unknown) => { err ? reject(err) : resolve(); }) as NextFunction);
      });

      const authedUser = req.user;
      if (!authedUser || !authedUser.id || !authedUser.companyId) {
        console.warn('Voice WebSocket rejected: unauthenticated connection');
        ws.close(4401, 'Unauthorized');
        return;
      }

      const { handleVoiceWebSocket } = await import('./services/voiceService');
      console.log(`Voice WebSocket connection established for user ${authedUser.id}`);
      handleVoiceWebSocket(ws, request, authedUser.id, authedUser.companyId);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Server error');
    }
  });

  return httpServer;
}
