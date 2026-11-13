import { BenchmarkRun } from '../types';

export interface WasmExports {
  memory: WebAssembly.Memory;
  get_wasm_abi_version: () => number;
  score_single_quiz: (
    answersPtr: number,
    keysPtr: number,
    weightsPtr: number,
    count: number,
    outStatsPtr: number
  ) => number;
  process_quiz_batch: (
    answersPtr: number,
    keysPtr: number,
    weightsPtr: number,
    timesPtr: number,
    outScoresPtr: number,
    batchCount: number,
    qCount: number
  ) => number;
  compute_percentile_rank: (scoresPtr: number, count: number, targetScore: number) => number;
}

export interface WasmRuntimeInfo {
  loaded: boolean;
  abiVersion: number;
  binaryBytes: number;
  memoryPages: number;
  memoryBytes: number;
  loadTimeMs: number;
  error?: string;
}

let cachedInstance: WebAssembly.Instance | null = null;
let cachedRuntimeInfo: WasmRuntimeInfo = {
  loaded: false,
  abiVersion: 0,
  binaryBytes: 0,
  memoryPages: 0,
  memoryBytes: 0,
  loadTimeMs: 0,
};

export async function initWasmEngine(): Promise<{
  exports: WasmExports;
  info: WasmRuntimeInfo;
}> {
  if (cachedInstance && cachedRuntimeInfo.loaded) {
    return {
      exports: cachedInstance.exports as unknown as WasmExports,
      info: cachedRuntimeInfo,
    };
  }

  const t0 = performance.now();
  const response = await fetch('/wasm/quiz_engine.wasm');
  if (!response.ok) {
    throw new Error(`Failed to fetch /wasm/quiz_engine.wasm (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(buffer);
  const exports = instance.exports as unknown as WasmExports;
  const loadTimeMs = Number((performance.now() - t0).toFixed(3));
  const pages = exports.memory.buffer.byteLength / 65536;

  cachedInstance = instance;
  cachedRuntimeInfo = {
    loaded: true,
    abiVersion: exports.get_wasm_abi_version(),
    binaryBytes: buffer.byteLength,
    memoryPages: pages,
    memoryBytes: exports.memory.buffer.byteLength,
    loadTimeMs,
  };

  return { exports, info: cachedRuntimeInfo };
}

export function getWasmRuntimeInfo(): WasmRuntimeInfo {
  return cachedRuntimeInfo;
}

/**
 * Pure JavaScript reference implementation mirroring quiz_engine.c score_single_quiz
 */
export function scoreSingleQuizJs(
  answers: Int32Array,
  keys: Int32Array,
  weights: Int32Array
): {
  correctCount: number;
  totalWeight: number;
  earnedWeight: number;
  accuracyBp: number;
} {
  let correctCount = 0;
  let totalWeight = 0;
  let earnedWeight = 0;

  for (let i = 0; i < answers.length; i++) {
    const w = weights[i] > 0 ? weights[i] : 1;
    totalWeight += w;
    if (answers[i] === keys[i]) {
      correctCount += 1;
      earnedWeight += w;
    }
  }

  const accuracyBp = totalWeight > 0 ? Math.trunc((earnedWeight * 10000) / totalWeight) : 0;
  return { correctCount, totalWeight, earnedWeight, accuracyBp };
}

/**
 * Pure JavaScript reference implementation mirroring quiz_engine.c process_quiz_batch
 */
export function processQuizBatchJs(
  answers: Int32Array,
  keys: Int32Array,
  weights: Int32Array,
  timesMs: Int32Array,
  outScores: Int32Array,
  batchCount: number,
  qCount: number
): number {
  if (batchCount <= 0 || qCount <= 0) return 0;

  let totalComposite = 0;

  for (let b = 0; b < batchCount; b++) {
    const base = b * qCount;
    let totalW = 0;
    let earnedW = 0;
    let totalTimeMs = 0;

    for (let q = 0; q < qCount; q++) {
      const idx = base + q;
      const w = weights[q] > 0 ? weights[q] : 1;
      totalW += w;
      totalTimeMs += timesMs[idx];
      if (answers[idx] === keys[q]) {
        earnedW += w;
      }
    }

    const rawBp = totalW > 0 ? Math.trunc((earnedW * 10000) / totalW) : 0;
    const avgQMs = Math.trunc(totalTimeMs / qCount);

    let adj = 0;
    if (rawBp >= 6000 && avgQMs <= 6000) {
      adj = 250;
    }
    if (avgQMs > 25000) {
      adj -= 200;
    }

    let composite = rawBp + adj;
    if (composite > 10000) composite = 10000;
    if (composite < 0) composite = 0;

    outScores[b] = composite;
    totalComposite += composite;
  }

  return Math.trunc(totalComposite / batchCount);
}

/**
 * Evaluates a real student quiz submission using both C-WebAssembly and JS
 * to verify exact numerical parity and measure real evaluation microseconds.
 */
export async function evaluateQuizWithWasmAndJs(
  answersArr: number[],
  keysArr: number[],
  weightsArr: number[]
) {
  const { exports } = await initWasmEngine();
  const count = answersArr.length;

  const answers = Int32Array.from(answersArr);
  const keys = Int32Array.from(keysArr);
  const weights = Int32Array.from(weightsArr);

  // Measure JS evaluation (1000 iterations averaged for microsecond resolution)
  const warmup = scoreSingleQuizJs(answers, keys, weights);
  const jsT0 = performance.now();
  let jsRes = warmup;
  for (let r = 0; r < 1000; r++) {
    jsRes = scoreSingleQuizJs(answers, keys, weights);
  }
  const jsT1 = performance.now();
  const jsEvalTimeUs = Number((((jsT1 - jsT0) * 1000) / 1000).toFixed(3));

  // Marshal into Wasm linear memory
  const memView = new Int32Array(exports.memory.buffer);
  const ansByteOffset = 1024;
  const keyByteOffset = ansByteOffset + count * 4 + 16;
  const wgtByteOffset = keyByteOffset + count * 4 + 16;
  const outByteOffset = wgtByteOffset + count * 4 + 16;

  memView.set(answers, ansByteOffset / 4);
  memView.set(keys, keyByteOffset / 4);
  memView.set(weights, wgtByteOffset / 4);

  const wasmT0 = performance.now();
  let wasmBp = 0;
  for (let r = 0; r < 1000; r++) {
    wasmBp = exports.score_single_quiz(
      ansByteOffset,
      keyByteOffset,
      wgtByteOffset,
      count,
      outByteOffset
    );
  }
  const wasmT1 = performance.now();
  const wasmEvalTimeUs = Number((((wasmT1 - wasmT0) * 1000) / 1000).toFixed(3));

  const outIdx = outByteOffset / 4;
  const wasmCorrect = memView[outIdx];
  const wasmTotalW = memView[outIdx + 1];
  const wasmEarnedW = memView[outIdx + 2];
  const wasmAccBp = memView[outIdx + 3];

  const parityMatch =
    wasmBp === jsRes.accuracyBp &&
    wasmCorrect === jsRes.correctCount &&
    wasmTotalW === jsRes.totalWeight &&
    wasmEarnedW === jsRes.earnedWeight;

  return {
    correctCount: wasmCorrect,
    totalWeight: wasmTotalW,
    earnedWeight: wasmEarnedW,
    accuracyBp: wasmAccBp,
    scorePercent: Number((wasmAccBp / 100).toFixed(1)),
    jsEvalTimeUs,
    wasmEvalTimeUs,
    parityMatch,
    memoryOffsets: {
      answersPtr: ansByteOffset,
      keysPtr: keyByteOffset,
      weightsPtr: wgtByteOffset,
      outStatsPtr: outByteOffset,
    },
  };
}

interface PerfWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

function getUsedJsHeapBytes(): number | null {
  const perf = performance as PerfWithMemory;
  return typeof perf.memory?.usedJSHeapSize === 'number' ? perf.memory.usedJSHeapSize : null;
}

function yieldFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function measureExecutionWithFrameMonitor<T>(fn: () => T): Promise<{
  result: T;
  maxFrameDeltaMs: number;
}> {
  let maxDelta = 0;
  let running = true;
  let last = performance.now();

  const rafPromise = new Promise<void>((resolve) => {
    function tick(now: number) {
      const delta = now - last;
      if (delta > maxDelta) maxDelta = delta;
      last = now;
      if (running) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });

  await yieldFrame();
  last = performance.now();
  const result = fn();
  await yieldFrame();
  running = false;
  await rafPromise;

  return { result, maxFrameDeltaMs: Number(maxDelta.toFixed(2)) };
}

/**
 * Runs a real, unfabricated benchmark comparing JS vs C-WebAssembly on the user's actual device/browser.
 */
export async function runLiveBenchmark(
  batchSize: number,
  qCount: number = 6
): Promise<BenchmarkRun> {
  const { exports } = await initWasmEngine();
  const totalItems = batchSize * qCount;

  // Deterministic pseudo-random quiz dataset (reproducible across JS and Wasm)
  const answers = new Int32Array(totalItems);
  const timesMs = new Int32Array(totalItems);
  const keys = new Int32Array(qCount);
  const weights = new Int32Array(qCount);

  for (let q = 0; q < qCount; q++) {
    keys[q] = q % 4;
    weights[q] = q % 2 === 0 ? 2 : 1;
  }

  let seed = 1337;
  for (let i = 0; i < totalItems; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    answers[i] = seed % 4;
    timesMs[i] = 2500 + ((seed >>> 8) % 28000);
  }

  // Ensure Wasm linear memory has enough capacity for all 5 buffers
  const ansPtr = 4096;
  const keysPtr = ansPtr + totalItems * 4 + 64;
  const weightsPtr = keysPtr + qCount * 4 + 64;
  const timesPtr = weightsPtr + qCount * 4 + 64;
  const outPtr = timesPtr + totalItems * 4 + 64;
  const requiredBytes = outPtr + batchSize * 4 + 4096;

  if (requiredBytes > exports.memory.buffer.byteLength) {
    const pagesNeeded = Math.ceil((requiredBytes - exports.memory.buffer.byteLength) / 65536);
    exports.memory.grow(pagesNeeded);
  }

  const jsOut = new Int32Array(batchSize);

  // Warmup tiny pass to avoid cold JIT skew
  processQuizBatchJs(answers.subarray(0, qCount * 10), keys, weights, timesMs.subarray(0, qCount * 10), jsOut, Math.min(10, batchSize), qCount);

  // 1. Measure JavaScript Engine
  const heapBeforeJs = getUsedJsHeapBytes();
  let jsTimeMs = 0;
  let jsMeanBp = 0;
  const jsMon = await measureExecutionWithFrameMonitor(() => {
    const t0 = performance.now();
    // Simulate typical JS object/array scoring overhead + compute
    jsMeanBp = processQuizBatchJs(answers, keys, weights, timesMs, jsOut, batchSize, qCount);
    jsTimeMs = performance.now() - t0;
    return jsMeanBp;
  });
  const heapAfterJs = getUsedJsHeapBytes();

  // Give browser a clean frame before Wasm run
  await yieldFrame();

  // 2. Measure WebAssembly Engine (End-to-End including buffer copy + Pure Compute)
  let wasmEndToEndTimeMs = 0;
  let wasmComputeTimeMs = 0;
  let wasmMeanBp = 0;

  const wasmMon = await measureExecutionWithFrameMonitor(() => {
    const tTotal0 = performance.now();
    const mem = new Int32Array(exports.memory.buffer);
    mem.set(answers, ansPtr / 4);
    mem.set(keys, keysPtr / 4);
    mem.set(weights, weightsPtr / 4);
    mem.set(timesMs, timesPtr / 4);

    const tCompute0 = performance.now();
    wasmMeanBp = exports.process_quiz_batch(
      ansPtr,
      keysPtr,
      weightsPtr,
      timesPtr,
      outPtr,
      batchSize,
      qCount
    );
    wasmComputeTimeMs = performance.now() - tCompute0;
    wasmEndToEndTimeMs = performance.now() - tTotal0;
    return wasmMeanBp;
  });

  const memPages = exports.memory.buffer.byteLength / 65536;
  const wasmMemoryMb = Number((exports.memory.buffer.byteLength / (1024 * 1024)).toFixed(2));
  const jsHeapDeltaKb =
    heapBeforeJs !== null && heapAfterJs !== null
      ? Number(((heapAfterJs - heapBeforeJs) / 1024).toFixed(1))
      : null;

  const safeJsMs = Math.max(jsTimeMs, 0.001);
  const safeWasmComputeMs = Math.max(wasmComputeTimeMs, 0.001);
  const safeWasmE2EMs = Math.max(wasmEndToEndTimeMs, 0.001);

  return {
    id: `bench-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString(),
    batchSize,
    questionsPerQuiz: qCount,
    totalOperations: totalItems,
    jsTimeMs: Number(jsTimeMs.toFixed(3)),
    wasmComputeTimeMs: Number(wasmComputeTimeMs.toFixed(3)),
    wasmEndToEndTimeMs: Number(wasmEndToEndTimeMs.toFixed(3)),
    jsLatencyUsPerQuiz: Number(((safeJsMs * 1000) / batchSize).toFixed(4)),
    wasmLatencyUsPerQuiz: Number(((safeWasmComputeMs * 1000) / batchSize).toFixed(4)),
    speedupCompute: Number((safeJsMs / safeWasmComputeMs).toFixed(2)),
    speedupEndToEnd: Number((safeJsMs / safeWasmE2EMs).toFixed(2)),
    jsHeapDeltaKb,
    wasmMemoryPages: memPages,
    wasmMemoryMb,
    jsMaxFrameDeltaMs: jsMon.maxFrameDeltaMs,
    wasmMaxFrameDeltaMs: wasmMon.maxFrameDeltaMs,
    parityMatched: jsMeanBp === wasmMeanBp,
    meanScorePercent: Number((wasmMeanBp / 100).toFixed(2)),
  };
}
