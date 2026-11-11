import { useState } from "react";
import {
  Tag,
  Printer,
  Scissors,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  Shirt,
  X,
  Phone,
  Calendar,
  Layers,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { shortDate, longDate, money } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface HangtagOrder {
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
  payments?: { amount: number }[];
}

export interface GarmentHangtagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: HangtagOrder | null;
  businessName: string;
  currency?: string;
}

export function GarmentHangtagModal({
  open,
  onOpenChange,
  order,
  businessName,
  currency = "NGN",
}: GarmentHangtagModalProps) {
  const [includeCare, setIncludeCare] = useState(true);
  const [includeStub, setIncludeStub] = useState(true);

  if (!order) return null;

  const ticketRef = `#ORD-${order.id.slice(0, 8).toUpperCase()}`;

  // Calculate balance due
  const totalPaid = (order.payments || []).reduce((acc, p) => acc + Number(p.amount), 0);
  const totalPrice = Number(order.price) || 0;
  const balanceDue = Math.max(0, totalPrice - totalPaid);
  const isFullyPaid = balanceDue === 0 && totalPrice > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-border bg-card">
        {/* On-screen Toolbar */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur px-6 py-4 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="size-5 text-primary" />
              <DialogTitle className="font-display text-xl">
                Garment Bag & Hanger Tag Generator
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Printable boutique garment tag with care instructions and customer claim stub.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mr-2 border-r border-border pr-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCare}
                  onChange={(e) => setIncludeCare(e.target.checked)}
                  className="rounded border-border text-primary size-3.5"
                />
                Care Label
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStub}
                  onChange={(e) => setIncludeStub(e.target.checked)}
                  className="rounded border-border text-primary size-3.5"
                />
                Pickup Claim Stub
              </label>
            </div>

            <Button variant="hero" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="size-4" />
              <span>Print Tag</span>
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

        {/* Printable Hangtag Document Preview */}
        <div className="p-6 sm:p-10 bg-secondary/30 flex justify-center print:p-0 print:bg-white print:m-0">
          <div
            id="garment-hangtag-card"
            className="w-full max-w-md bg-white text-zinc-900 border-2 border-zinc-900 rounded-xl p-6 shadow-sm print:shadow-none print:border-zinc-900 print:rounded-none relative"
          >
            {/* Hanger Punch Hole Indicator */}
            <div className="flex flex-col items-center pb-3">
              <div className="size-5 rounded-full border-2 border-dashed border-zinc-400 flex items-center justify-center text-[8px] text-zinc-400 font-mono">
                ○
              </div>
              <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-400 mt-1">
                Hanger Hole Punch
              </span>
            </div>

            {/* Brand Header */}
            <div className="text-center border-b border-zinc-300 pb-3">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900">
                {businessName}
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mt-0.5">
                Bespoke Atelier Garment Tag
              </p>
            </div>

            {/* Order Identifier & Barcode Visual */}
            <div className="py-3 flex items-center justify-between border-b border-zinc-300">
              <div>
                <span className="text-[9px] font-mono uppercase text-zinc-500 block">
                  Reference No.
                </span>
                <span className="font-mono text-base font-bold text-zinc-900 tracking-wider">
                  {ticketRef}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-mono uppercase text-zinc-500 block">
                  Target Handover
                </span>
                <span className="font-sans text-xs font-semibold text-zinc-900">
                  {order.due_date ? shortDate(order.due_date) : "Open"}
                </span>
              </div>
            </div>

            {/* Client Identification Box */}
            <div className="py-4 border-b border-zinc-300">
              <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                Client / Consignee
              </span>
              <p className="font-serif text-xl font-bold text-zinc-900">
                {order.customers?.full_name ?? "Private Client"}
              </p>
              {order.customers?.phone && (
                <p className="text-xs font-mono text-zinc-600 mt-0.5 flex items-center gap-1.5">
                  <Phone className="size-3 text-zinc-400" />
                  {order.customers.phone}
                </p>
              )}
            </div>

            {/* Garment Details & Workshop Bench */}
            <div className="py-4 border-b border-zinc-300 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block">
                    Garment Piece
                  </span>
                  <p className="font-semibold text-sm text-zinc-900 mt-0.5">{order.outfit_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block">
                    Quantity
                  </span>
                  <p className="font-mono text-sm font-bold text-zinc-900 mt-0.5">
                    {order.quantity} pc(s)
                  </p>
                </div>
              </div>

              {order.description && (
                <p className="text-[11px] text-zinc-600 italic bg-zinc-50 p-2 rounded border border-zinc-200">
                  {order.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-zinc-600 font-mono">
                <div>
                  <span className="text-zinc-400 block">Tailor Assigned:</span>
                  <span className="font-semibold text-zinc-800">Master Workshop</span>
                </div>
                <div>
                  <span className="text-zinc-400 block">Final QC Status:</span>
                  <span className="font-semibold text-emerald-700">Inspected & Pressed</span>
                </div>
              </div>
            </div>

            {/* Garment Care Symbols Section */}
            {includeCare && (
              <div className="py-4 border-b border-zinc-300">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-2 text-center">
                  Couture Preservation & Care
                </span>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-1.5 border border-zinc-200 rounded">
                    <span className="font-serif font-bold text-sm block text-zinc-900">Ⓟ</span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase block mt-0.5">
                      Dry Clean
                    </span>
                  </div>
                  <div className="p-1.5 border border-zinc-200 rounded">
                    <span className="font-serif font-bold text-sm block text-zinc-900">∦</span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase block mt-0.5">
                      Cool Iron
                    </span>
                  </div>
                  <div className="p-1.5 border border-zinc-200 rounded">
                    <span className="font-serif font-bold text-sm block text-zinc-900">◬</span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase block mt-0.5">
                      No Bleach
                    </span>
                  </div>
                  <div className="p-1.5 border border-zinc-200 rounded">
                    <span className="font-serif font-bold text-sm block text-zinc-900">⊗</span>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase block mt-0.5">
                      No Tumble
                    </span>
                  </div>
                </div>

                <p className="text-[9px] text-zinc-500 text-center mt-2 leading-relaxed">
                  Store inside breathable garment bag away from direct sunlight. Steam on reverse.
                </p>
              </div>
            )}

            {/* Perforated Tear-off Claim Stub */}
            {includeStub && (
              <div className="pt-4">
                {/* Perforation Line */}
                <div className="relative flex items-center justify-between pb-3">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-zinc-400" />
                  <span className="relative bg-white px-2 text-[9px] font-mono uppercase tracking-widest text-zinc-500 mx-auto flex items-center gap-1">
                    <Scissors className="size-3" /> TEAR HERE FOR CLIENT PICKUP STUB
                  </span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-serif font-bold text-zinc-900">{businessName}</p>
                      <p className="text-[9px] font-mono text-zinc-500">Official Collection Slip</p>
                    </div>
                    <span className="font-mono font-bold text-zinc-900">{ticketRef}</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-200 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-zinc-400 uppercase font-mono block">
                        Customer
                      </span>
                      <span className="font-semibold text-zinc-800 truncate max-w-[140px] block">
                        {order.customers?.full_name ?? "Valued Client"}
                      </span>
                    </div>

                    <div className="text-right">
                      {isFullyPaid ? (
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold font-mono">
                          PAID IN FULL ✓
                        </span>
                      ) : (
                        <div>
                          <span className="text-[9px] text-amber-700 uppercase font-mono block font-bold">
                            Balance Due:
                          </span>
                          <span className="font-mono font-bold text-amber-900 text-sm">
                            {money(balanceDue, currency)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[8px] text-zinc-400 text-center mt-2 font-mono">
                    Please present this receipt ticket upon collection at the atelier.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
