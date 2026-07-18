import OpenAI from "openai";
import { storage } from "../storage";
import { AI_MODELS } from "../config/aiModels";
import { buildAssistantIdentity } from "./aiPrompts";
import type { AISettings } from "@shared/schema";

if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set. AI features will return a 503 error.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing_key",
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class AIService {
  private async getSettings(companyId: string): Promise<AISettings | undefined> {
    return storage.getAISettings(companyId);
  }

  async searchBusinessData(companyId: string, query: string) {
    try {
      const settings = await this.getSettings(companyId);
      const searchResults = await storage.searchAll(companyId, query);

      let allLeads: any[] = [];
      let allDocuments: any[] = [];
      let allTasks: any[] = [];
      let allJobOpenings: any[] = [];
      const analysisKeywords = [
        "top",
        "best",
        "high",
        "recent",
        "latest",
        "newest",
        "oldest",
        "biggest",
        "largest",
        "most",
        "all",
        "my leads",
        "show leads",
        "docs",
        "documents",
        "have access",
        "job",
        "jobs",
        "recruitment",
        "hiring",
        "openings",
      ];
      const needsAnalysis = analysisKeywords.some((keyword) =>
        query.toLowerCase().includes(keyword),
      );

      if (
        needsAnalysis ||
        (searchResults.leads.length === 0 &&
          searchResults.documents.length === 0 &&
          searchResults.tasks.length === 0 &&
          (searchResults.jobOpenings?.length || 0) === 0)
      ) {
        [allLeads, allDocuments, allTasks, allJobOpenings] = await Promise.all([
          storage.getLeads(companyId),
          storage.getDocuments(companyId),
          storage.getTasks(companyId),
          storage.getJobOpenings(companyId),
        ]);
      }

      const identity = buildAssistantIdentity(settings);
      const prompt = `
        ${identity}
        Respond conversationally and naturally, like a knowledgeable colleague.

        User asked: "${query}"

        Available data:
        Search Results: ${JSON.stringify(searchResults, null, 2)}
        ${allLeads.length > 0 ? `All Leads: ${JSON.stringify(allLeads, null, 2)}` : ""}
        ${allDocuments.length > 0 ? `All Documents: ${JSON.stringify(allDocuments, null, 2)}` : ""}
        ${allTasks.length > 0 ? `All Tasks: ${JSON.stringify(allTasks, null, 2)}` : ""}
        ${allJobOpenings.length > 0 ? `All Job Openings: ${JSON.stringify(allJobOpenings, null, 2)}` : ""}

        Guidelines:
        - Be conversational and friendly, not robotic
        - For greetings like "hi" or "hello", respond naturally and offer to help
        - For queries about "recent/latest/newest" leads, sort by updatedAt (most recent first)
        - For "top/best/high value" leads, prioritize by value and stage
        - Always use actual data when available instead of saying "no results"
        - Keep responses concise but helpful
        - Use natural language, not technical jargon

        Provide a structured response with:
        1. A natural, conversational summary
        2. Relevant results in order of importance
        3. Practical next steps the user can take

        Respond in JSON format with this structure:
        {
          "summary": "Brief summary of findings",
          "relevantResults": {
            "leads": [...],
            "documents": [...],
            "tasks": [...],
            "jobOpenings": [...]
          },
          "suggestedActions": ["action1", "action2", ...],
          "totalResults": number
        }
      `;

      const response = await openai.chat.completions.create({
        model: AI_MODELS.chat,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");

      return {
        query,
        analysis,
        rawResults: searchResults,
        allLeadsCount: allLeads.length,
        allDocumentsCount: allDocuments.length,
        allTasksCount: allTasks.length,
        allJobOpeningsCount: allJobOpenings.length,
      };
    } catch (error) {
      console.error("Error in AI search:", error);
      throw new Error("Failed to perform AI-powered search");
    }
  }

  async chatWithAI(
    companyId: string,
    message: string,
    history: ChatMessage[] = [],
  ) {
    try {
      const settings = await this.getSettings(companyId);
      const [leads, documents, tasks, jobOpenings, activities] = await Promise.all([
        storage.getLeads(companyId).then((results) => results.slice(0, 15)),
        storage.getDocuments(companyId).then((results) => results.slice(0, 10)),
        storage.getTasks(companyId).then((results) => results.slice(0, 10)),
        storage.getJobOpenings(companyId).then((results) => results.slice(0, 10)),
        storage.getActivities(companyId, 10),
      ]);

      const systemPrompt = `${buildAssistantIdentity(settings)}

You help users manage their CRM, knowledge base, tasks, recruitment pipeline, and business operations.

Current business context:
- Leads: ${JSON.stringify(leads.map((l) => ({ name: l.name, company: l.company, stage: l.stage, value: l.value })))}
- Documents: ${JSON.stringify(documents.map((d) => ({ title: d.title, fileType: d.fileType })))}
- Tasks: ${JSON.stringify(tasks.map((t) => ({ title: t.title, status: t.status, priority: t.priority })))}
- Job Openings: ${JSON.stringify(jobOpenings.map((j) => ({ title: j.title, department: j.department, status: j.status, location: j.location })))}
- Recent Activities: ${JSON.stringify(activities.map((a) => ({ type: a.type, description: a.description })))}

Guidelines:
- Be concise, professional, and actionable
- Reference actual data from context when relevant
- For data-heavy questions, suggest using search mode for detailed results
- Guide users on how to perform actions in the platform when asked`;

      const recentHistory = history.slice(-10).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const response = await openai.chat.completions.create({
        model: AI_MODELS.chat,
        messages: [
          { role: "system", content: systemPrompt },
          ...recentHistory,
          { role: "user", content: message },
        ],
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error in AI chat:", error);
      throw new Error("Failed to process AI chat request");
    }
  }

  async analyzeLeadData(companyId: string) {
    try {
      const leads = await storage.getLeads(companyId);

      const prompt = `
        Analyze the following CRM lead data and provide business insights:

        Leads: ${JSON.stringify(leads)}

        Provide analysis including:
        1. Conversion funnel performance
        2. High-value opportunities
        3. Pipeline health
        4. Recommendations for improvement

        Respond in JSON format with detailed metrics and actionable insights.
      `;

      const response = await openai.chat.completions.create({
        model: AI_MODELS.chat,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      console.error("Error analyzing lead data:", error);
      throw new Error("Failed to analyze lead data");
    }
  }
}

export const aiService = new AIService();
