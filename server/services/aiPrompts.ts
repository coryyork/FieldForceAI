import type { AISettings } from "@shared/schema";

export function parsePersonalityKeywords(settings?: AISettings): string[] {
  if (!settings?.personalityKeywords) return [];
  try {
    const keywords = JSON.parse(settings.personalityKeywords);
    return Array.isArray(keywords) ? keywords.filter((k) => typeof k === "string") : [];
  } catch {
    return [];
  }
}

export function buildAssistantIdentity(settings?: AISettings): string {
  const name = settings?.aiName || "AI Assistant";
  const keywords = parsePersonalityKeywords(settings);
  const personality =
    keywords.length > 0
      ? `Your personality traits: ${keywords.join(", ")}. `
      : "You are professional, friendly, and action-oriented. ";

  return `Your name is ${name}. You are an AI assistant for Field Force, a business management platform. ${personality}When asked for your name, respond with "${name}".`;
}

export function buildVoiceInstructions(settings?: AISettings): string {
  const identity = buildAssistantIdentity(settings);
  const voiceSpeed = settings?.voiceSpeed ? parseFloat(settings.voiceSpeed.toString()) : 1.0;
  const pacing =
    voiceSpeed >= 1.25
      ? "Keep responses brief and speak at a brisk, efficient pace."
      : voiceSpeed <= 0.75
        ? "Speak slowly and clearly, with a calm pace."
        : "Speak naturally and keep responses concise for voice conversation.";

  return `${identity}

You are in a live voice conversation. ${pacing}

You have access to the user's business knowledge base including CRM leads, documents, tasks, job openings, and recent activities.

Always use the search_knowledge_base tool when the user asks about:
- Their leads, customers, or sales pipeline
- Documents or knowledge base content
- Tasks, projects, or to-do items
- Job openings, recruitment, or hiring
- Recent business activities or metrics

Provide helpful, conversational spoken responses based on actual data from their knowledge base.`;
}

/** Grok Voice Agent API supports 0.7–1.5 */
export function getVoiceSpeed(settings?: AISettings): number {
  const speed = settings?.voiceSpeed ? parseFloat(settings.voiceSpeed.toString()) : 1.0;
  return Math.min(1.5, Math.max(0.7, speed));
}

const GROK_VOICES = new Set(["eve", "ara", "rex", "sal", "leo"]);

/** Map legacy OpenAI Realtime voice IDs to Grok voices. */
const OPENAI_TO_GROK_VOICE: Record<string, string> = {
  alloy: "eve",
  ash: "rex",
  ballad: "ara",
  coral: "sal",
  echo: "leo",
  fable: "ara",
  nova: "eve",
  onyx: "rex",
  sage: "rex",
  shimmer: "eve",
  verse: "ara",
};

export function getVoiceId(settings?: AISettings): string {
  const requested = (settings?.voiceId || "eve").toLowerCase();
  if (GROK_VOICES.has(requested)) return requested;
  return OPENAI_TO_GROK_VOICE[requested] || "eve";
}
