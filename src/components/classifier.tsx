"use client";

import {
  DicesIcon,
  FileUpIcon,
  FlaskConicalIcon,
  RotateCcwIcon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FASTQ_EXTENSIONS, hasFastqExtension } from "@/lib/fastq";
import type { ClassificationResult } from "@/lib/inference";
import { cn } from "@/lib/utils";
import { PipelineTracker, STAGE_TEMPLATE } from "./pipeline-tracker";
import { ResultPanel } from "./result-panel";

type Status =
  | { kind: "idle" }
  | { kind: "running"; file: File; stage: number }
  | { kind: "success"; file: File; result: ClassificationResult }
  | { kind: "error"; file: File | null; message: string; line?: number };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function Classifier() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Advance the stage indicator while the request is in flight so the user
  // sees the pipeline progressing even though the API responds quickly.
  useEffect(() => {
    if (status.kind !== "running") return;
    if (status.stage >= STAGE_TEMPLATE.length - 1) return;
    const t = setTimeout(() => {
      setStatus((s) => (s.kind === "running" ? { ...s, stage: s.stage + 1 } : s));
    }, 350);
    return () => clearTimeout(t);
  }, [status]);

  const run = useCallback(async (file: File, seed: "content-hash" | "random") => {
    if (!hasFastqExtension(file.name)) {
      setStatus({
        kind: "error",
        file,
        message: `"${file.name}" is not a FASTQ file. Supported extensions: ${FASTQ_EXTENSIONS.join(", ")}.`,
      });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ kind: "running", file, stage: 0 });

    const form = new FormData();
    form.append("file", file);
    form.append("seed", seed);

    const started = performance.now();
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const body = await res.json();
      // Let the stage animation finish so the pipeline doesn't flash past.
      const minDuration = STAGE_TEMPLATE.length * 350;
      const elapsed = performance.now() - started;
      if (elapsed < minDuration) {
        await new Promise((r) => setTimeout(r, minDuration - elapsed));
      }
      if (controller.signal.aborted) return;
      if (!res.ok) {
        setStatus({
          kind: "error",
          file,
          message: body.error ?? `Request failed with status ${res.status}.`,
          line: body.line,
        });
        return;
      }
      setStatus({ kind: "success", file, result: body as ClassificationResult });
    } catch (e) {
      if (controller.signal.aborted) return;
      setStatus({
        kind: "error",
        file,
        message:
          e instanceof Error ? `Could not reach the classifier: ${e.message}` : "Unknown error.",
      });
    }
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) void run(file, "content-hash");
    },
    [run],
  );

  const loadSample = useCallback(async () => {
    setStatus({ kind: "running", file: new File([], "sample.fastq"), stage: 0 });
    try {
      const res = await fetch(`/api/sample?reads=400&length=150`);
      if (!res.ok) throw new Error(`sample endpoint returned ${res.status}`);
      const seed = res.headers.get("X-Sample-Seed") ?? "demo";
      const blob = await res.blob();
      const file = new File([blob], `amphimatch-sample-${seed}.fastq`, {
        type: "text/plain",
      });
      await run(file, "content-hash");
    } catch (e) {
      setStatus({
        kind: "error",
        file: null,
        message:
          e instanceof Error ? `Could not generate a sample: ${e.message}` : "Unknown error.",
      });
    }
  }, [run]);

  const reset = () => {
    abortRef.current?.abort();
    setStatus({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const currentFile = status.kind === "idle" ? null : status.file;

  return (
    <div className="grid gap-6">
      {status.kind === "idle" || status.kind === "error" ? (
        <Card
          className={cn(
            "border-2 border-dashed transition-colors",
            dragging && "border-primary bg-primary/5",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloudIcon className="size-7" />
            </div>
            <div className="grid gap-1">
              <p className="text-lg font-medium">Drop a FASTQ file to identify the species</p>
              <p className="text-sm text-muted-foreground">
                Accepts {FASTQ_EXTENSIONS.join(", ")} up to 25 MB. Files are processed in
                memory and never stored.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={() => inputRef.current?.click()}>
                <FileUpIcon data-icon="inline-start" />
                Choose file
              </Button>
              <Button variant="outline" onClick={loadSample}>
                <FlaskConicalIcon data-icon="inline-start" />
                Try a synthetic sample
              </Button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".fastq,.fq,.gz,text/plain,application/gzip"
              className="sr-only"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </CardContent>
        </Card>
      ) : null}

      {status.kind === "error" && (
        <Alert variant="destructive">
          <XCircleIcon />
          <AlertTitle>Classification failed</AlertTitle>
          <AlertDescription>
            <p>
              {status.message}
              {status.line ? ` (line ${status.line})` : ""}
            </p>
            {status.file && status.file.size > 0 && (
              <p className="font-mono text-xs">
                {status.file.name} · {formatBytes(status.file.size)}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {(status.kind === "running" || status.kind === "success") && currentFile && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileUpIcon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{currentFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentFile.size > 0 ? formatBytes(currentFile.size) : "generating…"}
                {status.kind === "running" ? " · running pipeline" : " · complete"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {status.kind === "success" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => run(currentFile, "random")}
                title="Re-run inference with a fresh random seed"
              >
                <DicesIcon data-icon="inline-start" />
                Re-roll
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcwIcon data-icon="inline-start" />
              New upload
            </Button>
          </div>
        </div>
      )}

      {status.kind === "running" && (
        <Card>
          <CardContent className="grid gap-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Running the AmphiMatch inference pipeline…
            </p>
            <PipelineTracker activeIndex={status.stage} />
          </CardContent>
        </Card>
      )}

      {status.kind === "success" && <ResultPanel result={status.result} />}
    </div>
  );
}
