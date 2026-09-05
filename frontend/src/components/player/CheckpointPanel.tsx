import React, { useState } from 'react';
import { HelpCircle, Send, Loader2, AlertCircle } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { evaluateStudentAnswer } from '../../api/interactionApi';
import type { CheckpointQuestion, EvaluationResult } from '../../types/interaction';

interface CheckpointPanelProps {
  question: CheckpointQuestion;
  onEvaluationComplete: (result: EvaluationResult, studentAnswer: string) => void;
}

export const CheckpointPanel: React.FC<CheckpointPanelProps> = ({
  question,
  onEvaluationComplete,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const isMcq = Boolean(question.options && question.options.length > 0);
  const activeAnswer = isMcq ? selectedOption || '' : typedAnswer.trim();

  const handleSubmit = async () => {
    if (!activeAnswer) return;

    setIsEvaluating(true);
    setEvalError(null);

    try {
      const res = await evaluateStudentAnswer(question, activeAnswer);
      onEvaluationComplete(res, activeAnswer);
    } catch (err: any) {
      setEvalError(err.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    if (isMcq) {
      // Find matching option or set text
      const matched = question.options?.find((opt) =>
        opt.toLowerCase().includes(text.toLowerCase())
      );
      if (matched) {
        setSelectedOption(matched);
      } else {
        setTypedAnswer(text);
      }
    } else {
      setTypedAnswer((prev) => (prev ? `${prev} ${text}` : text));
    }
  };

  return (
    <div className="p-6 rounded-[24px] bg-app-surface border border-app shadow-lg space-y-6 max-w-2xl mx-auto">
      {/* Header Badge */}
      <div className="flex items-center gap-3 border-b border-app pb-3">
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
            Comprehension Checkpoint
          </span>
          <h3 className="text-base font-extrabold text-app-primary tracking-tight">
            {question.questionText}
          </h3>
        </div>
      </div>

      {/* Question Options or Text Input */}
      {isMcq ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-app-secondary">Select the correct option:</p>
          <div className="grid grid-cols-1 gap-2.5">
            {question.options?.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-extrabold shadow-sm'
                      : 'bg-app-bg border-app text-app-primary hover:border-purple-400/50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-lg text-[10px] font-mono font-extrabold flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-purple-500 text-white border-purple-400'
                      : 'bg-app-surface border-app text-app-secondary'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-app-secondary">Type or record your answer:</label>
            <VoiceRecorder onTranscriptionComplete={handleVoiceTranscription} disabled={isEvaluating} />
          </div>
          <textarea
            rows={3}
            value={typedAnswer}
            onChange={(e) => setTypedAnswer(e.target.value)}
            placeholder="Explain your understanding..."
            className="w-full p-3.5 rounded-xl bg-app-bg border border-app text-xs text-app-primary placeholder:text-app-secondary/60 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      )}

      {/* Error Message */}
      {evalError && (
        <div className="p-3.5 rounded-xl bg-app-danger text-app-danger text-xs font-bold border border-red-500/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{evalError}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={!activeAnswer || isEvaluating}
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-extrabold text-xs hover:bg-purple-400 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          {isEvaluating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Checking your answer...</span>
            </>
          ) : (
            <>
              <span>Submit Answer</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
