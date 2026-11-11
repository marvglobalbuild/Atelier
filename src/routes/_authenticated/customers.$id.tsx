import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  MessageSquare,
  Scale,
  Plus,
  Sparkles,
  Images,
  Upload,
  Trash2,
  Scissors,
  Image as ImageIcon,
  Search,
  Check,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  check,
  customerQuery,
  logActivity,
  stylesQuery,
  useBusiness,
  useInvalidate,
} from "@/lib/api";
import { initials, longDate, money, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CustomerDialog, MeasurementDialog, OrderDialog } from "@/components/app/dialogs";
import { WhatsAppDialog } from "@/components/app/WhatsAppDialog";
import { MeasurementComparisonModal } from "@/components/app/MeasurementComparisonModal";
import { openWhatsApp, generateMeasurementSummaryMessage } from "@/lib/whatsapp";
import { Empty, StatusBadge } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(customerQuery(params.id)),
  head: () => ({ meta: [{ title: "Customer — Atelier" }] }),
  component: CustomerPage,
});

function CustomerPage() {
  const { id } = Route.useParams();
  const b = useBusiness();
  const inv = useInvalidate();
  const { data } = useSuspenseQuery(customerQuery(id));
  const { data: lib } = useQuery(stylesQuery);
  const { customer: c, sets, orders, styles } = data;
  const [edit, setEdit] = useState(false);
  const [meas, setMeas] = useState(false);
  const [order, setOrder] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  // Client's personal inspiration state
  const [isUploadInspoOpen, setIsUploadInspoOpen] = useState(false);
  const [isLibraryPickerOpen, setIsLibraryPickerOpen] = useState(false);
  const [inspoTitle, setInspoTitle] = useState("");
  const [inspoCategory, setInspoCategory] = useState("Evening Gown");
  const [inspoNotes, setInspoNotes] = useState("");
  const [inspoImage, setInspoImage] = useState("");
  const [inspoSubmitting, setInspoSubmitting] = useState(false);
  const [orderInspoPrefill, setOrderInspoPrefill] = useState<{
    outfitName?: string;
    description?: string;
  } | null>(null);
  const [librarySearch, setLibrarySearch] = useState("");

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInspoImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClientInspo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspoTitle.trim()) return toast.error("Please enter a style title");
    if (!inspoImage) return toast.error("Please select or drop an inspiration image");

    setInspoSubmitting(true);
    try {
      // 1. Insert into style_assets
      const newAsset = check(
        await supabase
          .from("style_assets")
          .insert({
            business_id: b.id,
            title: inspoTitle.trim(),
            storage_path: inspoImage,
            category: inspoCategory || "Custom Inspo",
            description: inspoNotes.trim() || null,
            tags: [inspoCategory, "client-custom"].filter(Boolean),
          })
          .select()
          .single(),
      );

      // 2. Link specifically to this customer
      check(
        await supabase.from("customer_style_assets").insert({
          business_id: b.id,
          customer_id: c.id,
          asset_id: newAsset.id,
        }),
      );

      await inv("customer", "styles");
      toast.success(`Design "${inspoTitle}" saved to ${c.full_name}'s personal inspiration board`);
      setIsUploadInspoOpen(false);
      setInspoTitle("");
      setInspoNotes("");
      setInspoImage("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to upload inspiration");
    } finally {
      setInspoSubmitting(false);
    }
  };

  const handleUnlinkClientInspo = async (assetId: string) => {
    if (!confirm("Remove this design from this client's moodboard?")) return;
    try {
      check(
        await supabase
          .from("customer_style_assets")
          .delete()
          .eq("customer_id", c.id)
          .eq("asset_id", assetId),
      );
      await inv("customer");
      toast.success("Design removed from client's inspiration board");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to remove design");
    }
  };

  const handleLinkExistingStyle = async (assetId: string) => {
    try {
      const alreadyLinked = styles.some((s) => s.id === assetId);
      if (alreadyLinked) {
        return toast.info("This style is already in this client's moodboard");
      }
      check(
        await supabase.from("customer_style_assets").insert({
          business_id: b.id,
          customer_id: c.id,
          asset_id: assetId,
        }),
      );
      await inv("customer");
      toast.success("Added to client's personal inspiration board");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to link style");
    }
  };

  async function toggleArchive() {
    const archived_at = c.archived_at ? null : new Date().toISOString();
    try {
      check(await supabase.from("customers").update({ archived_at }).eq("id", c.id).select());
      await logActivity(
        b.id,
        "customer",
        archived_at ? "archive" : "restore",
        `${archived_at ? "Archived" : "Restored"} ${c.full_name}`,
        c.id,
      );
      await inv("customers", "customer", "activity");
      toast.success(
        archived_at ? "Customer archived — their orders are kept" : "Customer restored",
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <Link
        to="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Customers
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-display grid size-14 place-items-center rounded-full bg-wine-soft text-xl text-primary">
            {initials(c.full_name)}
          </span>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">{c.full_name}</h1>
            <p className="text-sm text-muted-foreground">
              {[c.phone, c.email].filter(Boolean).join(" · ") || "No contact details"}
              {c.archived_at && " · Archived"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {c.phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWhatsAppOpen(true)}
              className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-sm"
            >
              <MessageSquare className="size-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </Button>
          )}
          <Button variant="quiet" size="sm" onClick={() => setEdit(true)}>
            Edit
          </Button>
          <Button variant="quiet" size="sm" onClick={toggleArchive}>
            {c.archived_at ? "Restore" : "Archive"}
          </Button>
          {!c.archived_at && (
            <Button variant="hero" size="sm" onClick={() => setOrder(true)}>
              New order
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="measurements" className="mt-8">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          {[
            ["measurements", `Measurements (${sets.length})`],
            ["orders", `Orders (${orders.length})`],
            ["inspiration", `Inspiration (${styles.length})`],
            ["profile", "Profile"],
          ].map(([v, l]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="rounded-none border-b-2 border-transparent px-3 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="measurements" className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              {sets.length >= 2 ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Scale className="size-3.5 text-primary" />
                  <span>{sets.length} dated measurement records on file</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Master silhouette and fitting specifications.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {sets.length >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompareOpen(true)}
                  className="gap-1.5 shadow-sm border-primary/25 text-foreground hover:bg-primary/5"
                >
                  <Scale className="size-3.5 text-primary" />
                  <span>Compare Fittings & Deltas</span>
                </Button>
              )}
              <Button variant="ink" size="sm" onClick={() => setMeas(true)}>
                Record measurements
              </Button>
            </div>
          </div>
          {sets.length === 0 ? (
            <Empty
              title="No measurements yet"
              body="Record a dated set using a garment template or your own fields."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sets.map((s, i) => (
                <div key={s.id} className={"surface p-4 " + (i === 0 ? "border-primary/40" : "")}>
                  <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                    <div>
                      <span className="font-medium">{s.garment}</span>
                      <span className="text-muted-foreground text-xs ml-2">
                        {longDate(s.taken_on)}
                        {i === 0 && " · latest"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {sets.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => setCompareOpen(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 border border-border px-2 py-0.5 rounded transition-colors"
                          title="Compare with other fittings"
                        >
                          <Scale className="size-3 text-primary" />
                          <span>Compare</span>
                        </button>
                      )}
                      {c.phone && (
                        <button
                          type="button"
                          onClick={() => {
                            const values = [...s.customer_measurement_values]
                              .sort((a, z) => a.position - z.position)
                              .map((v) => ({ label: v.label, value: Number(v.value) }));
                            const text = generateMeasurementSummaryMessage({
                              atelierName: b.name,
                              clientName: c.full_name,
                              garment: s.garment,
                              unit: s.unit,
                              measurements: values,
                            });
                            openWhatsApp(c.phone || "", text);
                            toast.success("Opening WhatsApp with measurement summary…");
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors"
                          title="Share measurements via WhatsApp"
                        >
                          <MessageSquare className="size-3" />
                          <span>Share Specs</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {[...s.customer_measurement_values]
                      .sort((a, z) => a.position - z.position)
                      .map((v) => (
                        <div
                          key={v.id}
                          className="flex justify-between border-b border-dashed border-border pb-1"
                        >
                          <dt className="text-muted-foreground">{v.label}</dt>
                          <dd className="tabular font-medium">
                            {Number(v.value)} {s.unit}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {orders.length === 0 ? (
            <Empty title="No orders yet" body="Orders for this customer will appear here." />
          ) : (
            <div className="surface divide-y divide-border">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  to="/orders/$id"
                  params={{ id: o.id }}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-secondary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.outfit_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {shortDate(o.due_date)} · {money(Number(o.price), b.currency)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inspiration" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
            <div>
              <h2 className="font-display text-lg text-foreground flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>{c.full_name}'s Inspiration Moodboard</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Client-specific reference designs, silhouette sketches, and bespoke styling briefs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLibraryPickerOpen(true)}
                className="gap-1.5 text-xs shadow-sm"
              >
                <Images className="size-3.5 text-muted-foreground" />
                <span>Pick from Atelier Catalog</span>
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={() => setIsUploadInspoOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                <span>Upload Client Inspo</span>
              </Button>
            </div>
          </div>

          {styles.length === 0 ? (
            <Empty
              title="No inspiration designs yet"
              body={`Upload reference photos or bespoke design ideas specifically for ${c.full_name}.`}
              action={
                <div className="flex gap-2">
                  <Button variant="hero" size="sm" onClick={() => setIsUploadInspoOpen(true)}>
                    <Upload className="size-3.5 mr-1.5" /> Upload First Inspo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsLibraryPickerOpen(true)}>
                    <Images className="size-3.5 mr-1.5" /> Choose from Catalog
                  </Button>
                </div>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {styles.map((s) => {
                const imgSrc =
                  s.storage_path.startsWith("data:") || s.storage_path.startsWith("http")
                    ? s.storage_path
                    : (lib?.urls?.[s.storage_path] ?? s.storage_path);

                return (
                  <div
                    key={s.id}
                    className="surface overflow-hidden rounded-lg group flex flex-col justify-between border hover:border-primary/40 transition-all"
                  >
                    <div>
                      {/* Image Preview */}
                      <div className="relative aspect-[3/4] bg-secondary/50 overflow-hidden">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={s.title}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="size-8 opacity-40" />
                          </div>
                        )}

                        {s.category && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium uppercase font-mono tracking-wider bg-background/90 text-foreground backdrop-blur shadow-sm">
                            {s.category}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                          {s.title}
                        </h4>
                        {s.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {s.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-3 pt-0 border-t border-border/50 flex items-center justify-between gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex-1 gap-1 text-primary hover:text-primary"
                        onClick={() => {
                          setOrderInspoPrefill({
                            outfitName: s.title,
                            description: s.description || undefined,
                          });
                          setOrder(true);
                        }}
                      >
                        <Scissors className="size-3" />
                        <span>Create Order</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        title="Remove from client's moodboard"
                        onClick={() => handleUnlinkClientInspo(s.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <dl className="surface grid gap-4 p-5 text-sm sm:grid-cols-2">
            {[
              ["Phone", c.phone],
              ["Email", c.email],
              ["Address", c.address],
              ["Customer since", longDate(c.created_at)],
              ["Notes", c.notes],
            ].map(([k, v]) => (
              <div key={k as string} className={k === "Notes" ? "sm:col-span-2" : ""}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="mt-1 whitespace-pre-wrap">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>
      </Tabs>

      <CustomerDialog open={edit} onOpenChange={setEdit} customer={c} />
      <MeasurementDialog open={meas} onOpenChange={setMeas} customerId={c.id} />
      <OrderDialog
        open={order}
        onOpenChange={(isOpen) => {
          setOrder(isOpen);
          if (!isOpen) setOrderInspoPrefill(null);
        }}
        customerId={c.id}
        defaultOutfitName={orderInspoPrefill?.outfitName}
        defaultDescription={orderInspoPrefill?.description}
      />
      <WhatsAppDialog
        open={whatsAppOpen}
        onOpenChange={setWhatsAppOpen}
        clientName={c.full_name}
        clientPhone={c.phone}
        defaultMode="custom"
      />
      <MeasurementComparisonModal
        open={compareOpen}
        onOpenChange={setCompareOpen}
        customerName={c.full_name}
        sets={sets}
      />

      {/* Upload Client Inspo Modal */}
      <Dialog open={isUploadInspoOpen} onOpenChange={setIsUploadInspoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <span>Add Inspo for {c.full_name}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUploadClientInspo} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="inspo-title">Style Name / Concept *</Label>
              <Input
                id="inspo-title"
                required
                placeholder="e.g. Emerald Off-Shoulder Corset Gown"
                value={inspoTitle}
                onChange={(e) => setInspoTitle(e.target.value)}
                className="mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="inspo-cat">Silhouette / Style Type</Label>
              <select
                id="inspo-cat"
                value={inspoCategory}
                onChange={(e) => setInspoCategory(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Evening Gown">Evening Gown</option>
                <option value="Asoebi">Asoebi / Traditional</option>
                <option value="Bridal">Bridal / Wedding</option>
                <option value="Corset & Bustier">Corset & Bustier</option>
                <option value="Two-Piece Suit">Tailored Suit</option>
                <option value="Jumpsuit">Jumpsuit</option>
                <option value="Kaftan / Boubou">Kaftan / Boubou</option>
                <option value="Casual & Cocktail">Cocktail & Party</option>
              </select>
            </div>

            <div>
              <Label htmlFor="inspo-notes">Customization Brief & Tailor Notes</Label>
              <Textarea
                id="inspo-notes"
                placeholder="Client requested sweetheart neckline, sheer mesh side boning, floor sweep train, bringing green silk velvet…"
                value={inspoNotes}
                onChange={(e) => setInspoNotes(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Design Reference Image *</Label>
              {inspoImage ? (
                <div className="mt-2 relative rounded-lg border border-border overflow-hidden group">
                  <img src={inspoImage} alt="Inspo preview" className="w-full h-44 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-white border-white hover:bg-white hover:text-black"
                      onClick={() => setInspoImage("")}
                    >
                      Change Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-1.5 space-y-2">
                  <label className="border-2 border-dashed border-input rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-secondary/20">
                    <Upload className="size-6 text-muted-foreground mb-1.5" />
                    <span className="text-xs font-medium text-foreground">
                      Upload sketch, photo or screenshot
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      PNG, JPG or WebP from phone/computer
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">or image URL:</span>
                    <Input
                      placeholder="https://..."
                      value={inspoImage.startsWith("http") ? inspoImage : ""}
                      onChange={(e) => setInspoImage(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsUploadInspoOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="ink" disabled={inspoSubmitting}>
                {inspoSubmitting ? "Saving…" : "Save to Client Moodboard"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link from General Style Library Picker Modal */}
      <Dialog open={isLibraryPickerOpen} onOpenChange={setIsLibraryPickerOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <Images className="size-5 text-primary" />
              <span>Choose from Atelier Catalog</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search styles by title or category…"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {!lib?.assets || lib.assets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No styles in general library. Upload directly using "Upload Client Inspo".
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {lib.assets
                  .filter((a) => {
                    if (!librarySearch.trim()) return true;
                    const q = librarySearch.toLowerCase();
                    return (
                      a.title.toLowerCase().includes(q) ||
                      (a.category || "").toLowerCase().includes(q)
                    );
                  })
                  .map((a) => {
                    const isAlreadyLinked = styles.some((s) => s.id === a.id);
                    const imgSrc =
                      a.storage_path.startsWith("data:") || a.storage_path.startsWith("http")
                        ? a.storage_path
                        : (lib?.urls?.[a.storage_path] ?? a.storage_path);

                    return (
                      <div
                        key={a.id}
                        className="surface rounded-md overflow-hidden border flex flex-col justify-between"
                      >
                        <div className="aspect-[3/4] bg-secondary overflow-hidden">
                          {imgSrc ? (
                            <img src={imgSrc} alt={a.title} className="size-full object-cover" />
                          ) : (
                            <div className="size-full flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="size-6 opacity-40" />
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="font-medium text-xs truncate text-foreground">{a.title}</p>
                          <Button
                            variant={isAlreadyLinked ? "outline" : "hero"}
                            size="sm"
                            disabled={isAlreadyLinked}
                            className="w-full mt-2 h-7 text-xs"
                            onClick={() => handleLinkExistingStyle(a.id)}
                          >
                            {isAlreadyLinked ? (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Check className="size-3 text-success" /> Added
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Plus className="size-3" /> Add to Client
                              </span>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
