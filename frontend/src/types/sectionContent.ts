import type { LessonPlan } from './lessonPlan';
import type { SourceConfig } from './lessonRequest';

export type VisualType = 'equation' | 'graph' | 'code' | 'diagram' | 'timeline' | 'none';

export interface EquationSpec {
  latex: string;
}

export interface GraphPoint {
  x: number;
  y: number;
}

export interface GraphSeries {
  name: string;
  points: GraphPoint[];
}

export interface GraphSpec {
  chartType: 'line' | 'bar' | 'scatter';
  xLabel: string;
  yLabel: string;
  series: GraphSeries[];
}

export interface CodeSpec {
  language: string;
  snippet: string;
  expectedOutput?: string;
}

export interface DiagramSpec {
  mermaidCode: string;
}

export interface TimelineEvent {
  label: string;
  order: number;
  detail?: string;
}

export interface TimelineSpec {
  events: TimelineEvent[];
}

export type VisualSpec =
  | EquationSpec
  | GraphSpec
  | CodeSpec
  | DiagramSpec
  | TimelineSpec
  | Record<string, any>;

export interface SectionContent {
  sectionId: string;
  narrationBeats: string[];
  onScreenHeadline: string;
  onScreenBullets: string[];
  visualType: VisualType;
  visualSpec: VisualSpec;
  visualReason: string;
}

export interface ContentGenerationRequest {
  plan: LessonPlan;
  source: SourceConfig;
}

export interface ContentGenerationResponse {
  sections: SectionContent[];
}
