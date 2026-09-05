import React, { useEffect, useState } from 'react';
import { Video, AlertTriangle } from 'lucide-react';
import { getVideoBudget } from '../../api/videoApi';
import type { VideoBudgetStatus } from '../../types/video';

interface VideoBudgetMeterProps {
  refreshTrigger?: number;
}

export const VideoBudgetMeter: React.FC<VideoBudgetMeterProps> = ({ refreshTrigger }) => {
  const [budget, setBudget] = useState<VideoBudgetStatus | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    getVideoBudget()
      .then((data) => {
        if (isMounted) {
          setBudget(data);
          setIsError(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  if (isError || !budget) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-app-surface border border-app text-app-secondary text-[11px] font-bold">
        <Video className="w-3.5 h-3.5 text-purple-500" />
        <span>Avatar Status: Ready</span>
      </div>
    );
  }

  const isMock = budget.provider === 'mock';
  const remainingPercent = (budget.remaining / (budget.limit || 1)) * 100;
  const isDanger = !isMock && remainingPercent < 15;

  if (isMock) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-600 dark:text-purple-300 text-[11px] font-extrabold shadow-sm">
        <Video className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
        <span>Avatar preview (mock)</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold border shadow-sm ${
        isDanger
          ? 'bg-app-danger text-app-danger border-red-500/30'
          : 'bg-app-surface border-app text-app-primary'
      }`}
    >
      {isDanger ? (
        <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-bounce" />
      ) : (
        <Video className="w-3.5 h-3.5 text-purple-500" />
      )}
      <span>
        D-ID · {budget.used.toFixed(0)}s / {budget.limit.toFixed(0)}s used
      </span>
    </div>
  );
};
