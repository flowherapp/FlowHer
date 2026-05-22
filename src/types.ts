export interface Win {
  id: string;
  text: string;
  category: string;
  date: string;
}

export interface TbcTask {
  id: string;
  task: string;
  estimated: number;
  actual: number;
  date: string;
  ratio: number;
}

export interface MaskMoment {
  id: string;
  types: string[];
  intensity: number;
  cost: number;
  note: string;
  date: string;
  time: string;
}

export interface WindDownLog {
  date: string;
  did: string;
  letGo: string;
  tomorrow: string;
}

export interface OnboardingData {
  brainType: string;
  goals: string[];
  completed: boolean;
}

export interface UserState {
  plan: 'free' | 'core';
  username: string;
  streakCount: number;
  lastCheckInDate: string;
  bestStreak: number;
  fogDays: number;
  wins: Win[];
  tbcData: TbcTask[];
  maskMoments: MaskMoment[];
  windDowns: WindDownLog[];
  onboarding: OnboardingData;
  completedDumpsCount: number; // For free users capping
}
