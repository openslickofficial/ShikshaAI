import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  CheckCircle2,
  Clock,
  Globe,
  GraduationCap,
  X,
  Loader2,
  Award,
  Sparkles,
  Clapperboard,
} from 'lucide-react';
import {
  getLearnerProfile,
  getSessionPlan,
  getSessionContent,
  getSessionReport,
} from '../api/sessionsApi';
import { generateContent } from '../api/contentApi';
import { getPastelSeries } from '../lib/colorHash';
import { LessonPlanPreview } from '../components/wizard/LessonPlanPreview';
import { SectionContentCard } from '../components/wizard/SectionContentCard';
import { ReportCard } from '../components/player/ReportCard';
import type { SessionSummary, ReportContent } from '../types/session';
import type { LessonPlan } from '../types/lessonPlan';
import type { SectionContent } from '../types/sectionContent';

export const LessonsPage: React.FC = () => {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for View Plan / View Study Material
  const [activePlanModal, setActivePlanModal] = useState<{
    sessionId: string;
    title: string;
    plan: LessonPlan;
    content: SectionContent[] | null;
  } | null>(null);

  const [isGeneratingModalContent, setIsGeneratingModalContent] = useState<boolean>(false);
  const [modalContentError, setModalContentError] = useState<string | null>(null);

  const [activeReportModal, setActiveReportModal] = useState<ReportContent | null>(null);
  const [isFetchingModalData, setIsFetchingModalData] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await getLearnerProfile();
      setSessions(profile.sessions);
    } catch (err: any) {
      setError(err.message || 'Failed to load lessons from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleViewPlan = async (session: SessionSummary) => {
    setIsFetchingModalData(true);
    setModalError(null);
    setModalContentError(null);
    try {
      const [plan, contentRes] = await Promise.all([
        getSessionPlan(session.id),
        getSessionContent(session.id).catch(() => null),
      ]);

      setActivePlanModal({
        sessionId: session.id,
        title: session.title,
        plan,
        content: contentRes?.sections || null,
      });
    } catch (err: any) {
      setModalError(err.message || 'Could not load saved lesson plan details.');
    } finally {
      setIsFetchingModalData(false);
    }
  };

  const handleGenerateModalContent = async () => {
    if (!activePlanModal) return;

    setIsGeneratingModalContent(true);
    setModalContentError(null);

    try {
      const res = await generateContent(
        activePlanModal.plan,
        { mode: 'topic', topic: activePlanModal.title },
        activePlanModal.sessionId
      );

      setActivePlanModal((prev) =>
        prev
          ? {
              ...prev,
              content: res.sections,
            }
          : null
      );
    } catch (err: any) {
      setModalContentError(err.message || 'Failed to generate study material content.');
    } finally {
      setIsGeneratingModalContent(false);
    }
  };

  const handleViewReport = async (session: SessionSummary) => {
    setIsFetchingModalData(true);
    setModalError(null);
    try {
      const report = await getSessionReport(session.id);
      setActiveReportModal(report);
    } catch (err: any) {
      setModalError(err.message || 'Could not load lesson completion report.');
    } finally {
      setIsFetchingModalData(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-300 font-extrabold text-xs">
            <BookOpen className="w-3.5 h-3.5" />
            Curriculum & Study Material Repository
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-app-primary tracking-tight">
            My Lessons
          </h1>
          <p className="text-xs text-app-secondary max-w-lg">
            All your generated lesson plans, teaching scripts, and study materials stored in the database.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/new-lesson')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Lesson</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="p-6 rounded-[24px] bg-app-surface border border-app animate-pulse space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="w-20 h-5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                <div className="w-16 h-5 bg-slate-300 dark:bg-slate-700 rounded-full" />
              </div>
              <div className="w-3/4 h-6 bg-slate-300 dark:bg-slate-700 rounded-xl" />
              <div className="w-1/2 h-4 bg-slate-300 dark:bg-slate-700 rounded-lg" />
              <div className="pt-4 border-t border-app flex justify-between">
                <div className="w-20 h-8 bg-slate-300 dark:bg-slate-700 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="p-8 rounded-[24px] bg-app-surface border border-app text-center space-y-4 max-w-md mx-auto shadow-sm my-8">
          <div className="w-14 h-14 rounded-2xl bg-app-danger text-app-danger flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-app-primary">Failed to Load Lessons</h3>
            <p className="text-xs text-app-secondary">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchSessions}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      ) : sessions.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-[28px] bg-app-surface border border-app text-center space-y-5 max-w-lg mx-auto shadow-sm my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center mx-auto border border-amber-400/30">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-app-primary">No Lessons Created Yet</h3>
            <p className="text-xs text-app-secondary">
              Generate your first AI-customized lesson plan from topic prompt or grounded material.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/new-lesson')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Lesson</span>
          </button>
        </div>
      ) : (
        /* Real Session Cards Grid */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((session) => {
              const cardSeries = getPastelSeries(session.id);
              const cardBgStyle = `bg-card-${cardSeries} text-card-${cardSeries}`;
              const isCompleted = session.status === 'completed';
              const dateStr = new Date(session.startedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={session.id}
                  className={`p-6 rounded-[24px] ${cardBgStyle} border border-black/5 dark:border-white/5 space-y-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Status Badge & Level */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-500" />
                            Plan Saved
                          </>
                        )}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase opacity-80">
                        <GraduationCap className="w-3 h-3" />
                        {session.level}
                      </span>
                    </div>

                    {/* Lesson Title */}
                    <h3 className="font-extrabold text-lg leading-tight line-clamp-2">
                      {session.title}
                    </h3>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-3 text-xs opacity-80 pt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {session.language || 'English'}
                      </span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  {/* Footer / Card Actions */}
                  <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2">
                    {isCompleted ? (
                      <>
                        <div className="flex items-center gap-1.5 font-extrabold text-sm">
                          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{session.scorePercent != null ? `${Math.round(session.scorePercent)}%` : 'Completed'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleViewReport(session)}
                          className="px-3.5 py-2 rounded-xl bg-white/60 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 font-extrabold text-xs transition-all border border-black/10 dark:border-white/10 cursor-pointer"
                        >
                          View Report
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-bold opacity-75">Plan Saved</span>
                        <button
                          type="button"
                          onClick={() => handleViewPlan(session)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/60 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 font-extrabold text-xs transition-all border border-black/10 dark:border-white/10 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fetching Modal Loading State */}
      {isFetchingModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="p-8 rounded-[24px] bg-app-surface border border-app text-center space-y-4 max-w-sm w-full shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs font-extrabold text-app-primary">
              Loading saved lesson details & study material...
            </p>
          </div>
        </div>
      )}

      {/* Modal Fetch Error */}
      {modalError && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="p-6 rounded-[24px] bg-app-surface border border-app text-center space-y-4 max-w-md w-full shadow-2xl">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-app-primary">Error Loading Item</h3>
              <p className="text-xs text-app-secondary">{modalError}</p>
            </div>
            <button
              type="button"
              onClick={() => setModalError(null)}
              className="px-5 py-2 rounded-xl bg-app-bg text-app-primary font-bold text-xs border border-app cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* View Saved Lesson Details Modal */}
      {activePlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-app-bg border border-app rounded-[28px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-app">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-500">
                <BookOpen className="w-4 h-4" />
                <span>Saved Lesson Details</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePlanModal(null)}
                className="p-1.5 rounded-full bg-app-surface text-app-secondary hover:text-app-primary border border-app transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Lesson Plan Curriculum Outline */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-app-primary uppercase tracking-wider">
                Curriculum Modules Outline
              </h3>
              <LessonPlanPreview plan={activePlanModal.plan} hideActions />
            </div>

            {/* 2. Generated Study Material & Interactive Script Section */}
            <div className="pt-6 border-t border-app space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-extrabold text-app-primary tracking-tight flex items-center gap-2">
                  <Clapperboard className="w-5 h-5 text-amber-500" />
                  <span>Study Material & Teaching Content</span>
                </h3>
              </div>

              {activePlanModal.content && activePlanModal.content.length > 0 ? (
                <div className="space-y-6">
                  {activePlanModal.content.map((content, idx) => {
                    const sectionPlan = activePlanModal.plan.sections.find(
                      (s) => s.id === content.sectionId
                    );
                    return (
                      <SectionContentCard
                        key={content.sectionId || idx}
                        content={content}
                        sectionIndex={idx}
                        conceptTitle={sectionPlan?.conceptTitle || `Module ${idx + 1}`}
                      />
                    );
                  })}
                </div>
              ) : isGeneratingModalContent ? (
                <div className="p-8 rounded-[24px] bg-app-surface border border-app text-center space-y-3">
                  <Loader2 className="w-7 h-7 animate-spin text-amber-500 mx-auto" />
                  <h4 className="text-sm font-extrabold text-app-primary">
                    Writing Study Material & Teaching Script...
                  </h4>
                  <p className="text-xs text-app-secondary">
                    Synthesizing narration scripts, takeaway key points, and interactive visual components.
                  </p>
                </div>
              ) : (
                <div className="p-8 rounded-[24px] bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-app text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-app-primary">
                      Study Material Not Generated Yet
                    </h4>
                    <p className="text-xs text-app-secondary max-w-md mx-auto">
                      Generate full narration script beats, key takeaway bullet points, KaTeX equations, executable code snippets, process flow diagrams, and TTS audio narration for this saved lesson.
                    </p>
                  </div>

                  {modalContentError && (
                    <div className="p-3 rounded-xl bg-app-danger text-app-danger text-xs font-bold border border-red-500/20 max-w-md mx-auto">
                      {modalContentError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerateModalContent}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Full Study Material & Script</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-app-bg border border-app rounded-[28px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-app">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-500">
                <Award className="w-4 h-4" />
                <span>Session Completion Report</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                className="p-1.5 rounded-full bg-app-surface text-app-secondary hover:text-app-primary border border-app transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ReportCard report={activeReportModal} onExit={() => setActiveReportModal(null)} />
          </div>
        </div>
      )}
    </div>
  );
};
