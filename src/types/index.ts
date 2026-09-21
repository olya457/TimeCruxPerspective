export type Answer = string | string[] | number;
export type Question = {
  id: string;
  kind: string;
  label: string;
  prompt: string;
  options: string[];
  fields: string[];
  placeholder: string;
  maxLength: number;
  min: number;
  max: number;
  scaleLabels: string[];
  final: boolean;
  numeric: boolean;
};
export type Situation = {
  id: string;
  title: string;
  category: string;
  depth: number;
  situation: string;
  time?: string;
  roles?: string[];
  questions: Question[];
};
export type Reflection = {
  id: string;
  sourceId: string;
  title: string;
  category: string;
  kind: 'situation' | 'perspective' | 'choice';
  answers: Record<string, Answer>;
  conclusion: string;
  note: string;
  step: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  role?: string;
  sessionId?: string;
};
export type ChallengeResult = {
  id: string;
  date: string;
  correct: number;
  total: number;
  score: number;
  seconds: number;
  misses: { statement: string; expected: string; actual: string }[];
};
export type ChoiceDraft = {
  option: number;
  priorities: number[];
  value: string;
  confidence: number;
};
export type RootStackParams = {
  Main: undefined;
  Reflection: {
    sourceId: string;
    reflectionId?: string;
    role?: string;
    sessionId?: string;
  };
  ReflectionDetail: { id: string };
  PerspectiveSetup: { sourceId: string; sessionId?: string };
  Compare: { sourceId: string; sessionId: string };
  ChallengePlay: {
    count: number;
    difficulty: string;
    timed: boolean;
    seconds: number;
  };
  ChallengeResult: { id: string };
  Article: { id: string };
  Choice: { id: string };
};
