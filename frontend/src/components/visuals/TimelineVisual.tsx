import React from 'react';
import { History } from 'lucide-react';
import type { TimelineSpec } from '../../types/sectionContent';

interface TimelineVisualProps {
  spec: TimelineSpec;
}

export const TimelineVisual: React.FC<TimelineVisualProps> = ({ spec }) => {
  const events = React.useMemo(() => {
    const evts = spec.events || [];
    return [...evts].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [spec]);

  return (
    <div className="p-5 rounded-[20px] bg-app-bg border border-app space-y-4 shadow-inner">
      <div className="flex items-center gap-2 text-xs font-extrabold text-amber-500 uppercase tracking-wider">
        <History className="w-4 h-4" />
        <span>Sequential Timeline / Historical Milestones</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-amber-400/30">
        {events.map((evt, idx) => (
          <div key={idx} className="relative flex items-start gap-3 group">
            {/* Step Marker Circle */}
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] flex items-center justify-center ring-4 ring-app-bg shrink-0 shadow-sm">
              {evt.order || idx + 1}
            </div>

            <div className="space-y-1">
              <h5 className="font-extrabold text-sm text-app-primary leading-tight flex items-center gap-2">
                <span>{evt.label}</span>
              </h5>
              {evt.detail && (
                <p className="text-xs text-app-secondary font-medium leading-relaxed">
                  {evt.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
