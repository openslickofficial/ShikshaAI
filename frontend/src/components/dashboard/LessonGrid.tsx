import React from 'react';
import type { SessionSummary } from '../../types/session';
import { LessonCard } from './LessonCard';
import { BookOpen } from 'lucide-react';

interface LessonGridProps {
  sessions: SessionSummary[];
  onSelectSession?: (session: SessionSummary) => void;
}

export const LessonGrid: React.FC<LessonGridProps> = ({ sessions, onSelectSession }) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-app-primary tracking-tight">
          Recent Lessons
        </h2>
        <span className="text-xs font-bold text-app-secondary">
          Showing {sessions.length} {sessions.length === 1 ? 'lesson' : 'lessons'}
        </span>
      </div>

      {sessions.length === 0 ? (
        <div className="p-8 rounded-[24px] bg-app-surface border border-app text-center space-y-3">
          <BookOpen className="w-8 h-8 text-app-secondary mx-auto opacity-50" />
          <h3 className="text-base font-bold text-app-primary">No saved lessons yet</h3>
          <p className="text-xs text-app-secondary max-w-sm mx-auto">
            Generate your first lesson plan in the Interactive Studio to see your saved sessions here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.map((s) => (
            <LessonCard
              key={s.id}
              session={s}
              onClick={onSelectSession ? () => onSelectSession(s) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
};
