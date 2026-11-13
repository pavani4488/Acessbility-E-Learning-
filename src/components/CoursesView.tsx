import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Plus,
  RotateCcw,
  Search,
  BookOpen,
} from 'lucide-react';
import { Course } from '../types';

interface CoursesViewProps {
  courses: Course[];
  selectedCourseId: string;
  completedLessons: string[];
  onSelectCourse: (courseId: string) => void;
  onToggleLessonComplete: (lessonId: string) => void;
  onAddCourse: (course: Course) => void;
  onResetProgress: () => void;
  onLaunchQuiz: (quizId: string) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  selectedCourseId,
  completedLessons,
  onSelectCourse,
  onToggleLessonComplete,
  onAddCourse,
  onResetProgress,
  onLaunchQuiz,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Course creation form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Accessibility Standards');
  const [newLevel, setNewLevel] = useState<'Foundation' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonSummary, setNewLessonSummary] = useState('');

  const categories = ['All', ...Array.from(new Set(courses.map((c) => c.category)))];

  const filteredCourses = courses.filter((c) => {
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const activeCourse =
    courses.find((c) => c.id === selectedCourseId) || filteredCourses[0] || courses[0];

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLessonTitle.trim()) return;

    const id = `custom-${Date.now()}`;
    const created: Course = {
      id,
      title: newTitle.trim(),
      category: newCategory,
      level: newLevel,
      estimatedMinutes: 20,
      imageUrl: '/src/assets/images/course_wcag_essentials_1794581605405.jpg',
      imageAlt: `Geometric educational cover graphic for ${newTitle.trim()}.`,
      description:
        newLessonSummary.trim() ||
        'Custom study module created in the interactive Course Management workspace.',
      quizId: 'quiz-wcag',
      lessons: [
        {
          id: `${id}-l1`,
          title: newLessonTitle.trim(),
          durationMin: 20,
          summary:
            newLessonSummary.trim() ||
            'Custom learning objective focusing on accessible implementation and runtime verification.',
          keyTakeaways: [
            'Validate semantic landmarks and keyboard tab navigation.',
            'Verify performance and contrast thresholds across mobile viewports.',
          ],
        },
      ],
    };

    onAddCourse(created);
    onSelectCourse(created.id);
    setNewTitle('');
    setNewLessonTitle('');
    setNewLessonSummary('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 [text-wrap:balance]">
            Course Management & Interactive Lessons
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Browse, filter, add custom study modules, and track lesson completions with accessible
            keyboard and screen-reader semantics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{showAddForm ? 'Close New Course Form' : 'Add Study Module'}</span>
          </button>
          <button
            type="button"
            onClick={onResetProgress}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Reset Progress</span>
          </button>
        </div>
      </div>

      {/* Add Course Form (Session Course Management) */}
      {showAddForm && (
        <form
          onSubmit={handleCreateCourse}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
            Create Session Study Module
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-course-title"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Course Title (required)
              </label>
              <input
                id="new-course-title"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. ARIA Grids & Focus Management"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-course-category"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Category
              </label>
              <select
                id="new-course-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="Accessibility Standards">Accessibility Standards</option>
                <option value="Systems Performance">Systems Performance</option>
                <option value="Mobile Engineering">Mobile Engineering</option>
                <option value="Adaptive Systems">Adaptive Systems</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-course-level"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Difficulty Level
              </label>
              <select
                id="new-course-level"
                value={newLevel}
                onChange={(e) =>
                  setNewLevel(e.target.value as 'Foundation' | 'Intermediate' | 'Advanced')
                }
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="Foundation">Foundation</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="new-lesson-title"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Initial Lesson Title (required)
              </label>
              <input
                id="new-lesson-title"
                type="text"
                required
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
                placeholder="e.g. Roving Tabindex Pattern"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-lesson-summary"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Lesson Summary
              </label>
              <input
                id="new-lesson-summary"
                type="text"
                value={newLessonSummary}
                onChange={(e) => setNewLessonSummary(e.target.value)}
                placeholder="Concise summary of learning objective"
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold"
            >
              Save Module to Catalog
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Filter courses by category"
          className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
        >
          {categories.map((cat) => {
            const active = categoryFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategoryFilter(cat)}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <label htmlFor="course-search" className="sr-only">
            Search courses
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="course-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter courses by topic..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Main Split: Course Cards + Active Lesson Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Course Catalog Column */}
        <div className="lg:col-span-5 space-y-4">
          {filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center space-y-2">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                No courses match "{searchQuery}"
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('All');
                  setSearchQuery('');
                }}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-blue-700 dark:text-blue-400 underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredCourses.map((course) => {
              const isSelected = activeCourse?.id === course.id;
              const doneCount = course.lessons.filter((l) =>
                completedLessons.includes(l.id)
              ).length;
              return (
                <article
                  key={course.id}
                  className={`rounded-2xl border transition-colors bg-white dark:bg-slate-900 overflow-hidden ${
                    isSelected
                      ? 'border-blue-700 dark:border-blue-500 ring-1 ring-blue-700 dark:ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course.id)}
                    className="w-full text-left p-5 space-y-3 focus-visible:outline-none"
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={course.imageUrl}
                        alt={course.imageAlt}
                        referrerPolicy="no-referrer"
                        className="w-20 h-16 rounded-lg object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <span>{course.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{course.level}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{course.estimatedMinutes} min</span>
                        </div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-snug">
                          {course.title}
                        </h2>
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                          {doneCount} / {course.lessons.length} lessons completed
                        </p>
                      </div>
                    </div>
                  </button>
                </article>
              );
            })
          )}
        </div>

        {/* Active Course Lesson Reader */}
        {activeCourse && (
          <section
            aria-label={`Course content for ${activeCourse.title}`}
            className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
          >
            <div className="aspect-[16/7] w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
              <img
                src={activeCourse.imageUrl}
                alt={activeCourse.imageAlt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent flex items-end p-6">
                <div className="space-y-1 text-white">
                  <div className="text-xs text-slate-200 flex items-center gap-2">
                    <span>{activeCourse.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeCourse.level}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{activeCourse.estimatedMinutes} min</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold">{activeCourse.title}</h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeCourse.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
                  <span>Module Lessons ({activeCourse.lessons.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchQuiz(activeCourse.quizId)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>Take Course Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <ol className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeCourse.lessons.map((lesson, idx) => {
                  const isDone = completedLessons.includes(lesson.id);
                  return (
                    <li key={lesson.id} className="py-5 first:pt-1 last:pb-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            Lesson 0{idx + 1} · {lesson.durationMin} min
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                            {lesson.title}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleLessonComplete(lesson.id)}
                          aria-pressed={isDone}
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 border transition-colors ${
                            isDone
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Circle className="w-4 h-4" aria-hidden="true" />
                          )}
                          <span>{isDone ? 'Completed' : 'Mark Complete'}</span>
                        </button>
                      </div>

                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {lesson.summary}
                      </p>

                      <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        {lesson.keyTakeaways.map((tip, tIdx) => (
                          <li key={tIdx}>{tip}</li>
                        ))}
                      </ul>

                      {lesson.codeExample && (
                        <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                          <code>{lesson.codeExample}</code>
                        </pre>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
