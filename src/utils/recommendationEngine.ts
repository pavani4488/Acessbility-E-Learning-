import { Course, Quiz, QuizAttempt, RuleRecommendation } from '../types';

/**
 * Deterministic client-side rule engine.
 * Explicitly distinct from the server-side Gemini generative AI recommendation engine.
 */
export function generateRuleBasedRecommendations(
  courses: Course[],
  quizzes: Quiz[],
  completedLessonIds: string[],
  quizAttempts: QuizAttempt[]
): RuleRecommendation[] {
  const recs: RuleRecommendation[] = [];

  // Rule 1: Any quiz attempt below 75% triggers remedial lesson review
  for (const attempt of quizAttempts) {
    if (attempt.scorePercent < 75) {
      const course = courses.find((c) => c.id === attempt.courseId);
      if (course) {
        recs.push({
          id: `rule-remedial-${attempt.id}`,
          ruleCode: 'RULE_SCORE_THRESHOLD_75',
          ruleCondition: `scorePercent (${attempt.scorePercent}%) < 75%`,
          targetId: course.id,
          targetType: 'course',
          title: `Review ${course.title}`,
          priority: 'High',
          rationale: `Latest assessment score of ${attempt.scorePercent}% is below the 75% mastery threshold${
            attempt.weakTopics.length > 0 ? ` (missed: ${attempt.weakTopics.join(', ')})` : ''
          }.`,
        });
      }
    }
  }

  // Rule 2: Completed all lessons in a course, but quiz not yet attempted
  for (const course of courses) {
    const allDone = course.lessons.every((l) => completedLessonIds.includes(l.id));
    const attempted = quizAttempts.some((a) => a.quizId === course.quizId);
    if (allDone && !attempted) {
      const quiz = quizzes.find((q) => q.id === course.quizId);
      if (quiz) {
        recs.push({
          id: `rule-ready-${quiz.id}`,
          ruleCode: 'RULE_COURSE_COMPLETE_QUIZ_PENDING',
          ruleCondition: `completedLessons == ${course.lessons.length}/${course.lessons.length} AND attempts == 0`,
          targetId: quiz.id,
          targetType: 'quiz',
          title: `Take ${quiz.title}`,
          priority: 'High',
          rationale: `All ${course.lessons.length} lessons in ${course.title} are complete, but the verification assessment has not been taken yet.`,
        });
      }
    }
  }

  // Rule 3: Pacing rule — slow average response time (> 18s/question) with passing score
  for (const attempt of quizAttempts) {
    if (attempt.scorePercent >= 75 && attempt.avgTimePerQuestionMs > 18000) {
      recs.push({
        id: `rule-pacing-${attempt.id}`,
        ruleCode: 'RULE_PACING_FLUENCY_18S',
        ruleCondition: `avgTimePerQuestionMs (${Math.round(attempt.avgTimePerQuestionMs / 1000)}s) > 18s`,
        targetId: attempt.quizId,
        targetType: 'quiz',
        title: `Fluency Retake: ${attempt.quizTitle}`,
        priority: 'Medium',
        rationale: `Accuracy is solid (${attempt.scorePercent}%), while average question time (${(
          attempt.avgTimePerQuestionMs / 1000
        ).toFixed(1)}s) exceeded the 18s fluency benchmark.`,
      });
    }
  }

  // Rule 4: Unstarted courses
  for (const course of courses) {
    const started = course.lessons.some((l) => completedLessonIds.includes(l.id));
    if (!started && recs.length < 4) {
      recs.push({
        id: `rule-next-${course.id}`,
        ruleCode: 'RULE_UNSTARTED_CURRICULUM',
        ruleCondition: `completedLessonsInCourse == 0`,
        targetId: course.id,
        targetType: 'course',
        title: `Start ${course.title}`,
        priority: 'Next Step',
        rationale: `0 of ${course.lessons.length} lessons completed in ${course.category}. Recommended next module in sequence.`,
      });
    }
  }

  // Deduplicate by targetId while preserving highest priority
  const seen = new Set<string>();
  const unique: RuleRecommendation[] = [];
  for (const r of recs) {
    if (!seen.has(`${r.targetType}:${r.targetId}`)) {
      seen.add(`${r.targetType}:${r.targetId}`);
      unique.push(r);
    }
  }

  return unique.slice(0, 3);
}
