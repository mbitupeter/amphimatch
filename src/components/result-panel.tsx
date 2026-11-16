"use client";

import {
  AlertTriangleIcon,
  DnaIcon,
  MapPinIcon,
  ShieldAlertIcon,
  TreesIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IucnStatus } from "@/lib/amphibians";
import type { ClassificationResult } from "@/lib/inference";
import { cn } from "@/lib/utils";
import { PipelineTracker } from "./pipeline-tracker";

const IUCN_STYLE: Record<IucnStatus, string> = {
  "Least Concern": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Near Threatened": "bg-lime-500/15 text-lime-700 dark:text-lime-300",
  Vulnerable: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Endangered: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  "Critically Endangered": "bg-red-500/15 text-red-700 dark:text-red-300",
};

const ORDER_LABEL = {
  Anura: "Frogs & toads",
  Caudata: "Salamanders & newts",
  Gymnophiona: "Caecilians",
} as const;

function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ResultPanel({ result }: { result: ClassificationResult }) {
  const { prediction, candidates, stats } = result;
  const species = prediction.species;
  const passedReads = stats.readCount - stats.filteredReads;
  const totalMs = result.stages.reduce((a, s) => a + s.durationMs, 0);

  return (
    <div className="grid gap-6">
      {result.qcWarnings.length > 0 && (
        <Alert variant={result.qcPassed ? "default" : "destructive"}>
          <AlertTriangleIcon />
          <AlertTitle>
            {result.qcPassed ? "Quality warnings" : "Quality control failed"}
          </AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {result.qcWarnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden border-emerald-500/30">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardHeader>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>Top prediction</span>
            <Badge variant="outline">{species.order} · {ORDER_LABEL[species.order]}</Badge>
            <Badge variant="outline">{species.family}</Badge>
          </CardDescription>
          <CardTitle className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {species.commonName}
          </CardTitle>
          <p className="text-lg italic text-muted-foreground">{species.scientificName}</p>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="grid gap-4">
            <p className="text-sm leading-relaxed">{species.note}</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Range</dt>
                  <dd>{species.region}</dd>
                </div>
              </div>
              <div className="flex gap-2">
                <TreesIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Habitat</dt>
                  <dd>{species.habitat}</dd>
                </div>
              </div>
              <div className="flex gap-2">
                <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">IUCN Red List</dt>
                  <dd>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-xs font-medium",
                        IUCN_STYLE[species.iucnStatus],
                      )}
                    >
                      {species.iucnStatus}
                    </span>
                  </dd>
                </div>
              </div>
              <div className="flex gap-2">
                <DnaIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Reference marker</dt>
                  <dd>{species.marker}</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="flex flex-col justify-center rounded-xl border bg-muted/40 p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Confidence
            </p>
            <p className="mt-1 font-mono text-5xl font-semibold tabular-nums">
              {pct(prediction.confidence, 1)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {prediction.supportingReads.toLocaleString()} of{" "}
              {passedReads.toLocaleString()} QC-passed reads voted for this species
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="candidates">
        <TabsList>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="qc">Read QC</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="json">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="candidates">
          <Card>
            <CardHeader>
              <CardTitle>Top {candidates.length} candidate species</CardTitle>
              <CardDescription>
                Softmax-style confidence over the {result.model.classes}-species reference
                panel. The remainder is assigned to &ldquo;no match&rdquo;.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {candidates.map((c, i) => (
                <div key={c.species.id} className="grid gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="w-4 shrink-0 font-mono text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="truncate font-medium">{c.species.commonName}</span>
                      <span className="hidden truncate text-muted-foreground italic sm:inline">
                        {c.species.scientificName}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono tabular-nums">
                      {pct(c.confidence)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        i === 0 ? "bg-emerald-500" : "bg-foreground/35",
                      )}
                      style={{ width: `${Math.max(c.confidence * 100, 0.5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qc">
          <Card>
            <CardHeader>
              <CardTitle>Read quality summary</CardTitle>
              <CardDescription>
                Computed from the uploaded file. Reads with mean Phred &lt; 20 or
                shorter than 50 bp are filtered before inference.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Reads" value={stats.readCount.toLocaleString()} />
                <Stat
                  label="Passed QC"
                  value={passedReads.toLocaleString()}
                  hint={`${stats.filteredReads.toLocaleString()} filtered`}
                />
                <Stat label="Total bases" value={stats.totalBases.toLocaleString()} />
                <Stat
                  label="Read length"
                  value={`${stats.meanReadLength.toFixed(0)} bp`}
                  hint={`${stats.minReadLength}–${stats.maxReadLength} bp`}
                />
                <Stat label="GC content" value={pct(stats.gcContent)} />
                <Stat label="Mean quality" value={`Q${stats.meanQuality.toFixed(1)}`} />
                <Stat label="Bases ≥ Q30" value={pct(stats.q30Fraction)} />
                <Stat label="Ambiguous (N)" value={pct(stats.nFraction, 2)} />
              </div>
              <Separator />
              <div className="grid gap-2 text-sm">
                <p className="text-xs text-muted-foreground">Base composition</p>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {(["A", "C", "G", "T", "N"] as const).map((b) => {
                    const share = stats.baseComposition[b] / Math.max(stats.totalBases, 1);
                    const colors = {
                      A: "bg-emerald-500",
                      C: "bg-sky-500",
                      G: "bg-amber-500",
                      T: "bg-rose-500",
                      N: "bg-zinc-400",
                    };
                    return (
                      <div
                        key={b}
                        className={colors[b]}
                        style={{ width: `${share * 100}%` }}
                        title={`${b}: ${pct(share)}`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
                  {(["A", "C", "G", "T", "N"] as const).map((b) => (
                    <span key={b}>
                      {b} {pct(stats.baseComposition[b] / Math.max(stats.totalBases, 1))}
                    </span>
                  ))}
                </div>
              </div>
              {stats.firstHeader && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground">First read header</p>
                    <p className="mt-1 truncate font-mono text-xs">@{stats.firstHeader}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Serving pipeline</CardTitle>
              <CardDescription>
                End-to-end latency {totalMs} ms · model {result.model.name} v
                {result.model.version} · request {result.requestId.slice(0, 8)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <PipelineTracker activeIndex={result.stages.length} stages={result.stages} done />
              <Separator />
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Input file</dt>
                  <dd className="truncate font-mono text-xs">
                    {result.file.name} · {formatBytes(result.file.sizeBytes)}
                    {result.file.gzip ? " · gzip" : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">SHA-256</dt>
                  <dd className="truncate font-mono text-xs">{result.file.sha256}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Random seed</dt>
                  <dd className="font-mono text-xs">
                    {result.seed.value}{" "}
                    <span className="text-muted-foreground">
                      ({result.seed.source === "content-hash"
                        ? "derived from file hash — reproducible"
                        : "fresh random seed"})
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Completed</dt>
                  <dd className="font-mono text-xs">
                    {new Date(result.completedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle>API response</CardTitle>
              <CardDescription>
                Exactly what <code className="font-mono">POST /api/classify</code> returned.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[480px] overflow-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
