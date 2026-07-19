# Parameterized Page Differentiation Progress

Status: `BASELINE AUDIT COMPLETE / CORRECTION REQUIRED`

The repository now persists the differentiation configuration, 61-surface registry, feature vectors, 61×61 pairwise matrix, clone-pair classification, cluster calculation, renderer usage and progress state.

Baseline calculated values:

- Scanned surfaces: 61 / 61
- Pairwise cells: 3,721 / 3,721
- Exact clones: 0
- Probable template clones: 0
- Over-shared pairs: 1
- Maximum similarity: 0.7200
- Mean similarity: 0.2718
- Cross-archetype mean: 0.2652
- Same-archetype mean: 0.3077
- Largest probable-clone cluster: 1 surface
- Universal business-renderer usage ratio: 0.0492
- Empty shells: 0

The Gate remains `FAIL` because expected-vs-actual archetype validation identifies surfaces requiring specification review or architecture correction. The result is intentionally not weakened by changing thresholds.

Machine-readable live state: `config/page-differentiation-progress.json`.
