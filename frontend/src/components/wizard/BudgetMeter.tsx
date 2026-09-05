import React, { useEffect, useState } from 'react';
import { Mic, AlertTriangle } from 'lucide-react';
import { getBudget } from '../../api/audioApi';
import type { BudgetStatus } from '../../types/audio';

interface BudgetMeterProps {
  refreshTrigger?: number;
}

export const BudgetMeter: React.FC<BudgetMeterProps> = ({ refreshTrigger }) => {
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    getBudget()
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
        <Mic className="w-3.5 h-3.5 text-amber-500" />
        <span>Voice Status: Ready</span>
      </div>
    );
  }

  const isMock = budget.provider === 'mock';
  const remainingPercent = (budget.remaining / (budget.limit || 1)) * 100;
  const isDanger = !isMock && remainingPercent < 15;

  if (isMock) {
    return (
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-600 dark:text-amber-300 text-[11px] font-extrabold shadow-sm">
        <Mic className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span>Sarvam AI (mock mode)</span>
      </div>
    );
  }

  const providerLabel =
    budget.provider === 'sarvam'
      ? 'Sarvam AI'
      : budget.provider === 'elevenlabs'
      ? 'ElevenLabs'
      : 'Voice API';

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
        <Mic className="w-3.5 h-3.5 text-amber-500" />
      )}
      <span>
        {providerLabel} · {budget.used.toLocaleString()} / {budget.limit.toLocaleString()} chars
      </span>
    </div>
  );
};
