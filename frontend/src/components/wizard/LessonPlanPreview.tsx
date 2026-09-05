import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  GraduationCap,
  Layers,
  HelpCircle,
  Lightbulb,
  RefreshCw,
  BookCheck,
  FileCheck,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { LessonPlan, SectionDepth } from '../../types/lessonPlan';

interface LessonPlanPreviewProps {
  plan: LessonPlan;
  onReset?: () => void;
  isGroundedMaterial?: boolean;
  isPersonalized?: boolean;
  hideActions?: boolean;
}

const DEPTH_BADGES: Record<SectionDepth, { label: string; style: string }> = {
  intro: {
    label: 'Intro',
    style: 'bg-card-mint text-card-mint border border-emerald-500/20',
  },
  core: {
    label: 'Core',
    style: 'bg-card-sand text-card-sand border border-amber-500/20',
  },
  advanced: {
    label: 'Advanced',
    style: 'bg-card-coral text-card-coral border border-red-500/20',
  },
};

export const LessonPlanPreview: React.FC<LessonPlanPreviewProps> = ({
  plan,
  onReset,
  isGroundedMaterial,
  isPersonalized,
  hideActions = false,
}) => {
  const navigate = useNavigate();

  // Track expanded section IDs (default first section expanded)
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (plan.sections.length > 0) {
      initial.add(plan.sections[0].id || '0');
    }
    return initial;
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const isAnySectionGrounded =
    isGroundedMaterial ||
    plan.sections.some((s) => s.groundedChunkIds && s.groundedChunkIds.length > 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      {/* Header Banner */}
      <div className="p-6 rounded-[24px] bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-emerald-500/15 border border-app shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 font-extrabold text-xs">
              <Sparkles className="w-4 h-4 text-amber-500" />
              AI Generated Lesson Architecture
            </div>

            {isAnySectionGrounded && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                Grounded in your material
              </div>
            )}

            {isPersonalized && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold text-xs">
                <History className="w-3.5 h-3.5 text-purple-500" />
                Personalized using your learning history
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-app-surface text-app-primary border border-app text-xs font-bold">
              <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
              <span className="capitalize">{plan.level}</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-app-surface text-app-primary border border-app text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{plan.totalMinutes} mins total</span>
            </span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-app-primary tracking-tight">
          {plan.title}
        </h2>
        <p className="text-xs text-app-secondary">
          {isAnySectionGrounded
            ? 'Curriculum synthesis grounded directly in your uploaded material excerpts using RAG retrieval.'
            : 'Generated curriculum breakdown. Section modules, interactive checkpoints, and tailored explanation styles.'}
        </p>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-base text-app-primary tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Curriculum Modules ({plan.sections.length} Sections)</span>
          </h3>
          <span className="text-xs font-bold text-app-secondary">
            Estimated ~{plan.totalMinutes} mins
          </span>
        </div>

        <div className="space-y-3">
          {plan.sections.map((section, idx) => {
            const sectionKey = section.id || String(idx);
            const isExpanded = expandedSectionIds.has(sectionKey);
            const depthBadge = DEPTH_BADGES[section.depth] || DEPTH_BADGES.core;
            const groundedCount = section.groundedChunkIds ? section.groundedChunkIds.length : 0;

            return (
              <div
                key={sectionKey}
                className="rounded-2xl bg-app-surface border border-app shadow-sm hover:border-slate-400/50 transition-all overflow-hidden"
              >
                {/* Clickable Header Button */}
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full text-left p-5 space-y-3 cursor-pointer focus:outline-none select-none"
                  aria-expanded={isExpanded}
                >
                  {/* Module Title Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-app-bg text-app-primary font-extrabold text-xs flex items-center justify-center border border-app shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-base text-app-primary leading-tight">
                            {section.conceptTitle}
                          </h4>

                          {groundedCount > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold"
                              title={`Grounded in ${groundedCount} document excerpt(s)`}
                            >
                              <FileCheck className="w-3 h-3 text-emerald-500" />
                              <span>{groundedCount} Excerpts</span>
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-app-secondary font-medium mt-0.5">
                          Approach: <span className="font-bold text-app-primary">{section.explanationApproach}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${depthBadge.style}`}>
                        {depthBadge.label}
                      </span>
                      <div className="p-1 rounded-lg bg-app-bg border border-app text-app-secondary">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-app-secondary" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-app-secondary" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-app text-xs font-semibold text-app-secondary">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        {section.exampleIdeas.length} Example {section.exampleIdeas.length === 1 ? 'Idea' : 'Ideas'}
                      </span>
                      <span className="text-[10px] text-app-secondary font-medium ml-1">
                        {isExpanded ? '(Hide example ideas)' : '(Show example ideas)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {section.hasCheckpoint && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                          <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="capitalize">{section.checkpointType || 'Conceptual'} Checkpoint</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1 text-app-primary font-bold text-xs">
                        <Clock className="w-3.5 h-3.5 text-app-secondary" />
                        {section.estimatedMinutes} mins
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded Section Outline Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-app bg-app-bg/40 space-y-3">
                    {/* Compact Example Ideas Chips */}
                    {section.exampleIdeas && section.exampleIdeas.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-app-secondary">Example ideas:</span>
                        <div className="flex flex-wrap gap-2">
                          {section.exampleIdeas.map((idea, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-3 py-1 rounded-full bg-app-surface text-app-primary border border-app text-xs font-medium shadow-2xs"
                            >
                              {idea}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grounded Excerpts Tag List */}
                    {section.groundedChunkIds && section.groundedChunkIds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs font-semibold text-app-secondary mr-1">Retrieved excerpts:</span>
                        {section.groundedChunkIds.map((chunkId, idx) => (
                          <span
                            key={chunkId || idx}
                            className="px-2 py-0.5 rounded bg-app-surface text-app-secondary border border-app text-[10px] font-mono"
                          >
                            {chunkId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      {!hideActions && (
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-app">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-app-surface text-app-primary font-bold text-xs border border-app hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Create Another Lesson</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
          >
            <BookCheck className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
};
