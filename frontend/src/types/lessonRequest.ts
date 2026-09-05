export type UploadedSourceConfig = {
  mode: 'upload';
  materialId: string;
  filename: string;
  chunkCount?: number;
};

export type TopicSourceConfig = {
  mode: 'topic';
  topic: string;
};

export type SourceConfig = UploadedSourceConfig | TopicSourceConfig;

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type TimeAvailable = '5min' | '20min' | '60min' | '7day';
export type TeachingStyle = 'simple-examples' | 'technical-detailed' | 'exam-focused';

export interface LessonRequest {
  source: SourceConfig;
  level: DifficultyLevel;
  timeAvailable: TimeAvailable;
  language: string;
  teachingStyle: TeachingStyle;
  interests?: string[];
  notes?: string;
  priorWeakConcepts?: string[];
}

