import React, { useState } from 'react';
import {
  Volume2,
  Tv,
  Eye,
  Info,
  CheckCircle2,
  Mic,
  Video,
  Loader2,
  AlertCircle,
  Play,
  Film,
} from 'lucide-react';
import { VisualRenderer } from '../visuals/VisualRenderer';
import { generateSectionAudio } from '../../api/audioApi';
import { generateSectionVideo } from '../../api/videoApi';
import type { SectionContent } from '../../types/sectionContent';
import type { BeatAudio } from '../../types/audio';
import type { SectionVideoResponse } from '../../types/video';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface SectionContentCardProps {
  content: SectionContent;
  sectionIndex: number;
  conceptTitle: string;
  lessonLanguage?: string;
  onAudioGenerated?: () => void;
  onVideoGenerated?: (video: SectionVideoResponse) => void;
}

export const SectionContentCard: React.FC<SectionContentCardProps> = ({
  content,
  sectionIndex,
  conceptTitle,
  lessonLanguage,
  onAudioGenerated,
  onVideoGenerated,
}) => {
  // Audio State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isAudioBudgetExceeded, setIsAudioBudgetExceeded] = useState<boolean>(false);
  const [beatAudios, setBeatAudios] = useState<BeatAudio[] | null>(null);

  // Video State
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoBudgetExceeded, setIsVideoBudgetExceeded] = useState<boolean>(false);
  const [sectionVideo, setSectionVideo] = useState<SectionVideoResponse | null>(null);

  const handleSynthesizeAudio = async () => {
    if (!content.narrationBeats || content.narrationBeats.length === 0) return;

    setIsGeneratingAudio(true);
    setAudioError(null);
    setIsAudioBudgetExceeded(false);

    try {
      const res = await generateSectionAudio(
        content.sectionId,
        content.narrationBeats,
        lessonLanguage
      );
      setBeatAudios(res.beats);
      if (onAudioGenerated) onAudioGenerated();
    } catch (err: any) {
      if (err.status === 402) {
        setIsAudioBudgetExceeded(true);
        setAudioError(
          err.message || 'Character budget limit reached for Sarvam AI TTS.'
        );
      } else {
        setAudioError(err.message || 'Failed to synthesize audio for this section.');
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleSynthesizeVideo = async () => {
    setIsGeneratingVideo(true);
    setVideoError(null);
    setIsVideoBudgetExceeded(false);

    try {
      const res = await generateSectionVideo(
        content.sectionId,
        content.onScreenHeadline
      );
      setSectionVideo(res);
      if (onVideoGenerated) onVideoGenerated(res);
    } catch (err: any) {
      if (err.status === 402) {
        setIsVideoBudgetExceeded(true);
        setVideoError(
          err.message || 'Avatar video budget limit reached for D-ID.'
        );
      } else if (err.status === 404) {
        setVideoError('No per-beat audio found. Please click "Generate audio" first.');
      } else {
        setVideoError(err.message || 'Failed to compose video for this section.');
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hasAudio = beatAudios !== null && beatAudios.length > 0;

  return (
    <div className="p-6 rounded-[24px] bg-app-surface border border-app shadow-sm space-y-6">
      {/* Header Badge & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-app">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-700 dark:text-amber-300 font-extrabold text-xs flex items-center justify-center border border-amber-400/30">
            {sectionIndex + 1}
          </span>
          <h3 className="font-extrabold text-lg text-app-primary tracking-tight">
            {conceptTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="px-3 py-1 rounded-full bg-app-bg text-app-secondary border border-app text-[11px] font-extrabold uppercase tracking-wider">
            Visual: {content.visualType}
          </span>

          {/* Section Audio Action Button */}
          <button
            type="button"
            disabled={isGeneratingAudio}
            onClick={handleSynthesizeAudio}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs hover:bg-amber-300 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isGeneratingAudio ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Narrating...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>{beatAudios ? 'Regenerate audio' : 'Generate audio'}</span>
              </>
            )}
          </button>

          {/* Section Video Action Button */}
          <button
            type="button"
            disabled={!hasAudio || isGeneratingVideo}
            title={!hasAudio ? 'Generate audio for this section first' : 'Compose avatar teaching video'}
            onClick={handleSynthesizeVideo}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all shadow-sm ${
              !hasAudio
                ? 'bg-app-bg text-app-secondary border border-app opacity-60 cursor-not-allowed'
                : 'bg-purple-500 text-white hover:bg-purple-400 cursor-pointer'
            }`}
          >
            {isGeneratingVideo ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Composing video...</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" />
                <span>{sectionVideo ? 'Regenerate video' : 'Generate video'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Button Disabled Hint if Audio Not Generated */}
      {!hasAudio && !sectionVideo && (
        <p className="text-[11px] font-bold text-amber-500 italic pl-1 -mt-3">
          * Click "Generate audio" above to unlock video composition for this section.
        </p>
      )}

      {/* Audio Error / Budget Warning Overlay */}
      {audioError && (
        <div
          className={`p-4 rounded-xl text-xs font-bold border space-y-1 ${
            isAudioBudgetExceeded
              ? 'bg-red-500/10 text-red-500 border-red-500/30'
              : 'bg-app-danger text-app-danger border-red-500/20'
          }`}
        >
          <div className="flex items-center gap-2 font-extrabold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {isAudioBudgetExceeded
                ? 'Character Budget Limit Reached'
                : 'Audio Generation Error'}
            </span>
          </div>
          <p className="pl-6 font-medium text-[11px]">{audioError}</p>
        </div>
      )}

      {/* Video Error / Budget Warning Overlay */}
      {videoError && (
        <div
          className={`p-4 rounded-xl text-xs font-bold border space-y-1 ${
            isVideoBudgetExceeded
              ? 'bg-red-500/10 text-red-500 border-red-500/30'
              : 'bg-app-danger text-app-danger border-red-500/20'
          }`}
        >
          <div className="flex items-center gap-2 font-extrabold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {isVideoBudgetExceeded
                ? 'Avatar Video Budget Limit Reached'
                : 'Video Composition Error'}
            </span>
          </div>
          <p className="pl-6 font-medium text-[11px]">{videoError}</p>
        </div>
      )}

      {/* Phase 8 Studio Layout: When Section Video Exists, Render Split Panel (Video + Live Visual) */}
      {sectionVideo ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Left Panel: Studio Video Player */}
          <div className="p-4 rounded-[20px] bg-app-bg border border-app space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold text-purple-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  <span>Avatar Video & Caption Track</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-mono">
                  {formatDuration(sectionVideo.durationSeconds)}
                </span>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-app aspect-video flex items-center justify-center">
                <video
                  controls
                  src={`${API_BASE_URL}${sectionVideo.videoUrl}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-app-surface border border-app/60 text-xs text-app-secondary space-y-1 mt-3">
              <div className="flex items-center gap-2 font-extrabold text-app-primary text-[11px]">
                <Tv className="w-3.5 h-3.5 text-indigo-500" />
                <span>Burned-in Caption: "{content.onScreenHeadline}"</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Live Visual Component */}
          <div className="p-4 rounded-[20px] bg-app-bg border border-app space-y-3 flex flex-col">
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

            <div className="flex-1 flex items-center justify-center pt-2">
              <VisualRenderer
                visualType={content.visualType}
                visualSpec={content.visualSpec}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Original Pre-Video Grid: On-Screen Display vs Narration Beats */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Column: On-Screen UI Card */}
          <div className="p-4 rounded-[20px] bg-app-bg border border-app space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-500 uppercase tracking-wider">
              <Tv className="w-4 h-4" />
              <span>On-Screen Display</span>
            </div>

            <h4 className="text-base font-extrabold text-app-primary leading-snug">
              {content.onScreenHeadline}
            </h4>

            <ul className="space-y-2 pt-1">
              {content.onScreenBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-app-secondary font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Audio Narration Beats + HTML5 Audio Controls */}
          <div className="p-4 rounded-[20px] bg-app-bg border border-app space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-amber-500 uppercase tracking-wider">
                <Volume2 className="w-4 h-4" />
                <span>Narration Script Beats</span>
              </div>
              {beatAudios && (
                <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                  <Play className="w-3.5 h-3.5 fill-current" /> Audio Ready ({beatAudios.length} clips)
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs text-app-primary font-medium leading-relaxed max-h-64 overflow-y-auto pr-1">
              {content.narrationBeats.map((beat, idx) => {
                const audioMeta = beatAudios?.find((a) => a.beatIndex === idx);

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-app-surface border border-app/60 space-y-2"
                  >
                    <p>
                      <span className="font-extrabold text-amber-500 mr-2">{idx + 1}.</span>
                      {beat}
                    </p>

                    {/* Playable HTML5 Audio Player for this beat */}
                    {audioMeta && (
                      <div className="flex items-center gap-3 pt-1.5 border-t border-app/40">
                        <audio
                          controls
                          src={`${API_BASE_URL}${audioMeta.audioUrl}`}
                          className="h-8 w-full rounded-lg text-xs"
                        />
                        <span className="px-2 py-1 rounded-md bg-app-bg text-app-secondary font-mono text-[10px] font-bold shrink-0">
                          {formatDuration(audioMeta.durationSeconds)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Visual Component Section (Only if video has not been generated yet) */}
      {!sectionVideo && content.visualType !== 'none' && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="flex items-center gap-2 text-xs font-extrabold text-app-primary uppercase tracking-wider">
              <Eye className="w-4 h-4 text-emerald-500" /> Subject Visual Component
            </span>

            {content.visualReason && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-app-secondary italic">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Why: "{content.visualReason}"</span>
              </span>
            )}
          </div>

          <VisualRenderer
            visualType={content.visualType}
            visualSpec={content.visualSpec}
          />
        </div>
      )}
    </div>
  );
};
