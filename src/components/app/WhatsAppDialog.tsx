import { useState, useEffect } from "react";
import { MessageSquare, Copy, ExternalLink, Check, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/lib/api";
import {
  openWhatsApp,
  generateStageUpdateMessage,
  generateFittingReminderMessage,
  generatePaymentReceiptMessage,
} from "@/lib/whatsapp";

export interface WhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientPhone?: string | null;
  orderTitle?: string;
  currentStage?: string;
  dueDate?: string | null;
  balanceDue?: number;
  totalOrderPrice?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  paymentAmount?: number;
  defaultMode?: "stage" | "fitting" | "receipt" | "custom";
}

export function WhatsAppDialog({
  open,
  onOpenChange,
  clientName,
  clientPhone,
  orderTitle = "Bespoke Garment",
  currentStage = "in_progress",
  dueDate,
  balanceDue,
  totalOrderPrice,
  appointmentDate,
  appointmentTime,
  paymentAmount,
  defaultMode = "stage",
}: WhatsAppDialogProps) {
  const business = useBusiness();
  const [activeTab, setActiveTab] = useState<"stage" | "fitting" | "receipt" | "custom">(
    defaultMode,
  );
  const [phone, setPhone] = useState(clientPhone || "");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Sync phone when client changes or dialog opens
  useEffect(() => {
    if (open) {
      setPhone(clientPhone || "");
      setActiveTab(defaultMode);
    }
  }, [open, clientPhone, defaultMode]);

  // Generate message based on active template
  useEffect(() => {
    if (!open) return;

    if (activeTab === "stage") {
      setMessage(
        generateStageUpdateMessage({
          atelierName: business.name,
          clientName: clientName || "Valued Client",
          outfitName: orderTitle,
          stage: currentStage,
          dueDate: dueDate || undefined,
          balanceDue: balanceDue,
          currency: business.currency,
        }),
      );
    } else if (activeTab === "fitting") {
      setMessage(
        generateFittingReminderMessage({
          atelierName: business.name,
          clientName: clientName || "Valued Client",
          outfitName: orderTitle,
          date: appointmentDate || dueDate || "Tomorrow",
          time: appointmentTime || "2:00 PM",
        }),
      );
    } else if (activeTab === "receipt") {
      setMessage(
        generatePaymentReceiptMessage({
          atelierName: business.name,
          clientName: clientName || "Valued Client",
          outfitName: orderTitle,
          amountPaid: paymentAmount || 0,
          totalOrderPrice: totalOrderPrice,
          balanceRemaining: balanceDue,
          currency: business.currency,
        }),
      );
    }
  }, [
    open,
    activeTab,
    business.name,
    business.currency,
    clientName,
    orderTitle,
    currentStage,
    dueDate,
    balanceDue,
    appointmentDate,
    appointmentTime,
    paymentAmount,
    totalOrderPrice,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Message copied to clipboard — ready to send!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy message");
    }
  };

  const handleSendWhatsApp = () => {
    if (!phone.trim()) {
      toast.error("Please enter a phone number to open WhatsApp");
      return;
    }
    openWhatsApp(phone, message);
    toast.success("Opening WhatsApp chat…");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg font-sans bg-white p-6 border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <MessageSquare className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">
                Direct WhatsApp Communication
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Send professional atelier updates with zero API setup or fees
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Client & Phone Field */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Client Name</Label>
              <Input
                value={clientName}
                disabled
                className="mt-1 h-8 text-xs bg-slate-50 border-slate-200"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-700 font-medium">WhatsApp / Phone Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +234 801 234 5678 or 0801..."
                  className="pl-8 h-8 text-xs border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Template Selection Tabs */}
          <div>
            <Label className="text-[11px] font-mono uppercase text-slate-400 mb-1.5 block">
              Message Template
            </Label>
            <div className="grid grid-cols-4 gap-1 rounded-md border border-slate-200 bg-slate-50 p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab("stage")}
                className={`rounded py-1 font-medium transition-colors ${
                  activeTab === "stage"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Stage Update
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("fitting")}
                className={`rounded py-1 font-medium transition-colors ${
                  activeTab === "fitting"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Fitting Notice
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("receipt")}
                className={`rounded py-1 font-medium transition-colors ${
                  activeTab === "receipt"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Payment Receipt
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`rounded py-1 font-medium transition-colors ${
                  activeTab === "custom"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Custom Note
              </button>
            </div>
          </div>

          {/* Message Preview & Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-[11px] font-mono uppercase text-slate-400">
                Message Preview & Customization
              </Label>
              <span className="text-[10px] font-mono text-slate-400">
                {message.length} characters
              </span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="font-mono text-xs leading-relaxed border-slate-200 bg-slate-50/50 focus:bg-white resize-none"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              You can edit the message above before dispatching. WhatsApp markdown (*bold*) is
              supported.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 text-xs gap-1.5 border-slate-200"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5 text-slate-500" />
            )}
            <span>{copied ? "Copied" : "Copy for SMS / DM"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs text-slate-500"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSendWhatsApp}
              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <ExternalLink className="size-3.5" />
              <span>Open in WhatsApp</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
