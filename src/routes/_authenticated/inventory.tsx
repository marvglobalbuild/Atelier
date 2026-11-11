import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Layers,
  Plus,
  Search,
  AlertTriangle,
  Scissors,
  Calculator,
  Archive,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  TrendingDown,
  Info,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/lib/api";
import { money } from "@/lib/format";
import { PageHeader, Empty, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FabricItem,
  FabricCategory,
  FABRIC_CATEGORIES,
  loadInventory,
  saveInventory,
  SILHOUETTE_ESTIMATES,
  calculateYardage,
} from "@/lib/inventory";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Fabric & Material Inventory — Atelier" }] }),
  component: InventoryPage,
});

export function InventoryPage() {
  const b = useBusiness();
  const [items, setItems] = useState<FabricItem[]>(() => loadInventory(b.id));

  // Sync state to storage
  useEffect(() => {
    saveInventory(b.id, items);
  }, [b.id, items]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const [isNewBoltOpen, setIsNewBoltOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FabricItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<{
    item: FabricItem;
    mode: "deduct" | "restock";
  } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");

  // New bolt form state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<FabricCategory>("silk");
  const [formColor, setFormColor] = useState("");
  const [formColorHex, setFormColorHex] = useState("#8b263e");
  const [formTotalYards, setFormTotalYards] = useState("20");
  const [formUnit, setFormUnit] = useState<"yards" | "meters">("yards");
  const [formCostPerUnit, setFormCostPerUnit] = useState("25000");
  const [formSupplier, setFormSupplier] = useState("");
  const [formLocation, setFormLocation] = useState("Rack 1 - Shelf A");
  const [formThreshold, setFormThreshold] = useState("5");
  const [formNotes, setFormNotes] = useState("");

  // Yardage Calculator Form State
  const [calcSilhouette, setCalcSilhouette] = useState("a_line_gown");
  const [calcHeight, setCalcHeight] = useState<"petite" | "standard" | "tall">("standard");
  const [calcWidth, setCalcWidth] = useState<45 | 60>(60);
  const [calcTrain, setCalcTrain] = useState(false);
  const [calcMatching, setCalcMatching] = useState(false);

  const yardageResult = useMemo(() => {
    return calculateYardage({
      silhouetteId: calcSilhouette,
      heightCategory: calcHeight,
      fabricWidth: calcWidth,
      hasTrain: calcTrain,
      hasPatternMatching: calcMatching,
    });
  }, [calcSilhouette, calcHeight, calcWidth, calcTrain, calcMatching]);

  // High level KPIs
  const stats = useMemo(() => {
    const totalBolts = items.length;
    const totalAvailableYards = items.reduce((acc, i) => acc + Number(i.availableYards), 0);
    const totalAllocatedYards = items.reduce((acc, i) => acc + Number(i.allocatedYards), 0);
    const totalInventoryValue = items.reduce(
      (acc, i) => acc + Number(i.availableYards) * Number(i.costPerUnit),
      0,
    );
    const lowStockCount = items.filter(
      (i) =>
        Number(i.availableYards) <= Number(i.lowStockThreshold) && Number(i.availableYards) > 0,
    ).length;
    const depletedCount = items.filter((i) => Number(i.availableYards) <= 0).length;

    return {
      totalBolts,
      totalAvailableYards: Math.round(totalAvailableYards * 10) / 10,
      totalAllocatedYards: Math.round(totalAllocatedYards * 10) / 10,
      totalInventoryValue,
      lowStockCount,
      depletedCount,
    };
  }, [items]);

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (statusFilter === "low" && item.availableYards > item.lowStockThreshold) return false;
      if (statusFilter === "depleted" && item.availableYards > 0) return false;
      if (
        statusFilter === "healthy" &&
        (item.availableYards <= item.lowStockThreshold || item.availableYards <= 0)
      )
        return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const n = item.name.toLowerCase();
        const c = item.color.toLowerCase();
        const s = (item.supplier || "").toLowerCase();
        const l = (item.location || "").toLowerCase();
        if (!n.includes(q) && !c.includes(q) && !s.includes(q) && !l.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [items, categoryFilter, statusFilter, search]);

  const handleCreateBolt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return toast.error("Please enter fabric name");

    const totalY = Math.max(0, parseFloat(formTotalYards) || 0);
    const newBolt: FabricItem = {
      id: `fab_${Date.now()}`,
      businessId: b.id,
      name: formName.trim(),
      category: formCategory,
      color: formColor.trim() || "Natural",
      colorHex: formColorHex,
      totalYards: totalY,
      availableYards: totalY,
      allocatedYards: 0,
      unit: formUnit,
      costPerUnit: Math.max(0, parseFloat(formCostPerUnit) || 0),
      supplier: formSupplier.trim() || undefined,
      location: formLocation.trim() || undefined,
      lowStockThreshold: Math.max(1, parseFloat(formThreshold) || 5),
      notes: formNotes.trim() || undefined,
      allocations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setItems((prev) => [newBolt, ...prev]);
    toast.success("Fabric bolt registered in atelier stock");
    setIsNewBoltOpen(false);

    // Reset form
    setFormName("");
    setFormColor("");
    setFormNotes("");
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      return toast.error("Please enter a valid amount greater than 0");
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== adjustItem.item.id) return i;

        let newAvailable = i.availableYards;
        let newTotal = i.totalYards;

        if (adjustItem.mode === "deduct") {
          newAvailable = Math.max(0, i.availableYards - amount);
        } else {
          newAvailable += amount;
          newTotal += amount;
        }

        return {
          ...i,
          availableYards: Math.round(newAvailable * 10) / 10,
          totalYards: Math.round(newTotal * 10) / 10,
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    toast.success(
      adjustItem.mode === "deduct"
        ? `Logged cut of ${amount} ${adjustItem.item.unit}`
        : `Restocked ${amount} ${adjustItem.item.unit} to bolt`,
    );

    setAdjustItem(null);
    setAdjustAmount("");
    setAdjustReason("");
  };

  const handleDeleteBolt = (id: string) => {
    if (!confirm("Are you sure you want to remove this bolt from inventory?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Fabric removed from inventory");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fabric & Material Inventory"
        sub="Track textile bolts, silk allocations, studio rack locations, and yardage estimates."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCalculatorOpen(true)}
              className="gap-1.5 shadow-sm"
            >
              <Calculator className="size-4 text-primary" />
              <span>Yardage Calculator</span>
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => setIsNewBoltOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              <span>Record New Bolt</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel className="p-4">
          <p className="eyebrow">Bolts & Textiles In Stock</p>
          <p className="font-display text-3xl mt-2 text-foreground">
            {stats.totalAvailableYards}{" "}
            <span className="text-sm font-sans font-normal text-muted-foreground">yds</span>
          </p>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <Layers className="size-3.5 text-primary mr-1" />
            Across {stats.totalBolts} active fabric bolts & rolls
          </div>
        </Panel>

        <Panel className="p-4">
          <p className="eyebrow">Allocated To Production</p>
          <p className="font-display text-3xl mt-2 text-foreground">
            {stats.totalAllocatedYards}{" "}
            <span className="text-sm font-sans font-normal text-muted-foreground">yds</span>
          </p>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <Scissors className="size-3.5 text-blue-500 mr-1" />
            Reserved for scheduled cuts & fittings
          </div>
        </Panel>

        <Panel className="p-4">
          <p className="eyebrow">Studio Inventory Value</p>
          <p className="font-display text-3xl mt-2 text-foreground">
            {money(stats.totalInventoryValue, b.currency)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Based on recorded supplier acquisition cost
          </p>
        </Panel>

        <Panel className="p-4">
          <p className="eyebrow">Reorder & Stock Alerts</p>
          <p
            className={cn(
              "font-display text-3xl mt-2",
              stats.lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-success",
            )}
          >
            {stats.lowStockCount}{" "}
            <span className="text-sm font-sans font-normal text-muted-foreground">low bolt(s)</span>
          </p>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            {stats.lowStockCount > 0 ? (
              <span className="text-amber-600 flex items-center gap-1 font-medium">
                <AlertTriangle className="size-3.5" /> Reorder before next collection
              </span>
            ) : (
              <span className="text-success flex items-center gap-1 font-medium">
                <Check className="size-3.5" /> All rolls above minimum threshold
              </span>
            )}
          </div>
        </Panel>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by fabric name, color, supplier, rack location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-card"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Fabric Categories</option>
            {FABRIC_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Stock Statuses</option>
            <option value="healthy">Healthy Stock</option>
            <option value="low">Low Stock (≤ Threshold)</option>
            <option value="depleted">Depleted (0 yds)</option>
          </select>
        </div>
      </div>

      {/* Inventory Grid */}
      {filteredItems.length === 0 ? (
        <Empty
          title="No fabric bolts match"
          body={
            search || categoryFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your search criteria or category filter."
              : "Record your first bolt of silk, satin, lace or lining to track studio inventory."
          }
          action={
            <Button variant="outline" onClick={() => setIsNewBoltOpen(true)}>
              <Plus className="size-4 mr-2" /> Add First Fabric Bolt
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const pctRemaining = Math.min(
              100,
              Math.max(0, (item.availableYards / item.totalYards) * 100),
            );
            const isLow = item.availableYards <= item.lowStockThreshold && item.availableYards > 0;
            const isDepleted = item.availableYards <= 0;

            return (
              <Panel key={item.id} className="p-4 flex flex-col justify-between relative group">
                <div>
                  {/* Swatch & Category Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="size-7 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm shrink-0"
                        style={{ backgroundColor: item.colorHex || "#888888" }}
                        title={`Color: ${item.color}`}
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
                          {FABRIC_CATEGORIES.find((c) => c.id === item.category)?.label ||
                            item.category}
                        </span>
                        <h3 className="font-semibold text-sm text-foreground truncate mt-0.5">
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isDepleted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-destructive/10 text-destructive border border-destructive/20">
                          Depleted
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="size-3" /> Low
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium font-mono uppercase bg-secondary text-muted-foreground">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Color & Location info */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground border-y border-border py-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase block text-muted-foreground/70">
                        Color Shade
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {item.color}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase block text-muted-foreground/70">
                        Studio Location
                      </span>
                      <span className="font-medium text-foreground truncate block">
                        {item.location || "General Shelf"}
                      </span>
                    </div>
                  </div>

                  {/* Stock Gauge & Progress */}
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-medium text-foreground">
                        <span className="font-display text-xl">{item.availableYards}</span>{" "}
                        <span className="text-muted-foreground font-mono">
                          {item.unit} available
                        </span>
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        of {item.totalYards} {item.unit}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isDepleted ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-primary",
                        )}
                        style={{ width: `${pctRemaining}%` }}
                      />
                    </div>
                  </div>

                  {/* Notes / Supplier */}
                  {item.notes && (
                    <p className="mt-2.5 text-xs text-muted-foreground line-clamp-2 bg-secondary/30 p-2 rounded">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                  <div className="text-muted-foreground font-mono">
                    {money(item.costPerUnit, b.currency)} / {item.unit.slice(0, 2)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setAdjustItem({ item, mode: "deduct" })}
                      title="Log fabric cut for order"
                    >
                      <Scissors className="size-3 mr-1" /> Cut
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setAdjustItem({ item, mode: "restock" })}
                      title="Add received bolt yardage"
                    >
                      <RefreshCw className="size-3 mr-1" /> Restock
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteBolt(item.id)}
                      title="Delete bolt"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {/* Record New Bolt Modal */}
      <Dialog open={isNewBoltOpen} onOpenChange={setIsNewBoltOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Record Fabric Bolt</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateBolt} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="bolt-name">Fabric Name & Weave *</Label>
              <Input
                id="bolt-name"
                required
                placeholder="e.g. Mulberry Silk Charmeuse 19mm"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bolt-cat">Category</Label>
                <select
                  id="bolt-cat"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as FabricCategory)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {FABRIC_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="bolt-color">Color Name</Label>
                <Input
                  id="bolt-color"
                  placeholder="e.g. Burgundy / Wine"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="bolt-yards">Total Bolt Length</Label>
                <Input
                  id="bolt-yards"
                  type="number"
                  step="0.5"
                  required
                  value={formTotalYards}
                  onChange={(e) => setFormTotalYards(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bolt-unit">Unit</Label>
                <select
                  id="bolt-unit"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value as "yards" | "meters")}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="yards">Yards</option>
                  <option value="meters">Meters</option>
                </select>
              </div>

              <div>
                <Label htmlFor="bolt-cost">Cost / Unit ({b.currency})</Label>
                <Input
                  id="bolt-cost"
                  type="number"
                  value={formCostPerUnit}
                  onChange={(e) => setFormCostPerUnit(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bolt-supplier">Supplier / Mill</Label>
                <Input
                  id="bolt-supplier"
                  placeholder="e.g. Vlisco Lagos / UK Silk Co"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bolt-location">Studio Rack Location</Label>
                <Input
                  id="bolt-location"
                  placeholder="e.g. Rack A - Shelf 2"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bolt-threshold">Low Stock Warning (Threshold)</Label>
                <Input
                  id="bolt-threshold"
                  type="number"
                  step="1"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bolt-hex">Swatch Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    id="bolt-hex"
                    value={formColorHex}
                    onChange={(e) => setFormColorHex(e.target.value)}
                    className="size-10 rounded border border-input p-0.5 bg-card cursor-pointer"
                  />
                  <span className="font-mono text-xs text-muted-foreground uppercase">
                    {formColorHex}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="bolt-notes">Tailor Notes & Weave Care</Label>
              <Textarea
                id="bolt-notes"
                placeholder="Drape characteristics, shrinkage factor, matching lining recommendations…"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsNewBoltOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="ink">
                Save Bolt to Stock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock (Cut or Restock) Dialog */}
      <Dialog open={!!adjustItem} onOpenChange={(o) => !o && setAdjustItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              {adjustItem?.mode === "deduct" ? (
                <>
                  <Scissors className="size-5 text-primary" />
                  <span>Log Fabric Cut</span>
                </>
              ) : (
                <>
                  <RefreshCw className="size-5 text-primary" />
                  <span>Restock Fabric Bolt</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {adjustItem && (
            <form onSubmit={handleAdjustStock} className="space-y-4 mt-2">
              <div className="p-3 bg-secondary/50 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-foreground">{adjustItem.item.name}</p>
                <p className="text-muted-foreground">
                  Current Available:{" "}
                  <strong className="text-foreground">
                    {adjustItem.item.availableYards} {adjustItem.item.unit}
                  </strong>
                </p>
              </div>

              <div>
                <Label htmlFor="adj-amount">
                  {adjustItem.mode === "deduct"
                    ? `Yardage to Cut (${adjustItem.item.unit}) *`
                    : `Yardage to Add (${adjustItem.item.unit}) *`}
                </Label>
                <Input
                  id="adj-amount"
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 3.5"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="mt-1"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="adj-reason">Order / Project Reference (Optional)</Label>
                <Input
                  id="adj-reason"
                  placeholder={
                    adjustItem.mode === "deduct"
                      ? "e.g. Cut for #ORD-1234 (Velvet Evening Gown)"
                      : "e.g. New bolt arrival from mill"
                  }
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1"
                />
              </div>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setAdjustItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="ink">
                  {adjustItem.mode === "deduct" ? "Confirm Cut" : "Confirm Restock"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Yardage Calculator Modal */}
      <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Calculator className="size-5 text-primary" />
              <span>Garment Fabric Yardage Estimator</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="calc-sil">Garment Silhouette / Style</Label>
              <select
                id="calc-sil"
                value={calcSilhouette}
                onChange={(e) => setCalcSilhouette(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {SILHOUETTE_ESTIMATES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="calc-height">Client Height Category</Label>
                <select
                  id="calc-height"
                  value={calcHeight}
                  onChange={(e) => setCalcHeight(e.target.value as "petite" | "standard" | "tall")}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="petite">Petite (&lt; 5'3" / 160cm)</option>
                  <option value="standard">Standard (5'4"–5'8")</option>
                  <option value="tall">Tall (&gt; 5'8" / 173cm)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="calc-width">Bolt Width</Label>
                <select
                  id="calc-width"
                  value={calcWidth}
                  onChange={(e) => setCalcWidth(Number(e.target.value) as 45 | 60)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value={60}>60 inches (Standard Double Width)</option>
                  <option value={45}>45 inches (Narrow Bolt +25%)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={calcTrain}
                  onChange={(e) => setCalcTrain(e.target.checked)}
                  className="rounded border-input text-primary size-4"
                />
                <span>Include Extended Train (+2.0 yds)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={calcMatching}
                  onChange={(e) => setCalcMatching(e.target.checked)}
                  className="rounded border-input text-primary size-4"
                />
                <span>Directional / African Print Matching (+15%)</span>
              </label>
            </div>

            {/* Estimated Output Result */}
            <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Calculated Requirements: {yardageResult.silhouetteName}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Standard Ease Included
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded bg-card border border-border">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Main Fabric
                  </span>
                  <p className="font-display text-2xl text-foreground mt-1">
                    {yardageResult.estimatedMainYardage}{" "}
                    <span className="text-xs font-sans text-muted-foreground">yds</span>
                  </p>
                </div>

                <div className="p-2.5 rounded bg-card border border-border">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Inner Lining
                  </span>
                  <p className="font-display text-2xl text-foreground mt-1">
                    {yardageResult.estimatedLiningYardage}{" "}
                    <span className="text-xs font-sans text-muted-foreground">yds</span>
                  </p>
                </div>

                <div className="p-2.5 rounded bg-card border border-border">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Canvas / Fusing
                  </span>
                  <p className="font-display text-2xl text-foreground mt-1">
                    {yardageResult.estimatedInterfacingYardage}{" "}
                    <span className="text-xs font-sans text-muted-foreground">yds</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsCalculatorOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
