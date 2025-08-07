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
      
      // For queries that need analysis rather than text search, get all leads
      let allLeads: any[] = [];
      const analysisKeywords = ['top', 'best', 'high', 'recent', 'latest', 'newest', 'oldest', 'biggest', 'largest', 'most', 'all', 'my leads', 'show leads'];
      const needsAnalysis = analysisKeywords.some(keyword => query.toLowerCase().includes(keyword));
      
      if (needsAnalysis || searchResults.leads.length === 0) {
        allLeads = await storage.getLeads(companyId);
        console.log("Got all leads for analysis:", allLeads.length);
      }
      
      // Use AI to analyze and rank the results
      const prompt = `
        You are an AI assistant for a business platform called Field Force. 
        Analyze the following search results for the query: "${query}"
        
        Search Results:
        Leads found: ${JSON.stringify(searchResults.leads)}
        Documents found: ${JSON.stringify(searchResults.documents)}
        Tasks found: ${JSON.stringify(searchResults.tasks)}
        
        ${allLeads.length > 0 ? `All Leads for Analysis: ${JSON.stringify(allLeads)}` : ''}
        
        IMPORTANT: If no search results were found but all leads data is available, use the all leads data for analysis.
        
        For queries about leads, analyze and rank them by:
        - "recent/latest/newest": Sort by updatedAt or createdAt (most recent first)
        - "top/best/high value": Sort by lead value (higher is better)
        - "hot leads": Focus on leads in proposal/negotiation stages
        - Stage progression (proposal/negotiation stages are high priority)
        - Recent activity and engagement
        
        Always prioritize showing actual lead data over saying "no results found".
        
        Provide a structured response with:
        1. A summary of what was found
        2. The most relevant results ranked by importance
        3. Suggested actions the user can take
        
        Respond in JSON format with this structure:
        {
          "summary": "Brief summary of findings",
          "relevantResults": {
            "leads": [...],
            "documents": [...],
            "tasks": [...]
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
        allLeadsCount: allLeads.length
      };
    } catch (error) {
      console.error("Error in AI search:", error);
      throw new Error("Failed to perform AI-powered search");
    }
  }

  async chatWithAI(companyId: string, message: string) {
    try {
      // Get recent company data for context
      const [leads, documents, tasks, activities] = await Promise.all([
        storage.getLeads(companyId).then(results => results.slice(0, 10)),
        storage.getDocuments(companyId).then(results => results.slice(0, 10)),
        storage.getTasks(companyId).then(results => results.slice(0, 10)),
        storage.getActivities(companyId, 10),
      ]);

      const contextPrompt = `
        You are an AI assistant for Field Force, a business platform. 
        You have access to the following company data for context:
        
        Recent Leads: ${JSON.stringify(leads.map(l => ({ name: l.name, company: l.company, stage: l.stage, value: l.value })))}
        Recent Documents: ${JSON.stringify(documents.map(d => ({ title: d.title, fileType: d.fileType })))}
        Recent Tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority })))}
        Recent Activities: ${JSON.stringify(activities.map(a => ({ type: a.type, description: a.description })))}
        
        User message: "${message}"
        
        Provide a helpful response based on the available data. Be conversational and actionable.
        If the user is asking for specific data analysis, provide insights based on the context.
        If they want to perform actions (like creating leads, tasks, etc.), guide them on how to do it.
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
