# AmphiMatch demo

A working end-to-end demo of **AmphiMatch**, an ML system that identifies amphibian
species from DNA sequencing reads. Upload a FASTQ file and the app returns the
amphibian the reads most likely came from, along with a confidence distribution,
read-quality statistics and per-stage pipeline latency.

The FASTQ ingestion, parsing, quality control and serving layers are real. The
species classifier is a **stand-in**: a seeded random generator picks from a
22-species reference catalog and fabricates a plausible top-5 confidence
distribution. The seed is derived from the SHA-256 of the uploaded reads, so the
same file always yields the same species; the "Re-roll" button re-runs inference
with a fresh random seed.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:4826>. Drop a `.fastq`, `.fq`, `.fastq.gz` or `.fq.gz`
file (up to 25 MB) onto the page, or click **Try a synthetic sample** to generate
one.

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

## API

| Method | Path            | Description                                                                 |
| ------ | --------------- | --------------------------------------------------------------------------- |
| `POST` | `/api/classify` | Multipart form with a `file` field. Optional `seed=random` field for a fresh random seed. |
| `GET`  | `/api/sample`   | Generates a synthetic FASTQ file. Query params: `reads` (≤ 5000), `length` (≤ 500), `seed`. |
| `GET`  | `/api/species`  | Returns the reference catalog and model metadata.                           |

Example:

```bash
curl -s "http://localhost:4826/api/sample?reads=300" -o sample.fastq
curl -s -F "file=@sample.fastq" http://localhost:4826/api/classify | jq '.prediction.species.commonName, .prediction.confidence'
```

Malformed uploads return `4xx` with an `error` message and, where applicable,
the offending `line` number.

## Architecture

| Component               | In this demo                                                                 |
| ----------------------- | ---------------------------------------------------------------------------- |
| Data ingestion          | Multipart upload, SHA-256 checksum, gzip auto-detect, 25 MB cap              |
| Preprocessing & QC      | FASTQ validation, Phred+33 check, GC / Q30 / base composition, read filter   |
| Feature extraction      | Represented in the pipeline tracker only                                     |
| Model inference         | Seeded random generator over the catalog (`src/lib/inference.ts`)           |
| Reference catalog       | Static list in `src/lib/amphibians.ts`                                       |
| Serving & UI            | Next.js route handlers + React UI with live pipeline progress                |
| Monitoring & feedback   | Per-stage latency in every response; no persistence                          |

## Stack

Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui, lucide-react.

## Project layout

```
src/
  app/
    page.tsx                 landing page: classifier, architecture, catalog
    api/classify/route.ts    upload → parse → QC → mock inference
    api/sample/route.ts      synthetic FASTQ generator
    api/species/route.ts     reference catalog
  components/
    classifier.tsx           upload dropzone and request lifecycle
    pipeline-tracker.tsx     animated stage indicator
    result-panel.tsx         prediction, candidates, QC, pipeline, raw JSON
    architecture.tsx         system design overview
    species-catalog.tsx      catalog listing
  lib/
    amphibians.ts            species list
    fastq.ts                 FASTQ parser and statistics
    inference.ts             mock model
    rng.ts                   seeded PRNG helpers
```
