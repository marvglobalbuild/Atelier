import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Scale,
  Scissors,
  Printer,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { shortDate, longDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CustomerMeasurementValue {
  id: string;
  label: string;
  value: number;
  position: number;
}

export interface CustomerMeasurementSet {
  id: string;
  garment: string;
  unit: string;
  taken_on: string;
  created_at: string;
  customer_measurement_values: CustomerMeasurementValue[];
}

export interface MeasurementComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  sets: CustomerMeasurementSet[];
}

export function MeasurementComparisonModal({
  open,
  onOpenChange,
  customerName,
  sets = [],
}: MeasurementComparisonModalProps) {
  const [copied, setCopied] = useState(false);

  // Default to comparing the latest set with the second most recent set
  const [targetSetId, setTargetSetId] = useState<string>(() => sets[0]?.id ?? "");
  const [baseSetId, setBaseSetId] = useState<string>(() => sets[1]?.id ?? sets[0]?.id ?? "");

  // Update selected IDs if sets change
  const currentBaseId = baseSetId || (sets[1]?.id ?? sets[0]?.id ?? "");
  const currentTargetId = targetSetId || (sets[0]?.id ?? "");

  const baseSet = useMemo(
    () => sets.find((s) => s.id === currentBaseId) ?? sets[1] ?? sets[0],
    [sets, currentBaseId],
  );
  const targetSet = useMemo(
    () => sets.find((s) => s.id === currentTargetId) ?? sets[0],
    [sets, currentTargetId],
  );

  // Comparison computation
  const comparison = useMemo(() => {
    if (!baseSet || !targetSet) return null;

    const baseValuesMap = new Map<string, number>();
    baseSet.customer_measurement_values.forEach((v) => {
      baseValuesMap.set(v.label.toLowerCase().trim(), Number(v.value));
    });

    const targetValuesMap = new Map<string, number>();
    targetSet.customer_measurement_values.forEach((v) => {
      targetValuesMap.set(v.label.toLowerCase().trim(), Number(v.value));
    });

    // Collect all unique labels
    const allLabels: string[] = [];
    const seen = new Set<string>();

    // Order first by target set positions, then base set positions
    const sortedTarget = [...targetSet.customer_measurement_values].sort(
      (a, z) => a.position - z.position,
    );
    for (const v of sortedTarget) {
      const key = v.label.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        allLabels.push(v.label);
      }
    }

    const sortedBase = [...baseSet.customer_measurement_values].sort(
      (a, z) => a.position - z.position,
    );
    for (const v of sortedBase) {
      const key = v.label.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        allLabels.push(v.label);
      }
    }

    let significantChangesCount = 0;
    let netWaistDelta: number | null = null;
    let netBustDelta: number | null = null;
    let netHipDelta: number | null = null;

    const rows = allLabels.map((label) => {
      const key = label.toLowerCase().trim();
      const baseVal = baseValuesMap.get(key);
      const targetVal = targetValuesMap.get(key);

      const hasBoth = baseVal !== undefined && targetVal !== undefined;
      const delta = hasBoth ? targetVal! - baseVal! : null;

      if (delta !== null && Math.abs(delta) >= 0.25) {
        significantChangesCount++;
      }

      if (
        key.includes("waist") &&
        !key.includes("height") &&
        !key.includes("floor") &&
        delta !== null
      ) {
        netWaistDelta = delta;
      }
      if (
        key.includes("bust") &&
        !key.includes("under") &&
        !key.includes("point") &&
        delta !== null
      ) {
        netBustDelta = delta;
      }
      if (key.includes("hip") && !key.includes("high") && delta !== null) {
        netHipDelta = delta;
      }

      // Generate bespoke tailor advice based on anatomy point
      let advice = "No adjustment";
      if (delta !== null && Math.abs(delta) >= 0.25) {
        if (delta > 0) {
          if (key.includes("waist")) advice = "Let out side seams / waistband";
          else if (key.includes("bust")) advice = "Release side seams / princess dart";
          else if (key.includes("hip")) advice = "Ease hip side curve from notch";
          else if (key.includes("shoulder")) advice = "Widen cross-back / armscye";
          else if (key.includes("sleeve") || key.includes("arm"))
            advice = "Ease bicep circumference";
          else if (key.includes("length")) advice = "Lower hemline marking";
          else advice = "Let out seam allowances";
        } else {
          if (key.includes("waist")) advice = "Deepen waist darts / take in sides";
          else if (key.includes("bust")) advice = "Pinch excess at bust apex / side";
          else if (key.includes("hip")) advice = "Taper hip curve inward";
          else if (key.includes("shoulder")) advice = "Narrow shoulder slope / yoke";
          else if (key.includes("sleeve") || key.includes("arm")) advice = "Slim sleeve seam";
          else if (key.includes("length")) advice = "Raise hemline marking";
          else advice = "Take in seam allowances";
        }
      }

      return {
        label,
        baseVal,
        targetVal,
        delta,
        advice,
        unit: targetSet.unit,
      };
    });

    return {
      rows,
      significantChangesCount,
      netWaistDelta,
      netBustDelta,
      netHipDelta,
      isSameSet: baseSet.id === targetSet.id,
    };
  }, [baseSet, targetSet]);

  const handleCopySummary = () => {
    if (!comparison || !baseSet || !targetSet) return;
    const lines = [
      `FITTING COMPARISON: ${customerName}`,
      `Baseline: ${baseSet.garment} (${shortDate(baseSet.taken_on)})`,
      `Current: ${targetSet.garment} (${shortDate(targetSet.taken_on)})`,
      `----------------------------------------`,
    ];

    comparison.rows.forEach((r) => {
      if (r.delta !== null) {
        const sign = r.delta > 0 ? `+${r.delta.toFixed(1)}` : `${r.delta.toFixed(1)}`;
        lines.push(`${r.label}: ${r.baseVal} -> ${r.targetVal} ${r.unit} (${sign}) [${r.advice}]`);
      }
    });

    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    toast.success("Measurement comparison copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-border bg-card">
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="size-5 text-primary" />
              <DialogTitle className="font-display text-xl">
                Silhouette & Measurement Comparison
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare customer measurements across fittings to calculate pattern alterations and
              dart adjustments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="gap-1.5 text-xs"
            >
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy Log"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs"
            >
              <Printer className="size-3.5" />
              <span>Print</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="size-8 p-0"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Comparison Set Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/40 border border-border">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Baseline (Earlier Fitting)
              </label>
              <select
                value={currentBaseId}
                onChange={(e) => setBaseSetId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
              >
                {sets.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {s.garment} · {shortDate(s.taken_on)} ({s.unit}) {idx === 1 ? "— Previous" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Comparison (Newer Fitting)
              </label>
              <select
                value={currentTargetId}
                onChange={(e) => setTargetSetId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium"
              >
                {sets.map((s, idx) => (
                  <option key={s.id} value={s.id}>
                    {s.garment} · {shortDate(s.taken_on)} ({s.unit}) {idx === 0 ? "— Latest" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics KPI Banner */}
          {comparison && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  Fitting Variance
                </span>
                <p className="font-display text-2xl text-foreground mt-1">
                  {comparison.significantChangesCount}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Points shifted ≥ 0.25 {targetSet?.unit}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  Waist Delta
                </span>
                <p
                  className={cn(
                    "font-display text-2xl mt-1",
                    comparison.netWaistDelta === null || Math.abs(comparison.netWaistDelta) < 0.1
                      ? "text-muted-foreground"
                      : comparison.netWaistDelta > 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {comparison.netWaistDelta === null
                    ? "—"
                    : `${comparison.netWaistDelta > 0 ? "+" : ""}${comparison.netWaistDelta.toFixed(1)} ${targetSet?.unit}`}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {comparison.netWaistDelta === null
                    ? "Not tracked"
                    : comparison.netWaistDelta > 0
                      ? "Waist expanded"
                      : comparison.netWaistDelta < 0
                        ? "Waist reduced"
                        : "Stable"}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  Bust Delta
                </span>
                <p
                  className={cn(
                    "font-display text-2xl mt-1",
                    comparison.netBustDelta === null || Math.abs(comparison.netBustDelta) < 0.1
                      ? "text-muted-foreground"
                      : comparison.netBustDelta > 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {comparison.netBustDelta === null
                    ? "—"
                    : `${comparison.netBustDelta > 0 ? "+" : ""}${comparison.netBustDelta.toFixed(1)} ${targetSet?.unit}`}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {comparison.netBustDelta === null
                    ? "Not tracked"
                    : comparison.netBustDelta > 0
                      ? "Bust expanded"
                      : comparison.netBustDelta < 0
                        ? "Bust reduced"
                        : "Stable"}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border bg-card">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  Hip Delta
                </span>
                <p
                  className={cn(
                    "font-display text-2xl mt-1",
                    comparison.netHipDelta === null || Math.abs(comparison.netHipDelta) < 0.1
                      ? "text-muted-foreground"
                      : comparison.netHipDelta > 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {comparison.netHipDelta === null
                    ? "—"
                    : `${comparison.netHipDelta > 0 ? "+" : ""}${comparison.netHipDelta.toFixed(1)} ${targetSet?.unit}`}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {comparison.netHipDelta === null
                    ? "Not tracked"
                    : comparison.netHipDelta > 0
                      ? "Hips expanded"
                      : comparison.netHipDelta < 0
                        ? "Hips reduced"
                        : "Stable"}
                </p>
              </div>
            </div>
          )}

          {/* Warning if comparing identical set */}
          {comparison?.isSameSet && (
            <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>
                You have selected the same measurement record for both baseline and comparison.
                Select another date to view silhouette evolution.
              </span>
            </div>
          )}

          {/* Comparison Table */}
          {comparison && (
            <div className="surface overflow-hidden rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-3 px-4 font-medium">Measurement Point</th>
                      <th className="py-3 px-4 font-medium text-right">
                        {baseSet ? shortDate(baseSet.taken_on) : "Baseline"}
                      </th>
                      <th className="py-3 px-4 font-medium text-right">
                        {targetSet ? shortDate(targetSet.taken_on) : "Latest"}
                      </th>
                      <th className="py-3 px-4 font-medium text-center">Change (Δ)</th>
                      <th className="py-3 px-4 font-medium">Tailor Pattern Advice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {comparison.rows.map((row) => {
                      const isUnchanged = row.delta === null || Math.abs(row.delta) < 0.1;
                      const isExpanded = row.delta !== null && row.delta >= 0.1;
                      const isReduced = row.delta !== null && row.delta <= -0.1;

                      return (
                        <tr key={row.label} className="hover:bg-secondary/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-foreground">{row.label}</td>
                          <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                            {row.baseVal !== undefined ? `${row.baseVal} ${row.unit}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                            {row.targetVal !== undefined ? `${row.targetVal} ${row.unit}` : "—"}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {row.delta === null ? (
                              <span className="text-muted-foreground text-xs font-mono">—</span>
                            ) : isUnchanged ? (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono bg-secondary px-2 py-0.5 rounded">
                                <Minus className="size-3" /> 0.0
                              </span>
                            ) : isExpanded ? (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 font-mono font-semibold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                                <TrendingUp className="size-3" /> +{row.delta.toFixed(1)} {row.unit}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                                <TrendingDown className="size-3" /> {row.delta.toFixed(1)}{" "}
                                {row.unit}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            <span
                              className={cn(
                                !isUnchanged
                                  ? "font-medium text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {row.advice}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
