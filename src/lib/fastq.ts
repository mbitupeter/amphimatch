export interface FastqStats {
  readCount: number;
  totalBases: number;
  minReadLength: number;
  maxReadLength: number;
  meanReadLength: number;
  gcContent: number;
  /** Mean Phred quality, assuming Phred+33 encoding. */
  meanQuality: number;
  /** Fraction of bases with Phred >= 30. */
  q30Fraction: number;
  nFraction: number;
  baseComposition: Record<"A" | "C" | "G" | "T" | "N" | "other", number>;
  firstHeader: string | null;
  /** Reads dropped by the QC filter (mean Phred < 20 or length < 50). */
  filteredReads: number;
}

export class FastqParseError extends Error {
  constructor(
    message: string,
    public readonly line?: number,
  ) {
    super(message);
    this.name = "FastqParseError";
  }
}

const MIN_READ_LENGTH = 50;
const MIN_MEAN_QUALITY = 20;

/**
 * Parses FASTQ text, validates the four-line record structure and computes
 * summary statistics. Throws FastqParseError on malformed input.
 */
export function parseFastq(text: string): FastqStats {
  const lines = text.split(/\r?\n/);
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

  if (lines.length === 0) {
    throw new FastqParseError("The file is empty.");
  }
  if (lines[0][0] !== "@") {
    throw new FastqParseError(
      "Not a FASTQ file: the first line must start with '@'. FASTA files (starting with '>') are not supported.",
      1,
    );
  }
  if (lines.length % 4 !== 0) {
    throw new FastqParseError(
      `Malformed FASTQ: expected records of four lines, but the file has ${lines.length} lines.`,
    );
  }

  const composition = { A: 0, C: 0, G: 0, T: 0, N: 0, other: 0 };
  let readCount = 0;
  let totalBases = 0;
  let minLen = Number.POSITIVE_INFINITY;
  let maxLen = 0;
  let qualitySum = 0;
  let q30 = 0;
  let filtered = 0;

  for (let i = 0; i < lines.length; i += 4) {
    const header = lines[i];
    const seq = lines[i + 1].trim();
    const plus = lines[i + 2];
    const qual = lines[i + 3].trim();

    if (header[0] !== "@") {
      throw new FastqParseError("Record header must start with '@'.", i + 1);
    }
    if (plus[0] !== "+") {
      throw new FastqParseError("Separator line must start with '+'.", i + 3);
    }
    if (seq.length !== qual.length) {
      throw new FastqParseError(
        `Sequence length (${seq.length}) does not match quality length (${qual.length}).`,
        i + 2,
      );
    }
    if (seq.length === 0) {
      throw new FastqParseError("Empty sequence line.", i + 2);
    }

    let readQualSum = 0;
    for (let j = 0; j < seq.length; j++) {
      const base = seq[j].toUpperCase();
      if (base in composition) {
        composition[base as keyof typeof composition]++;
      } else {
        composition.other++;
      }
      const phred = qual.charCodeAt(j) - 33;
      if (phred < 0 || phred > 93) {
        throw new FastqParseError(
          "Quality string contains characters outside the Phred+33 range.",
          i + 4,
        );
      }
      readQualSum += phred;
      if (phred >= 30) q30++;
    }

    const meanReadQual = readQualSum / seq.length;
    if (meanReadQual < MIN_MEAN_QUALITY || seq.length < MIN_READ_LENGTH) {
      filtered++;
    }

    readCount++;
    totalBases += seq.length;
    qualitySum += readQualSum;
    minLen = Math.min(minLen, seq.length);
    maxLen = Math.max(maxLen, seq.length);
  }

  const gc = composition.G + composition.C;
  const acgt = gc + composition.A + composition.T;

  return {
    readCount,
    totalBases,
    minReadLength: minLen,
    maxReadLength: maxLen,
    meanReadLength: totalBases / readCount,
    gcContent: acgt > 0 ? gc / acgt : 0,
    meanQuality: totalBases > 0 ? qualitySum / totalBases : 0,
    q30Fraction: totalBases > 0 ? q30 / totalBases : 0,
    nFraction: totalBases > 0 ? composition.N / totalBases : 0,
    baseComposition: composition,
    firstHeader: lines[0].slice(1).trim() || null,
    filteredReads: filtered,
  };
}

export const FASTQ_EXTENSIONS = [".fastq", ".fq", ".fastq.gz", ".fq.gz"];

export function hasFastqExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return FASTQ_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isGzipName(name: string): boolean {
  return name.toLowerCase().endsWith(".gz");
}
