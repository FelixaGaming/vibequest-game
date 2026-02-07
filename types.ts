
export interface StrategyItem {
  id: string;
  label: string;
  emoji: string;
  type: 'good' | 'bad';
  tip: string;
}

export interface Feelings {
  who: string;
  text: string;
}

export interface Choice {
  kind: 'prosocial' | 'mild' | 'negative';
  text: string;
  attributes: string[];
  toxic: boolean;
  severity: string;
  likes: number;
  target: string;
  feelings: Feelings;
}

export interface Exchange {
  speaker: string;
  who: string;
  line: string;
  post: {
    attributes: string[];
    toxic: boolean;
  };
  prosocial: Choice;
  mild: Choice;
  negative: Choice;
}

export interface Scenario {
  id: number;
  title: string;
  exchangePool: Exchange[];
}

export interface TranscriptEntry {
  scenarioId: number;
  scenarioTitle: string;
  speaker: string;
  who: string;
  target: string;
  comment: string;
  feeling: string;
  attributes: string[];
  toxic: boolean;
  severity: string;
  likes: number;
  kind: string;
}

export interface PlayerMetrics {
  totalResponses: number;
  prosocialCount: number;
  mildCount: number;
  negativeCount: number;
  toxicCount: number;
  avgLikes: number;
  attributeCounts: Record<string, number>;
}

export interface BehavioralAnalysis {
  dominantStyle: string;
  empathyScore: number;
  toxicityRisk: string;
  socialImpact: string;
  keyStrengths: string[];
  growthAreas: string[];
}
