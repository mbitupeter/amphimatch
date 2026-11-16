import { createHash, randomUUID } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { NextResponse, type NextRequest } from "next/server";
import { FastqParseError, hasFastqExtension, isGzipName, parseFastq } from "@/lib/fastq";
import { classify, MODEL_INFO, type ClassificationResult } from "@/lib/inference";
import { randomSeed, seedFromHex } from "@/lib/rng";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function error(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("Expected multipart/form-data with a 'file' field.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return error("No file was uploaded. Attach a FASTQ file in the 'file' field.");
  }
  if (file.size === 0) {
    return error("The uploaded file is empty.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). The demo accepts up to 25 MB.`,
      413,
    );
  }
  if (!hasFastqExtension(file.name)) {
    return error(
      `Unsupported file type "${file.name}". Upload a .fastq, .fq, .fastq.gz or .fq.gz file.`,
      415,
    );
  }

  const seedMode = form.get("seed") === "random" ? "random" : "content-hash";

  const raw = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(raw).digest("hex");

  let decoded: Buffer;
  const gzip = isGzipName(file.name) || (raw[0] === 0x1f && raw[1] === 0x8b);
  try {
    decoded = gzip ? gunzipSync(raw) : raw;
  } catch {
    return error("The file looks gzip-compressed but could not be decompressed.");
  }
  const text = decoded.toString("utf8");
  // Seed from the decompressed reads so sample.fastq and sample.fastq.gz agree.
  const contentHash = gzip ? createHash("sha256").update(decoded).digest("hex") : sha256;

  const parseStart = performance.now();
  let stats;
  try {
    stats = parseFastq(text);
  } catch (e) {
    if (e instanceof FastqParseError) {
      return error(e.message, 422, { line: e.line });
    }
    throw e;
  }
  const parseDurationMs = performance.now() - parseStart;

  const seed = seedMode === "random" ? randomSeed() : seedFromHex(contentHash);
  const inference = classify(stats, seed, parseDurationMs);

  const result: ClassificationResult = {
    requestId: randomUUID(),
    file: { name: file.name, sizeBytes: file.size, sha256, gzip },
    seed: { value: seed, source: seedMode },
    stats,
    ...inference,
    model: MODEL_INFO,
    completedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
