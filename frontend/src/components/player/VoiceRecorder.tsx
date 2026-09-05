import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import { transcribeAudioBlob } from '../../api/interactionApi';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptionComplete,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setMicError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        setIsUploading(true);
        try {
          const text = await transcribeAudioBlob(audioBlob);
          onTranscriptionComplete(text);
        } catch (err: any) {
          setMicError(err.message || 'Failed to transcribe voice recording.');
        } finally {
          setIsUploading(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        setMicError('Microphone access denied. Please type your answer below.');
      } else {
        setMicError('Could not access microphone. Please type your answer.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={startRecording}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-app-surface text-app-primary border border-app hover:bg-app-bg transition-all text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>Transcribing voice...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-amber-500" />
                <span>Answer by Voice</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-500 text-white font-extrabold text-xs hover:bg-red-600 transition-all shadow-md cursor-pointer animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Recording... (Click to Stop)</span>
          </button>
        )}
      </div>

      {micError && (
        <div className="flex items-center gap-2 text-[11px] font-bold text-amber-500 bg-amber-400/10 p-2.5 rounded-xl border border-amber-400/20">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          <span>{micError}</span>
        </div>
      )}
    </div>
  );
};
