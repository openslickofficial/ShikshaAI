import React from 'react';
import { Flame, Settings, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileCardProps {
  displayName?: string;
  streakDays: number;
  totalCompletedLessons: number;
  totalSessions?: number;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  displayName,
  streakDays,
  totalCompletedLessons,
  totalSessions = 0,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Dynamic name fallback logic: Supabase user metadata -> email prefix -> default
  const authFallbackName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Learner';

  const nameToDisplay =
    displayName && displayName.trim() && displayName !== 'Learner'
      ? displayName
      : authFallbackName;

  const initials = nameToDisplay
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const lessonsCountText =
    totalCompletedLessons > 0
      ? `${totalCompletedLessons} Done`
      : totalSessions > 0
      ? `${totalSessions} Active`
      : '0 Done';

  return (
    <div className="p-5 rounded-[24px] bg-app-surface border border-app shadow-sm space-y-4">
      {/* Header with Avatar & Dynamic Name */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-extrabold text-sm border-2 border-amber-300 shadow-md shrink-0">
            {initials || 'L'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-sm text-app-primary leading-tight truncate" title={nameToDisplay}>
              {nameToDisplay}
            </h3>
            <p className="text-[11px] font-medium text-app-secondary truncate">AI Learner Profile</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="p-1.5 rounded-xl text-app-secondary hover:text-app-primary hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Badges Row */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {/* Streak Stat */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-400/15 border border-amber-400/20 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
            <Flame className="w-3.5 h-3.5 fill-slate-950" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 truncate">
              Streak
            </p>
            <p className="text-xs font-extrabold text-app-primary truncate">
              {streakDays} Day{streakDays === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Total Lessons Completed/Active Stat */}
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 truncate">
              Lessons
            </p>
            <p className="text-xs font-extrabold text-app-primary truncate">
              {lessonsCountText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
