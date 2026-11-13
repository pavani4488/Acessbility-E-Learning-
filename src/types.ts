export type AppView = 'dashboard' | 'courses' | 'quizzes' | 'lab' | 'accessibility';

export interface Lesson {
  id: string;
  title: string;
  durationMin: number;
  summary: string;
  keyTakeaways: string[];
  codeExample?: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  level: 'Foundation' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  imageUrl: string;
  imageAlt: string;
  description: string;
  lessons: Lesson[];
  quizId: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  weight: number;
  explanation: string;
  topic: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  category: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  courseId: string;
  timestamp: string;
  correctCount: number;
  totalQuestions: number;
  earnedWeight: number;
  totalWeight: number;
  scorePercent: number;
  totalTimeMs: number;
  avgTimePerQuestionMs: number;
  wasmEvalTimeUs: number;
  jsEvalTimeUs: number;
  engineVerifiedMatch: boolean;
  weakTopics: string[];
}

export type ThemeMode = 'light' | 'dark';

export interface AccessibilitySettings {
  theme: ThemeMode;
  highContrast: boolean;
  fontScale: 1 | 1.15 | 1.3 | 1.5;
  dyslexiaSpacing: boolean;
  reducedMotion: boolean;
  enhancedFocus: boolean;
  screenReaderVerbosity: 'standard' | 'verbose';
}

export interface WcagCheckItem {
  id: string;
  criterion: string;
  level: 'A' | 'AA' | 'AAA';
  title: string;
  status: 'Pass' | 'Warning' | 'Fail';
  checkedCount: number;
  issueCount: number;
  measuredSummary: string;
  issues: {
    selector: string;
    detail: string;
    measuredValue: string;
  }[];
}

export interface WcagAuditReport {
  timestamp: string;
  totalElementsScanned: number;
  passedChecks: number;
  warningChecks: number;
  failedChecks: number;
  complianceRate: number;
  checks: WcagCheckItem[];
}

export interface BenchmarkRun {
  id: string;
  timestamp: string;
  batchSize: number;
  questionsPerQuiz: number;
  totalOperations: number;
  jsTimeMs: number;
  wasmComputeTimeMs: number;
  wasmEndToEndTimeMs: number;
  jsLatencyUsPerQuiz: number;
  wasmLatencyUsPerQuiz: number;
  speedupCompute: number;
  speedupEndToEnd: number;
  jsHeapDeltaKb: number | null;
  wasmMemoryPages: number;
  wasmMemoryMb: number;
  jsMaxFrameDeltaMs: number;
  wasmMaxFrameDeltaMs: number;
  parityMatched: boolean;
  meanScorePercent: number;
}

export interface RuleRecommendation {
  id: string;
  ruleCode: string;
  ruleCondition: string;
  targetId: string;
  targetType: 'course' | 'quiz';
  title: string;
  priority: 'High' | 'Medium' | 'Next Step';
  rationale: string;
}

export interface AiRecommendationItem {
  targetId: string;
  targetType: 'course' | 'quiz';
  title: string;
  priority: string;
  rationale: string;
  studyTip: string;
}

export interface AiRecommendationResponse {
  model: string;
  latencyMs: number;
  learnerSummary: string;
  recommendations: AiRecommendationItem[];
}

export interface AchievementBadge {
  id: string;
  title: string;
  criteriaLabel: string;
  description: string;
  tokenReward: number;
  unlocked: boolean;
  progressCurrent: number;
  progressTarget: number;
  category: 'streak' | 'mastery' | 'completion';
  actionHint: {
    label: string;
    targetView: AppView;
  };
}

export interface AchievementSummary {
  totalTokens: number;
  maxPossibleTokens: number;
  unlockedCount: number;
  totalBadges: number;
  currentLessonStreak: number;
  bestLessonStreak: number;
  perfectQuizCount: number;
  badges: AchievementBadge[];
}

