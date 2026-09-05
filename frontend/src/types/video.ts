export interface BeatTiming {
  beatIndex: number;
  startSeconds: number;
  endSeconds: number;
}

export interface SectionVideoResponse {
  sectionId: string;
  videoUrl: string;
  durationSeconds: number;
  beatTimings: BeatTiming[];
}

export interface VideoBudgetStatus {
  used: number;
  limit: number;
  remaining: number;
  provider: 'mock' | 'did' | string;
}
