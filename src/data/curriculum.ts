import { Course, Quiz } from '../types';

export const COURSES: Course[] = [
  {
    id: 'wcag-engineering',
    title: 'WCAG 2.2 Accessibility Engineering',
    category: 'Accessibility Standards',
    level: 'Foundation',
    estimatedMinutes: 35,
    imageUrl: '/src/assets/images/course_wcag_essentials_1794581605405.jpg',
    imageAlt:
      'Layered paper-cut geometric diagram illustrating web layout contrast grids, typography hierarchy, and touch selection guides.',
    description:
      'Build keyboard-navigable, screen-reader-ready mobile and desktop interfaces conforming to WCAG 2.2 AA/AAA contrast, focus, and semantic landmark rules.',
    quizId: 'quiz-wcag',
    lessons: [
      {
        id: 'wcag-l1',
        title: 'Semantic Landmarks & Keyboard Navigation',
        durationMin: 10,
        summary:
          'Structure documents with single-purpose landmarks (<header>, <nav>, <main>, <footer>), logical tab order, and bypass skip links so assistive technology users navigate without friction.',
        keyTakeaways: [
          'Provide a visible-on-focus skip link as the first focusable DOM node.',
          'Never use positive tabindex values (> 0); rely on native DOM order and <button>/<a> elements.',
          'Use ARIA live regions (aria-live="polite") to announce dynamic quiz feedback and route transitions.',
        ],
        codeExample: `<a href="#main-content" class="skip-link">Skip to main content</a>
<main id="main-content" tabindex="-1">
  <div role="status" aria-live="polite">Score processed in 0.14 ms</div>
</main>`,
      },
      {
        id: 'wcag-l2',
        title: 'Color Contrast Math & Dual-Coded States',
        durationMin: 12,
        summary:
          'Calculate sRGB relative luminance to enforce 4.5:1 body text contrast (AA) and 7:1 enhanced contrast (AAA), while pairing every status color with explicit text labels or icons.',
        keyTakeaways: [
          'Relative luminance formula: L = 0.2126*R + 0.7152*G + 0.0722*B after gamma linearization.',
          'Contrast ratio = (L_lighter + 0.05) / (L_darker + 0.05), yielding values from 1:1 to 21:1.',
          'Never signal pass/fail or warning states via hue alone—always include text and icon glyphs.',
        ],
      },
      {
        id: 'wcag-l3',
        title: 'Typography Scaling & Focus Visibility',
        durationMin: 13,
        summary:
          'Ensure layouts remain unbroken up to 150%-200% text scaling using relative rem units, flexible CSS grids, and high-contrast :focus-visible outlines.',
        keyTakeaways: [
          'Use rem units on root typography so user font-size scaling propagates cleanly.',
          'Enforce WCAG 2.4.7 / 2.4.11 visible focus indicators with >= 3:1 adjacent contrast.',
          'Respect prefers-reduced-motion media queries and provide an explicit user override.',
        ],
      },
    ],
  },
  {
    id: 'wasm-performance',
    title: 'WebAssembly & C Memory Optimization',
    category: 'Systems Performance',
    level: 'Intermediate',
    estimatedMinutes: 40,
    imageUrl: '/src/assets/images/course_wasm_systems_1794581605829.jpg',
    imageAlt:
      'Isometric technical rendering of interlocking metallic WebAssembly compute modules and structured linear memory arrays.',
    description:
      'Compile performance-critical C scoring pipelines to WebAssembly via Emscripten, eliminate GC pauses, and pass typed arrays across zero-copy linear memory.',
    quizId: 'quiz-wasm',
    lessons: [
      {
        id: 'wasm-l1',
        title: 'Emscripten Compilation & Exported C ABI',
        durationMin: 14,
        summary:
          'Mark C functions with EMSCRIPTEN_KEEPALIVE and compile with -O3 to emit compact, deterministic WebAssembly binaries with predictable integer and floating-point throughput.',
        keyTakeaways: [
          'Use fixed-width C types (int32_t, int64_t) for deterministic memory layout across architectures.',
          'Compile with -O3 and explicit EXPORTED_FUNCTIONS to minimize binary footprint for mobile networks.',
          'Use WebAssembly.instantiateStreaming when serving .wasm with application/wasm MIME type.',
        ],
        codeExample: `EMSCRIPTEN_KEEPALIVE
int32_t score_single_quiz(const int32_t* ans, const int32_t* keys,
                          const int32_t* weights, int32_t count, int32_t* out);`,
      },
      {
        id: 'wasm-l2',
        title: 'Zero-Copy Linear Memory & GC Avoidance',
        durationMin: 14,
        summary:
          'Avoid per-object JavaScript heap allocations when processing large student quiz batches by writing typed Int32Array views directly into WebAssembly linear memory.',
        keyTakeaways: [
          'Each WebAssembly memory page equals 64 KiB (65,536 bytes).',
          'Reusing pre-allocated offsets inside WebAssembly.Memory eliminates garbage collection spikes.',
          'Minimize JS-to-Wasm boundary crossings by batching arrays into a single C loop invocation.',
        ],
      },
      {
        id: 'wasm-l3',
        title: 'Main-Thread Responsiveness & Frame Budgets',
        durationMin: 12,
        summary:
          'Keep mobile interactions responsive within the 16.6 ms (60 Hz) frame budget so screen readers, touch scrolling, and keyboard navigation never stutter during heavy analytics.',
        keyTakeaways: [
          'Measure actual frame deltas via requestAnimationFrame alongside performance.now().',
          'Sub-millisecond Wasm scoring preserves UI responsiveness on constrained mobile CPUs.',
          'Always verify mathematical parity between JS fallback and compiled Wasm outputs.',
        ],
      },
    ],
  },
  {
    id: 'mobile-ergonomics',
    title: 'Mobile Touch & Screen Reader UX',
    category: 'Mobile Engineering',
    level: 'Intermediate',
    estimatedMinutes: 30,
    imageUrl: '/src/assets/images/course_mobile_a11y_1794581606245.jpg',
    imageAlt:
      'Studio view of matte smartphones on limestone displaying high-contrast modular user interface touch blocks.',
    description:
      'Design responsive thumb-zone navigation, 44x44px minimum touch hitboxes, and TalkBack/VoiceOver-compatible layouts tested across Android and iOS viewports.',
    quizId: 'quiz-mobile',
    lessons: [
      {
        id: 'mobile-l1',
        title: '44px Touch Targets & Thumb-Zone Ergonomics',
        durationMin: 10,
        summary:
          'Position frequent mobile navigation inside the natural bottom thumb zone while enforcing >= 44x44px hitboxes and <= 15% aggregate sticky chrome height.',
        keyTakeaways: [
          'WCAG 2.5.5 recommends >= 44x44 CSS pixels for interactive touch targets.',
          'Keep top sticky bar + bottom navigation under 15% of mobile viewport height.',
          'Maintain horizontal single-line labels with overflow protection at 375px viewport width.',
        ],
      },
      {
        id: 'mobile-l2',
        title: 'Android TalkBack & iOS VoiceOver Testing',
        durationMin: 10,
        summary:
          'Validate swipe focus order, semantic roles, and dynamic state announcements on Android Studio Emulator (TalkBack) and Xcode iOS Simulator (VoiceOver / Accessibility Inspector).',
        keyTakeaways: [
          'Inspect accessibility tree labels and traits using Android Layout Inspector and Xcode Accessibility Inspector.',
          'Ensure radio-style quiz options expose aria-checked and descriptive group labels.',
          'Test scaled text (130%-150%) on 375x812 (iOS) and 393x851 (Android) viewports.',
        ],
      },
      {
        id: 'mobile-l3',
        title: 'Low-Latency Mobile Rendering Pipelines',
        durationMin: 10,
        summary:
          'Animate only compositor-safe properties (transform, opacity) and defer non-critical payload work so mobile battery and thermal budgets stay healthy.',
        keyTakeaways: [
          'Never animate layout geometry (width, height, top, left) on touch interactions.',
          'Keep micro-interaction feedback settling within 100-200ms.',
        ],
      },
    ],
  },
  {
    id: 'adaptive-ai',
    title: 'AI-Driven Personalization & Rule Engines',
    category: 'Adaptive Systems',
    level: 'Advanced',
    estimatedMinutes: 35,
    imageUrl: '/src/assets/images/course_ai_adaptive_1794581607274.jpg',
    imageAlt:
      'Geometric architectural diagram of interconnected cobalt and emerald adaptive curriculum nodes on an off-white grid.',
    description:
      'Combine transparent deterministic rule engines with structured LLM personalization to tailor study paths while clearly distinguishing heuristic logic from generative AI.',
    quizId: 'quiz-ai',
    lessons: [
      {
        id: 'ai-l1',
        title: 'Deterministic Rule Engines vs Generative AI',
        durationMin: 12,
        summary:
          'Understand when deterministic threshold rules provide predictable, zero-latency baseline routing versus when server-side LLM synthesis adds nuanced cross-topic curriculum guidance.',
        keyTakeaways: [
          'Rule-based engines execute locally in microseconds with 100% deterministic auditability.',
          'Generative AI excels at synthesizing multi-factor patterns (accuracy, pacing, accessibility context).',
          'Transparently label both recommendation sources so learners and auditors know how guidance was produced.',
        ],
      },
      {
        id: 'ai-l2',
        title: 'Structured JSON Schemas for Safe Recommendations',
        durationMin: 12,
        summary:
          'Constrain server-side Gemini responses with strict responseSchema definitions so recommended courseIds and quizIds always resolve to valid interactive routes.',
        keyTakeaways: [
          'Keep all LLM SDK calls and API keys strictly on the backend Express server.',
          'Enforce typed JSON schemas to prevent broken navigation targets in the client UI.',
          'Handle network/quota failures explicitly with honest user feedback rather than silent mock fallbacks.',
        ],
      },
      {
        id: 'ai-l3',
        title: 'Accessibility-Aware Curriculum Adaptation',
        durationMin: 11,
        summary:
          'Incorporate learner font-scaling, reduced-motion, and timing telemetry into study recommendations so pacing suggestions respect assistive-technology navigation speed.',
        keyTakeaways: [
          'Screen reader navigation naturally introduces deliberate reading pauses—avoid penalizing thoughtful pacing harshly.',
          'Provide concise, scannable study tips compatible with text-to-speech output.',
        ],
      },
    ],
  },
];

export const QUIZZES: Quiz[] = [
  {
    id: 'quiz-wcag',
    courseId: 'wcag-engineering',
    title: 'WCAG 2.2 Compliance Assessment',
    category: 'Accessibility Standards',
    questions: [
      {
        id: 'wcag-q1',
        topic: 'Contrast Ratios',
        weight: 2,
        prompt: 'What is the minimum WCAG 2.2 AA contrast ratio required for standard body text?',
        options: ['3.0 : 1', '4.5 : 1', '7.0 : 1', '2.5 : 1'],
        correctIndex: 1,
        explanation:
          'WCAG 1.4.3 requires at least 4.5:1 contrast for normal text and 3.0:1 for large text (18pt+ or 14pt+ bold).',
      },
      {
        id: 'wcag-q2',
        topic: 'Keyboard Focus',
        weight: 2,
        prompt: 'Which CSS pseudo-class shows focus outlines primarily for keyboard navigation without cluttering mouse clicks?',
        options: [':focus-within', ':hover', ':focus-visible', ':active'],
        correctIndex: 2,
        explanation:
          ':focus-visible matches when the browser determines focus should be visibly indicated (such as keyboard Tab navigation).',
      },
      {
        id: 'wcag-q3',
        topic: 'Live Regions',
        weight: 2,
        prompt: 'Which ARIA attribute announces dynamic quiz feedback to a screen reader without interrupting current speech?',
        options: ['aria-hidden="true"', 'aria-live="polite"', 'role="presentation"', 'aria-disabled="true"'],
        correctIndex: 1,
        explanation:
          'aria-live="polite" queues announcements until the screen reader finishes speaking the current phrase.',
      },
      {
        id: 'wcag-q4',
        topic: 'Semantic HTML',
        weight: 1,
        prompt: 'Why should interactive actions use native <button> elements instead of clickable <div> elements?',
        options: [
          'Buttons automatically use less CSS memory',
          'Buttons provide built-in keyboard activation (Enter/Space), focusability, and button role semantics',
          'Div elements cannot attach onClick handlers in React',
          'Buttons bypass WCAG contrast validation',
        ],
        correctIndex: 1,
        explanation:
          'Native <button> elements include keyboard focus, Enter/Space key handling, and implicit ARIA role="button".',
      },
      {
        id: 'wcag-q5',
        topic: 'Non-Text Content',
        weight: 1,
        prompt: 'How should purely decorative images be handled for screen readers under WCAG 1.1.1?',
        options: [
          'Omit the alt attribute completely',
          'Use alt="image" on every element',
          'Set an empty alt="" attribute so assistive tech skips it',
          'Add title="decorative" without alt',
        ],
        correctIndex: 2,
        explanation:
          'Setting alt="" marks an image as decorative so screen readers ignore it; omitting alt causes screen readers to read the filename.',
      },
      {
        id: 'wcag-q6',
        topic: 'Color Independence',
        weight: 2,
        prompt: 'Under WCAG 1.4.1 (Use of Color), how must quiz pass/fail states be communicated?',
        options: [
          'Green or red background tint alone is sufficient',
          'Pair semantic colors with explicit text labels or distinct icons',
          'Use lower opacity on failing rows',
          'Place status only inside a tooltip',
        ],
        correctIndex: 1,
        explanation:
          'Color cannot be the sole visual means of conveying information; always pair color with explicit text or icon indicators.',
      },
    ],
  },
  {
    id: 'quiz-wasm',
    courseId: 'wasm-performance',
    title: 'WebAssembly & C Optimization Quiz',
    category: 'Systems Performance',
    questions: [
      {
        id: 'wasm-q1',
        topic: 'Linear Memory',
        weight: 2,
        prompt: 'What is the fixed size of one WebAssembly linear memory page?',
        options: ['4 KiB (4,096 bytes)', '16 KiB (16,384 bytes)', '64 KiB (65,536 bytes)', '1 MiB (1,048,576 bytes)'],
        correctIndex: 2,
        explanation: 'Every WebAssembly linear memory page is defined by the specification as exactly 64 KiB (65,536 bytes).',
      },
      {
        id: 'wasm-q2',
        topic: 'Emscripten ABI',
        weight: 2,
        prompt: 'Which Emscripten macro prevents the linker from dead-code-eliminating a C function exported to JavaScript?',
        options: ['EMSCRIPTEN_INLINE', 'EMSCRIPTEN_KEEPALIVE', 'WASM_STATIC', 'EXPORT_JS_ONLY'],
        correctIndex: 1,
        explanation: 'EMSCRIPTEN_KEEPALIVE marks a C function so LLVM/Emscripten preserves and exports it in the Wasm module.',
      },
      {
        id: 'wasm-q3',
        topic: 'Boundary Overhead',
        weight: 2,
        prompt: 'What is the most effective way to minimize JS-to-WebAssembly call overhead during large quiz batch scoring?',
        options: [
          'Call a Wasm function once per individual question inside a JS loop',
          'Serialize arrays to JSON strings before passing to C',
          'Write typed arrays directly into shared linear memory and invoke one batched C function',
          'Recreate the WebAssembly instance for every submission',
        ],
        correctIndex: 2,
        explanation:
          'Batching typed Int32Array data in linear memory and executing the hot loop inside C eliminates boundary-crossing and GC overhead.',
      },
      {
        id: 'wasm-q4',
        topic: 'Instantiation',
        weight: 1,
        prompt: 'Which browser API compiles WebAssembly bytes incrementally as they arrive over the network?',
        options: [
          'WebAssembly.compileSync()',
          'WebAssembly.instantiateStreaming()',
          'JSON.parseWasm()',
          'evalWasmModule()',
        ],
        correctIndex: 1,
        explanation:
          'WebAssembly.instantiateStreaming() compiles the module directly from a Fetch Response stream (with application/wasm MIME type).',
      },
      {
        id: 'wasm-q5',
        topic: 'Determinism & Parity',
        weight: 2,
        prompt: 'Why does the quiz_engine.c module compute scores in integer basis points (0..10000) rather than floats?',
        options: [
          'WebAssembly does not support floating-point instructions',
          'Integer arithmetic guarantees exact, deterministic bit-for-bit parity and avoids rounding drift',
          'JavaScript Int32Array cannot store numbers above 100',
          'Emscripten forbids float parameters',
        ],
        correctIndex: 1,
        explanation:
          'Fixed-point integer basis points (10000 = 100.00%) yield deterministic integer math in C and exact JS parity.',
      },
      {
        id: 'wasm-q6',
        topic: 'UI Responsiveness',
        weight: 1,
        prompt: 'What is the per-frame time budget required to maintain smooth 60 Hz mobile scrolling and assistive-tech responsiveness?',
        options: ['~16.6 ms', '~120 ms', '~500 ms', '~1.0 ms'],
        correctIndex: 0,
        explanation: 'At 60 frames per second, the browser has 1,000 ms / 60 = ~16.67 ms per frame for scripting, layout, and paint.',
      },
    ],
  },
  {
    id: 'quiz-mobile',
    courseId: 'mobile-ergonomics',
    title: 'Mobile Accessibility & Emulator Assessment',
    category: 'Mobile Engineering',
    questions: [
      {
        id: 'mob-q1',
        topic: 'Touch Targets',
        weight: 2,
        prompt: 'What is the recommended minimum touch target size for mobile interactive controls under WCAG 2.5.5?',
        options: ['24 x 24 CSS px', '32 x 32 CSS px', '44 x 44 CSS px', '64 x 64 CSS px'],
        correctIndex: 2,
        explanation: '44 x 44 CSS pixels ensures comfortable finger tap accuracy without accidental adjacent activation.',
      },
      {
        id: 'mob-q2',
        topic: 'Thumb Zones',
        weight: 1,
        prompt: 'Where should primary mobile navigation tabs be anchored for comfortable one-handed thumb reach?',
        options: [
          'Top-left corner only',
          'Bottom viewport navigation bar within natural thumb arc',
          'Floating center overlay',
          'Hidden behind a hover menu',
        ],
        correctIndex: 1,
        explanation: 'The bottom 40% of the mobile viewport falls inside the natural thumb reach zone for single-handed operation.',
      },
      {
        id: 'mob-q3',
        topic: 'Android Testing',
        weight: 2,
        prompt: 'Which screen reader service is used to validate mobile web accessibility on Android Studio Emulators?',
        options: ['VoiceOver', 'NVDA', 'TalkBack', 'JAWS'],
        correctIndex: 2,
        explanation: 'TalkBack is the built-in Android accessibility screen reader available for testing on physical devices and Android Emulators.',
      },
      {
        id: 'mob-q4',
        topic: 'iOS Testing',
        weight: 2,
        prompt: 'Which Xcode companion tool inspects iOS Simulator accessibility labels, traits, and contrast audits?',
        options: ['Instruments Network Profiler', 'Accessibility Inspector', 'CoreData Browser', 'Metal Debugger'],
        correctIndex: 1,
        explanation: 'Xcode Accessibility Inspector attaches to the iOS Simulator to audit labels, traits, hitboxes, and contrast.',
      },
      {
        id: 'mob-q5',
        topic: 'Viewport Allocation',
        weight: 1,
        prompt: 'Why should combined sticky headers and bottom navigation stay under 15% of mobile viewport height?',
        options: [
          'Browsers reject CSS fixed positioning above 15%',
          'It preserves >= 85% of vertical space for readable course content and zoomed text',
          'Wasm memory shrinks when sticky elements are tall',
          'Android TalkBack disables scrolling otherwise',
        ],
        correctIndex: 1,
        explanation: 'Capping fixed chrome at <= 15% leaves generous vertical space for reading, especially when users scale text to 150%.',
      },
      {
        id: 'mob-q6',
        topic: 'Compositor Motion',
        weight: 2,
        prompt: 'Which CSS properties animate purely on the GPU compositor without triggering expensive mobile layout reflows?',
        options: ['width and height', 'top and left', 'transform and opacity', 'margin and padding'],
        correctIndex: 2,
        explanation: 'Animating transform and opacity avoids layout and paint passes, keeping mobile frame times smooth.',
      },
    ],
  },
  {
    id: 'quiz-ai',
    courseId: 'adaptive-ai',
    title: 'AI Personalization & Rule Engine Quiz',
    category: 'Adaptive Systems',
    questions: [
      {
        id: 'ai-q1',
        topic: 'Rule vs AI Distinction',
        weight: 2,
        prompt: 'What is the primary architectural difference between a rule-based recommender and a generative AI recommender?',
        options: [
          'Rule engines require cloud GPUs while LLMs run in C',
          'Rule engines evaluate explicit deterministic thresholds; generative AI synthesizes nuanced multi-factor context via a model',
          'Rule engines only work with databases',
          'There is no functional difference between them',
        ],
        correctIndex: 1,
        explanation:
          'Rule-based engines apply explicit, auditable if/else thresholds locally; generative AI models synthesize broader learning patterns and prose.',
      },
      {
        id: 'ai-q2',
        topic: 'API Architecture',
        weight: 2,
        prompt: 'Where must generative AI SDK calls and API keys reside in a full-stack web application?',
        options: [
          'Hardcoded in React component state',
          'Stored in URL query parameters',
          'Executed strictly in backend server routes (e.g. Express /api/*)',
          'Embedded inside public/wasm/quiz_engine.c',
        ],
        correctIndex: 2,
        explanation:
          'Keeping @google/genai calls on the Express backend ensures credentials stay server-side and enables clean validation/retries.',
      },
      {
        id: 'ai-q3',
        topic: 'Structured Output',
        weight: 2,
        prompt: 'Why should AI curriculum recommendation endpoints configure a strict JSON responseSchema?',
        options: [
          'To force the AI to output valid courseId/quizId keys and typed fields the UI can render safely',
          'To compress WebAssembly memory pages',
          'To bypass WCAG color contrast rules',
          'To disable HTTP POST requests',
        ],
        correctIndex: 0,
        explanation:
          'A typed responseSchema guarantees structured JSON so every recommended course or quiz links cleanly to an actual route.',
      },
      {
        id: 'ai-q4',
        topic: 'Honest Error Handling',
        weight: 1,
        prompt: 'If a live AI recommendation request fails due to network or key configuration issues, what should the interface do?',
        options: [
          'Silently display static rules while claiming they came from the AI model',
          'Display the explicit error status and distinguish the deterministic rule engine separately',
          'Hide the entire dashboard',
          'Fabricate random latency numbers',
        ],
        correctIndex: 1,
        explanation:
          'Transparent engineering requires reporting real AI errors honestly and never mislabeling rule-based output as AI.',
      },
      {
        id: 'ai-q5',
        topic: 'Accessible Telemetry',
        weight: 1,
        prompt: 'Why should personalization engines consider a learner’s accessibility settings when interpreting quiz response times?',
        options: [
          'Screen-reader and magnified navigation naturally involve deliberate audio/focus traversal',
          'WebAssembly cannot measure milliseconds in dark mode',
          'High contrast slows down CPU clock speed',
          'Rule engines ignore accuracy scores',
        ],
        correctIndex: 0,
        explanation:
          'Assistive-technology users navigate sequentially via audio or magnification, so timing thresholds should account for accessibility context.',
      },
      {
        id: 'ai-q6',
        topic: 'Feedback Loops',
        weight: 2,
        prompt: 'Which telemetry signal is most direct for identifying specific concept gaps to recommend next?',
        options: [
          'Browser window innerWidth',
          'Per-topic missed question weights and incomplete module lessons',
          'Number of clicks on the footer',
          'System clock timezone',
        ],
        correctIndex: 1,
        explanation:
          'Topic-level accuracy combined with remaining incomplete lessons directly pinpoints which module or drill will close knowledge gaps.',
      },
    ],
  },
];
