import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import type { ReportContent } from '../../types/session';

interface ReportCardProps {
  report: ReportContent;
  onExit: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onExit }) => {
  const navigate = useNavigate();

  const getScoreColor = (score: number) => {
    if (score >= 80)
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
      };
    if (score >= 50)
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
      };
    return {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
    };
  };

  const scoreTheme = getScoreColor(report.scorePercent);

  const handleStartNextTopic = () => {
    navigate('/new-lesson', {
      state: { prefillTopic: report.suggestedNextTopic },
    });
  };

  return (
    <div className="p-8 sm:p-10 rounded-[24px] bg-app-surface border border-app shadow-2xl max-w-2xl mx-auto space-y-8 my-6">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/30 shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
          Evaluated Learning Report
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-app-primary tracking-tight">
          Lesson Performance Summary
        </h2>
      </div>

      {/* Main Score Display */}
      <div
        className={`p-6 rounded-2xl ${scoreTheme.bg} border ${scoreTheme.border} text-center space-y-1`}
      >
        <div className={`text-4xl sm:text-5xl font-black ${scoreTheme.text}`}>
          {report.scorePercent.toFixed(1)}%
        </div>
        <div className="text-xs font-extrabold uppercase tracking-wider text-app-primary">
          Overall Understanding Score
        </div>
      </div>

      {/* Tag Clusters: Strong Areas & Needs Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strong Areas */}
        <div className="p-4 rounded-xl bg-app-bg border border-app space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Mastered Concepts</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {report.strongAreas && report.strongAreas.length > 0 ? (
              report.strongAreas.map((area, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold"
                >
                  {area}
                </span>
              ))
            ) : (
              <span className="text-xs text-app-secondary italic">
                No mastered concepts recorded.
              </span>
            )}
          </div>
        </div>

        {/* Needs Improvement */}
        <div className="p-4 rounded-xl bg-app-bg border border-app space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-rose-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Concepts to Revisit</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {report.weakAreas && report.weakAreas.length > 0 ? (
              report.weakAreas.map((area, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold"
                >
                  {area}
                </span>
              ))
            ) : (
              <span className="text-xs text-app-secondary italic">
                None! Great job mastering all topics.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostic Recommendation */}
      {report.recommendation && (
        <div className="p-4 rounded-xl bg-app-bg border border-app space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" />
            <span>Teacher Recommendation</span>
          </div>
          <p className="text-xs text-app-secondary leading-relaxed font-medium">
            {report.recommendation}
          </p>
        </div>
      )}

      {/* Suggested Next Topic Card */}
      {report.suggestedNextTopic && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 space-y-3">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
            Recommended Next Step
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-extrabold text-white">
                {report.suggestedNextTopic}
              </h4>
              <p className="text-xs text-indigo-200">
                Continue your learning journey with this follow-up topic.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartNextTopic}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs shadow-md transition-all shrink-0 cursor-pointer"
            >
              <span>Learn This Topic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="pt-2 flex items-center justify-center">
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
};
