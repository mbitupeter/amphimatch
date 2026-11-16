"use client";

import { CheckIcon, LoaderCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineStage } from "@/lib/inference";

export const STAGE_TEMPLATE: Omit<PipelineStage, "durationMs">[] = [
  { id: "ingest", label: "Ingestion", description: "Upload, checksum, gzip detection" },
  { id: "qc", label: "Parsing & QC", description: "Validate FASTQ, filter reads" },
  { id: "features", label: "Feature extraction", description: "k-mer profiles" },
  { id: "inference", label: "Model inference", description: "Species classifier" },
  { id: "postprocess", label: "Post-processing", description: "Aggregate votes" },
];

interface Props {
  /** Index of the stage currently running; stages before it are complete. */
  activeIndex: number;
  stages?: PipelineStage[];
  done?: boolean;
}

export function PipelineTracker({ activeIndex, stages, done }: Props) {
  const items: (Omit<PipelineStage, "durationMs"> & { durationMs?: number })[] =
    stages ?? STAGE_TEMPLATE;
  return (
    <ol className="grid gap-2 sm:grid-cols-5">
      {items.map((stage, i) => {
        const complete = done || i < activeIndex;
        const active = !done && i === activeIndex;
        return (
          <li
            key={stage.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border p-3 transition-colors sm:flex-col sm:gap-2",
              complete && "border-emerald-500/40 bg-emerald-500/5",
              active && "border-primary bg-primary/5",
              !complete && !active && "opacity-60",
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
                complete && "border-emerald-500 bg-emerald-500 text-white",
                active && "border-primary text-primary",
              )}
            >
              {complete ? (
                <CheckIcon className="size-3.5" />
              ) : active ? (
                <LoaderCircleIcon className="size-3.5 animate-spin" />
              ) : (
                i + 1
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">{stage.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stage.description}
              </p>
              {stage.durationMs !== undefined && complete && (
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {stage.durationMs} ms
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
