import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ProfileCard } from '../dashboard/ProfileCard';
import { ActivityChart } from '../dashboard/ActivityChart';
import { FocusAreas } from '../dashboard/FocusAreas';
import { SidebarWidgets } from './SidebarWidgets';
import { ColdStartBanner } from './ColdStartBanner';
import { getLearnerProfile } from '../../api/sessionsApi';
import { monthlyHours, currentStreak } from '../../lib/sessionAggregates';
import { checkBackendWake } from '../../lib/backendWake';
import type { ProfileResponse } from '../../types/session';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isBackendWaking, setIsBackendWaking] = useState(false);

  useEffect(() => {
    // Prober for backend cold-start wake state on mount (PROD only)
    const cleanup = checkBackendWake((waking) => setIsBackendWaking(waking));
    return cleanup;
  }, []);

  useEffect(() => {
    getLearnerProfile()
      .then((data) => setProfile(data))
      .catch((err) => console.warn('AppLayout profile fetch error:', err));
  }, [location.pathname]);

  const allSessions = profile?.sessions || [];
  const completedSessions = allSessions.filter((s) => Boolean(s.completedAt));
  const streak = currentStreak(allSessions);
  const hoursData = monthlyHours(allSessions);
  const focusConcepts = profile?.overallWeakConcepts || [];

  return (
    <div className="min-h-screen bg-app-bg text-app-primary flex flex-col font-sans transition-colors duration-200">
      {/* Top Cold-Start Banner */}
      <ColdStartBanner isVisible={isBackendWaking} onDismiss={() => setIsBackendWaking(false)} />

      <div className="flex-1 flex flex-row">
        {/* 1. Fixed Left Icon Rail (72px) */}
        <Sidebar />

        {/* Main Wrapper offset by sidebar width (72px) */}
        <div className="flex-1 flex flex-row ml-[72px] min-h-screen">
          {/* 2. Main Content Area */}
          <main className="flex-1 p-5 md:p-6 lg:p-8 overflow-y-auto w-full">
            <Outlet />
          </main>

          {/* 3. Right Rail Panel (~340px) - Desktop Viewport (>=1024px) */}
          {isHomePage ? (
            <aside className="hidden lg:block w-[340px] shrink-0 p-5 border-l border-app bg-app-surface/40 backdrop-blur-sm min-h-screen space-y-5 overflow-y-auto">
              <ProfileCard
                displayName={profile?.displayName}
                streakDays={streak}
                totalCompletedLessons={completedSessions.length}
                totalSessions={allSessions.length}
              />
              <ActivityChart data={hoursData} />
              <FocusAreas weakConcepts={focusConcepts} />
            </aside>
          ) : (
            <aside className="hidden lg:block w-[340px] shrink-0 p-5 border-l border-app bg-app-surface/40 backdrop-blur-sm min-h-screen overflow-y-auto">
              <SidebarWidgets
                displayName={profile?.displayName}
                streakDays={streak}
                completedLessons={completedSessions.length}
                recentSessions={allSessions}
                weakConcepts={focusConcepts}
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
