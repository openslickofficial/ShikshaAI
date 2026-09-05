import React from 'react';
import {
  GraduationCap,
  Clock,
  Globe,
  Sparkles,
  Heart,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { SelectableCard } from './SelectableCard';
import { Chip } from './Chip';
import type {
  DifficultyLevel,
  TimeAvailable,
  TeachingStyle,
} from '../../types/lessonRequest';

interface PreferencesStepProps {
  level: DifficultyLevel | null;
  onChangeLevel: (level: DifficultyLevel) => void;
  timeAvailable: TimeAvailable | null;
  onChangeTime: (time: TimeAvailable) => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
  teachingStyle: TeachingStyle | null;
  onChangeStyle: (style: TeachingStyle) => void;
  interests: string[];
  onChangeInterests: (interests: string[]) => void;
  notes: string;
  onChangeNotes: (notes: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const LEVEL_OPTIONS: { id: DifficultyLevel; title: string; desc: string }[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    desc: 'No prior knowledge needed. Core fundamentals taught step-by-step.',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    desc: 'Requires basic understanding. Focuses on practical application.',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    desc: 'Deep dive into complex theoretical concepts and edge cases.',
  },
];

const TIME_OPTIONS: { id: TimeAvailable; label: string }[] = [
  { id: '5min', label: '⚡ 5 Min Quick Overview' },
  { id: '20min', label: '📖 20 Min Core Lesson' },
  { id: '60min', label: '🎓 60 Min Deep Session' },
  { id: '7day', label: '📅 7-Day Mastery Plan' },
];

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Hinglish', 'Spanish', 'French'];

const STYLE_OPTIONS: { id: TeachingStyle; label: string }[] = [
  { id: 'simple-examples', label: '💡 Simple Examples & Stories' },
  { id: 'technical-detailed', label: '🔬 Technical & Detailed Proofs' },
  { id: 'exam-focused', label: '🎯 Exam & Test Focused' },
];

const INTEREST_OPTIONS = [
  'Cricket',
  'Gaming',
  'Movies',
  'Cooking',
  'Music',
  'Tech',
];

export const PreferencesStep: React.FC<PreferencesStepProps> = ({
  level,
  onChangeLevel,
  timeAvailable,
  onChangeTime,
  language,
  onChangeLanguage,
  teachingStyle,
  onChangeStyle,
  interests,
  onChangeInterests,
  notes,
  onChangeNotes,
  onNext,
  onBack,
}) => {
  // Max 2 interests logic: selecting a 3rd deselects the oldest
  const handleInterestClick = (item: string) => {
    if (interests.includes(item)) {
      onChangeInterests(interests.filter((i) => i !== item));
    } else {
      if (interests.length >= 2) {
        // Keep the newest interest and append the new item (drop the oldest element [0])
        onChangeInterests([interests[1], item]);
      } else {
        onChangeInterests([...interests, item]);
      }
    }
  };

  const isFormValid =
    level !== null &&
    timeAvailable !== null &&
    language.length > 0 &&
    teachingStyle !== null;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-app-primary tracking-tight">
          Customize Your Learning Style
        </h2>
        <p className="text-xs text-app-secondary">
          Tailor difficulty, session length, language, and teaching approach to fit your goals.
        </p>
      </div>

      {/* 1. Difficulty Level */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-app-primary">
          <GraduationCap className="w-4 h-4 text-amber-500" />
          <span>Select Difficulty Level *</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LEVEL_OPTIONS.map((opt) => (
            <SelectableCard
              key={opt.id}
              id={opt.id}
              title={opt.title}
              description={opt.desc}
              isSelected={level === opt.id}
              onSelect={(id) => onChangeLevel(id as DifficultyLevel)}
            />
          ))}
        </div>
      </div>

      {/* 2. Time Available & Language Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time Available */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-app-primary">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Time Available *</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((t) => (
              <Chip
                key={t.id}
                label={t.label}
                isSelected={timeAvailable === t.id}
                onClick={() => onChangeTime(t.id)}
              />
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-app-primary">
            <Globe className="w-4 h-4 text-amber-500" />
            <span>Teaching Language *</span>
          </div>
          <select
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-app-surface border border-app text-app-primary font-bold text-xs focus:outline-none focus:border-amber-400 transition-colors shadow-sm"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Teaching Style */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-app-primary">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Preferred Teaching Style *</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STYLE_OPTIONS.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              isSelected={teachingStyle === s.id}
              onClick={() => onChangeStyle(s.id)}
            />
          ))}
        </div>
      </div>

      {/* 4. Interests (Optional - Max 2) */}
      <div className="space-y-3 pt-2 border-t border-app">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-app-primary">
            <Heart className="w-4 h-4 text-amber-500" />
            <span>Personal Interests (Optional - Max 2)</span>
          </div>
          <span className="text-[10px] font-bold text-app-secondary">
            {interests.length}/2 selected
          </span>
        </div>
        <p className="text-[11px] text-app-secondary">
          We'll use these to customize real-world examples and analogies for you.
        </p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((item) => (
            <Chip
              key={item}
              label={item}
              isSelected={interests.includes(item)}
              onClick={() => handleInterestClick(item)}
            />
          ))}
        </div>
      </div>

      {/* 5. Additional Notes (Optional) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-app-primary">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          <span>Additional Notes for Shiksha AI (Optional)</span>
        </div>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          placeholder="e.g. Please explain step 3 slowly with visual diagrams. I struggle with calculus formulas."
          className="w-full p-4 rounded-2xl bg-app-surface border border-app text-app-primary text-xs font-medium placeholder:text-app-secondary/60 focus:outline-none focus:border-amber-400 transition-colors shadow-sm resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-app">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs text-app-secondary hover:text-app-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Source</span>
        </button>

        <button
          type="button"
          disabled={!isFormValid}
          onClick={onNext}
          className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-extrabold text-sm transition-all duration-200 ${
            isFormValid
              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 shadow-md cursor-pointer'
              : 'bg-app-surface text-app-secondary opacity-50 border border-app cursor-not-allowed'
          }`}
        >
          <span>Review Request</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
