import React from 'react';
import { Settings, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card-sand text-card-sand font-bold text-xs">
        <Settings className="w-3.5 h-3.5" />
        System Configuration
      </div>

      <h1 className="text-3xl font-extrabold text-app-primary">Platform Settings</h1>
      <p className="text-app-secondary">
        Manage theme preferences, Shiksha AI parameters, and interface display options.
      </p>

      {/* Theme Preference Setting Card */}
      <div className="p-6 rounded-[24px] bg-app-surface border border-app shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-app-primary flex items-center gap-2">
          <Monitor className="w-5 h-5 text-amber-500" />
          Appearance & Theme
        </h3>
        <p className="text-xs text-app-secondary">
          Toggle between Light and Dark visual modes. Preference automatically persists in your local storage.
        </p>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-app-bg border border-app">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-bold text-app-primary">
                Current Theme: <span className="capitalize text-amber-500">{theme} Mode</span>
              </p>
              <p className="text-xs text-app-secondary">HTML class Strategy (`dark` on &lt;html&gt;)</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>
      </div>
    </div>
  );
};
