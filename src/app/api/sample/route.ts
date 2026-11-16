import { type NextRequest } from "next/server";
import { mulberry32, randomSeed } from "@/lib/rng";

const BASES = "ACGT";

/**
 * Generates a synthetic FASTQ file so the demo can be tried without real
 * sequencing data. Reads are random, which is all the mock model needs.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const reads = Math.min(Math.max(Number(params.get("reads")) || 250, 1), 5000);
  const length = Math.min(Math.max(Number(params.get("length")) || 150, 20), 500);
  const seedParam = params.get("seed");
  const seed = seedParam ? Number(seedParam) >>> 0 : randomSeed();
  const rand = mulberry32(seed);

  const lines: string[] = [];
  for (let i = 0; i < reads; i++) {
    let seq = "";
    let qual = "";
    for (let j = 0; j < length; j++) {
      seq += BASES[Math.floor(rand() * 4)];
      // Quality decays toward the 3' end, like a real Illumina read.
      const base = 38 - Math.floor((j / length) * 10);
      const phred = Math.max(2, Math.min(41, base + Math.floor(rand() * 6) - 3));
      qual += String.fromCharCode(phred + 33);
    }
    lines.push(
      `@AMPHIMATCH_DEMO:1:${seed}:${i + 1} 1:N:0:ACGTAC`,
      seq,
      "+",
      qual,
    );
  }

  const body = lines.join("\n") + "\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="amphimatch-sample-${seed}.fastq"`,
      "X-Sample-Seed": String(seed),
      "Cache-Control": "no-store",
    },
  });
}
