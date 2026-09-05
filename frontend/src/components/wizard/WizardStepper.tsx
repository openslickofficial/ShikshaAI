import React from 'react';
import { Check, Upload, SlidersHorizontal, Eye } from 'lucide-react';

interface WizardStepperProps {
  currentStep: number; // 1 | 2 | 3
  completedSteps: number[]; // e.g. [1]
  onStepClick: (step: number) => void;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  const steps = [
    { number: 1, label: '1. Source', icon: Upload },
    { number: 2, label: '2. Preferences', icon: SlidersHorizontal },
    { number: 3, label: '3. Review', icon: Eye },
  ];

  return (
    <div className="flex items-center justify-between p-2 rounded-2xl bg-app-surface border border-app shadow-sm max-w-xl mx-auto">
      {steps.map((step) => {
        const isCurrent = currentStep === step.number;
        const isCompleted = completedSteps.includes(step.number);
        const isClickable = isCompleted || isCurrent;
        const StepIcon = step.icon;

        return (
          <button
            key={step.number}
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onStepClick(step.number)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all duration-200 ${
              isCurrent
                ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                : isCompleted
                ? 'text-amber-600 dark:text-amber-400 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer'
                : 'text-app-secondary opacity-50 cursor-not-allowed'
            }`}
          >
            {isCompleted && !isCurrent ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : (
              <StepIcon className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{step.label}</span>
            <span className="sm:hidden">{step.number}</span>
          </button>
        );
      })}
    </div>
  );
};
