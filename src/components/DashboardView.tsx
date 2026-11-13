import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  Download,
  GitBranch,
  AlertTriangle,
  BookOpen,
  ClipboardCheck,
  RefreshCw,
  Award,
  Coins,
  Flame,
  Lock,
} from 'lucide-react';
import {
  AccessibilitySettings,
  AchievementSummary,
  AiRecommendationResponse,
  AppView,
  BenchmarkRun,
  Course,
  Quiz,
  QuizAttempt,
  WcagAuditReport,
} from '../types';
import { generateRuleBasedRecommendations } from '../utils/recommendationEngine';

interface DashboardViewProps {
  courses: Course[];
  quizzes: Quiz[];
  completedLessons: string[];
  quizAttempts: QuizAttempt[];
  benchmarks: BenchmarkRun[];
  auditReport: WcagAuditReport | null;
  a11ySettings: AccessibilitySettings;
  achievements: AchievementSummary;
  onNavigate: (view: AppView) => void;
  onOpenCourse: (courseId: string) => void;
  onOpenQuiz: (quizId: string) => void;
  onRunAudit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  courses,
  quizzes,
  completedLessons,
  quizAttempts,
  benchmarks,
  auditReport,
  a11ySettings,
  achievements,
  onNavigate,
  onOpenCourse,
  onOpenQuiz,
  onRunAudit,
}) => {
  const [aiResponse, setAiResponse] = useState<AiRecommendationResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const totalLessons = courses.reduce((acc, c) => acc + c.lessons.length, 0);
  const completedCount = completedLessons.length;
  const overallProgressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const avgQuizScore =
    quizAttempts.length > 0
      ? Number(
          (quizAttempts.reduce((acc, a) => acc + a.scorePercent, 0) / quizAttempts.length).toFixed(1)
        )
      : null;

  const latestBenchmark = benchmarks[0] ?? null;

  const ruleRecommendations = generateRuleBasedRecommendations(
    courses,
    quizzes,
    completedLessons,
    quizAttempts
  );

  const handleRequestAiRecommendations = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const catalogSummary = courses.map((c) => ({
        courseId: c.id,
        title: c.title,
        category: c.category,
        quizId: c.quizId,
        totalLessons: c.lessons.length,
        completedLessonsInCourse: c.lessons.filter((l) => completedLessons.includes(l.id)).length,
      }));

      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses: catalogSummary,
          completedLessons,
          quizHistory: quizAttempts.slice(0, 8),
          accessibilityProfile: {
            fontScale: a11ySettings.fontScale,
            highContrast: a11ySettings.highContrast,
            reducedMotion: a11ySettings.reducedMotion,
            dyslexiaSpacing: a11ySettings.dyslexiaSpacing,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server returned ${res.status}`);
      }
      setAiResponse(data as AiRecommendationResponse);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Unable to reach AI recommendation service.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportProgressCsv = () => {
    const header = 'Attempt ID,Quiz Title,Score %,Correct,Total,Wasm Eval (us),JS Eval (us),Avg Time/Q (ms),Timestamp\n';
    const rows = quizAttempts
      .map(
        (a) =>
          `"${a.id}","${a.quizTitle}",${a.scorePercent},${a.correctCount},${a.totalQuestions},${a.wasmEvalTimeUs},${a.jsEvalTimeUs},${a.avgTimePerQuestionMs},"${a.timestamp}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accessilearn-progress.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* Hero / Focal Anchor */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
              Accessible Mobile E-Learning · C/WebAssembly Optimization · AI Personalization
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 [text-wrap:balance]">
              Learning Workspace & Accessibility Performance Overview
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Complete WCAG 2.2 engineering lessons, evaluate quizzes directly inside compiled C
              WebAssembly linear memory, inspect live DOM compliance, and benchmark JavaScript against
              WebAssembly on your current device.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('quizzes')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Start Quiz Assessment</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('lab')}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              Open Wasm Benchmark Lab
            </button>
          </div>
        </div>

        {/* 4-Column Summary Metric Strip */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Curriculum Progress
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
              {overallProgressPct}%
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              {completedCount} of {totalLessons} lessons done
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Mean Quiz Score
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
              {avgQuizScore !== null ? `${avgQuizScore}%` : 'No attempts'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              {quizAttempts.length} C-Wasm evaluated {quizAttempts.length === 1 ? 'quiz' : 'quizzes'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Latest Wasm Speedup
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
              {latestBenchmark ? `${latestBenchmark.speedupCompute}x` : 'Not measured'}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
              {latestBenchmark
                ? `${latestBenchmark.wasmComputeTimeMs} ms vs ${latestBenchmark.jsTimeMs} ms JS`
                : 'Run benchmark in Wasm Lab'}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Live WCAG DOM Audit
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
              {auditReport ? `${auditReport.complianceRate}%` : 'Pending'}
            </p>
            <button
              type="button"
              onClick={onRunAudit}
              className="mt-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline min-h-[24px] inline-flex items-center gap-1"
            >
              <span>{auditReport ? 'Re-scan live DOM' : 'Run live DOM audit'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Achievement Badges & Virtual Tokens Module */}
      <section aria-labelledby="achievements-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2
              id="achievements-heading"
              className="text-xl font-bold text-slate-900 dark:text-slate-50"
            >
              Achievement Badges & Virtual Tokens
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Earn virtual tokens by completing consecutive lessons in a row or achieving 100% on
              C-WebAssembly quizzes.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter achievement badges"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0"
          >
            {(
              [
                { id: 'all', label: `All (${achievements.totalBadges})` },
                { id: 'unlocked', label: `Unlocked (${achievements.unlockedCount})` },
                {
                  id: 'locked',
                  label: `In Progress (${achievements.totalBadges - achievements.unlockedCount})`,
                },
              ] as const
            ).map((tab) => {
              const active = badgeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setBadgeFilter(tab.id)}
                  className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Token Ledger Summary Strip */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Token Balance</p>
                <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-50 tabular-nums">
                  {achievements.totalTokens} / {achievements.maxPossibleTokens}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-blue-700 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Consecutive Lesson Streak
                </p>
                <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-50 tabular-nums">
                  {achievements.currentLessonStreak} active · {achievements.bestLessonStreak} best
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  100% Quiz Assessments
                </p>
                <p className="text-lg font-bold font-mono text-slate-900 dark:text-slate-50 tabular-nums">
                  {achievements.perfectQuizCount} perfected
                </p>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.badges
              .filter((badge) => {
                if (badgeFilter === 'unlocked') return badge.unlocked;
                if (badgeFilter === 'locked') return !badge.unlocked;
                return true;
              })
              .map((badge) => {
                const pct = Math.round((badge.progressCurrent / badge.progressTarget) * 100);
                return (
                  <article
                    key={badge.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between gap-4 ${
                      badge.unlocked
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs font-mono">
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold ${
                            badge.unlocked
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {badge.unlocked ? (
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          <span>{badge.unlocked ? 'Unlocked' : 'In Progress'}</span>
                        </span>
                        <span className="font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                          +{badge.tokenReward} Tokens
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                          {badge.title}
                        </h3>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                          {badge.criteriaLabel}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {badge.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                          <span>Progress</span>
                          <span>
                            {badge.progressCurrent} / {badge.progressTarget} ({pct}%)
                          </span>
                        </div>
                        <div
                          className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${badge.title} progress`}
                        >
                          <div
                            className={`h-full transition-all duration-300 ${
                              badge.unlocked
                                ? 'bg-emerald-600 dark:bg-emerald-500'
                                : 'bg-blue-700 dark:bg-blue-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {!badge.unlocked && (
                        <button
                          type="button"
                          onClick={() => onNavigate(badge.actionHint.targetView)}
                          className="min-h-[44px] w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center justify-center gap-1.5"
                        >
                          <span>{badge.actionHint.label}</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      </section>

      {/* Module 8: AI Personalization vs Deterministic Rule Engine */}
      <section aria-labelledby="personalization-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2
              id="personalization-heading"
              className="text-xl font-bold text-slate-900 dark:text-slate-50"
            >
              Personalized Learning Recommendations
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Explicit architectural separation between client-side deterministic rules and
              server-side Gemini generative AI synthesis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Column 1: Deterministic Rule-Based Engine */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <GitBranch className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
                    <span>Deterministic Rule Engine · Client-Side Local Logic</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Threshold-Based Routing
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                  0 ms network
                </span>
              </div>

              {ruleRecommendations.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400 py-4">
                  All curriculum modules and assessments meet mastery thresholds.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ruleRecommendations.map((rec) => (
                    <li key={rec.id} className="py-4 first:pt-1 last:pb-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                          {rec.ruleCode} · Priority: {rec.priority}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {rec.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rec.rationale}
                      </p>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        Condition: {rec.ruleCondition}
                      </p>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            rec.targetType === 'course'
                              ? onOpenCourse(rec.targetId)
                              : onOpenQuiz(rec.targetId)
                          }
                          className="min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5"
                        >
                          <span>
                            {rec.targetType === 'course' ? 'Open Course' : 'Launch Quiz'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Column 2: Real Gemini AI Engine */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                    <Bot className="w-4 h-4" aria-hidden="true" />
                    <span>Live Generative AI · Server-Side Gemini API</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Adaptive Curriculum Synthesis
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleRequestAiRecommendations}
                  disabled={aiLoading}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>{aiLoading ? 'Analyzing Telemetry...' : 'Generate AI Recommendations'}</span>
                </button>
              </div>

              {aiError && (
                <div
                  role="alert"
                  className="p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 text-xs space-y-1"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Gemini API Request Failed (Not Substituted With Rules)</span>
                  </div>
                  <p>{aiError}</p>
                </div>
              )}

              {!aiResponse && !aiError && !aiLoading && (
                <div className="py-6 space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Invoke the backend <code className="font-mono text-xs">/api/ai/recommend</code>{' '}
                    endpoint to analyze your live lesson completions, C-Wasm quiz accuracy, pacing,
                    and active accessibility settings using Gemini.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Unlike the deterministic rules on the left, generative AI synthesizes
                    cross-topic patterns and outputs structured study tips tailored to your profile.
                  </p>
                </div>
              )}

              {aiLoading && (
                <div className="space-y-3 py-4" aria-live="polite">
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="h-16 w-full rounded bg-slate-100 dark:bg-slate-800/70 animate-pulse" />
                  <div className="h-16 w-full rounded bg-slate-100 dark:bg-slate-800/70 animate-pulse" />
                </div>
              )}

              {aiResponse && !aiLoading && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 font-mono">
                    <span>Model: {aiResponse.model}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">Latency: {aiResponse.latencyMs} ms</span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {aiResponse.learnerSummary}
                  </p>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {aiResponse.recommendations.map((item, idx) => (
                      <li key={`${item.targetId}-${idx}`} className="py-3.5 first:pt-1 last:pb-1 space-y-1.5">
                        <div className="text-xs font-medium text-blue-700 dark:text-blue-400">
                          Priority: {item.priority} · {item.targetType === 'course' ? 'Course' : 'Quiz'}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.rationale}
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-200">
                          <span className="font-semibold">Study Action:</span> {item.studyTip}
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const isCourse = courses.some((c) => c.id === item.targetId);
                              const isQuiz = quizzes.some((q) => q.id === item.targetId);
                              if (isCourse) onOpenCourse(item.targetId);
                              else if (isQuiz) onOpenQuiz(item.targetId);
                              else onNavigate('courses');
                            }}
                            className="min-h-[44px] px-3.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold text-blue-800 dark:text-blue-300 inline-flex items-center gap-1.5"
                          >
                            <span>Open Recommended Module</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Module 4: Student Progress Tracking */}
      <section aria-labelledby="progress-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="progress-heading"
              className="text-xl font-bold text-slate-900 dark:text-slate-50"
            >
              Student Progress Tracking
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Course completion across modules and C-WebAssembly assessment telemetry.
            </p>
          </div>
          {quizAttempts.length > 0 && (
            <button
              type="button"
              onClick={handleExportProgressCsv}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Export CSV Report</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Course Progress List */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
              <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
              <span>Course Completion Matrix</span>
            </div>
            <ul className="space-y-5">
              {courses.map((course) => {
                const done = course.lessons.filter((l) => completedLessons.includes(l.id)).length;
                const pct =
                  course.lessons.length > 0
                    ? Math.round((done / course.lessons.length) * 100)
                    : 0;
                return (
                  <li key={course.id} className="space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenCourse(course.id)}
                        className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 text-left min-h-[24px]"
                      >
                        {course.title}
                      </button>
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums shrink-0">
                        {done}/{course.lessons.length} ({pct}%)
                      </span>
                    </div>
                    <div
                      className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${course.title} completion`}
                    >
                      <div
                        className="h-full bg-blue-700 dark:bg-blue-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quiz Attempts Ledger */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                <ClipboardCheck
                  className="w-4 h-4 text-blue-700 dark:text-blue-400"
                  aria-hidden="true"
                />
                <span>Assessment Attempt Log (Processed via C/Wasm)</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {quizAttempts.length} recorded
              </span>
            </div>

            {quizAttempts.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  No quiz attempts recorded in this session yet.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('quizzes')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold"
                >
                  Take Your First Assessment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 pr-3">Assessment</th>
                      <th className="py-2.5 px-3 text-right">Score</th>
                      <th className="py-2.5 px-3 text-right">Wasm Eval</th>
                      <th className="py-2.5 pl-3 text-right">Parity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {quizAttempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td className="py-3 pr-3">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {attempt.quizTitle}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {attempt.correctCount}/{attempt.totalQuestions} correct · {attempt.timestamp}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {attempt.scorePercent}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                          {attempt.wasmEvalTimeUs} µs
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{attempt.engineVerifiedMatch ? 'Exact' : 'Diff'}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
