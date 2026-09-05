import React from 'react';
import { Check } from 'lucide-react';

interface ChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ElementType;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  isSelected,
  onClick,
  icon: Icon,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
        isSelected
          ? 'bg-amber-400 text-slate-950 shadow-sm scale-105'
          : 'bg-app-surface text-app-secondary hover:text-app-primary border border-app hover:border-slate-400'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
    </button>
  );
};
