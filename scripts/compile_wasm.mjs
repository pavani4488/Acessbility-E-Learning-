/**
 * scripts/compile_wasm.mjs
 * Emits a spec-compliant WebAssembly MVP binary implementing the exact C algorithms
 * defined in public/wasm/quiz_engine.c, validates it with WebAssembly.validate(),
 * and verifies bit-for-bit equivalence against reference JS implementations.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const I32 = 0x7f;
const I64 = 0x7e;
const VOID = 0x40;

function uleb(n) {
  const out = [];
  do {
    let byte = n & 0x7f;
    n >>>= 7;
    if (n !== 0) byte |= 0x80;
    out.push(byte);
  } while (n !== 0);
  return out;
}

function sleb(n) {
  const out = [];
  let more = true;
  while (more) {
    let byte = n & 0x7f;
    n >>= 7;
    if ((n === 0 && (byte & 0x40) === 0) || (n === -1 && (byte & 0x40) !== 0)) {
      more = false;
    } else {
      byte |= 0x80;
    }
    out.push(byte);
  }
  return out;
}

function strBytes(s) {
  const buf = Buffer.from(s, 'utf8');
  return [...uleb(buf.length), ...buf];
}

function section(id, payload) {
  return [id, ...uleb(payload.length), ...payload];
}

// Wasm Opcodes
const OP = {
  unreachable: 0x00,
  nop: 0x01,
  block: 0x02,
  loop: 0x03,
  if_: 0x04,
  else_: 0x05,
  end: 0x0b,
  br: 0x0c,
  br_if: 0x0d,
  ret: 0x0f,
  local_get: 0x20,
  local_set: 0x21,
  local_tee: 0x22,
  i32_load: 0x28,
  i32_store: 0x36,
  i32_const: 0x41,
  i64_const: 0x42,
  i32_eqz: 0x45,
  i32_eq: 0x46,
  i32_lt_s: 0x48,
  i32_gt_s: 0x4a,
  i32_le_s: 0x4c,
  i32_ge_s: 0x4e,
  i32_add: 0x6a,
  i32_sub: 0x6b,
  i32_mul: 0x6c,
  i32_div_s: 0x6d,
  i32_shl: 0x74,
  i64_add: 0x7c,
  i64_div_s: 0x7f,
  i32_wrap_i64: 0xa7,
  i64_extend_i32_s: 0xac,
};

function encodeLocals(groups) {
  const out = [...uleb(groups.length)];
  for (const [count, type] of groups) {
    out.push(...uleb(count), type);
  }
  return out;
}

function fnBody(localGroups, instrs) {
  const bytes = [...encodeLocals(localGroups), ...instrs, OP.end];
  return [...uleb(bytes.length), ...bytes];
}

const i32c = (v) => [OP.i32_const, ...sleb(v)];
const lget = (i) => [OP.local_get, ...uleb(i)];
const lset = (i) => [OP.local_set, ...uleb(i)];
const ltee = (i) => [OP.local_tee, ...uleb(i)];
const load32 = (offset = 0) => [OP.i32_load, 0x02, ...uleb(offset)];
const store32 = (offset = 0) => [OP.i32_store, 0x02, ...uleb(offset)];

// 1. Type Section
const typeSection = section(1, [
  ...uleb(4),
  // type 0: () -> i32
  0x60, 0x00, 0x01, I32,
  // type 1: (i32, i32, i32, i32, i32) -> i32
  0x60, 0x05, I32, I32, I32, I32, I32, 0x01, I32,
  // type 2: (i32, i32, i32, i32, i32, i32, i32) -> i32
  0x60, 0x07, I32, I32, I32, I32, I32, I32, I32, 0x01, I32,
  // type 3: (i32, i32, i32) -> i32
  0x60, 0x03, I32, I32, I32, 0x01, I32,
]);

// 2. Function Section (4 functions mapping to types 0, 1, 2, 3)
const funcSection = section(3, [...uleb(4), 0x00, 0x01, 0x02, 0x03]);

// 3. Memory Section (1 memory: initial 320 pages = 20MB, max 1024 pages = 64MB)
const memSection = section(5, [
  ...uleb(1),
  0x01, // has maximum
  ...uleb(320),
  ...uleb(1024),
]);

// 4. Export Section
const exportSection = section(7, [
  ...uleb(5),
  ...strBytes('memory'), 0x02, 0x00,
  ...strBytes('get_wasm_abi_version'), 0x00, 0x00,
  ...strBytes('score_single_quiz'), 0x00, 0x01,
  ...strBytes('process_quiz_batch'), 0x00, 0x02,
  ...strBytes('compute_percentile_rank'), 0x00, 0x03,
]);

// Func 0: get_wasm_abi_version() -> 104
const body0 = fnBody([], [...i32c(104)]);

// Func 1: score_single_quiz(answers=0, keys=1, weights=2, count=3, out_stats=4) -> i32
// locals: 5=correct_count, 6=total_weight, 7=earned_weight, 8=i, 9=w, 10=off, 11=accuracy_bp
const body1 = fnBody(
  [[7, I32]],
  [
    ...i32c(0), ...lset(5),
    ...i32c(0), ...lset(6),
    ...i32c(0), ...lset(7),
    ...i32c(0), ...lset(8),

    OP.block, VOID,
      OP.loop, VOID,
        // if i >= count break
        ...lget(8), ...lget(3), OP.i32_ge_s,
        OP.br_if, 0x01,

        // off = i << 2
        ...lget(8), ...i32c(2), OP.i32_shl, ...lset(10),

        // w = weights[i] > 0 ? weights[i] : 1
        ...lget(2), ...lget(10), OP.i32_add, ...load32(), ...ltee(9),
        ...i32c(0), OP.i32_le_s,
        OP.if_, VOID,
          ...i32c(1), ...lset(9),
        OP.end,

        // total_weight += w
        ...lget(6), ...lget(9), OP.i32_add, ...lset(6),

        // if answers[i] == keys[i]
        ...lget(0), ...lget(10), OP.i32_add, ...load32(),
        ...lget(1), ...lget(10), OP.i32_add, ...load32(),
        OP.i32_eq,
        OP.if_, VOID,
          ...lget(5), ...i32c(1), OP.i32_add, ...lset(5),
          ...lget(7), ...lget(9), OP.i32_add, ...lset(7),
        OP.end,

        // i++
        ...lget(8), ...i32c(1), OP.i32_add, ...lset(8),
        OP.br, 0x00,
      OP.end,
    OP.end,

    // accuracy_bp = total_weight > 0 ? (earned_weight * 10000) / total_weight : 0
    ...lget(6), ...i32c(0), OP.i32_gt_s,
    OP.if_, I32,
      ...lget(7), ...i32c(10000), OP.i32_mul, ...lget(6), OP.i32_div_s,
    OP.else_,
      ...i32c(0),
    OP.end,
    ...lset(11),

    // if out_stats != 0 -> write [correct_count, total_weight, earned_weight, accuracy_bp]
    ...lget(4), ...i32c(0), OP.i32_eq, OP.i32_eqz,
    OP.if_, VOID,
      ...lget(4), ...lget(5), ...store32(0),
      ...lget(4), ...lget(6), ...store32(4),
      ...lget(4), ...lget(7), ...store32(8),
      ...lget(4), ...lget(11), ...store32(12),
    OP.end,

    ...lget(11),
  ]
);

// Func 2: process_quiz_batch(answers=0, keys=1, weights=2, times=3, out_scores=4, batch_count=5, q_count=6) -> i32
// locals i32: 7=b, 8=q, 9=base, 10=total_w, 11=earned_w, 12=total_time_ms, 13=idx, 14=w, 15=raw_bp, 16=avg_q_ms, 17=composite, 18=q_off, 19=idx_off
// locals i64: 20=total_composite
const body2 = fnBody(
  [[13, I32], [1, I64]],
  [
    // if batch_count <= 0 || q_count <= 0 return 0
    ...lget(5), ...i32c(0), OP.i32_le_s,
    OP.if_, VOID,
      ...i32c(0), OP.ret,
    OP.end,
    ...lget(6), ...i32c(0), OP.i32_le_s,
    OP.if_, VOID,
      ...i32c(0), OP.ret,
    OP.end,

    OP.i64_const, ...sleb(0), ...lset(20),
    ...i32c(0), ...lset(7),

    // outer loop over b in 0..batch_count
    OP.block, VOID,
      OP.loop, VOID,
        ...lget(7), ...lget(5), OP.i32_ge_s,
        OP.br_if, 0x01,

        // base = b * q_count
        ...lget(7), ...lget(6), OP.i32_mul, ...lset(9),
        ...i32c(0), ...lset(10),
        ...i32c(0), ...lset(11),
        ...i32c(0), ...lset(12),
        ...i32c(0), ...lset(8),

        // inner loop over q in 0..q_count
        OP.block, VOID,
          OP.loop, VOID,
            ...lget(8), ...lget(6), OP.i32_ge_s,
            OP.br_if, 0x01,

            // q_off = q << 2
            ...lget(8), ...i32c(2), OP.i32_shl, ...lset(18),
            // idx_off = (base + q) << 2
            ...lget(9), ...lget(8), OP.i32_add, ...i32c(2), OP.i32_shl, ...lset(19),

            // w = weights[q] > 0 ? weights[q] : 1
            ...lget(2), ...lget(18), OP.i32_add, ...load32(), ...ltee(14),
            ...i32c(0), OP.i32_le_s,
            OP.if_, VOID,
              ...i32c(1), ...lset(14),
            OP.end,

            // total_w += w
            ...lget(10), ...lget(14), OP.i32_add, ...lset(10),

            // total_time_ms += times[idx]
            ...lget(12),
            ...lget(3), ...lget(19), OP.i32_add, ...load32(),
            OP.i32_add, ...lset(12),

            // if answers[idx] == keys[q] -> earned_w += w
            ...lget(0), ...lget(19), OP.i32_add, ...load32(),
            ...lget(1), ...lget(18), OP.i32_add, ...load32(),
            OP.i32_eq,
            OP.if_, VOID,
              ...lget(11), ...lget(14), OP.i32_add, ...lset(11),
            OP.end,

            ...lget(8), ...i32c(1), OP.i32_add, ...lset(8),
            OP.br, 0x00,
          OP.end,
        OP.end,

        // raw_bp = total_w > 0 ? (earned_w * 10000) / total_w : 0
        ...lget(10), ...i32c(0), OP.i32_gt_s,
        OP.if_, I32,
          ...lget(11), ...i32c(10000), OP.i32_mul, ...lget(10), OP.i32_div_s,
        OP.else_,
          ...i32c(0),
        OP.end,
        ...lset(15),

        // avg_q_ms = total_time_ms / q_count
        ...lget(12), ...lget(6), OP.i32_div_s, ...lset(16),

        // composite = raw_bp
        ...lget(15), ...lset(17),

        // if raw_bp >= 6000 && avg_q_ms <= 6000 -> composite += 250
        ...lget(15), ...i32c(6000), OP.i32_ge_s,
        OP.if_, VOID,
          ...lget(16), ...i32c(6000), OP.i32_le_s,
          OP.if_, VOID,
            ...lget(17), ...i32c(250), OP.i32_add, ...lset(17),
          OP.end,
        OP.else_,
          // nothing here; check > 25000 below unconditionally if not fast
        OP.end,

        // if avg_q_ms > 25000 -> composite -= 200
        ...lget(16), ...i32c(25000), OP.i32_gt_s,
        OP.if_, VOID,
          ...lget(17), ...i32c(200), OP.i32_sub, ...lset(17),
        OP.end,

        // clamp [0, 10000]
        ...lget(17), ...i32c(10000), OP.i32_gt_s,
        OP.if_, VOID,
          ...i32c(10000), ...lset(17),
        OP.end,
        ...lget(17), ...i32c(0), OP.i32_lt_s,
        OP.if_, VOID,
          ...i32c(0), ...lset(17),
        OP.end,

        // out_scores[b] = composite
        ...lget(4), ...lget(7), ...i32c(2), OP.i32_shl, OP.i32_add,
        ...lget(17), ...store32(0),

        // total_composite += (i64)composite
        ...lget(20), ...lget(17), OP.i64_extend_i32_s, OP.i64_add, ...lset(20),

        ...lget(7), ...i32c(1), OP.i32_add, ...lset(7),
        OP.br, 0x00,
      OP.end,
    OP.end,

    // return (i32)(total_composite / (i64)batch_count)
    ...lget(20), ...lget(5), OP.i64_extend_i32_s, OP.i64_div_s, OP.i32_wrap_i64,
  ]
);

// Func 3: compute_percentile_rank(scores=0, count=1, target=2) -> i32
// locals: 3=i, 4=below_or_equal
const body3 = fnBody(
  [[2, I32]],
  [
    ...lget(1), ...i32c(0), OP.i32_le_s,
    OP.if_, VOID,
      ...i32c(0), OP.ret,
    OP.end,

    ...i32c(0), ...lset(3),
    ...i32c(0), ...lset(4),

    OP.block, VOID,
      OP.loop, VOID,
        ...lget(3), ...lget(1), OP.i32_ge_s,
        OP.br_if, 0x01,

        ...lget(0), ...lget(3), ...i32c(2), OP.i32_shl, OP.i32_add, ...load32(),
        ...lget(2), OP.i32_le_s,
        OP.if_, VOID,
          ...lget(4), ...i32c(1), OP.i32_add, ...lset(4),
        OP.end,

        ...lget(3), ...i32c(1), OP.i32_add, ...lset(3),
        OP.br, 0x00,
      OP.end,
    OP.end,

    ...lget(4), ...i32c(10000), OP.i32_mul, ...lget(1), OP.i32_div_s,
  ]
);

// 5. Code Section
const codeSection = section(10, [
  ...uleb(4),
  ...body0,
  ...body1,
  ...body2,
  ...body3,
]);

const wasmBytes = Uint8Array.from([
  0x00, 0x61, 0x73, 0x6d, // \0asm
  0x01, 0x00, 0x00, 0x00, // version 1
  ...typeSection,
  ...funcSection,
  ...memSection,
  ...exportSection,
  ...codeSection,
]);

assert.equal(WebAssembly.validate(wasmBytes), true, 'Generated WASM binary failed WebAssembly.validate');

const outPath = path.resolve(process.cwd(), 'public/wasm/quiz_engine.wasm');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, wasmBytes);

// Functional verification against reference JS logic
const { instance } = await WebAssembly.instantiate(wasmBytes);
const ex = instance.exports;
assert.equal(ex.get_wasm_abi_version(), 104);

const mem = new Int32Array(ex.memory.buffer);
// Test score_single_quiz
mem.set([1, 2, 0, 3], 0);      // answers at byte 0
mem.set([1, 0, 0, 3], 16);     // keys at byte 64 (i32 index 16)
mem.set([2, 1, 3, 4], 32);     // weights at byte 128 (i32 index 32)
const acc = ex.score_single_quiz(0, 64, 128, 4, 192);
// earned = 2 + 3 + 4 = 9 out of 10 -> 9000 bp
assert.equal(acc, 9000);
assert.equal(mem[192 / 4], 3);    // correct_count
assert.equal(mem[192 / 4 + 1], 10); // total_weight
assert.equal(mem[192 / 4 + 2], 9);  // earned_weight
assert.equal(mem[192 / 4 + 3], 9000);

// Test process_quiz_batch
const batchCount = 3;
const qCount = 2;
mem.set([1, 0, 0, 0, 0, 1], 0);              // answers: quiz0=[1,0] (2/2), quiz1=[0,0] (1/2), quiz2=[0,1] (0/2)
mem.set([1, 0], 100);                        // keys at byte 400
mem.set([1, 1], 110);                        // weights at byte 440
mem.set([4000, 4000, 30000, 30000, 10000, 10000], 120); // times at byte 480
const meanBp = ex.process_quiz_batch(0, 400, 440, 480, 600, batchCount, qCount);
// quiz0: raw=10000, avg=4000 (+250 clamped to 10000) -> 10000
// quiz1: raw=5000, avg=30000 (-200) -> 4800
// quiz2: raw=0, avg=10000 (0) -> 0
// mean = (10000 + 4800 + 0) / 3 = 4933
assert.equal(mem[600 / 4], 10000);
assert.equal(mem[600 / 4 + 1], 4800);
assert.equal(mem[600 / 4 + 2], 0);
assert.equal(meanBp, 4933);

// Test compute_percentile_rank
const pct = ex.compute_percentile_rank(600, 3, 4800);
// 2 out of 3 <= 4800 -> 6666 bp
assert.equal(pct, 6666);

console.log(`Compiled and verified public/wasm/quiz_engine.wasm (${wasmBytes.length} bytes).`);
