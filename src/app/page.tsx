import { DnaIcon } from "lucide-react";
import { Architecture } from "@/components/architecture";
import { Classifier } from "@/components/classifier";
import { SpeciesCatalog } from "@/components/species-catalog";
import { Badge } from "@/components/ui/badge";
import { AMPHIBIANS } from "@/lib/amphibians";
import { MODEL_INFO } from "@/lib/inference";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="#" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <DnaIcon className="size-5" />
            </span>
            <span className="grid leading-tight">
              <span className="font-semibold tracking-tight">AmphiMatch</span>
              <span className="text-xs text-muted-foreground">
                Amphibian species ID from FASTQ
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
            <a href="#classify" className="hover:text-foreground">
              Classify
            </a>
            <a href="#architecture" className="hover:text-foreground">
              Architecture
            </a>
            <a href="#catalog" className="hover:text-foreground">
              Catalog
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <section id="classify" className="grid gap-8">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Demo build</Badge>
              <Badge variant="outline">
                {MODEL_INFO.name} v{MODEL_INFO.version}
              </Badge>
              <Badge variant="outline">{AMPHIBIANS.length} species in panel</Badge>
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
              Upload sequencing reads, get back the amphibian they came from.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              This is a working end-to-end slice of the AmphiMatch ML system. The FASTQ
              parsing, quality control and serving layers are real; the species classifier
              is stood in for by a seeded random generator over the reference catalog.
            </p>
          </div>

          <Classifier />
        </section>

        <div className="my-16 border-t" />

        <Architecture />

        <div className="my-16 border-t" />

        <SpeciesCatalog />
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            AmphiMatch demo. Predictions are randomly generated and must not be used for
            research or conservation decisions.
          </p>
          <p className="font-mono">
            POST /api/classify · GET /api/species · GET /api/sample
          </p>
        </div>
      </footer>
    </div>
  );
}
