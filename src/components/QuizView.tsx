import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Cpu,
  RotateCcw,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { Quiz, QuizAttempt } from '../types';
import { evaluateQuizWithWasmAndJs, getWasmRuntimeInfo } from '../wasm/wasmEngine';

interface QuizViewProps {
  quizzes: Quiz[];
  selectedQuizId: string;
  onSelectQuiz: (quizId: string) => void;
  onRecordAttempt: (attempt: QuizAttempt) => void;
  onAnnounce: (msg: string) => void;
}

interface EvaluationReport {
  correctCount: number;
  totalWeight: number;
  earnedWeight: number;
  scorePercent: number;
  jsEvalTimeUs: number;
  wasmEvalTimeUs: number;
  parityMatch: boolean;
  totalTimeMs: number;
  avgTimePerQuestionMs: number;
  memoryOffsets: {
    answersPtr: number;
    keysPtr: number;
    weightsPtr: number;
    outStatsPtr: number;
  };
}

export const QuizView: React.FC<QuizViewProps> = ({
  quizzes,
  selectedQuizId,
  onSelectQuiz,
  onRecordAttempt,
  onAnnounce,
}) => {
  const activeQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startedAt, setStartedAt] = useState<number>(() => performance.now());
  const [submitted, setSubmitted] = useState(false);
  const [evalReport, setEvalReport] = useState<EvaluationReport | null>(null);
  const [showCSource, setShowCSource] = useState(false);
  const [cSource, setCSource] = useState<string>('');
  const [wasmMeta, setWasmMeta] = useState(() => getWasmRuntimeInfo());

  useEffect(() => {
    setAnswers({});
    setStartedAt(performance.now());
    setSubmitted(false);
    setEvalReport(null);
  }, [activeQuiz.id]);

  const handleLoadCSource = async () => {
    if (showCSource) {
      setShowCSource(false);
      return;
    }
    setShowCSource(true);
    if (!cSource) {
      try {
        const res = await fetch('/api/wasm/source');
        const data = await res.json();
        setCSource(data.source || 'C source unavailable.');
      } catch {
        setCSource('Failed to load public/wasm/quiz_engine.c.');
      }
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalTimeMs = Math.max(100, Math.round(performance.now() - startedAt));
    const avgTimePerQuestionMs = Math.round(totalTimeMs / activeQuiz.questions.length);

    const ansArr = activeQuiz.questions.map((q) =>
      answers[q.id] !== undefined ? answers[q.id] : -1
    );
    const keyArr = activeQuiz.questions.map((q) => q.correctIndex);
    const weightArr = activeQuiz.questions.map((q) => q.weight);

    const res = await evaluateQuizWithWasmAndJs(ansArr, keyArr, weightArr);
    setWasmMeta(getWasmRuntimeInfo());

    const weakTopics = activeQuiz.questions
      .filter((q, idx) => ansArr[idx] !== q.correctIndex)
      .map((q) => q.topic);

    const report: EvaluationReport = {
      correctCount: res.correctCount,
      totalWeight: res.totalWeight,
      earnedWeight: res.earnedWeight,
      scorePercent: res.scorePercent,
      jsEvalTimeUs: res.jsEvalTimeUs,
      wasmEvalTimeUs: res.wasmEvalTimeUs,
      parityMatch: res.parityMatch,
      totalTimeMs,
      avgTimePerQuestionMs,
      memoryOffsets: res.memoryOffsets,
    };

    setEvalReport(report);
    setSubmitted(true);

    onRecordAttempt({
      id: `attempt-${Date.now()}`,
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      courseId: activeQuiz.courseId,
      timestamp: new Date().toLocaleTimeString(),
      correctCount: res.correctCount,
      totalQuestions: activeQuiz.questions.length,
      earnedWeight: res.earnedWeight,
      totalWeight: res.totalWeight,
      scorePercent: res.scorePercent,
      totalTimeMs,
      avgTimePerQuestionMs,
      wasmEvalTimeUs: res.wasmEvalTimeUs,
      jsEvalTimeUs: res.jsEvalTimeUs,
      engineVerifiedMatch: res.parityMatch,
      weakTopics: Array.from(new Set(weakTopics)),
    });

    onAnnounce(
      `Quiz submitted. Score ${res.scorePercent} percent, ${res.correctCount} of ${activeQuiz.questions.length} correct, evaluated in ${res.wasmEvalTimeUs} microseconds via WebAssembly.`
    );
  };

  const handleRetake = () => {
    setAnswers({});
    setStartedAt(performance.now());
    setSubmitted(false);
    setEvalReport(null);
    onAnnounce(`Reset ${activeQuiz.title}. Ready for new attempt.`);
  };

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === activeQuiz.questions.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 [text-wrap:balance]">
            Accessible Quiz & C-WebAssembly Evaluation
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Keyboard-navigable assessments scored directly in compiled C WebAssembly linear memory
            with live JS parity verification.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadCSource}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Code2 className="w-4 h-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
          <span>{showCSource ? 'Hide quiz_engine.c' : 'Inspect C Source (quiz_engine.c)'}</span>
        </button>
      </div>

      {/* C Source Inspection Panel */}
      {showCSource && (
        <section
          aria-label="WebAssembly C Source Code"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
            <span>public/wasm/quiz_engine.c · Emscripten EMSCRIPTEN_KEEPALIVE Exports</span>
            <span>
              Binary: {wasmMeta.loaded ? `${wasmMeta.binaryBytes} bytes` : 'Loads on quiz submit'}
            </span>
          </div>
          <pre className="text-xs font-mono overflow-x-auto max-h-80 leading-relaxed text-slate-200">
            <code>{cSource || 'Loading C source...'}</code>
          </pre>
        </section>
      )}

      {/* Quiz Selector Tabs */}
      <div
        role="tablist"
        aria-label="Select assessment module"
        className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
      >
        {quizzes.map((quiz) => {
          const active = quiz.id === activeQuiz.id;
          return (
            <button
              key={quiz.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectQuiz(quiz.id)}
              className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {quiz.title}
            </button>
          );
        })}
      </div>

      {/* Evaluation Result & C-Wasm Memory Inspector */}
      {submitted && evalReport && (
        <section
          role="region"
          aria-label="Quiz Evaluation Summary"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Cpu className="w-4 h-4" aria-hidden="true" />
                <span>Scored via C-WebAssembly (`score_single_quiz`)</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                Score: {evalReport.scorePercent}% ({evalReport.correctCount}/
                {activeQuiz.questions.length} correct)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleRetake}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Retake Assessment</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Weighted Points</p>
              <p className="mt-1 text-lg font-bold font-mono text-slate-900 dark:text-slate-50 tabular-nums">
                {evalReport.earnedWeight} / {evalReport.totalWeight}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Wasm Eval Time</p>
              <p className="mt-1 text-lg font-bold font-mono text-blue-700 dark:text-blue-400 tabular-nums">
                {evalReport.wasmEvalTimeUs} µs
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">JS Eval Time</p>
              <p className="mt-1 text-lg font-bold font-mono text-slate-900 dark:text-slate-50 tabular-nums">
                {evalReport.jsEvalTimeUs} µs
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">JS / Wasm Parity</p>
              <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                {evalReport.parityMatch ? 'Exact Match' : 'Mismatch'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-6 gap-y-1">
            <span>ABI v{wasmMeta.abiVersion}</span>
            <span>answersPtr: 0x{evalReport.memoryOffsets.answersPtr.toString(16)}</span>
            <span>keysPtr: 0x{evalReport.memoryOffsets.keysPtr.toString(16)}</span>
            <span>weightsPtr: 0x{evalReport.memoryOffsets.weightsPtr.toString(16)}</span>
            <span>outStatsPtr: 0x{evalReport.memoryOffsets.outStatsPtr.toString(16)}</span>
          </div>
        </section>
      )}

      {/* Quiz Questions Form */}
      <form onSubmit={handleSubmitQuiz} className="space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 tabular-nums">
          <span>
            {activeQuiz.category} · {activeQuiz.questions.length} weighted questions
          </span>
          <span>
            Answered {answeredCount} of {activeQuiz.questions.length}
          </span>
        </div>

        <ol className="space-y-6">
          {activeQuiz.questions.map((q, qIdx) => {
            const chosen = answers[q.id];
            const isCorrect = submitted && chosen === q.correctIndex;

            return (
              <li
                key={q.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
              >
                <fieldset className="space-y-4">
                  <legend className="w-full space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Question {qIdx + 1} · {q.topic}
                      </span>
                      <span className="font-mono tabular-nums">Weight: {q.weight} pts</span>
                    </div>
                    <p className="text-base font-semibold text-slate-900 dark:text-slate-50 leading-snug">
                      {q.prompt}
                    </p>
                  </legend>

                  <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label={q.prompt}>
                    {q.options.map((opt, oIdx) => {
                      const isChecked = chosen === oIdx;
                      const isRightOption = submitted && oIdx === q.correctIndex;
                      const isWrongSelected = submitted && isChecked && oIdx !== q.correctIndex;

                      let borderStyle =
                        'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-900 dark:text-slate-100';

                      if (isRightOption) {
                        borderStyle =
                          'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100';
                      } else if (isWrongSelected) {
                        borderStyle =
                          'border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-100';
                      } else if (isChecked) {
                        borderStyle =
                          'border-blue-700 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 ring-1 ring-blue-700 dark:ring-blue-500';
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          role="radio"
                          aria-checked={isChecked}
                          disabled={submitted}
                          onClick={() => handleSelectOption(q.id, oIdx)}
                          className={`min-h-[48px] w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-between gap-3 ${borderStyle}`}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? 'border-blue-700 dark:border-blue-400 bg-blue-700 dark:bg-blue-400'
                                  : 'border-slate-400 dark:border-slate-600'
                              }`}
                            >
                              {isChecked && <span className="w-2 h-2 rounded-full bg-white dark:bg-slate-950" />}
                            </span>
                            <span>{opt}</span>
                          </span>

                          {isRightOption && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                              <span>Correct</span>
                            </span>
                          )}
                          {isWrongSelected && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-300 shrink-0">
                              <XCircle className="w-4 h-4" aria-hidden="true" />
                              <span>Selected</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {submitted && (
                  <div
                    className={`pt-3 border-t border-slate-100 dark:border-slate-800 text-xs leading-relaxed ${
                      isCorrect
                        ? 'text-emerald-800 dark:text-emerald-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-semibold">
                      {isCorrect ? 'Verified Correct: ' : 'Explanation: '}
                    </span>
                    {q.explanation}
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        {!submitted && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {allAnswered
                ? 'All questions answered. Ready to process inside C-WebAssembly linear memory.'
                : `Select options for all ${activeQuiz.questions.length} questions (${answeredCount} selected).`}
            </p>
            <button
              type="submit"
              disabled={!allAnswered}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Submit & Evaluate in WebAssembly</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
