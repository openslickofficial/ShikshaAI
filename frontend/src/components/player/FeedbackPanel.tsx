import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Lightbulb, Loader2 } from 'lucide-react';
import { fetchRemediation } from '../../api/interactionApi';
import type { CheckpointQuestion, EvaluationResult, RemediationContent } from '../../types/interaction';

interface FeedbackPanelProps {
  question: CheckpointQuestion;
  studentAnswer: string;
  evaluation: EvaluationResult;
  onContinue: () => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  question,
  studentAnswer,
  evaluation,
  onContinue,
}) => {
  const [remediation, setRemediation] = useState<RemediationContent | null>(null);
  const [isLoadingRemediation, setIsLoadingRemediation] = useState<boolean>(false);

  const isIncorrect = evaluation.verdict === 'incorrect';

  useEffect(() => {
    if (isIncorrect && evaluation.decision === 'reexplain') {
      setIsLoadingRemediation(true);
      fetchRemediation(question, studentAnswer, evaluation)
        .then((res) => setRemediation(res))
        .catch(() => {
          // Fallback remediation content if API fails
          setRemediation({
            newExplanationApproach: 'Simplified Review',
            headline: 'Key Concept Clarification',
            narrationBeats: [
              evaluation.feedback,
              'Remember to carefully check how parameters update in the opposite direction of the gradient.',
            ],
          });
        })
        .finally(() => setIsLoadingRemediation(false));
    }
  }, [isIncorrect, evaluation.decision]);

  return (
    <div className="p-6 rounded-[24px] bg-app-surface border border-app shadow-lg space-y-6 max-w-2xl mx-auto">
      {/* Verdict Header Badge */}
      <div className="flex items-center gap-3 border-b border-app pb-4">
        {evaluation.verdict === 'correct' ? (
          <div className="w-10 h-10 rounded-2xl bg-emerald-400/20 text-emerald-500 flex items-center justify-center border border-emerald-400/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        ) : evaluation.verdict === 'partial' ? (
          <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center border border-amber-400/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center border border-red-500/30">
            <XCircle className="w-5 h-5" />
          </div>
        )}

        <div>
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider ${
              evaluation.verdict === 'correct'
                ? 'text-emerald-500'
                : evaluation.verdict === 'partial'
                ? 'text-amber-500'
                : 'text-red-500'
            }`}
          >
            {evaluation.verdict === 'correct'
              ? 'Great Job!'
              : evaluation.verdict === 'partial'
              ? 'Almost There!'
              : 'Learning Moment'}
          </span>
          <h3 className="text-base font-extrabold text-app-primary tracking-tight">
            {evaluation.verdict === 'correct'
              ? 'Correct Answer'
              : evaluation.verdict === 'partial'
              ? 'Partially Correct'
              : 'Let\'s Review This Concept'}
          </h3>
        </div>
      </div>

      {/* Diagnostic Feedback */}
      <div className="p-4 rounded-xl bg-app-bg border border-app space-y-2">
        <p className="text-xs text-app-primary font-medium leading-relaxed">
          {evaluation.feedback}
        </p>

        {evaluation.misconception && (
          <div className="pt-2 border-t border-app/60 text-[11px] text-amber-500 font-bold flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span>Diagnosed Misconception: {evaluation.misconception}</span>
          </div>
        )}
      </div>

      {/* Inline Remediation Card (Only when verdict === 'incorrect') */}
      {isIncorrect && (
        <div className="space-y-3">
          {isLoadingRemediation ? (
            <div className="p-6 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
              <p className="text-xs font-bold text-purple-300">
                Generating adaptive 1-round re-explanation...
              </p>
            </div>
          ) : remediation ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
                  Adaptive Re-Explanation ({remediation.newExplanationApproach})
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-app-primary">
                {remediation.headline}
              </h4>
              <ul className="space-y-2 pt-1">
                {remediation.narrationBeats.map((beat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-app-primary font-medium">
                    <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{beat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
        >
          <span>{isIncorrect ? 'I Understand, Continue' : 'Continue Lesson'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
