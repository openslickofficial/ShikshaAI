import React from 'react';
import { EquationVisual } from './EquationVisual';
import { GraphVisual } from './GraphVisual';
import { CodeVisual } from './CodeVisual';
import { DiagramVisual } from './DiagramVisual';
import { TimelineVisual } from './TimelineVisual';
import type {
  VisualType,
  VisualSpec,
  EquationSpec,
  GraphSpec,
  CodeSpec,
  DiagramSpec,
  TimelineSpec,
} from '../../types/sectionContent';

interface VisualRendererProps {
  visualType: VisualType;
  visualSpec: VisualSpec;
}

export const VisualRenderer: React.FC<VisualRendererProps> = ({
  visualType,
  visualSpec,
}) => {
  if (visualType === 'none' || !visualSpec) {
    return null;
  }

  switch (visualType) {
    case 'equation':
      return <EquationVisual spec={visualSpec as EquationSpec} />;
    case 'graph':
      return <GraphVisual spec={visualSpec as GraphSpec} />;
    case 'code':
      return <CodeVisual spec={visualSpec as CodeSpec} />;
    case 'diagram':
      return <DiagramVisual spec={visualSpec as DiagramSpec} />;
    case 'timeline':
      return <TimelineVisual spec={visualSpec as TimelineSpec} />;
    default:
      return null;
  }
};
