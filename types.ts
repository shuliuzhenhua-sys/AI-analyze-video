export interface AnalysisResult {
  id: string;
  timestamp: number; // in seconds
  thumbnail: string; // base64
  isLoading: boolean;
  data?: AnalysisData;
  error?: string;
}

export interface AnalysisData {
  visualDescription: string;
  aiPrompt: string;
  characterPrompt?: string; // New field for character-specific prompt
  technicalBreakdown: string;
  colorPalette: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
}