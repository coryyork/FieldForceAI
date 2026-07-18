import { useCallback, useRef, useState } from "react";
import { getSupportedAudioMimeType, transcribeVoiceComment } from "@/lib/audioRecording";

interface UseVoiceRecordingOptions {
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
}

export function useVoiceRecording({ onTranscript, onError }: UseVoiceRecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef("");
  const streamRef = useRef<MediaStream | null>(null);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    mediaRecorderRef.current = null;
    setIsRecording(false);
    cleanupStream();

    const mimeType = mimeTypeRef.current;
    const blob = new Blob(chunksRef.current, { type: mimeType || "audio/mp4" });
    chunksRef.current = [];

    if (!blob.size) {
      onError?.("No audio captured. Try holding the mic a little longer.");
      return;
    }

    setIsTranscribing(true);
    try {
      const text = await transcribeVoiceComment(blob, mimeType || blob.type || "audio/mp4");
      if (!text) {
        onError?.("Could not detect any speech. Please try again.");
        return;
      }
      onTranscript(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Voice comment failed";
      onError?.(message);
    } finally {
      setIsTranscribing(false);
    }
  }, [cleanupStream, onError, onTranscript]);

  const startRecording = useCallback(async () => {
    if (isRecording || isTranscribing) {
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      onError?.("Voice recording is not supported in this browser.");
      return;
    }

    const mimeType = getSupportedAudioMimeType();
    if (!mimeType) {
      onError?.("This browser does not support a Whisper-compatible audio format.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];
      mimeTypeRef.current = mimeType;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      cleanupStream();
      onError?.(
        error instanceof Error
          ? error.message
          : "Microphone access is required for voice comments.",
      );
    }
  }, [cleanupStream, isRecording, isTranscribing, onError]);

  const cancelRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    cleanupStream();
  }, [cleanupStream]);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
