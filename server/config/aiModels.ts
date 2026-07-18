export const AI_MODELS = {
  chat: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
  realtime: process.env.XAI_VOICE_MODEL || "grok-voice-latest",
  transcription: process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1",
} as const;
