import React, { useCallback, useEffect, useState } from 'react';
import {
  Accessibility,
  BookOpen,
  ClipboardCheck,
  Cpu,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import { COURSES, QUIZZES } from './data/curriculum';
import {
  AccessibilitySettings,
  AppView,
  BenchmarkRun,
  Course,
  QuizAttempt,
  WcagAuditReport,
} from './types';
import { runLiveWcagDomAudit } from './utils/wcagAuditor';
import { computeAchievementSummary } from './utils/achievements';
import { initWasmEngine } from './wasm/wasmEngine';
import { DashboardView } from './components/DashboardView';
import { CoursesView } from './components/CoursesView';
import { QuizView } from './components/QuizView';
import { LabView } from './components/LabView';
import { AccessibilityView } from './components/AccessibilityView';

const DEFAULT_A11Y: AccessibilitySettings = {
  theme: 'light',
  highContrast: false,
  fontScale: 1,
  dyslexiaSpacing: false,
  reducedMotion: false,
  enhancedFocus: false,
  screenReaderVerbosity: 'standard',
};

const STORAGE_KEYS = {
  a11y: 'accessilearn_a11y_v1',
  completedLessons: 'accessilearn_lessons_v1',
  attempts: 'accessilearn_attempts_v1',
  customCourses: 'accessilearn_custom_courses_v1',
  lessonStreak: 'accessilearn_streak_v1',
};

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [customCourses, setCustomCourses] = useState<Course[]>(() =>
    loadJson<Course[]>(STORAGE_KEYS.customCourses, [])
  );
  const allCourses = [...COURSES, ...customCourses];

  const [selectedCourseId, setSelectedCourseId] = useState<string>(COURSES[0].id);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(QUIZZES[0].id);

  const [completedLessons, setCompletedLessons] = useState<string[]>(() =>
    loadJson<string[]>(STORAGE_KEYS.completedLessons, ['wcag-l1'])
  );
  const [streakState, setStreakState] = useState<{ current: number; best: number }>(() =>
    loadJson<{ current: number; best: number }>(STORAGE_KEYS.lessonStreak, {
      current: 1,
      best: 1,
    })
  );
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() =>
    loadJson<QuizAttempt[]>(STORAGE_KEYS.attempts, [])
  );
  const [benchmarks, setBenchmarks] = useState<BenchmarkRun[]>([]);
  const [a11ySettings, setA11ySettings] = useState<AccessibilitySettings>(() =>
    loadJson<AccessibilitySettings>(STORAGE_KEYS.a11y, DEFAULT_A11Y)
  );
  const [auditReport, setAuditReport] = useState<WcagAuditReport | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');

  // Preload Wasm binary on mount
  useEffect(() => {
    initWasmEngine().catch((err) => {
      console.error('Wasm preload warning:', err);
    });
  }, []);

  // Apply accessibility settings to documentElement
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', a11ySettings.theme === 'dark');
    root.classList.toggle('a11y-high-contrast', a11ySettings.highContrast);
    root.classList.toggle('a11y-spacing', a11ySettings.dyslexiaSpacing);
    root.classList.toggle('a11y-reduce-motion', a11ySettings.reducedMotion);
    root.classList.toggle('a11y-focus-enhanced', a11ySettings.enhancedFocus);
    root.style.setProperty('--a11y-font-scale', String(a11ySettings.fontScale));
    localStorage.setItem(STORAGE_KEYS.a11y, JSON.stringify(a11ySettings));
  }, [a11ySettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.completedLessons, JSON.stringify(completedLessons));
  }, [completedLessons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.attempts, JSON.stringify(quizAttempts));
  }, [quizAttempts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.customCourses, JSON.stringify(customCourses));
  }, [customCourses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.lessonStreak, JSON.stringify(streakState));
  }, [streakState]);

  const achievementSummary = computeAchievementSummary(
    allCourses,
    completedLessons,
    quizAttempts,
    streakState.current,
    streakState.best
  );

  const announce = useCallback((msg: string) => {
    setAnnouncement('');
    requestAnimationFrame(() => {
      setAnnouncement(msg);
    });
  }, []);

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: a11ySettings.reducedMotion ? 'auto' : 'smooth' });
    const labels: Record<AppView, string> = {
      dashboard: 'Dashboard',
      courses: 'Courses',
      quizzes: 'Quizzes',
      lab: 'Wasm and Mobile Lab',
      accessibility: 'Accessibility and WCAG Validator',
    };
    announce(`Navigated to ${labels[view]}`);
  };

  const handleRunWcagAudit = useCallback(() => {
    requestAnimationFrame(() => {
      const report = runLiveWcagDomAudit();
      setAuditReport(report);
      setActiveView('accessibility');
      announce(
        `WCAG audit complete: ${report.complianceRate} percent pass across ${report.totalElementsScanned} DOM elements.`
      );
    });
  }, [announce]);

  const handleToggleLesson = (lessonId: string) => {
    const exists = completedLessons.includes(lessonId);
    const nextLessons = exists
      ? completedLessons.filter((id) => id !== lessonId)
      : [...completedLessons, lessonId];

    const nextStreak = exists
      ? { current: 0, best: streakState.best }
      : {
          current: streakState.current + 1,
          best: Math.max(streakState.best, streakState.current + 1),
        };

    const nextSummary = computeAchievementSummary(
      allCourses,
      nextLessons,
      quizAttempts,
      nextStreak.current,
      nextStreak.best
    );
    const newlyUnlocked = nextSummary.badges.filter(
      (b) => b.unlocked && !achievementSummary.badges.find((prevB) => prevB.id === b.id)?.unlocked
    );

    setCompletedLessons(nextLessons);
    setStreakState(nextStreak);

    if (newlyUnlocked.length > 0) {
      const names = newlyUnlocked.map((b) => `${b.title} (+${b.tokenReward} tokens)`).join(', ');
      announce(`Lesson marked complete. Achievement badge unlocked: ${names}.`);
    } else {
      announce(exists ? 'Lesson marked incomplete. Consecutive streak reset.' : 'Lesson marked complete.');
    }
  };

  const handleAddCourse = (course: Course) => {
    setCustomCourses((prev) => [...prev, course]);
    announce(`Added course ${course.title} to curriculum.`);
  };

  const handleResetProgress = () => {
    setCompletedLessons([]);
    setQuizAttempts([]);
    setStreakState({ current: 0, best: 0 });
    announce('Learning progress, streak, and quiz history reset for this session.');
  };

  const navItems: Array<{ id: AppView; label: string; shortLabel: string; icon: React.ReactNode }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Home',
      icon: <LayoutDashboard className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'courses',
      label: 'Courses',
      shortLabel: 'Courses',
      icon: <BookOpen className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'quizzes',
      label: 'Quizzes',
      shortLabel: 'Quizzes',
      icon: <ClipboardCheck className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'lab',
      label: 'Wasm Lab',
      shortLabel: 'Lab',
      icon: <Cpu className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: 'accessibility',
      label: 'Accessibility',
      shortLabel: 'A11y',
      icon: <Accessibility className="w-5 h-5" aria-hidden="true" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      {/* WCAG 2.4.1 Bypass Block Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global Screen Reader Live Announcer */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Desktop Top Bar (3-Zone Contract) & Compact Mobile Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[52px] md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Title (single line, no subtitle/badge) */}
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 min-h-[44px] inline-flex items-center"
          >
            AccessiLearn Wasm
          </button>

          {/* Zone 2: 5 concise nav links (desktop) */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`min-h-[44px] px-1 inline-flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-blue-700 dark:border-blue-400 text-slate-900 dark:text-slate-50 font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleRunWcagAudit}
              className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Run WCAG Audit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24 md:pb-12 focus:outline-none"
      >
        {activeView === 'dashboard' && (
          <DashboardView
            courses={allCourses}
            quizzes={QUIZZES}
            completedLessons={completedLessons}
            quizAttempts={quizAttempts}
            benchmarks={benchmarks}
            auditReport={auditReport}
            a11ySettings={a11ySettings}
            achievements={achievementSummary}
            onNavigate={handleNavigate}
            onOpenCourse={(courseId) => {
              setSelectedCourseId(courseId);
              handleNavigate('courses');
            }}
            onOpenQuiz={(quizId) => {
              setSelectedQuizId(quizId);
              handleNavigate('quizzes');
            }}
            onRunAudit={handleRunWcagAudit}
          />
        )}

        {activeView === 'courses' && (
          <CoursesView
            courses={allCourses}
            selectedCourseId={selectedCourseId}
            completedLessons={completedLessons}
            onSelectCourse={setSelectedCourseId}
            onToggleLessonComplete={handleToggleLesson}
            onAddCourse={handleAddCourse}
            onResetProgress={handleResetProgress}
            onLaunchQuiz={(quizId) => {
              setSelectedQuizId(quizId);
              handleNavigate('quizzes');
            }}
          />
        )}

        {activeView === 'quizzes' && (
          <QuizView
            quizzes={QUIZZES}
            selectedQuizId={selectedQuizId}
            onSelectQuiz={setSelectedQuizId}
            onRecordAttempt={(attempt) => {
              const nextAttempts = [attempt, ...quizAttempts];
              const nextSummary = computeAchievementSummary(
                allCourses,
                completedLessons,
                nextAttempts,
                streakState.current,
                streakState.best
              );
              const newlyUnlocked = nextSummary.badges.filter(
                (b) =>
                  b.unlocked &&
                  !achievementSummary.badges.find((prevB) => prevB.id === b.id)?.unlocked
              );
              setQuizAttempts(nextAttempts);
              if (newlyUnlocked.length > 0) {
                const names = newlyUnlocked
                  .map((b) => `${b.title} (+${b.tokenReward} tokens)`)
                  .join(', ');
                announce(`Achievement badge unlocked: ${names}.`);
              }
            }}
            onAnnounce={announce}
          />
        )}

        {activeView === 'lab' && (
          <LabView
            benchmarks={benchmarks}
            onAddBenchmark={(run) => setBenchmarks((prev) => [run, ...prev])}
            onAnnounce={announce}
          />
        )}

        {activeView === 'accessibility' && (
          <AccessibilityView
            settings={a11ySettings}
            onUpdateSettings={(patch) =>
              setA11ySettings((prev) => ({ ...prev, ...patch }))
            }
            auditReport={auditReport}
            onRunAudit={handleRunWcagAudit}
            onAnnounce={announce}
          />
        )}
      </main>

      {/* Clean Quiet Footer (Desktop) */}
      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            AccessiLearn Wasm — WCAG 2.2 Accessibility, C-to-WebAssembly Processing & Mobile
            Benchmarking
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('accessibility')}
              className="hover:text-slate-900 dark:hover:text-slate-100 underline min-h-[24px]"
            >
              Accessibility Statement & Audit
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('lab')}
              className="hover:text-slate-900 dark:hover:text-slate-100 underline min-h-[24px]"
            >
              Testing Environment
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Thumb Navigation Bar (64px; total sticky <= 116px < 15% of mobile viewport) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md grid grid-cols-5 items-center px-1"
      >
        {navItems.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-medium whitespace-nowrap ${
                active
                  ? 'text-blue-700 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.icon}
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
