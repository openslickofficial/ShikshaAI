import React from 'react';
import { Target, AlertCircle } from 'lucide-react';

interface FocusAreasProps {
  weakConcepts: string[];
}

export const FocusAreas: React.FC<FocusAreasProps> = ({ weakConcepts }) => {
  const topConcepts = weakConcepts.slice(0, 3);

  return (
    <div className="p-5 rounded-[24px] bg-app-surface border border-app shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-app-primary">Focus Areas</h3>
            <p className="text-[11px] text-app-secondary">Concepts to review in future lessons</p>
          </div>
        </div>
      </div>

      {/* Focus Area Rows */}
      {topConcepts.length > 0 ? (
        <div className="space-y-2.5">
          {topConcepts.map((concept, index) => (
            <div
              key={index}
              className="p-3 rounded-2xl bg-app-bg border border-app flex items-center gap-3"
            >
              <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-app-primary line-clamp-1">
                {concept}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-app-bg border border-app text-center">
          <p className="text-xs text-app-secondary font-medium">
            Complete a lesson with a few questions to see focus areas here.
          </p>
        </div>
      )}
    </div>
  );
};
