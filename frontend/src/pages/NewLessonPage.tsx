import React, { useState } from 'react';
import { WizardStepper } from '../components/wizard/WizardStepper';
import { SourceStep } from '../components/wizard/SourceStep';
import { PreferencesStep } from '../components/wizard/PreferencesStep';
import { ReviewStep } from '../components/wizard/ReviewStep';
import { LessonPlanPreview } from '../components/wizard/LessonPlanPreview';
import { SectionContentCard } from '../components/wizard/SectionContentCard';
import { LessonPlayer } from '../components/player/LessonPlayer';
import type { PlayableSection } from '../components/player/LessonPlayer';

import { fetchLessonPlan } from '../api/lessonsApi';
import { generateContent } from '../api/contentApi';
import { getLearnerProfile } from '../api/sessionsApi';

import { Loader2, AlertCircle, RefreshCw, Sparkles, Clapperboard, Play } from 'lucide-react';
import type {
  LessonRequest,
  SourceConfig,
  DifficultyLevel,
  TimeAvailable,
  TeachingStyle,
} from '../types/lessonRequest';
import type { LessonPlan } from '../types/lessonPlan';
import type { SectionContent } from '../types/sectionContent';
import type { SectionVideoResponse } from '../types/video';

export const NewLessonPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 1 State
  const [sourceConfig, setSourceConfig] = useState<SourceConfig>({
    mode: 'upload',
    materialId: '',
    filename: '',
    chunkCount: 0,
  });

  // Step 2 State
  const [level, setLevel] = useState<DifficultyLevel | null>(null);
  const [timeAvailable, setTimeAvailable] = useState<TimeAvailable | null>(null);
  const [language, setLanguage] = useState<string>('English');
  const [teachingStyle, setTeachingStyle] = useState<TeachingStyle | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  // Step 3 Execution & Plan API State
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<LessonPlan | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [usedPriorWeakConcepts, setUsedPriorWeakConcepts] = useState<string[]>([]);

  // Phase 6 Content Generation State
  const [isGeneratingContent, setIsGeneratingContent] = useState<boolean>(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<SectionContent[] | null>(null);

  // Phase 8 Video Track & Phase 9 Player Mode State
  const [sectionVideos, setSectionVideos] = useState<Record<string, SectionVideoResponse>>({});
  const [isPlayerMode, setIsPlayerMode] = useState<boolean>(false);

  // Navigation Logic
  const handleNextFromSource = () => {
    if (!completedSteps.includes(1)) {
      setCompletedSteps((prev) => [...prev, 1]);
    }
    setCurrentStep(2);
  };

  const handleNextFromPreferences = () => {
    if (!completedSteps.includes(2)) {
      setCompletedSteps((prev) => [...prev, 2]);
    }
    setCurrentStep(3);
  };

  const handleStartLesson = async () => {
    if (!level || !timeAvailable || !teachingStyle) return;

    // Best-effort fetch learner profile for personalization (Phase 11)
    let weakConcepts: string[] | undefined = undefined;
    try {
      const profile = await getLearnerProfile();
      if (profile.overallWeakConcepts && profile.overallWeakConcepts.length > 0) {
        weakConcepts = profile.overallWeakConcepts;
      }
    } catch {
      // Proceed gracefully without personalization if profile fetch fails
    }

    setUsedPriorWeakConcepts(weakConcepts || []);

    const lessonRequest: LessonRequest = {
      source: sourceConfig,
      level,
      timeAvailable,
      language,
      teachingStyle,
      interests: interests.length > 0 ? interests : undefined,
      notes: notes.trim().length > 0 ? notes.trim() : undefined,
      priorWeakConcepts: weakConcepts,
    };

    setIsSubmitted(true);
    setIsLoadingPlan(true);
    setPlanError(null);

    try {
      const res = await fetchLessonPlan(lessonRequest);
      setGeneratedPlan(res.plan);
      setSessionId(res.sessionId);
    } catch (err: any) {
      setPlanError(err.message || 'Failed to generate lesson plan from backend service.');
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setSourceConfig({ mode: 'upload', materialId: '', filename: '', chunkCount: 0 });
    setLevel(null);
    setTimeAvailable(null);
    setLanguage('English');
    setTeachingStyle(null);
    setInterests([]);
    setNotes('');
    setIsSubmitted(false);
    setGeneratedPlan(null);
    setPlanError(null);
    setGeneratedContent(null);
    setContentError(null);
    setSectionVideos({});
    setIsPlayerMode(false);
  };

  // Phase 6 Batch Content Script Generator
  const handleGenerateContent = async () => {
    if (!generatedPlan) return;

    setIsGeneratingContent(true);
    setContentError(null);

    try {
      const res = await generateContent(generatedPlan, sourceConfig, sessionId || undefined);
      setGeneratedContent(res.sections);
    } catch (err: any) {
      setContentError(err.message || 'Failed to generate study material and scripts.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleVideoGenerated = (sectionId: string, video: SectionVideoResponse) => {
    setSectionVideos((prev) => ({
      ...prev,
      [sectionId]: video,
    }));
  };

  const requestConfig: LessonRequest = {
    source: sourceConfig,
    level: level || 'beginner',
    timeAvailable: timeAvailable || '20min',
    language,
    teachingStyle: teachingStyle || 'simple-examples',
    interests: interests.length > 0 ? interests : undefined,
    notes: notes.trim().length > 0 ? notes.trim() : undefined,
  };

  // Check if ALL sections in the plan have a generated video
  const allSectionsHaveVideo =
    generatedPlan &&
    generatedContent &&
    generatedPlan.sections.length > 0 &&
    generatedPlan.sections.every((sec) => Boolean(sectionVideos[sec.id]));

  // Build playable sections array for LessonPlayer
  const playableSections: PlayableSection[] =
    generatedPlan && generatedContent
      ? generatedPlan.sections
          .map((sec) => {
            const content = generatedContent.find((c) => c.sectionId === sec.id);
            const video = sectionVideos[sec.id];
            if (content && video) {
              return {
                section: sec,
                content,
                videoUrl: video.videoUrl,
              };
            }
            return null;
          })
          .filter((item): item is PlayableSection => item !== null)
      : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Render Phase 9 LessonPlayer in Player Mode */}
      {isPlayerMode && sessionId ? (
        <LessonPlayer
          sessionId={sessionId}
          lessonTitle={generatedPlan?.title || 'Interactive Lesson'}
          lessonLevel={level || 'beginner'}
          lessonLanguage={language}
          playableSections={playableSections}
          onExit={() => setIsPlayerMode(false)}
        />
      ) : (
        <>
          {/* Page Title Header */}
          {!isSubmitted && (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500">
                    Interactive Lesson Studio
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-app-primary tracking-tight">
                  Create New AI Lesson
                </h1>
              </div>

              <WizardStepper
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={(step) => setCurrentStep(step)}
              />
            </div>
          )}

          {/* Render Loading State for Lesson Plan */}
          {isLoadingPlan ? (
            <div className="p-12 rounded-[24px] bg-app-surface border border-app text-center space-y-4 max-w-md mx-auto shadow-sm my-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-app-primary tracking-tight">
                  Synthesizing RAG Lesson Plan...
                </h3>
                <p className="text-xs text-app-secondary">
                  {sourceConfig.mode === 'upload'
                    ? 'Retrieving document excerpts from ChromaDB and building a grounded lesson curriculum.'
                    : 'Gemini 2.5 Flash Lite is crafting a personalized curriculum breakdown based on your parameters.'}
                </p>
              </div>
            </div>
          ) : planError ? (
            /* Render Plan Generation Error State */
            <div className="p-8 rounded-[24px] bg-app-surface border border-app space-y-6 max-w-md mx-auto shadow-sm my-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-app-danger text-app-danger flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-app-primary tracking-tight">
                  Plan Generation Error
                </h3>
                <div className="p-3.5 rounded-xl bg-app-danger text-app-danger text-xs font-bold border border-red-500/20">
                  {planError}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setPlanError(null);
                    setCurrentStep(3);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-app-bg text-app-secondary hover:text-app-primary text-xs font-bold border border-app transition-colors"
                >
                  Back to Review
                </button>
                <button
                  type="button"
                  onClick={handleStartLesson}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          ) : generatedPlan ? (
            /* Render Success LessonPlanPreview Component & Phase 6/7/8/9 Studio */
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Phase 9 Start Lesson Button (Unlocked when all sections have videos) */}
                {allSectionsHaveVideo ? (
                  <button
                    type="button"
                    onClick={() => setIsPlayerMode(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg cursor-pointer animate-bounce"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>▶ Start Interactive Lesson</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              <LessonPlanPreview
                plan={generatedPlan}
                onReset={handleReset}
                isGroundedMaterial={sourceConfig.mode === 'upload'}
                isPersonalized={usedPriorWeakConcepts.length > 0}
              />

              {/* Phase 6, 7 & 8: Script, Audio & Video Studio Section */}
              <div className="pt-6 border-t border-app space-y-6">
                {!generatedContent && !isGeneratingContent && !contentError && (
                  <div className="p-8 rounded-[24px] bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-app text-center space-y-4 max-w-2xl mx-auto shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-extrabold text-app-primary">
                        Generate Interactive Study Material & Audio Scripts
                      </h3>
                      <p className="text-xs text-app-secondary max-w-md mx-auto">
                        Synthesize narration beats, key takeaways, equations, code snippets, diagrams, and TTS audio narration for every module.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateContent}
                      className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Full Study Content</span>
                    </button>
                  </div>
                )}

                {isGeneratingContent && (
                  <div className="p-8 rounded-[24px] bg-app-surface border border-app text-center space-y-3 max-w-md mx-auto shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
                    <h3 className="text-lg font-extrabold text-app-primary">
                      Synthesizing Interactive Scripts & Visual Specs...
                    </h3>
                    <p className="text-xs text-app-secondary">
                      Generating structured narration beats, on-screen key takeaways, KaTeX equations, executable code, and Mermaid diagrams.
                    </p>
                  </div>
                )}

                {contentError && (
                  <div className="p-6 rounded-[24px] bg-app-surface border border-app space-y-4 max-w-md mx-auto text-center shadow-sm">
                    <div className="p-3 rounded-xl bg-app-danger text-app-danger text-xs font-bold border border-red-500/20">
                      {contentError}
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateContent}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Content Script Generation</span>
                    </button>
                  </div>
                )}

                {generatedContent && generatedContent.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="font-extrabold text-lg text-app-primary tracking-tight flex items-center gap-2">
                        <Clapperboard className="w-5 h-5 text-amber-500" />
                        <span>Interactive Teaching Script & Visual Studio</span>
                      </h3>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full">
                        {generatedContent.length} Modules Synthesized
                      </span>
                    </div>

                    <div className="space-y-6">
                      {generatedContent.map((content, idx) => {
                        const sectionPlan = generatedPlan.sections.find(
                          (s) => s.id === content.sectionId
                        );
                        return (
                          <SectionContentCard
                            key={content.sectionId || idx}
                            content={content}
                            sectionIndex={idx}
                            conceptTitle={sectionPlan?.conceptTitle || `Module ${idx + 1}`}
                            lessonLanguage={language}
                            onVideoGenerated={(video) =>
                              handleVideoGenerated(content.sectionId, video)
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Wizard Steps Container */
            <div className="p-6 sm:p-8 rounded-[28px] bg-app-surface border border-app shadow-sm">
              {currentStep === 1 && (
                <SourceStep
                  sourceConfig={sourceConfig}
                  onChangeSource={setSourceConfig}
                  onNext={handleNextFromSource}
                />
              )}

              {currentStep === 2 && (
                <PreferencesStep
                  level={level}
                  onChangeLevel={setLevel}
                  timeAvailable={timeAvailable}
                  onChangeTime={setTimeAvailable}
                  language={language}
                  onChangeLanguage={setLanguage}
                  teachingStyle={teachingStyle}
                  onChangeStyle={setTeachingStyle}
                  interests={interests}
                  onChangeInterests={setInterests}
                  notes={notes}
                  onChangeNotes={setNotes}
                  onNext={handleNextFromPreferences}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {currentStep === 3 && (
                <ReviewStep
                  request={requestConfig}
                  onEditStep={(step) => setCurrentStep(step)}
                  onStartLesson={handleStartLesson}
                  onBack={() => setCurrentStep(2)}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
