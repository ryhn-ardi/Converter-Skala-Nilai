export interface ScaleSettings {
  minOld: number;
  maxOld: number;
  minNew: number;
  maxNew: number;
  decimals: 'flat' | 'none' | number; // flat = bulat terdekat, 'none' = tanpa pembulatan
  roundingMode: 'round' | 'floor' | 'ceil';
  clipValues: boolean;
  passingScoreNew: number; // threshold for passing grade on the new scale
  enableRemedial: boolean;
  remedialThreshold: number; // original scores below this are boosted
  remedialValue: number; // what base score they get boosted to
}

export interface StudentRow {
  id: string;
  name: string;
  originalScore: number;
}

export interface CalculatedRow {
  id: string;
  name: string;
  originalScore: number;
  isRemediated: boolean;
  remedialOriginalScore: number; // original score after remedial adjustment
  newScore: number;
  isPassed: boolean;
}

export interface ScalePreset {
  id: string;
  name: string;
  description: string;
  minOld: number;
  maxOld: number;
  minNew: number;
  maxNew: number;
  decimals: 'flat' | 'none' | number;
  roundingMode: 'round' | 'floor' | 'ceil';
  clipValues: boolean;
  passingScoreNew: number;
  enableRemedial: boolean;
  remedialThreshold: number;
  remedialValue: number;
}
