import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sparkles, BookOpen, BarChart2, Settings, GraduationCap, LogOut } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/new-lesson', icon: Sparkles, label: 'New Lesson' },
    { to: '/lessons', icon: BookOpen, label: 'My Lessons' },
    { to: '/progress', icon: BarChart2, label: 'Progress' },
  ];

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Learner';

  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className="fixed top-0 left-0 bottom-0 w-[72px] bg-app-sidebar z-30 flex flex-col items-center justify-between py-5 border-r border-slate-800/50 shadow-lg select-none"
      aria-label="Sidebar Navigation"
    >
      {/* Top Section: Logo */}
      <div className="flex flex-col items-center gap-6">
        <NavLink
          to="/"
          className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md hover:scale-105 transition-all duration-200"
          title="Shiksha AI Platform"
        >
          <GraduationCap className="w-7 h-7 text-slate-950 transition-transform group-hover:rotate-6" />
          <span className="absolute left-16 bg-slate-900 text-white text-xs font-medium px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
            Shiksha AI
          </span>
        </NavLink>

        {/* Primary Nav Links */}
        <nav className="flex flex-col items-center gap-3 mt-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-bold scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {/* Tooltip */}
                  <span className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section: Theme Toggle, Settings & User Avatar */}
      <div className="flex flex-col items-center gap-3">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Settings NavLink */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 ${
              isActive
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 font-bold scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Settings className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'rotate-45' : 'group-hover:rotate-45'}`} />
              <span className="absolute left-16 bg-slate-900 text-white text-xs font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-slate-700">
                Settings
              </span>
            </>
          )}
        </NavLink>

        {/* User Avatar & Logout Dropdown */}
        <div className="relative pt-1">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-extrabold text-xs border-2 border-slate-700 shadow-md hover:border-amber-300 transition-all duration-200 cursor-pointer"
            title={user?.email || 'User Menu'}
          >
            {initials}
          </button>

          {/* Flyout Menu */}
          {showUserMenu && (
            <div
              className="absolute left-16 bottom-0 w-56 p-3 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl space-y-3 z-50 animate-in fade-in duration-150"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="space-y-0.5 px-1">
                <p className="text-xs font-extrabold text-amber-400 truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/15 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
