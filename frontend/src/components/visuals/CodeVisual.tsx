import React from 'react';
import { Code2, Terminal } from 'lucide-react';
import type { CodeSpec } from '../../types/sectionContent';

interface CodeVisualProps {
  spec: CodeSpec;
}

export const CodeVisual: React.FC<CodeVisualProps> = ({ spec }) => {
  const { language = 'python', snippet = '', expectedOutput } = spec;

  return (
    <div className="rounded-[20px] bg-slate-900 border border-slate-800 text-slate-100 overflow-hidden shadow-md">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-extrabold">
          <Code2 className="w-4 h-4 text-amber-400" />
          <span>Code Snippet</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[11px] font-extrabold uppercase">
          {language}
        </span>
      </div>

      {/* Code Block */}
      <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto text-amber-100 selection:bg-amber-400 selection:text-slate-950">
        <pre className="whitespace-pre">{snippet.trim()}</pre>
      </div>

      {/* Expected Output Box */}
      {expectedOutput && (
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400">
            <Terminal className="w-3.5 h-3.5" />
            <span>Expected Terminal Output:</span>
          </div>
          <pre className="font-mono text-xs text-slate-300 whitespace-pre font-medium pl-5">
            {expectedOutput.trim()}
          </pre>
        </div>
      )}
    </div>
  );
};
