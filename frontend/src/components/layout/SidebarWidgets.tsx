import React from 'react';
import {
  BookOpen,
  Target,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SessionSummary } from '../../types/session';

interface SidebarWidgetsProps {
  displayName?: string;
  streakDays?: number;
  completedLessons?: number;
  recentSessions?: SessionSummary[];
  weakConcepts?: string[];
}

export const SidebarWidgets: React.FC<SidebarWidgetsProps> = ({
  displayName = 'Learner',
  streakDays = 0,
  completedLessons = 0,
  recentSessions = [],
  weakConcepts = [],
}) => {
  const navigate = useNavigate();
  const topSessions = recentSessions.slice(0, 4);

  return (
    <div className="space-y-5">
      {/* 1. User Profile & Learning Streak */}
      <div className="p-5 rounded-[24px] bg-gradient-to-br from-amber-500/15 via-purple-500/10 to-emerald-500/15 border border-app shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-md">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-app-primary">{displayName}</h3>
              <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-amber-500" /> {streakDays} Day Streak
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
            Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-app">
          <div className="p-2.5 rounded-xl bg-app-surface/80 border border-app text-center">
            <span className="block font-black text-base text-app-primary">
              {completedLessons > 0 ? completedLessons : recentSessions.length}
            </span>
            <span className="text-[10px] text-app-secondary font-bold">
              {completedLessons > 0 ? 'Lessons Completed' : 'Lessons Active'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-app-surface/80 border border-app text-center">
            <span className="block font-black text-base text-amber-500">{streakDays}d</span>
            <span className="text-[10px] text-app-secondary font-bold">Current Streak</span>
          </div>
        </div>
      </div>

      {/* 2. Recent Lessons Quick Launch */}
      {topSessions.length > 0 && (
        <div className="p-5 rounded-[24px] bg-app-surface border border-app shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-app">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-xs text-app-primary uppercase tracking-wider">
                Recent Lessons
              </h3>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-[11px] font-bold text-amber-500 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {topSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/lesson?id=${session.id}`)}
                className="p-3 rounded-2xl bg-app-bg border border-app hover:border-amber-400/50 transition-all cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-app-primary line-clamp-1">
                    {session.title}
                  </h4>
                  {session.completedAt && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-app-secondary font-medium">
                  <span className="capitalize font-bold text-amber-500">{session.level}</span>
                  <span>•</span>
                  <span>{session.completedAt ? 'Completed' : 'In Progress'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Concepts to Review / Focus Areas */}
      {weakConcepts.length > 0 && (
        <div className="p-5 rounded-[24px] bg-app-surface border border-app shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-app">
            <Target className="w-4 h-4 text-purple-500" />
            <h3 className="font-extrabold text-xs text-app-primary uppercase tracking-wider">
              Concepts to Review
            </h3>
          </div>
          <div className="space-y-1.5">
            {weakConcepts.slice(0, 4).map((concept, idx) => (
              <span
                key={idx}
                className="block px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-bold line-clamp-1"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
