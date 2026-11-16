import { Badge } from "@/components/ui/badge";
import { AMPHIBIANS, type IucnStatus } from "@/lib/amphibians";
import { cn } from "@/lib/utils";

const IUCN_DOT: Record<IucnStatus, string> = {
  "Least Concern": "bg-emerald-500",
  "Near Threatened": "bg-lime-500",
  Vulnerable: "bg-amber-500",
  Endangered: "bg-orange-500",
  "Critically Endangered": "bg-red-500",
};

export function SpeciesCatalog() {
  const byOrder = AMPHIBIANS.reduce<Record<string, typeof AMPHIBIANS>>((acc, a) => {
    (acc[a.order] ??= []).push(a);
    return acc;
  }, {});

  return (
    <section id="catalog" className="grid gap-6">
      <div className="grid gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">Reference catalog</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          The {AMPHIBIANS.length} species the mock classifier can return. In production this
          catalog would be the label space of the trained model and the source of the
          metadata shown with each prediction.
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(byOrder).map(([order, species]) => (
          <div key={order} className="grid gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{order}</h3>
              <Badge variant="outline">{species.length}</Badge>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {species.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.commonName}</p>
                    <p className="truncate text-xs italic text-muted-foreground">
                      {s.scientificName}
                    </p>
                  </div>
                  <span
                    className="mt-1 flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"
                    title={`IUCN: ${s.iucnStatus}`}
                  >
                    <span className={cn("size-2 rounded-full", IUCN_DOT[s.iucnStatus])} />
                    {s.marker}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
