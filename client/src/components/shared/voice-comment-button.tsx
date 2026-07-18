import { Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { cn } from "@/lib/utils";

interface VoiceCommentButtonProps {
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function VoiceCommentButton({
  onTranscript,
  onError,
  disabled = false,
  className,
}: VoiceCommentButtonProps) {
  const { isRecording, isTranscribing, startRecording, stopRecording, cancelRecording } =
    useVoiceRecording({ onTranscript, onError });

  const isBusy = isRecording || isTranscribing;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={disabled || isTranscribing}
      className={cn(
        "shrink-0 touch-none",
        isRecording && "border-red-500 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300",
        className,
      )}
      title={isRecording ? "Release to finish" : "Hold to talk"}
      onPointerDown={(event) => {
        event.preventDefault();
        if (disabled || isBusy) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        void startRecording();
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        if (!isRecording) return;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        void stopRecording();
      }}
      onPointerCancel={() => {
        if (isRecording) {
          cancelRecording();
        }
      }}
      onLostPointerCapture={() => {
        if (isRecording) {
          void stopRecording();
        }
      }}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
      )}
    </Button>
  );
}
