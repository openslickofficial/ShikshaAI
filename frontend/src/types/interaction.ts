export interface CheckpointQuestion {
  checkpointType: string;
  questionText: string;
  options?: string[] | null;
  correctOption?: string | null;
  rubric?: string | null;
}

export interface EvaluationResult {
  verdict: 'correct' | 'partial' | 'incorrect';
  misconception?: string | null;
  feedback: string;
  decision: 'continue' | 'reexplain';
}

export interface RemediationContent {
  newExplanationApproach: string;
  headline: string;
  narrationBeats: string[];
}

export interface SessionLogEntry {
  sectionId: string;
  verdict: 'correct' | 'partial' | 'incorrect';
  misconception?: string | null;
}
