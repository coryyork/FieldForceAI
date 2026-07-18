import OpenAI, { toFile } from "openai";
import { AI_MODELS } from "../config/aiModels";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "missing_key",
});

const WHISPER_EXTENSIONS = new Set([
  "flac",
  "m4a",
  "mp3",
  "mp4",
  "mpeg",
  "mpga",
  "oga",
  "ogg",
  "wav",
  "webm",
]);

const MIME_TO_EXTENSION: Record<string, string> = {
  "audio/flac": "flac",
  "audio/m4a": "m4a",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "m4a",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/ogg": "ogg",
  "audio/oga": "oga",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function resolveWhisperFilename(mimeType: string, originalName?: string): string {
  const normalizedMime = mimeType.split(";")[0].trim().toLowerCase();
  let extension = MIME_TO_EXTENSION[normalizedMime];

  if (!extension && originalName) {
    const match = originalName.match(/\.([a-z0-9]+)$/i);
    if (match && WHISPER_EXTENSIONS.has(match[1].toLowerCase())) {
      extension = match[1].toLowerCase();
    }
  }

  // iOS Safari often records MP4 audio but sends an empty or generic MIME type.
  if (!extension) {
    extension = "m4a";
  }

  return `recording.${extension}`;
}

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
  originalName?: string,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  if (!buffer.length) {
    throw new Error("Audio file is empty");
  }

  const filename = resolveWhisperFilename(mimeType, originalName);
  const normalizedMime = mimeType.split(";")[0].trim().toLowerCase() || "audio/mp4";
  const file = await toFile(buffer, filename, { type: normalizedMime });

  const response = await openai.audio.transcriptions.create({
    file,
    model: AI_MODELS.transcription ?? "whisper-1",
  });

  return response.text.trim();
}
