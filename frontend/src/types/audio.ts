export interface BeatAudio {
  beatIndex: number;
  audioUrl: string;
  durationSeconds: number;
  charactersUsed: number;
}

export interface SectionAudioResponse {
  sectionId: string;
  beats: BeatAudio[];
  totalCharactersUsed: number;
}

export interface BudgetStatus {
  used: number;
  limit: number;
  remaining: number;
  provider: 'mock' | 'elevenlabs' | string;
}
