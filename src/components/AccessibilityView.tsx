import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Monitor,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  Type as TypeIcon,
  Volume2,
  XCircle,
} from 'lucide-react';
import { AccessibilitySettings, WcagAuditReport } from '../types';

interface AccessibilityViewProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (patch: Partial<AccessibilitySettings>) => void;
  auditReport: WcagAuditReport | null;
  onRunAudit: () => void;
  onAnnounce: (msg: string) => void;
}

export const AccessibilityView: React.FC<AccessibilityViewProps> = ({
  settings,
  onUpdateSettings,
  auditReport,
  onRunAudit,
  onAnnounce,
}) => {
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [testAnnouncement, setTestAnnouncement] = useState(
    'Screen reader check: WCAG 2.2 live region announcement confirmed.'
  );

  const fontScales: Array<{ value: AccessibilitySettings['fontScale']; label: string }> = [
    { value: 1, label: '100% (16px)' },
    { value: 1.15, label: '115% (18.4px)' },
    { value: 1.3, label: '130% (20.8px)' },
    { value: 1.5, label: '150% (24px)' },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 [text-wrap:balance]">
            Accessibility Settings & Live WCAG 2.2 Validator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure persistent visual, motor, and screen-reader adaptations and audit the live
            rendered DOM against WCAG 2.2 criteria.
          </p>
        </div>

        <button
          type="button"
          onClick={onRunAudit}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Run Live DOM Audit</span>
        </button>
      </div>

      {/* Module 5: Accessibility Controls */}
      <section
        aria-labelledby="a11y-settings-heading"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6"
      >
        <div className="space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="a11y-settings-heading"
            className="text-lg font-bold text-slate-900 dark:text-slate-50"
          >
            Adaptive Interface Preferences
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Changes apply immediately across the entire e-learning workspace and persist in local
            browser storage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Mode */}
          <div className="space-y-2.5">
            <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Color Theme
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                aria-pressed={settings.theme === 'light'}
                onClick={() => {
                  onUpdateSettings({ theme: 'light' });
                  onAnnounce('Switched to Light color theme.');
                }}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-2 ${
                  settings.theme === 'light'
                    ? 'border-blue-700 bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4" aria-hidden="true" />
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                aria-pressed={settings.theme === 'dark'}
                onClick={() => {
                  onUpdateSettings({ theme: 'dark' });
                  onAnnounce('Switched to Dark color theme.');
                }}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-2 ${
                  settings.theme === 'dark'
                    ? 'border-blue-500 bg-blue-950/60 text-blue-200'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4" aria-hidden="true" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Font Scaling */}
          <div className="space-y-2.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <TypeIcon className="w-4 h-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
              <span>Global Text Size Scaling</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fontScales.map((fs) => {
                const active = settings.fontScale === fs.value;
                return (
                  <button
                    key={fs.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      onUpdateSettings({ fontScale: fs.value });
                      onAnnounce(`Text size set to ${fs.label}.`);
                    }}
                    className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-xs font-semibold tabular-nums ${
                      active
                        ? 'border-blue-700 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100'
                        : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {fs.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {[
            {
              key: 'highContrast' as const,
              title: 'High Contrast Mode (AAA)',
              desc: 'Maximizes foreground-to-canvas contrast for low-vision legibility.',
              value: settings.highContrast,
            },
            {
              key: 'dyslexiaSpacing' as const,
              title: 'Readable Spacing Boost',
              desc: 'Increases letter spacing, word spacing, and 1.75 line height.',
              value: settings.dyslexiaSpacing,
            },
            {
              key: 'reducedMotion' as const,
              title: 'Reduce Motion',
              desc: 'Disables non-essential animations and transitions globally.',
              value: settings.reducedMotion,
            },
            {
              key: 'enhancedFocus' as const,
              title: 'Enhanced Focus Ring (3px)',
              desc: 'Applies high-visibility focus rings and halo outlines on Tab focus.',
              value: settings.enhancedFocus,
            },
          ].map((toggle) => (
            <button
              key={toggle.key}
              type="button"
              role="switch"
              aria-checked={toggle.value}
              onClick={() => {
                onUpdateSettings({ [toggle.key]: !toggle.value });
                onAnnounce(`${toggle.title} ${!toggle.value ? 'enabled' : 'disabled'}.`);
              }}
              className="min-h-[60px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-center justify-between gap-4"
            >
              <div className="space-y-0.5">
                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {toggle.title}
                </span>
                <span className="block text-xs text-slate-600 dark:text-slate-400">
                  {toggle.desc}
                </span>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold shrink-0 ${
                  toggle.value
                    ? 'bg-blue-700 text-white dark:bg-blue-500'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {toggle.value ? 'ON' : 'OFF'}
              </span>
            </button>
          ))}
        </div>

        {/* Screen Reader Live Region Tester */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="sr-test-input"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <Volume2 className="w-4 h-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
              <span>Screen Reader Live Region Tester (aria-live="polite")</span>
            </label>
            <input
              id="sr-test-input"
              type="text"
              value={testAnnouncement}
              onChange={(e) => setTestAnnouncement(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="button"
            onClick={() => onAnnounce(testAnnouncement)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-xs font-semibold whitespace-nowrap shrink-0"
          >
            Dispatch Announcement
          </button>
        </div>
      </section>

      {/* Module 6: Live WCAG DOM Accessibility Validation */}
      <section
        aria-labelledby="wcag-validator-heading"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Real-Time Browser DOM Inspector</span>
            </div>
            <h2
              id="wcag-validator-heading"
              className="text-lg font-bold text-slate-900 dark:text-slate-50"
            >
              WCAG 2.2 Compliance Validation Report
            </h2>
          </div>

          {auditReport && (
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
              <span>Scanned: {auditReport.totalElementsScanned} nodes</span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                {auditReport.complianceRate}% Pass
              </span>
            </div>
          )}
        </div>

        {!auditReport ? (
          <div className="py-6 text-sm text-slate-600 dark:text-slate-400">
            Click <strong>Run Live DOM Audit</strong> to inspect contrast ratios, image alt text,
            accessible names, landmark structure, and touch hitboxes on the active DOM.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Passed Criteria</p>
                <p className="mt-1 text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {auditReport.passedChecks}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Warnings</p>
                <p className="mt-1 text-xl font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
                  {auditReport.warningChecks}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Failures</p>
                <p className="mt-1 text-xl font-bold font-mono text-red-700 dark:text-red-400 tabular-nums">
                  {auditReport.failedChecks}
                </p>
              </div>
            </div>

            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {auditReport.checks.map((check) => {
                const isExpanded = expandedCheckId === check.id;
                return (
                  <li key={check.id} className="py-4 first:pt-2 last:pb-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <span>WCAG {check.criterion}</span>
                          <span aria-hidden="true">·</span>
                          <span>Level {check.level}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                          {check.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {check.measuredSummary}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            check.status === 'Pass'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : check.status === 'Warning'
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-red-700 dark:text-red-400'
                          }`}
                        >
                          {check.status === 'Pass' && (
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          )}
                          {check.status === 'Warning' && (
                            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                          )}
                          {check.status === 'Fail' && (
                            <XCircle className="w-4 h-4" aria-hidden="true" />
                          )}
                          <span>
                            {check.status} ({check.issueCount} issues)
                          </span>
                        </span>

                        {check.issues.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCheckId(isExpanded ? null : check.id)
                            }
                            aria-expanded={isExpanded}
                            className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isExpanded ? 'Hide Details' : 'Inspect'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && check.issues.length > 0 && (
                      <ul className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                        {check.issues.map((issue, idx) => (
                          <li
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono"
                          >
                            <span className="text-slate-800 dark:text-slate-200 truncate">
                              {issue.selector} — {issue.detail}
                            </span>
                            <span className="text-amber-700 dark:text-amber-400 font-semibold shrink-0">
                              {issue.measuredValue}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
};
