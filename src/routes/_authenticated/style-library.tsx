import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Tag, FolderPlus, Eye, Scissors, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { stylesQuery, useInvalidate, useBusiness, supabase, type StyleAsset } from "@/lib/api";
import { PageHeader, Empty } from "@/components/app/ui";
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
import { OrderDialog } from "@/components/app/dialogs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/style-library")({
  validateSearch: (s: Record<string, unknown>): { status?: string; from?: string } => ({
    ...(typeof s.status === "string" ? { status: s.status } : {}),
    ...(typeof s.from === "string" ? { from: s.from } : {}),
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(stylesQuery),
  head: () => ({ meta: [{ title: "Style Library — Atelier" }] }),
  component: StyleLibrary,
});

interface StyleItem extends StyleAsset {
  collection_assets?: { collection_id: string }[];
  imageUrl?: string;
}

export function StyleLibrary() {
  const b = useBusiness();
  const { data: styleData } = useQuery(stylesQuery);
  const inv = useInvalidate();

  const [activeCollection, setActiveCollection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("all");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<StyleItem | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  // Form states for Upload
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCollectionId, setUploadCollectionId] = useState("");
  const [uploadTag, setUploadTag] = useState("Tailoring");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadImageFile, setUploadImageFile] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for New Collection
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");

  const collections = styleData?.collections ?? [];
  const assets = styleData?.assets ?? [];
  const urls = styleData?.urls ?? {};

  // Extract unique tags
  const allTags = Array.from(
    new Set(assets.flatMap((a) => (a.tags && Array.isArray(a.tags) ? a.tags : []))),
  );

  const filteredAssets = assets.filter((asset) => {
    // Collection filter
    if (activeCollection !== "all") {
      const match = asset.collection_assets?.some(
        (ca: { collection_id: string }) => ca.collection_id === activeCollection,
      );
      if (!match) return false;
    }

    // Tag filter
    if (activeTag !== "all") {
      if (!asset.tags?.includes(activeTag)) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = asset.title?.toLowerCase().includes(query);
      const matchNotes = asset.notes?.toLowerCase().includes(query);
      const matchTags = asset.tags?.some((t: string) => t.toLowerCase().includes(query));
      if (!matchTitle && !matchNotes && !matchTags) return false;
    }

    return true;
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadImageFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return toast.error("Please enter a collection name");

    try {
      const { error } = await supabase.from("style_collections").insert({
        business_id: b.id,
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim() || null,
      });
      if (error) throw error;

      await inv("styles");
      toast.success(`Collection "${newCollectionName}" created`);
      setNewCollectionName("");
      setNewCollectionDesc("");
      setIsCollectionOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to create collection");
    }
  };

  const handleUploadStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return toast.error("Please enter a style title");
    if (!uploadImageFile) return toast.error("Please select or drop an image file");

    setIsSubmitting(true);
    try {
      const { data: assetData, error } = await supabase
        .from("style_assets")
        .insert({
          business_id: b.id,
          title: uploadTitle.trim(),
          storage_path: uploadImageFile,
          tags: [uploadTag.trim()].filter(Boolean),
          notes: uploadNotes.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (uploadCollectionId && assetData) {
        await supabase.from("collection_assets").insert({
          business_id: b.id,
          asset_id: assetData.id,
          collection_id: uploadCollectionId,
        });
      }

      await inv("styles");
      toast.success("Style inspiration added to library");
      setUploadTitle("");
      setUploadNotes("");
      setUploadImageFile("");
      setIsUploadOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to upload style");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to remove this style inspiration?")) return;
    try {
      const { error } = await supabase.from("style_assets").delete().eq("id", assetId);
      if (error) throw error;

      await inv("styles");
      if (previewAsset?.id === assetId) setPreviewAsset(null);
      toast.success("Inspiration removed from library");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Could not delete inspiration");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Style Library"
        sub="Bespoke moodboards, client inspiration, fabric references & lookbook cuts."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsCollectionOpen(true)}>
              <FolderPlus className="size-4 mr-2" />
              New Collection
            </Button>
            <Button variant="hero" onClick={() => setIsUploadOpen(true)}>
              <Plus className="size-4 mr-2" />
              Add Inspiration
            </Button>
          </div>
        }
      />

      {/* Collection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border">
        <button
          onClick={() => setActiveCollection("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
            activeCollection === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          All References ({assets.length})
        </button>
        {collections.map((col) => {
          const count = assets.filter((a) =>
            a.collection_assets?.some(
              (ca: { collection_id: string }) => ca.collection_id === col.id,
            ),
          ).length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                activeCollection === col.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {col.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Filters and search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, tags or fabric notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-card"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-muted-foreground mr-1 flex items-center">
              <Tag className="size-3 mr-1" /> Tags:
            </span>
            <button
              onClick={() => setActiveTag("all")}
              className={cn(
                "px-2.5 py-1 rounded border text-xs",
                activeTag === "all"
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={cn(
                  "px-2.5 py-1 rounded border text-xs whitespace-nowrap",
                  activeTag === tag
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <Empty
          title="No inspirations found"
          body={
            searchQuery || activeCollection !== "all" || activeTag !== "all"
              ? "Try clearing filters to see more inspiration styles."
              : "Upload your first lookbook photos, fabric swatches, or client references."
          }
          action={
            <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
              <Plus className="size-4 mr-2" /> Upload First Inspiration
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAssets.map((asset) => {
            const imageUrl = urls[asset.storage_path] || "/placeholder.jpg";
            return (
              <div
                key={asset.id}
                className="group relative surface overflow-hidden rounded-lg transition-all duration-200 hover:shadow-md"
              >
                {/* Image Container */}
                <div
                  className="relative aspect-[3/4] w-full overflow-hidden bg-secondary cursor-pointer"
                  onClick={() => setPreviewAsset({ ...asset, imageUrl })}
                >
                  <img
                    src={imageUrl}
                    alt={asset.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-end p-4">
                    <span className="text-xs text-white/90 flex items-center gap-1 font-medium">
                      <Eye className="size-3.5" /> Click to view details
                    </span>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3.5">
                  <h3 className="font-medium text-sm text-foreground line-clamp-1">
                    {asset.title}
                  </h3>
                  {asset.notes && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{asset.notes}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex flex-wrap gap-1">
                      {asset.tags?.slice(0, 2).map((t: string) => (
                        <span
                          key={t}
                          className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                        title="Start order with this style"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderDialogOpen(true);
                        }}
                      >
                        <Scissors className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete asset"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAsset(asset.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={(o) => !o && setPreviewAsset(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-lg">
          {previewAsset && (
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-black/95 max-h-[70vh] flex items-center justify-center p-2">
                <img
                  src={previewAsset.imageUrl}
                  alt={previewAsset.title}
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded"
                />
              </div>
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <DialogHeader className="p-0 text-left">
                    <DialogTitle className="font-display text-2xl">
                      {previewAsset.title}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {previewAsset.tags?.map((t: string) => (
                      <span
                        key={t}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-foreground font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {previewAsset.notes && (
                    <div className="mt-4">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                        Fabric & Construction Notes
                      </Label>
                      <p className="mt-1 text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                        {previewAsset.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteAsset(previewAsset.id)}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ink"
                    size="sm"
                    onClick={() => {
                      setPreviewAsset(null);
                      setOrderDialogOpen(true);
                    }}
                  >
                    <Scissors className="size-3.5 mr-1.5" /> Use in Order
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Add Style Inspiration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadStyle} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="title">Design / Silhouette Name *</Label>
              <Input
                id="title"
                required
                placeholder="e.g., Royal Blue Corset Ballgown"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="collection">Collection</Label>
                <select
                  id="collection"
                  value={uploadCollectionId}
                  onChange={(e) => setUploadCollectionId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">General Library</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="tag">Category Tag</Label>
                <select
                  id="tag"
                  value={uploadTag}
                  onChange={(e) => setUploadTag(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="Tailoring">Tailoring</option>
                  <option value="Bridal">Bridal</option>
                  <option value="Evening">Evening</option>
                  <option value="Traditional">Traditional</option>
                  <option value="Fabrics">Fabrics</option>
                  <option value="Resort">Resort</option>
                  <option value="Casual">Casual</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="image">Image File *</Label>
              <div className="mt-1 flex flex-col gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="cursor-pointer file:cursor-pointer file:rounded file:border-0 file:bg-secondary file:px-2.5 file:py-1 file:text-xs"
                />
                {uploadImageFile && (
                  <div className="relative mt-2 h-36 w-full overflow-hidden rounded border border-border">
                    <img
                      src={uploadImageFile}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Fabric & Styling Notes</Label>
              <Textarea
                id="notes"
                placeholder="Fabric yardage requirements, lining types, recommended embellishments…"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="ink" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save Inspiration"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Collection Dialog */}
      <Dialog open={isCollectionOpen} onOpenChange={setIsCollectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Create Style Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCollection} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="cname">Collection Name *</Label>
              <Input
                id="cname"
                required
                placeholder="e.g., Summer Resort 2027"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cdesc">Description</Label>
              <Textarea
                id="cdesc"
                placeholder="Brief description of the aesthetic or season theme…"
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCollectionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="ink">
                Create Collection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Order Dialog */}
      <OrderDialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen} />
    </div>
  );
}
