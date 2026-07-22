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
      ? `Your personality traits are: ${keywords.join(", ")}. Embody these traits in every reply — tone, word choice, and energy should clearly reflect them. `
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

/** OpenAI Realtime handles voice pacing from instructions; keep this for saved settings compatibility. */
export function getVoiceSpeed(settings?: AISettings): number {
  const speed = settings?.voiceSpeed ? parseFloat(settings.voiceSpeed.toString()) : 1.0;
  return Math.min(1.5, Math.max(0.7, speed));
}

const OPENAI_REALTIME_VOICES = new Set(["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"]);

/** Map the current UI voice choices back to valid OpenAI Realtime voices. */
const UI_TO_OPENAI_VOICE: Record<string, string> = {
  eve: "alloy",
  ara: "shimmer",
  rex: "ash",
  sal: "coral",
  leo: "echo",
  fable: "shimmer",
  nova: "shimmer",
  onyx: "ash",
};

export function getVoiceId(settings?: AISettings): string {
  const requested = (settings?.voiceId || "alloy").toLowerCase();
  if (OPENAI_REALTIME_VOICES.has(requested)) return requested;
  return UI_TO_OPENAI_VOICE[requested] || "alloy";
}
