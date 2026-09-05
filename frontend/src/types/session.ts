export interface CheckpointRecordRequest {
  sectionId: string;
  conceptTitle: string;
  checkpointType: string;
  verdict: string;
  misconception?: string;
}

export interface ReportContent {
  scorePercent: number;
  strongAreas: string[];
  weakAreas: string[];
  recommendation: string;
  suggestedNextTopic: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  level: string;
  startedAt: string;
  completedAt?: string;
  scorePercent?: number;
  status: 'draft' | 'completed';
  language?: string;
}

export interface ProfileResponse {
  learnerId: string;
  displayName: string;
  sessions: SessionSummary[];
  overallWeakConcepts: string[];
  overallStrongConcepts: string[];
}
