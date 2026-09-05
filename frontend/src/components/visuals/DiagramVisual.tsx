import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import { Network } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { DiagramSpec } from '../../types/sectionContent';

interface DiagramVisualProps {
  spec: DiagramSpec;
}

export const DiagramVisual: React.FC<DiagramVisualProps> = ({ spec }) => {
  const { theme } = useTheme();
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);

  const rawMermaid = spec.mermaidCode || 'graph TD\n  A[Start] --> B[End]';

  useEffect(() => {
    let isMounted = true;
    const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    // Helper to remove any error elements Mermaid automatically injects into document.body
    const cleanupBodyErrors = () => {
      const errNodes = document.querySelectorAll(`[id^="d${uniqueId}"], #${uniqueId}, .mermaid-error`);
      errNodes.forEach((node) => node.remove());
    };

    try {
      mermaid.initialize({
        startOnLoad: false,
        suppressErrorRendering: true,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: 'Inter, system-ui, sans-serif',
      });
    } catch {
      // Ignore re-initialization warnings
    }

    const renderDiagram = async () => {
      try {
        // Validate Mermaid syntax first
        const isValid = await mermaid.parse(rawMermaid, { suppressErrors: true }).catch(() => false);
        if (!isValid) {
          if (isMounted) {
            setRenderError('Invalid diagram syntax.');
            cleanupBodyErrors();
          }
          return;
        }

        const { svg } = await mermaid.render(uniqueId, rawMermaid);
        if (isMounted) {
          setSvgContent(svg);
          setRenderError(null);
          cleanupBodyErrors();
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Mermaid diagram render error:', err);
          setRenderError('Could not render process flow diagram.');
          cleanupBodyErrors();
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
      cleanupBodyErrors();
    };
  }, [rawMermaid, theme]);

  return (
    <div className="p-5 rounded-[20px] bg-app-bg border border-app space-y-3 shadow-inner text-center overflow-x-auto">
      <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-amber-500 uppercase tracking-wider">
        <Network className="w-4 h-4" />
        <span>Process Flow Diagram</span>
      </div>

      {renderError ? (
        <div className="p-4 rounded-xl bg-app-surface border border-app font-mono text-xs text-app-secondary whitespace-pre-wrap text-left space-y-1">
          <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">{renderError}</p>
          <pre className="text-xs font-mono opacity-80">{rawMermaid}</pre>
        </div>
      ) : (
        <div
          className="flex justify-center items-center min-h-[140px] [&>svg]:max-w-full [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};
