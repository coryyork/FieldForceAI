import OpenAI from "openai";
import { storage } from "../storage";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export class AIService {
  async searchBusinessData(companyId: string, query: string) {
    try {
      // First, get raw search results from the database
      const searchResults = await storage.searchAll(companyId, query);
      
      console.log("=== AI SEARCH DEBUG ===");
      console.log("Company ID:", companyId);
      console.log("Query:", query);
      console.log("Search results:", JSON.stringify(searchResults, null, 2));
      
      // For queries that need analysis rather than text search, get all data
      let allLeads: any[] = [];
      let allDocuments: any[] = [];
      let allTasks: any[] = [];
      let allJobOpenings: any[] = [];
      const analysisKeywords = ['top', 'best', 'high', 'recent', 'latest', 'newest', 'oldest', 'biggest', 'largest', 'most', 'all', 'my leads', 'show leads', 'docs', 'documents', 'have access', 'job', 'jobs', 'recruitment', 'hiring', 'openings'];
      const needsAnalysis = analysisKeywords.some(keyword => query.toLowerCase().includes(keyword));
      
      if (needsAnalysis || (searchResults.leads.length === 0 && searchResults.documents.length === 0 && searchResults.tasks.length === 0 && (searchResults.jobOpenings?.length || 0) === 0)) {
        allLeads = await storage.getLeads(companyId);
        allDocuments = await storage.getDocuments(companyId);
        allTasks = await storage.getTasks(companyId);
        allJobOpenings = await storage.getJobOpenings(companyId);
        console.log("Got all data for analysis - Leads:", allLeads.length, "Documents:", allDocuments.length, "Tasks:", allTasks.length, "Job Openings:", allJobOpenings.length);
      }
      
      // Use AI to analyze and rank the results
      const prompt = `
        You are a helpful AI assistant for Field Force, a business management platform. 
        Respond conversationally and naturally, like a knowledgeable colleague.
        
        User asked: "${query}"
        
        Available data:
        Search Results: ${JSON.stringify(searchResults, null, 2)}
        ${allLeads.length > 0 ? `All Leads: ${JSON.stringify(allLeads, null, 2)}` : ''}
        ${allDocuments.length > 0 ? `All Documents: ${JSON.stringify(allDocuments, null, 2)}` : ''}
        ${allTasks.length > 0 ? `All Tasks: ${JSON.stringify(allTasks, null, 2)}` : ''}
        ${allJobOpenings.length > 0 ? `All Job Openings: ${JSON.stringify(allJobOpenings, null, 2)}` : ''}
        
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
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      
      console.log("AI Analysis response:", JSON.stringify(analysis, null, 2));
      
      return {
        query,
        analysis,
        rawResults: searchResults,
        allLeadsCount: allLeads.length,
        allDocumentsCount: allDocuments.length,
        allTasksCount: allTasks.length,
        allJobOpeningsCount: allJobOpenings.length
      };
    } catch (error) {
      console.error("Error in AI search:", error);
      throw new Error("Failed to perform AI-powered search");
    }
  }

  async chatWithAI(companyId: string, message: string) {
    try {
      // Get recent company data for context
      const [leads, documents, tasks, jobOpenings, activities] = await Promise.all([
        storage.getLeads(companyId).then(results => results.slice(0, 10)),
        storage.getDocuments(companyId).then(results => results.slice(0, 10)),
        storage.getTasks(companyId).then(results => results.slice(0, 10)),
        storage.getJobOpenings(companyId).then(results => results.slice(0, 10)),
        storage.getActivities(companyId, 10),
      ]);

      const contextPrompt = `
        You are an AI assistant for Field Force, a business platform. 
        You have access to the following company data for context:
        
        Recent Leads: ${JSON.stringify(leads.map(l => ({ name: l.name, company: l.company, stage: l.stage, value: l.value })))}
        Recent Documents: ${JSON.stringify(documents.map(d => ({ title: d.title, fileType: d.fileType })))}
        Recent Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority })))}
        Recent Job Openings: ${JSON.stringify(jobOpenings.map(j => ({ title: j.title, department: j.department, status: j.status, location: j.location })))}
        Recent Activities: ${JSON.stringify(activities.map(a => ({ type: a.type, description: a.description })))}
        
        User message: "${message}"
        
        Provide a helpful response based on the available data. Be conversational and actionable.
        If the user is asking for specific data analysis, provide insights based on the context.
        If they want to perform actions (like creating leads, tasks, job openings etc.), guide them on how to do it.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for a business platform. Be concise, professional, and actionable in your responses."
          },
          {
            role: "user",
            content: contextPrompt
          }
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
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
