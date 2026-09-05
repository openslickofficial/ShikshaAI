import React from 'react';
import { CheckCircle2, Bot, ArrowRight, RefreshCw, FileCheck2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { LessonRequest } from '../../types/lessonRequest';

interface ConfirmationPanelProps {
  request: LessonRequest;
  onReset: () => void;
}

export const ConfirmationPanel: React.FC<ConfirmationPanelProps> = ({
  request,
  onReset,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-xl mx-auto text-center py-6 select-none">
      {/* Icon Badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
      </div>

      {/* Headline & Subtext */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-app-primary tracking-tight">
          Your lesson request is ready!
        </h2>
        <p className="text-sm text-app-secondary max-w-md mx-auto">
          The parameters for your custom uploaded material lesson have been validated and assembled into a structured request payload.
        </p>
      </div>

      {/* Payload Summary Box */}
      <div className="p-6 rounded-[24px] bg-app-surface border border-app text-left space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-app">
          <span className="flex items-center gap-2 text-xs font-extrabold text-app-primary">
            <FileCheck2 className="w-4 h-4 text-emerald-500" /> Validated Payload Summary
          </span>
          <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
            Validated
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-app/50">
            <span className="text-app-secondary font-medium">Source Mode:</span>
            <span className="font-bold text-app-primary uppercase">
              {request.source.mode}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-app/50">
            <span className="text-app-secondary font-medium">Topic / File:</span>
            <span className="font-bold text-app-primary truncate max-w-[240px]">
              {request.source.mode === 'upload'
                ? request.source.filename
                : request.source.topic}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-app/50">
            <span className="text-app-secondary font-medium">Difficulty Level:</span>
            <span className="font-bold text-app-primary capitalize">
              {request.level}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-app/50">
            <span className="text-app-secondary font-medium">Duration:</span>
            <span className="font-bold text-app-primary">
              {request.timeAvailable}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-app/50">
            <span className="text-app-secondary font-medium">Language:</span>
            <span className="font-bold text-app-primary">{request.language}</span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-app-secondary font-medium">Teaching Style:</span>
            <span className="font-bold text-app-primary">{request.teachingStyle}</span>
          </div>
        </div>
      </div>

      {/* Phase 5 Backend Integration Note */}
      <div className="p-4 rounded-2xl bg-amber-400/15 border border-amber-400/20 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-3">
        <Bot className="w-5 h-5 text-amber-500 shrink-0" />
        <p className="text-left leading-relaxed">
          Material-based RAG pipeline is active and connected to the Shiksha AI backend.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-app-surface text-app-primary font-bold text-xs border border-app hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Create Another Lesson</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
