import {
  ActivityIcon,
  BrainCircuitIcon,
  DatabaseIcon,
  FilterIcon,
  HardDriveUploadIcon,
  LayersIcon,
  SendIcon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Component {
  icon: LucideIcon;
  title: string;
  role: string;
  production: string;
  demo: string;
  status: "implemented" | "mocked" | "out of scope";
}

const COMPONENTS: Component[] = [
  {
    icon: HardDriveUploadIcon,
    title: "Data ingestion",
    role: "Accept raw sequencing output from field or lab devices.",
    production: "Object storage bucket + upload API with checksums and resumable transfers.",
    demo: "Multipart upload to POST /api/classify, SHA-256 checksum, gzip auto-detect, 25 MB cap.",
    status: "implemented",
  },
  {
    icon: FilterIcon,
    title: "Preprocessing & QC",
    role: "Validate FASTQ structure and drop reads that would mislead the model.",
    production: "fastp / Trimmomatic step in a workflow engine (Nextflow, Airflow).",
    demo: "Streaming parser validates 4-line records and Phred+33, computes GC, Q30 and base composition, filters reads < Q20 or < 50 bp.",
    status: "implemented",
  },
  {
    icon: LayersIcon,
    title: "Feature extraction",
    role: "Turn variable-length reads into fixed-size numeric vectors.",
    production: "k-mer frequency vectors or learned embeddings from a DNA foundation model.",
    demo: "Stage is represented in the pipeline tracker; vectors are not materialised.",
    status: "mocked",
  },
  {
    icon: BrainCircuitIcon,
    title: "Model inference",
    role: "Assign each read to a species and aggregate into a sample-level call.",
    production: "Classifier trained on 16S / COI barcodes, served behind a model registry with versioned artifacts.",
    demo: "Seeded random generator selects from the 22-species catalog and fabricates a top-5 confidence distribution. Same file → same answer.",
    status: "mocked",
  },
  {
    icon: DatabaseIcon,
    title: "Reference catalog",
    role: "Species metadata returned alongside the prediction.",
    production: "Curated taxonomy database synced from AmphibiaWeb / IUCN.",
    demo: "Static catalog in src/lib/amphibians.ts exposed at GET /api/species.",
    status: "implemented",
  },
  {
    icon: SendIcon,
    title: "Serving & UI",
    role: "Return results to field biologists quickly, on any device.",
    production: "Autoscaled API, async job queue for large runs, result history per user.",
    demo: "Next.js route handlers and a responsive React interface with pipeline progress.",
    status: "implemented",
  },
  {
    icon: ActivityIcon,
    title: "Monitoring & feedback",
    role: "Track drift, latency and expert corrections to retrain the model.",
    production: "Metrics dashboard, label-correction workflow, scheduled retraining.",
    demo: "Per-stage latency is reported in each response; no persistence.",
    status: "out of scope",
  },
];

const STATUS_VARIANT = {
  implemented: "default",
  mocked: "secondary",
  "out of scope": "outline",
} as const;

export function Architecture() {
  return (
    <section id="architecture" className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">System architecture</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          AmphiMatch identifies amphibian species from environmental DNA or tissue
          sequencing reads. The demo wires up the full request path end to end, with the
          learned model swapped for a seeded random generator so the system can be exercised
          without a trained classifier.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {COMPONENTS.map((c) => (
          <Card key={c.title} className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <c.icon className="size-4" />
                </div>
                <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
              </div>
              <CardTitle className="pt-2">{c.title}</CardTitle>
              <CardDescription>{c.role}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Production design
                </p>
                <p className="mt-1">{c.production}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  In this demo
                </p>
                <p className="mt-1">{c.demo}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
