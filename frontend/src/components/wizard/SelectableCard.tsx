import React from 'react';
import { Check } from 'lucide-react';

interface SelectableCardProps {
  id: string;
  title: string;
  description: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
  icon?: React.ElementType;
}

export const SelectableCard: React.FC<SelectableCardProps> = ({
  id,
  title,
  description,
  isSelected,
  onSelect,
  icon: Icon,
}) => {
  return (
    <div
      onClick={() => onSelect(id)}
      className={`p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
        isSelected
          ? 'border-amber-400 bg-amber-400/10 shadow-md scale-[1.02]'
          : 'border-app bg-app-surface hover:border-slate-400/60 hover:bg-black/5 dark:hover:bg-white/5'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isSelected
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-app-bg text-app-secondary'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
          )}
          <h4 className="font-extrabold text-base text-app-primary">{title}</h4>
        </div>

        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-amber-400 text-slate-950 font-bold'
              : 'border-2 border-app bg-app-bg'
          }`}
        >
          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
        </div>
      </div>

      <p className="text-xs text-app-secondary leading-relaxed">{description}</p>
    </div>
  );
};
