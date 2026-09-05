import React, { useState } from 'react';
import {
  Film,
  Eye,
  Tv,
  ArrowRight,
  Trophy,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { VisualRenderer } from '../visuals/VisualRenderer';
import { CheckpointPanel } from './CheckpointPanel';
import { FeedbackPanel } from './FeedbackPanel';
import { ReportCard } from './ReportCard';
import { fetchCheckpoint } from '../../api/interactionApi';
import {
  recordCheckpoint,
  completeSession,
} from '../../api/sessionsApi';
import type { LessonSection } from '../../types/lessonPlan';
import type { SectionContent } from '../../types/sectionContent';
import type {
  CheckpointQuestion,
  EvaluationResult,
  SessionLogEntry,
} from '../../types/interaction';
import type { ReportContent } from '../../types/session';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface PlayableSection {
  section: LessonSection;
  content: SectionContent;
  videoUrl: string;
}

interface LessonPlayerProps {
  sessionId: string;
  lessonTitle: string;
  lessonLevel: string;
  lessonLanguage?: string;
  playableSections: PlayableSection[];
  onExit: () => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  sessionId,
  lessonTitle: _lessonTitle,
  lessonLevel: _lessonLevel,
  lessonLanguage: _lessonLanguage = 'English',
  playableSections,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [phase, setPhase] = useState<
    'playing' | 'checkpoint' | 'feedback' | 'complete'
  >('playing');

  // Session Persistence State
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportContent, setReportContent] = useState<ReportContent | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Checkpoint & Feedback State
  const [isFetchingCheckpoint, setIsFetchingCheckpoint] = useState<boolean>(false);
  const [currentQuestion, setCurrentQuestion] = useState<CheckpointQuestion | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);
  const [lastStudentAnswer, setLastStudentAnswer] = useState<string>('');

  // Session Log State (local immediate feedback)
  const [sessionLog, setSessionLog] = useState<SessionLogEntry[]>([]);
  const [videoFinished, setVideoFinished] = useState<boolean>(false);

  const currentPlayable = playableSections[currentIndex];
  if (!currentPlayable) return null;

  const { section, content, videoUrl } = currentPlayable;

  const handleVideoEnded = async () => {
    setVideoFinished(true);

    if (section.hasCheckpoint) {
      setIsFetchingCheckpoint(true);
      try {
        const q = await fetchCheckpoint(section, content);
        setCurrentQuestion(q);
        setPhase('checkpoint');
      } catch {
        // Fallback question if API fails
        setCurrentQuestion({
          checkpointType: 'multiple-choice',
          questionText: `What is the core takeaway of "${section.conceptTitle}"?`,
          options: [
            content.onScreenHeadline,
            'It is unrelated to the lesson objective.',
            'Parameters are kept static.',
            'Cost function is ignored.',
          ],
          correctOption: content.onScreenHeadline,
        });
        setPhase('checkpoint');
      } finally {
        setIsFetchingCheckpoint(false);
      }
    }
  };

  const handleEvaluationComplete = (result: EvaluationResult, answer: string) => {
    setCurrentEvaluation(result);
    setLastStudentAnswer(answer);

    // 1. Append to local state for immediate feedback
    setSessionLog((prev) => [
      ...prev,
      {
        sectionId: section.id,
        verdict: result.verdict,
        misconception: result.misconception || undefined,
      },
    ]);

    // 2. Fire-and-forget DB checkpoint recording
    if (sessionId) {
      recordCheckpoint(sessionId, {
        sectionId: section.id,
        conceptTitle: section.conceptTitle,
        checkpointType: section.checkpointType || 'multiple-choice',
        verdict: result.verdict,
        misconception: result.misconception || undefined,
      }).catch((err) => {
        console.warn('Failed to persist checkpoint record to DB:', err);
      });
    }

    setPhase('feedback');
  };

  const handleAdvanceSection = async () => {
    if (currentIndex + 1 < playableSections.length) {
      setCurrentIndex((prev) => prev + 1);
      setPhase('playing');
      setVideoFinished(false);
      setCurrentQuestion(null);
      setCurrentEvaluation(null);
    } else {
      // Reached end of lesson! Trigger session completion report
      setPhase('complete');

      if (sessionId) {
        setIsGeneratingReport(true);
        setReportError(null);
        try {
          const rep = await completeSession(sessionId);
          setReportContent(rep);
        } catch (err: any) {
          console.error('Error completing session report:', err);
          setReportError(
            err.message || 'Could not load complete AI learning report.'
          );
        } finally {
          setIsGeneratingReport(false);
        }
      }
    }
  };

  // 1. Render Lesson Complete Summary Screen / ReportCard
  if (phase === 'complete') {
    if (isGeneratingReport) {
      return (
        <div className="p-12 rounded-[24px] bg-app-surface border border-app text-center space-y-4 max-w-md mx-auto shadow-xl my-12">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400 mx-auto" />
          <h3 className="text-lg font-extrabold text-app-primary">
            Preparing your learning report...
          </h3>
          <p className="text-xs text-app-secondary">
            Evaluating checkpoint responses and synthesizing teacher recommendations.
          </p>
        </div>
      );
    }

    if (reportContent) {
      return <ReportCard report={reportContent} onExit={onExit} />;
    }

    // Fallback UI if completeSession failed
    const totalCheckpoints = sessionLog.length;
    const correctFirstTry = sessionLog.filter(
      (entry) => entry.verdict === 'correct'
    ).length;

    return (
      <div className="p-8 sm:p-12 rounded-[24px] bg-app-surface border border-app shadow-xl max-w-2xl mx-auto text-center space-y-6 my-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center mx-auto border border-amber-400/30">
          <Trophy className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500">
            Interactive Lesson Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-app-primary tracking-tight">
            Congratulations! Lesson Finished
          </h2>
          <p className="text-xs text-app-secondary max-w-md mx-auto">
            You completed all {playableSections.length} sections of this interactive AI lesson.
          </p>
        </div>

        {reportError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold max-w-md mx-auto">
            {reportError}
          </div>
        )}

        {totalCheckpoints > 0 && (
          <div className="p-6 rounded-2xl bg-app-bg border border-app max-w-sm mx-auto space-y-2">
            <div className="text-3xl font-extrabold text-amber-400">
              {correctFirstTry} / {totalCheckpoints}
            </div>
            <p className="text-xs font-bold text-app-primary">
              Checkpoints Correct on First Try
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return to Studio View</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[20px] bg-app-surface border border-app shadow-sm">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-500 font-extrabold text-xs flex items-center justify-center border border-amber-400/30">
            {currentIndex + 1} / {playableSections.length}
          </span>
          <div>
            <h3 className="font-extrabold text-sm text-app-primary">
              {section.conceptTitle}
            </h3>
            <p className="text-[11px] text-app-secondary">
              Interactive Delivery Player
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="px-3.5 py-1.5 rounded-xl bg-app-bg text-app-secondary hover:text-app-primary border border-app text-xs font-bold transition-all cursor-pointer"
        >
          Exit Lesson
        </button>
      </div>

      {/* Main Studio Split Panel (Left Video + Right Visual) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Video Player */}
        <div className="p-5 rounded-[24px] bg-app-surface border border-app space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold text-purple-400 uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                <span>Teaching Avatar Video</span>
              </div>
              {section.hasCheckpoint && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-extrabold">
                  Checkpoint Section
                </span>
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-slate-950 border border-app aspect-video flex items-center justify-center shadow-md">
              <video
                key={videoUrl}
                controls
                autoPlay
                onEnded={handleVideoEnded}
                src={`${API_BASE_URL}${videoUrl}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-app-bg border border-app/60 text-xs text-app-secondary space-y-1">
            <div className="flex items-center gap-2 font-extrabold text-app-primary text-[11px]">
              <Tv className="w-3.5 h-3.5 text-indigo-500" />
              <span>Headline: "{content.onScreenHeadline}"</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Visual Component */}
        <div className="p-5 rounded-[24px] bg-app-surface border border-app space-y-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-2 text-xs font-extrabold text-app-primary uppercase tracking-wider">
              <Eye className="w-4 h-4 text-emerald-500" /> Live Interactive Visual
            </span>
            {content.visualReason && (
              <span className="text-[10px] font-medium text-app-secondary italic truncate max-w-[200px]">
                "{content.visualReason}"
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center py-4">
            <VisualRenderer
              visualType={content.visualType}
              visualSpec={content.visualSpec}
            />
          </div>
        </div>
      </div>

      {/* Loading Checkpoint State */}
      {isFetchingCheckpoint && (
        <div className="p-8 rounded-[24px] bg-app-surface border border-app text-center space-y-3 max-w-md mx-auto shadow-md">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
          <h4 className="text-sm font-extrabold text-app-primary">
            Preparing Checkpoint Question...
          </h4>
        </div>
      )}

      {/* Checkpoint Question Panel */}
      {phase === 'checkpoint' && currentQuestion && (
        <CheckpointPanel
          question={currentQuestion}
          onEvaluationComplete={handleEvaluationComplete}
        />
      )}

      {/* Feedback & Adaptive Remediation Panel */}
      {phase === 'feedback' && currentQuestion && currentEvaluation && (
        <FeedbackPanel
          question={currentQuestion}
          studentAnswer={lastStudentAnswer}
          evaluation={currentEvaluation}
          onContinue={handleAdvanceSection}
        />
      )}

      {/* Non-checkpoint Section Finish Action Button */}
      {phase === 'playing' && videoFinished && !section.hasCheckpoint && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleAdvanceSection}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
          >
            <span>Continue to Next Section</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
