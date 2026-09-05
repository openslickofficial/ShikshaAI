export type SectionDepth = 'intro' | 'core' | 'advanced';
export type CheckpointType = 'conceptual' | 'mcq' | 'short-answer' | 'application';

export interface LessonSection {
  id: string;
  conceptTitle: string;
  depth: SectionDepth;
  explanationApproach: string;
  exampleIdeas: string[];
  hasCheckpoint: boolean;
  checkpointType?: CheckpointType;
  estimatedMinutes: number;
  groundedChunkIds?: string[];
}

export interface LessonPlan {
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  totalMinutes: number;
  sections: LessonSection[];
}

export interface PlanGenerationResponse {
  plan: LessonPlan;
  sessionId: string;
}
