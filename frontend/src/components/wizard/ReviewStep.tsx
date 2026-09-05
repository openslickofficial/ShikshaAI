import React from 'react';
import {
  FileText,
  Sparkles,
  GraduationCap,
  Clock,
  Globe,
  BookOpen,
  Heart,
  MessageSquare,
  Edit2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import type { LessonRequest } from '../../types/lessonRequest';

interface ReviewStepProps {
  request: LessonRequest;
  onEditStep: (step: number) => void;
  onStartLesson: () => void;
  onBack: () => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  request,
  onEditStep,
  onStartLesson,
  onBack,
}) => {
  const isUploadMode = request.source.mode === 'upload';
  const sourceTitle = request.source.mode === 'upload' ? request.source.filename : request.source.topic;
  const chunkCount = request.source.mode === 'upload' ? (request.source.chunkCount || 0) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Review Header Banner */}
      <div className="p-6 rounded-[24px] bg-gradient-to-r from-amber-400/20 via-purple-500/10 to-emerald-400/20 border border-app shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 font-extrabold text-xs">
          <Sparkles className="w-4 h-4 text-amber-500" /> Final Request Validation
        </div>
        <h2 className="text-2xl font-extrabold text-app-primary tracking-tight">
          Review your lesson request
        </h2>
        <p className="text-xs text-app-secondary">
          Confirm your parameters before triggering the Shiksha AI lesson planner backend.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="space-y-4">
        {/* Card 1: Source Material */}
        <div className="p-5 rounded-[22px] bg-app-surface border border-app shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-extrabold text-app-secondary uppercase tracking-wider">
              {isUploadMode ? (
                <>
                  <FileText className="w-4 h-4 text-amber-500" /> Reference Material
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500" /> Topic Selection
                </>
              )}
            </span>

            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-xl bg-app-bg text-app-primary font-bold flex items-center justify-center border border-app shrink-0">
              {isUploadMode ? <FileText className="w-5 h-5 text-emerald-500" /> : <BookOpen className="w-5 h-5 text-amber-500" />}
            </div>

            <div>
              <h3 className="font-extrabold text-base text-app-primary">
                {sourceTitle}
              </h3>
              <p className="text-xs text-app-secondary">
                {isUploadMode ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready · {chunkCount} sections indexed
                  </span>
                ) : (
                  'Custom topic specification for direct AI synthesis'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Learning Preferences */}
        <div className="p-5 rounded-[22px] bg-app-surface border border-app shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-extrabold text-app-secondary uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-indigo-500" /> Learning Preferences
            </span>

            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-app-bg border border-app/60 space-y-1">
              <span className="text-[10px] font-bold text-app-secondary uppercase flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-amber-500" /> Level
              </span>
              <p className="text-xs font-extrabold text-app-primary capitalize">
                {request.level}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-app-bg border border-app/60 space-y-1">
              <span className="text-[10px] font-bold text-app-secondary uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" /> Duration
              </span>
              <p className="text-xs font-extrabold text-app-primary">
                {request.timeAvailable}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-app-bg border border-app/60 space-y-1">
              <span className="text-[10px] font-bold text-app-secondary uppercase flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-500" /> Language
              </span>
              <p className="text-xs font-extrabold text-app-primary">
                {request.language}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-app-bg border border-app/60 space-y-1">
              <span className="text-[10px] font-bold text-app-secondary uppercase flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-purple-500" /> Style
              </span>
              <p className="text-xs font-extrabold text-app-primary truncate">
                {request.teachingStyle}
              </p>
            </div>
          </div>

          {/* Interests & Notes summary */}
          {(request.interests || request.notes) && (
            <div className="pt-2 border-t border-app space-y-2 text-xs">
              {request.interests && request.interests.length > 0 && (
                <div className="flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-app-secondary font-medium">Personal Interests:</span>
                  <div className="flex flex-wrap gap-1">
                    {request.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-extrabold text-[11px]"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {request.notes && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-app-secondary font-medium">Additional Notes: </span>
                    <span className="text-app-primary font-semibold italic">
                      "{request.notes}"
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-app-surface text-app-primary font-bold text-xs border border-app hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Preferences</span>
        </button>

        <button
          type="button"
          onClick={onStartLesson}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
        >
          <span>Start Lesson</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
