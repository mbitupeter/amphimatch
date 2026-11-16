import { AMPHIBIANS, type Amphibian } from "./amphibians";
import type { FastqStats } from "./fastq";
import { mulberry32, shuffle } from "./rng";

export const MODEL_INFO = {
  name: "AmphiMatch k-mer classifier",
  version: "0.3.1-demo",
  kmerSize: 6,
  referenceDb: "AmphiRef mock panel",
  classes: AMPHIBIANS.length,
} as const;

export interface Candidate {
  species: Amphibian;
  confidence: number;
  /** Reads (after QC) whose k-mer profile the mock model assigned to this class. */
  supportingReads: number;
}

export interface PipelineStage {
  id: string;
  label: string;
  description: string;
  durationMs: number;
}

export interface ClassificationResult {
  requestId: string;
  file: { name: string; sizeBytes: number; sha256: string; gzip: boolean };
  seed: { value: number; source: "content-hash" | "random" };
  stats: FastqStats;
  prediction: Candidate;
  candidates: Candidate[];
  qcPassed: boolean;
  qcWarnings: string[];
  stages: PipelineStage[];
  model: typeof MODEL_INFO;
  completedAt: string;
}

export const TOP_K = 5;

/**
 * Mock model. A seeded random generator picks a species from the catalog and
 * fabricates a plausible confidence distribution over the top-k candidates.
 * Everything else (QC, read counting) is computed from the real upload.
 */
export function classify(
  stats: FastqStats,
  seed: number,
  parseDurationMs: number,
): Pick<
  ClassificationResult,
  "prediction" | "candidates" | "qcPassed" | "qcWarnings" | "stages"
> {
  const rand = mulberry32(seed);
  const ranked = shuffle(AMPHIBIANS, rand).slice(0, TOP_K);

  const passedReads = Math.max(stats.readCount - stats.filteredReads, 0);
  const qcPassed = passedReads > 0;

  // Top class gets 52–97 %, the remainder is split across the other candidates.
  const topConfidence = 0.52 + rand() * 0.45;
  const weights = Array.from({ length: TOP_K - 1 }, () => rand() + 0.05).sort(
    (a, b) => b - a,
  );
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const remainder = 1 - topConfidence;
  // Keep ~3 % unassigned to represent reads that matched nothing in the panel.
  const assignable = remainder * (0.9 + rand() * 0.08);

  const confidences = [
    topConfidence,
    ...weights.map((w) => (w / weightSum) * assignable),
  ];

  const candidates: Candidate[] = ranked.map((species, i) => ({
    species,
    confidence: confidences[i],
    supportingReads: Math.round(confidences[i] * passedReads),
  }));

  const qcWarnings: string[] = [];
  if (!qcPassed) {
    qcWarnings.push(
      "No reads passed quality control (mean Phred ≥ 20 and length ≥ 50 bp).",
    );
  }
  if (stats.readCount < 100) {
    qcWarnings.push(
      `Only ${stats.readCount} reads were supplied; production runs expect at least 100 reads for a stable call.`,
    );
  }
  if (stats.filteredReads / Math.max(stats.readCount, 1) > 0.25) {
    qcWarnings.push(
      `${Math.round((stats.filteredReads / stats.readCount) * 100)}% of reads were filtered during QC.`,
    );
  }
  if (stats.nFraction > 0.02) {
    qcWarnings.push(
      `Ambiguous bases (N) make up ${(stats.nFraction * 100).toFixed(1)}% of the data.`,
    );
  }
  if (stats.meanQuality < 25) {
    qcWarnings.push(
      `Mean base quality is low (Q${stats.meanQuality.toFixed(1)}).`,
    );
  }

  const stages: PipelineStage[] = [
    {
      id: "ingest",
      label: "Ingestion",
      description: "Upload received, checksum computed, gzip detected",
      durationMs: Math.round(2 + rand() * 6),
    },
    {
      id: "qc",
      label: "Parsing & QC",
      description: "FASTQ validated, low-quality and short reads filtered",
      durationMs: Math.max(1, Math.round(parseDurationMs)),
    },
    {
      id: "features",
      label: "Feature extraction",
      description: `${MODEL_INFO.kmerSize}-mer frequency profile per read`,
      durationMs: Math.round(8 + rand() * 30 + passedReads * 0.01),
    },
    {
      id: "inference",
      label: "Model inference",
      description: `${MODEL_INFO.name} v${MODEL_INFO.version}`,
      durationMs: Math.round(15 + rand() * 60),
    },
    {
      id: "postprocess",
      label: "Post-processing",
      description: "Per-read votes aggregated into species confidence",
      durationMs: Math.round(1 + rand() * 4),
    },
  ];

  return {
    prediction: candidates[0],
    candidates,
    qcPassed,
    qcWarnings,
    stages,
  };
}
