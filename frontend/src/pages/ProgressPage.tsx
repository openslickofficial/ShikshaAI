import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  TrendingUp,
  Award,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { getLearnerProfile } from '../api/sessionsApi';
import { useTheme } from '../context/ThemeContext';
import type { ProfileResponse } from '../types/session';

export const ProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getLearnerProfile()
      .then((data) => {
        if (isMounted) setProfile(data);
      })
      .catch((err) => {
        if (isMounted)
          setError(err.message || 'Failed to load learner profile.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const textColor = theme === 'dark' ? '#94A3B8' : '#64748B';
  const tooltipBg = theme === 'dark' ? '#18221F' : '#FFFFFF';
  const tooltipBorder = theme === 'dark' ? '#2A3833' : '#E2E8F0';

  if (isLoading) {
    return (
      <div className="p-12 rounded-[24px] bg-app-surface border border-app text-center space-y-4 max-w-md mx-auto shadow-sm my-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto" />
        <h3 className="text-lg font-extrabold text-app-primary">
          Loading Learning Progress...
        </h3>
      </div>
    );
  }

  const sessions = profile?.sessions || [];
  const completedSessions = sessions.filter(
    (s) => s.completedAt && s.scorePercent !== null && s.scorePercent !== undefined
  );

  // Score Over Time chart data
  const chartData = [...completedSessions]
    .reverse()
    .map((s, idx) => ({
      name: `Session ${idx + 1}`,
      title: s.title,
      score: s.scorePercent || 0,
      date: new Date(s.startedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
    }));

  const avgScore =
    completedSessions.length > 0
      ? (
          completedSessions.reduce(
            (acc, s) => acc + (s.scorePercent || 0),
            0
          ) / completedSessions.length
        ).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30 font-extrabold text-xs">
          <BarChart2 className="w-3.5 h-3.5" />
          Real-Time Learner Analytics
        </div>
        <h1 className="text-3xl font-extrabold text-app-primary tracking-tight">
          Learning Progress & History
        </h1>
        <p className="text-xs text-app-secondary">
          Track cross-session comprehension scores, concept mastery trends, and AI evaluation metrics.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-[22px] bg-app-surface border border-app shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-indigo-400">
            <BookOpen className="w-4 h-4" />
            <span className="text-xs font-bold text-app-secondary">Total Lessons Played</span>
          </div>
          <p className="text-3xl font-extrabold text-app-primary">{sessions.length}</p>
        </div>

        <div className="p-6 rounded-[22px] bg-app-surface border border-app shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold text-app-secondary">Avg Comprehension Score</span>
          </div>
          <p className="text-3xl font-extrabold text-app-primary">{avgScore}%</p>
        </div>

        <div className="p-6 rounded-[22px] bg-app-surface border border-app shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-amber-400">
            <Award className="w-4 h-4" />
            <span className="text-xs font-bold text-app-secondary">Completed Sessions</span>
          </div>
          <p className="text-3xl font-extrabold text-app-primary">{completedSessions.length}</p>
        </div>
      </div>

      {/* Empty State */}
      {sessions.length === 0 ? (
        <div className="p-12 rounded-[24px] bg-app-surface border border-app text-center space-y-4 max-w-lg mx-auto shadow-sm my-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-400/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-app-primary tracking-tight">
              No Lesson History Yet
            </h3>
            <p className="text-xs text-app-secondary">
              Complete your first lesson to see progress metrics, concept mastery tags, and score trends here.
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
        <>
          {/* Recharts Score-Over-Time Line Chart */}
          {chartData.length > 0 && (
            <div className="p-6 rounded-[24px] bg-app-surface border border-app shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-app-primary">Score Trend Over Time</h3>
                    <p className="text-[11px] text-app-secondary">Comprehension score % across completed sessions</p>
                  </div>
                </div>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: textColor, fontSize: 10, fontWeight: 600 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: textColor, fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: theme === 'dark' ? '#F8FAFC' : '#0F172A',
                      }}
                      formatter={(value: any) => [`${value}%`, 'Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ fill: '#F59E0B', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Mastered vs Revisit Tag Clusters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mastered Concepts */}
            <div className="p-6 rounded-[24px] bg-app-surface border border-app space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Concepts You've Mastered</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.overallStrongConcepts && profile.overallStrongConcepts.length > 0 ? (
                  profile.overallStrongConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold"
                    >
                      {concept}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-app-secondary italic">
                    Complete checkpoints correctly on your first attempt to list mastered concepts.
                  </span>
                )}
              </div>
            </div>

            {/* Concepts to Revisit */}
            <div className="p-6 rounded-[24px] bg-app-surface border border-app space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-extrabold text-rose-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Concepts to Revisit</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.overallWeakConcepts && profile.overallWeakConcepts.length > 0 ? (
                  profile.overallWeakConcepts.map((concept, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold"
                    >
                      {concept}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-app-secondary italic">
                    None! No recurring misconceptions detected across your completed lessons.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Session History Table */}
          <div className="p-6 rounded-[24px] bg-app-surface border border-app space-y-4 shadow-sm">
            <h3 className="font-extrabold text-base text-app-primary tracking-tight">
              Session History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-app text-[11px] font-extrabold uppercase tracking-wider text-app-secondary">
                    <th className="pb-3">Lesson Title</th>
                    <th className="pb-3">Level</th>
                    <th className="pb-3">Started Date</th>
                    <th className="pb-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app text-xs font-medium">
                  {sessions.map((s) => {
                    const isCompleted = Boolean(s.completedAt);
                    const score = s.scorePercent;
                    return (
                      <tr key={s.id} className="hover:bg-app-bg/50 transition-colors">
                        <td className="py-3.5 font-bold text-app-primary">{s.title}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-app-bg border border-app text-[10px] font-extrabold uppercase text-app-secondary">
                            {s.level}
                          </span>
                        </td>
                        <td className="py-3.5 text-app-secondary">
                          {new Date(s.startedAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 text-right font-extrabold">
                          {isCompleted && score !== null && score !== undefined ? (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs ${
                                score >= 80
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : score >= 50
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {score.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px]">
                              In Progress
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
