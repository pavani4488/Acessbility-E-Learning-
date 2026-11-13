import { AchievementBadge, AchievementSummary, Course, QuizAttempt } from '../types';

export function computeAchievementSummary(
  courses: Course[],
  completedLessons: string[],
  quizAttempts: QuizAttempt[],
  currentLessonStreak: number,
  bestLessonStreak: number
): AchievementSummary {
  const effectiveBestStreak = Math.max(bestLessonStreak, currentLessonStreak, completedLessons.length > 0 ? 1 : 0);
  const completedCoursesCount = courses.filter(
    (c) => c.lessons.length > 0 && c.lessons.every((l) => completedLessons.includes(l.id))
  ).length;

  const perfectQuizzes = new Set(
    quizAttempts.filter((a) => a.scorePercent === 100).map((a) => a.quizId)
  );
  const perfectQuizCount = perfectQuizzes.size;

  const badges: AchievementBadge[] = [
    {
      id: 'badge-first-lesson',
      title: 'First Lesson Momentum',
      criteriaLabel: 'Complete 1 lesson',
      description: 'Awarded for completing your opening accessibility or WebAssembly lesson.',
      tokenReward: 25,
      unlocked: completedLessons.length >= 1,
      progressCurrent: Math.min(1, completedLessons.length),
      progressTarget: 1,
      category: 'completion',
      actionHint: { label: 'Browse Courses', targetView: 'courses' },
    },
    {
      id: 'badge-streak-3',
      title: 'Triple Lesson Streak',
      criteriaLabel: 'Complete 3 lessons in a row',
      description: 'Complete 3 consecutive lessons without breaking your study sequence.',
      tokenReward: 75,
      unlocked: effectiveBestStreak >= 3,
      progressCurrent: Math.min(3, effectiveBestStreak),
      progressTarget: 3,
      category: 'streak',
      actionHint: { label: 'Continue Lessons', targetView: 'courses' },
    },
    {
      id: 'badge-streak-6',
      title: 'Sustained Study Streak',
      criteriaLabel: 'Complete 6 lessons in a row',
      description: 'Maintain focus across 6 consecutive curriculum lessons.',
      tokenReward: 150,
      unlocked: effectiveBestStreak >= 6,
      progressCurrent: Math.min(6, effectiveBestStreak),
      progressTarget: 6,
      category: 'streak',
      actionHint: { label: 'Continue Lessons', targetView: 'courses' },
    },
    {
      id: 'badge-course-finisher',
      title: 'Module Completer',
      criteriaLabel: 'Finish all lessons in a course',
      description: 'Complete every lesson inside any curriculum course track.',
      tokenReward: 100,
      unlocked: completedCoursesCount >= 1,
      progressCurrent: Math.min(1, completedCoursesCount),
      progressTarget: 1,
      category: 'completion',
      actionHint: { label: 'View Courses', targetView: 'courses' },
    },
    {
      id: 'badge-quiz-100',
      title: '100% Quiz Precision',
      criteriaLabel: 'Score 100% on a quiz',
      description: 'Achieve a verified 100% score evaluated by the C-WebAssembly scoring engine.',
      tokenReward: 120,
      unlocked: perfectQuizCount >= 1,
      progressCurrent: Math.min(1, perfectQuizCount),
      progressTarget: 1,
      category: 'mastery',
      actionHint: { label: 'Take Assessment', targetView: 'quizzes' },
    },
    {
      id: 'badge-double-100',
      title: 'Dual Assessment Mastery',
      criteriaLabel: 'Score 100% on 2 distinct quizzes',
      description: 'Demonstrate full mastery across two separate accessibility or systems quizzes.',
      tokenReward: 200,
      unlocked: perfectQuizCount >= 2,
      progressCurrent: Math.min(2, perfectQuizCount),
      progressTarget: 2,
      category: 'mastery',
      actionHint: { label: 'Take Assessment', targetView: 'quizzes' },
    },
  ];

  const totalTokens = badges
    .filter((b) => b.unlocked)
    .reduce((sum, b) => sum + b.tokenReward, 0);
  const maxPossibleTokens = badges.reduce((sum, b) => sum + b.tokenReward, 0);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return {
    totalTokens,
    maxPossibleTokens,
    unlockedCount,
    totalBadges: badges.length,
    currentLessonStreak: Math.max(currentLessonStreak, completedLessons.length > 0 ? 1 : 0),
    bestLessonStreak: effectiveBestStreak,
    perfectQuizCount,
    badges,
  };
}
