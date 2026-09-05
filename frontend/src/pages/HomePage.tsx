import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/dashboard/Hero';
import { LessonGrid } from '../components/dashboard/LessonGrid';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { ActivityChart } from '../components/dashboard/ActivityChart';
import { FocusAreas } from '../components/dashboard/FocusAreas';
import {
  getLearnerProfile,
  getSessionPlan,
  getSessionContent,
} from '../api/sessionsApi';
import { generateContent } from '../api/contentApi';
import { LessonPlanPreview } from '../components/wizard/LessonPlanPreview';
import { SectionContentCard } from '../components/wizard/SectionContentCard';
import { monthlyHours, currentStreak } from '../lib/sessionAggregates';
import type { ProfileResponse, SessionSummary } from '../types/session';
import type { LessonPlan } from '../types/lessonPlan';
import type { SectionContent } from '../types/sectionContent';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  BookOpen,
  Clapperboard,
  X,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lesson Dialog Box State
  const [activePlanModal, setActivePlanModal] = useState<{
    sessionId: string;
    title: string;
    plan: LessonPlan;
    content: SectionContent[] | null;
  } | null>(null);

  const [isFetchingModalData, setIsFetchingModalData] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isGeneratingModalContent, setIsGeneratingModalContent] = useState<boolean>(false);
  const [modalContentError, setModalContentError] = useState<string | null>(null);

  const fetchProfileData = () => {
    setIsLoading(true);
    setError(null);
    getLearnerProfile()
      .then((data) => setProfile(data))
      .catch((err) => {
        console.error('Failed to load learner profile:', err);
        setError(err.message || 'Failed to connect to backend learner service.');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSelectSession = async (session: SessionSummary) => {
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
      setModalError(err.message || 'Could not load saved lesson details.');
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

  const allSessions = profile?.sessions || [];
  const recentSessions = allSessions.slice(0, 6);
  const completedSessions = allSessions.filter((s) => Boolean(s.completedAt));

  const streak = currentStreak(allSessions);
  const hoursData = monthlyHours(allSessions);
  const focusConcepts = profile?.overallWeakConcepts || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* 1. Hero Banner */}
      <Hero />

      {/* 2. Backend Sync Notice Bar if profile service is starting or errored */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
            <span className="truncate">Unable to sync profile with backend ({error}). Ensure FastAPI backend server is running on port 8000.</span>
          </div>
          <button
            type="button"
            onClick={fetchProfileData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold hover:bg-amber-300 transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 3. Main Content Grid */}
      {isLoading ? (
        <div className="p-12 rounded-[24px] bg-app-surface border border-app text-center space-y-4 max-w-md mx-auto shadow-sm my-8">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
          <h3 className="text-lg font-extrabold text-app-primary">
            Loading Learner Dashboard...
          </h3>
        </div>
      ) : allSessions.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-[24px] bg-app-surface border border-app text-center space-y-4 max-w-lg mx-auto shadow-sm my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-app-primary tracking-tight">
              No Lesson History Yet
            </h3>
            <p className="text-xs text-app-secondary">
              Generate your first AI-customized lesson plan in the Interactive Studio to start learning.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/new-lesson')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
          >
            <span>Create Your First Lesson</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Recent Saved Lessons Grid */
        <LessonGrid sessions={recentSessions} onSelectSession={handleSelectSession} />
      )}

      {/* 4. Mobile & Tablet Right Rail Stack (<1024px viewports) */}
      <div className="block lg:hidden space-y-6 pt-6 border-t border-app">
        <h2 className="text-xl font-extrabold text-app-primary tracking-tight">
          Learning Dashboard Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileCard
            displayName={profile?.displayName}
            streakDays={streak}
            totalCompletedLessons={completedSessions.length}
          />
          <FocusAreas weakConcepts={focusConcepts} />
        </div>
        <ActivityChart data={hoursData} />
      </div>

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
    </div>
  );
};
