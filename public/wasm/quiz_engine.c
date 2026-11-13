/**
 * quiz_engine.c
 * AccessiLearn Wasm — C Quiz Result Processing & Benchmarking Engine
 *
 * Emscripten Compilation Command:
 *   emcc public/wasm/quiz_engine.c -O3 -s WASM=1 \
 *     -s INITIAL_MEMORY=16777216 -s MAXIMUM_MEMORY=67108864 \
 *     -s ALLOW_MEMORY_GROWTH=1 \
 *     -s EXPORTED_FUNCTIONS='["_score_single_quiz","_process_quiz_batch","_compute_percentile_rank","_get_wasm_abi_version"]' \
 *     -o public/wasm/quiz_engine.wasm
 */

#include <stdint.h>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define EXPORT EMSCRIPTEN_KEEPALIVE
#else
#define EXPORT
#endif

EXPORT int32_t get_wasm_abi_version(void) {
    return 104;
}

/**
 * Evaluates a single quiz submission using zero-copy linear memory buffers.
 * Writes [correct_count, total_weight, earned_weight, accuracy_bp] to out_stats_ptr.
 * Returns accuracy in basis points (0..10000, where 8550 = 85.50%).
 */
EXPORT int32_t score_single_quiz(
    const int32_t* answers,
    const int32_t* correct_keys,
    const int32_t* weights,
    int32_t count,
    int32_t* out_stats
) {
    int32_t correct_count = 0;
    int32_t total_weight = 0;
    int32_t earned_weight = 0;

    for (int32_t i = 0; i < count; i++) {
        int32_t w = weights[i] > 0 ? weights[i] : 1;
        total_weight += w;
        if (answers[i] == correct_keys[i]) {
            correct_count += 1;
            earned_weight += w;
        }
    }

    int32_t accuracy_bp = total_weight > 0 ? (earned_weight * 10000) / total_weight : 0;

    if (out_stats != 0) {
        out_stats[0] = correct_count;
        out_stats[1] = total_weight;
        out_stats[2] = earned_weight;
        out_stats[3] = accuracy_bp;
    }

    return accuracy_bp;
}

/**
 * Processes a batch of `batch_count` quiz submissions, each with `q_count` items.
 * Incorporates weighted correctness and response-time efficiency adjustment.
 * Writes each submission's composite score (0..10000 bp) to `out_scores`.
 * Returns the aggregate mean score across all submissions in basis points.
 */
EXPORT int32_t process_quiz_batch(
    const int32_t* answers,
    const int32_t* correct_keys,
    const int32_t* weights,
    const int32_t* times_ms,
    int32_t* out_scores,
    int32_t batch_count,
    int32_t q_count
) {
    if (batch_count <= 0 || q_count <= 0) {
        return 0;
    }

    int64_t total_composite = 0;

    for (int32_t b = 0; b < batch_count; b++) {
        int32_t base = b * q_count;
        int32_t total_w = 0;
        int32_t earned_w = 0;
        int32_t total_time_ms = 0;

        for (int32_t q = 0; q < q_count; q++) {
            int32_t idx = base + q;
            int32_t w = weights[q] > 0 ? weights[q] : 1;
            total_w += w;
            total_time_ms += times_ms[idx];
            if (answers[idx] == correct_keys[q]) {
                earned_w += w;
            }
        }

        int32_t raw_bp = total_w > 0 ? (earned_w * 10000) / total_w : 0;
        int32_t avg_q_ms = total_time_ms / q_count;

        /* Time efficiency adjustment: +250bp if <= 6000ms/q and >= 60%, -200bp if > 25000ms/q */
        int32_t adj = 0;
        if (raw_bp >= 6000 && avg_q_ms <= 6000) {
            adj = 250;
        } else if (avg_q_ms > 25000) {
            adj = -200;
        }

        int32_t composite = raw_bp + adj;
        if (composite > 10000) composite = 10000;
        if (composite < 0) composite = 0;

        out_scores[b] = composite;
        total_composite += composite;
    }

    return (int32_t)(total_composite / batch_count);
}

/**
 * Computes exact percentile rank (0..10000 basis points) of `target_score`
 * across `count` scored submissions in linear memory.
 */
EXPORT int32_t compute_percentile_rank(
    const int32_t* scores,
    int32_t count,
    int32_t target_score
) {
    if (count <= 0) {
        return 0;
    }
    int32_t below_or_equal = 0;
    for (int32_t i = 0; i < count; i++) {
        if (scores[i] <= target_score) {
            below_or_equal += 1;
        }
    }
    return (below_or_equal * 10000) / count;
}
