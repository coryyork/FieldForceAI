export const AI_MODELS = {
  chat: process.env.OPENAI_CHAT_MODEL || "gpt-4.1",
  realtime: process.env.OPENAI_REALTIME_MODEL || "gpt-4o-realtime-preview",
  transcription: process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1",
} as const;
