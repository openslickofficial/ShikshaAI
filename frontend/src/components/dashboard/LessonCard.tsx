import React from 'react';
import { BookOpen, Trophy, Globe, Clock } from 'lucide-react';
import { getPastelSeries } from '../../lib/colorHash';
import type { SessionSummary } from '../../types/session';

const SERIES_CLASSES = {
  coral: {
    bg: 'bg-card-coral',
    text: 'text-card-coral',
    scoreTag: 'bg-rose-500/20 text-rose-900 dark:text-rose-200 border-rose-500/30',
    draftTag: 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/30',
  },
  sand: {
    bg: 'bg-card-sand',
    text: 'text-card-sand',
    scoreTag: 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/30',
    draftTag: 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/30',
  },
  lavender: {
    bg: 'bg-card-lavender',
    text: 'text-card-lavender',
    scoreTag: 'bg-purple-500/20 text-purple-900 dark:text-purple-200 border-purple-500/30',
    draftTag: 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/30',
  },
  mint: {
    bg: 'bg-card-mint',
    text: 'text-card-mint',
    scoreTag: 'bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-emerald-500/30',
    draftTag: 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/30',
  },
};

interface LessonCardProps {
  session: SessionSummary;
  onClick?: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ session, onClick }) => {
  const series = getPastelSeries(session.id);
  const seriesStyle = SERIES_CLASSES[series];
  const isCompleted = Boolean(session.completedAt);
  const score = session.scorePercent !== null && session.scorePercent !== undefined ? session.scorePercent : null;

  return (
    <div
      onClick={onClick}
      className={`${seriesStyle.bg} ${seriesStyle.text} p-6 rounded-[24px] shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between border border-black/5 dark:border-white/5 group select-none ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div>
        {/* Top Header: Icon & Status / Score Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-black/30 backdrop-blur-sm flex items-center justify-center shadow-inner">
            <BookOpen className="w-6 h-6" />
          </div>

          {isCompleted ? (
            <div className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border backdrop-blur-sm ${seriesStyle.scoreTag}`}>
              <Trophy className="w-3.5 h-3.5" />
              <span>{score !== null ? `${score.toFixed(1)}%` : 'Completed'}</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border backdrop-blur-sm ${seriesStyle.draftTag}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>Plan Saved</span>
            </div>
          )}
        </div>

        {/* Level Badge & Title */}
        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
          {session.level}
        </span>
        <h3 className="text-xl font-extrabold mt-2 mb-3 leading-snug tracking-tight line-clamp-2">
          {session.title}
        </h3>
      </div>

      {/* Footer Meta: Language & Date */}
      <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs font-semibold opacity-85">
        <span className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          {session.language || 'English'}
        </span>
        <span className="text-[10px] font-extrabold opacity-75">
          {new Date(session.startedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
};
