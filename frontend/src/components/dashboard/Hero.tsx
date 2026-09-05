import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Bot } from 'lucide-react';

export const Hero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-emerald-500/10 border border-app p-6 md:p-8 lg:p-10 shadow-sm">
      <div className="relative z-10 max-w-3xl space-y-4">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300 font-bold text-xs">
          <Bot className="w-4 h-4 text-amber-500" />
          Personalized Shiksha AI Platform
        </div>

        {/* Chunky Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-app-primary leading-[1.15]">
          Learn anything, taught like a real teacher
        </h1>

        {/* Subtext */}
        <p className="text-app-secondary text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
          AI-powered interactive lessons customized to your pace, learning style, and academic goals. Experience 1-on-1 tutoring on any subject.
        </p>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={() => navigate('/new-lesson')}
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-bold text-sm hover:bg-amber-300 active:scale-95 transition-all duration-200 shadow-md hover:shadow-amber-400/25 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Create New Lesson</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtle Background Glow Decorative Circle */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
    </section>
  );
};
