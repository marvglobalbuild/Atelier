import { useState, useRef } from "react";
import {
  Printer,
  Scissors,
  CheckSquare,
  FileText,
  User,
  Calendar,
  Layers,
  Sparkles,
  Phone,
  Eye,
  AlertTriangle,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { shortDate, longDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CuttingTicketOrder {
  id: string;
  outfit_name: string;
  quantity: number;
  price?: number;
  status: string;
  due_date: string | null;
  created_at: string;
  description?: string | null;
  production_notes?: string | null;
  customer_id?: string;
  customers?: {
    id?: string;
    full_name: string;
    phone?: string | null;
  } | null;
}

export interface CuttingTicketMeasurement {
  label: string;
  value: number;
}

export interface CuttingTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: CuttingTicketOrder | null;
  businessName: string;
  currency?: string;
  measurements?: CuttingTicketMeasurement[];
  measurementGarment?: string;
  measurementUnit?: string;
}

const DEFAULT_STAGES = [
  {
    step: "1",
    title: "Pattern Drafting & Sloper",
    desc: "Block adjustments, seam allowance & grainlines",
  },
  {
    step: "2",
    title: "Fabric Cutting & Interfacing",
    desc: "Grain alignment, canvas fusing, lining rough cut",
  },
  {
    step: "3",
    title: "Baste for 1st Fitting",
    desc: "Temporary basting, shoulder pads, pinned zipper",
  },
  {
    step: "4",
    title: "1st Fitting Alterations",
    desc: "Pin corrections marked & adjusted on pattern",
  },
  {
    step: "5",
    title: "Structural Assembly",
    desc: "Final seams, boning channels, shoulder stay & darts",
  },
  {
    step: "6",
    title: "Lining & Clean Finishing",
    desc: "Lining insertion, understitching & seam binding",
  },
  {
    step: "7",
    title: "Hemming & Closures",
    desc: "Blind hem, hand-stitched hooks, reinforced zipper",
  },
  {
    step: "8",
    title: "Final Pressing & QC Check",
    desc: "Steam shaping, thread trimming, final inspection",
  },
];

export function CuttingTicketModal({
  open,
  onOpenChange,
  order,
  businessName,
  measurements = [],
  measurementGarment = "Standard Silhouette",
  measurementUnit = "inches",
}: CuttingTicketModalProps) {
  const [showPhone, setShowPhone] = useState(true);
  const [showChecklist, setShowChecklist] = useState(true);
  const [showBlankLines, setShowBlankLines] = useState(true);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const ticketRef = `#ORD-${order.id.slice(0, 8).toUpperCase()}`;
  const isUrgent = (() => {
    if (!order.due_date) return false;
    const due = new Date(order.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && order.status !== "delivered" && order.status !== "cancelled";
  })();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-border bg-card">
        {/* On-screen control bar (hidden in print) */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur px-6 py-4 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <Scissors className="size-5 text-primary" />
              <DialogTitle className="font-display text-xl">
                Workshop Cutting Ticket & Job Sheet
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Production docket for cutters, machinists, and hanger rack identification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mr-2 border-r border-border pr-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPhone}
                  onChange={(e) => setShowPhone(e.target.checked)}
                  className="rounded border-border text-primary size-3.5"
                />
                Client Phone
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showChecklist}
                  onChange={(e) => setShowChecklist(e.target.checked)}
                  className="rounded border-border text-primary size-3.5"
                />
                QC Checklist
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBlankLines}
                  onChange={(e) => setShowBlankLines(e.target.checked)}
                  className="rounded border-border text-primary size-3.5"
                />
                Bench Notes
              </label>
            </div>

            <Button variant="hero" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="size-4" />
              <span>Print Ticket</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="size-8 p-0"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Printable Ticket Document */}
        <div
          className="p-6 sm:p-8 bg-white text-zinc-900 print:p-0 print:m-0"
          id="cutting-ticket-document"
          ref={printAreaRef}
        >
          {/* Printable Masthead */}
          <div className="border-b-2 border-zinc-900 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 font-semibold">
                  ATELIER WORKSHOP PRODUCTION DOCKET
                </span>
                <h1 className="text-2xl font-serif font-bold text-zinc-900 tracking-tight mt-0.5">
                  {businessName}
                </h1>
                <p className="text-xs text-zinc-600 font-sans mt-0.5">
                  Bespoke Couture & Tailoring Cutting Ticket
                </p>
              </div>

              <div className="text-right">
                <div className="inline-block bg-zinc-900 text-white font-mono px-3 py-1 text-sm font-bold tracking-wider rounded">
                  {ticketRef}
                </div>
                <p className="text-[11px] font-mono text-zinc-600 mt-1">
                  Issued: {shortDate(order.created_at)}
                </p>
              </div>
            </div>

            {/* Priority Urgency Banner */}
            {isUrgent && (
              <div className="mt-3 flex items-center justify-between border-2 border-amber-500 bg-amber-50 px-3 py-1.5 text-amber-900 rounded text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-4 text-amber-600" />
                  <span>PRIORITY RUSH PRODUCTION — DUE SOON</span>
                </div>
                <span className="font-mono text-amber-800">
                  Target Due: {longDate(order.due_date)}
                </span>
              </div>
            )}
          </div>

          {/* Garment & Client Primary Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-zinc-300 text-xs">
            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
                Outfit / Garment
              </span>
              <p className="font-semibold text-sm text-zinc-900 mt-0.5 truncate">
                {order.outfit_name}
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5">Qty: {order.quantity} item(s)</p>
            </div>

            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
                Client Contact
              </span>
              <p className="font-semibold text-sm text-zinc-900 mt-0.5 truncate">
                {order.customers?.full_name ?? "Direct Client"}
              </p>
              {showPhone && order.customers?.phone && (
                <p className="text-[11px] font-mono text-zinc-600 mt-0.5">
                  {order.customers.phone}
                </p>
              )}
            </div>

            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
                Target Deadline
              </span>
              <p className="font-semibold text-sm text-zinc-900 mt-0.5">
                {order.due_date ? shortDate(order.due_date) : "Open schedule"}
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5 capitalize">Status: {order.status}</p>
            </div>

            <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
              <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
                Pattern & Cut Standard
              </span>
              <p className="font-semibold text-sm text-zinc-900 mt-0.5 truncate">
                {measurementGarment}
              </p>
              <p className="text-[11px] font-mono text-zinc-600 mt-0.5 uppercase">
                Units: {measurementUnit}
              </p>
            </div>
          </div>

          {/* Garment Design Notes & Instructions */}
          {(order.description || order.production_notes) && (
            <div className="py-3 border-b border-zinc-300 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-1">
                Design Specifications & Tailor Guidelines
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.description && (
                  <div className="p-2 rounded bg-zinc-50 border border-zinc-200">
                    <p className="font-semibold text-zinc-700 text-[11px] mb-0.5">Style Details:</p>
                    <p className="text-zinc-800 leading-relaxed whitespace-pre-wrap">
                      {order.description}
                    </p>
                  </div>
                )}
                {order.production_notes && (
                  <div className="p-2 rounded bg-amber-50/70 border border-amber-200/80">
                    <p className="font-semibold text-amber-900 text-[11px] mb-0.5">
                      Production & Fabric Notes:
                    </p>
                    <p className="text-amber-950 leading-relaxed whitespace-pre-wrap">
                      {order.production_notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Workshop Measurement Matrix */}
          <div className="py-4 border-b-2 border-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif font-bold text-sm tracking-wide text-zinc-900 uppercase flex items-center gap-1.5">
                <Scissors className="size-3.5 text-zinc-700" />
                Cutter Measurement Specifications ({measurementUnit})
              </h2>
              <span className="text-[10px] font-mono text-zinc-500">
                {measurements.length} points recorded · Check against toile before cutting
              </span>
            </div>

            {measurements.length === 0 ? (
              <div className="border border-dashed border-zinc-300 rounded p-4 text-center">
                <p className="text-xs text-zinc-500 italic">
                  No automated measurement snapshot was linked to this order.
                </p>
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2 text-left">
                  {[
                    "Bust",
                    "Waist",
                    "High Hip",
                    "Full Hip",
                    "Shoulder",
                    "Cross Front",
                    "Cross Back",
                    "Sleeve Lgth",
                    "Armhole",
                    "Round Sleeve",
                    "Half Length",
                    "Full Length",
                  ].map((m) => (
                    <div key={m} className="border border-zinc-200 p-1.5 rounded text-[11px]">
                      <span className="text-zinc-500 block text-[9px] uppercase font-mono">
                        {m}
                      </span>
                      <span className="block border-b border-zinc-400 mt-2 h-4"></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {measurements.map((m) => (
                  <div
                    key={m.label}
                    className="flex items-center justify-between border border-zinc-200 px-2.5 py-1.5 rounded bg-zinc-50/50 text-xs"
                  >
                    <span className="text-zinc-600 font-medium text-[11px] truncate max-w-[120px]">
                      {m.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-zinc-900">{m.value}</span>
                      <span className="text-[9px] text-zinc-400 font-mono">
                        {measurementUnit === "inches" ? '"' : "cm"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Production Stages & Quality Control Sign-Off */}
          {showChecklist && (
            <div className="py-4 border-b border-zinc-300">
              <h2 className="font-serif font-bold text-sm tracking-wide text-zinc-900 uppercase mb-2 flex items-center gap-1.5">
                <CheckSquare className="size-3.5 text-zinc-700" />
                Workshop Production Stages & QC Sign-Off
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {DEFAULT_STAGES.map((s) => (
                  <div
                    key={s.step}
                    className="flex items-start gap-2.5 p-2 rounded border border-zinc-200 bg-zinc-50/40"
                  >
                    <div className="size-4 border-2 border-zinc-400 rounded-sm shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <span className="font-semibold text-zinc-900 text-[11px]">
                          {s.step}. {s.title}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400">
                          Date / Int: _____
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benchwork Notes & Fabric Details */}
          {showBlankLines && (
            <div className="py-3 border-b border-zinc-300 text-xs">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-1">
                Workshop Bench Notes & Material Log
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-zinc-600 mb-2">
                <div>
                  <span className="font-mono text-[9px] text-zinc-400 block uppercase">
                    Fabric Length Used:
                  </span>
                  <div className="border-b border-zinc-400 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[9px] text-zinc-400 block uppercase">
                    Lining / Thread No.:
                  </span>
                  <div className="border-b border-zinc-400 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[9px] text-zinc-400 block uppercase">
                    Zipper & Trims:
                  </span>
                  <div className="border-b border-zinc-400 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[9px] text-zinc-400 block uppercase">
                    Assigned Tailor:
                  </span>
                  <div className="border-b border-zinc-400 h-5" />
                </div>
              </div>
              <div className="border border-dashed border-zinc-300 rounded p-2 min-h-12 text-zinc-400 text-[10px] italic">
                Cutter / Tailor annotations (pattern adjustments, alteration pins, special seam
                allowances)…
              </div>
            </div>
          )}

          {/* Final Sign-Off & Verification Box */}
          <div className="pt-4 grid grid-cols-3 gap-4 text-center text-xs">
            <div className="border border-zinc-200 rounded p-2">
              <span className="text-[9px] font-mono uppercase text-zinc-400 block">
                Pattern & Cutting Approval
              </span>
              <div className="h-7 border-b border-dashed border-zinc-300 mt-2" />
              <span className="text-[10px] text-zinc-600 mt-1 block">Head Cutter Signature</span>
            </div>

            <div className="border border-zinc-200 rounded p-2">
              <span className="text-[9px] font-mono uppercase text-zinc-400 block">
                Quality Inspection Passed
              </span>
              <div className="h-7 border-b border-dashed border-zinc-300 mt-2" />
              <span className="text-[10px] text-zinc-600 mt-1 block">QC Supervisor Signature</span>
            </div>

            <div className="border border-zinc-200 rounded p-2">
              <span className="text-[9px] font-mono uppercase text-zinc-400 block">
                Client Delivery Handover
              </span>
              <div className="h-7 border-b border-dashed border-zinc-300 mt-2" />
              <span className="text-[10px] text-zinc-600 mt-1 block">Fitted & Accepted</span>
            </div>
          </div>

          {/* Footer Identifier */}
          <div className="mt-4 pt-2 border-t border-zinc-200 flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>
              {businessName} Atelier Suite · Order ID: {order.id}
            </span>
            <span>Printed via Atelier OS</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
