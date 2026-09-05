import React from 'react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Sigma } from 'lucide-react';
import type { EquationSpec } from '../../types/sectionContent';

interface EquationVisualProps {
  spec: EquationSpec;
}

export const EquationVisual: React.FC<EquationVisualProps> = ({ spec }) => {
  const latexStr = spec.latex || 'E = mc^2';

  return (
    <div className="p-6 rounded-[20px] bg-app-bg border border-app shadow-inner text-center space-y-3 overflow-x-auto">
      <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-amber-500 uppercase tracking-wider">
        <Sigma className="w-4 h-4" />
        <span>Mathematical Formula</span>
      </div>

      <div className="py-3 text-app-primary text-lg sm:text-xl font-medium tracking-wide">
        <BlockMath math={latexStr} />
      </div>
    </div>
  );
};
