/**
 * Atelier WhatsApp & Direct Client Communication Protocol.
 * Uses the universal click-to-chat WhatsApp protocol (https://wa.me/)
 * with zero external API keys or subscription fees required.
 */

export interface StageUpdateParams {
  atelierName: string;
  clientName: string;
  outfitName: string;
  stage: string;
  dueDate?: string | null;
  balanceDue?: number;
  currency?: string;
  notes?: string;
}

export interface FittingReminderParams {
  atelierName: string;
  clientName: string;
  outfitName?: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
}

export interface PaymentReceiptParams {
  atelierName: string;
  clientName: string;
  outfitName: string;
  amountPaid: number;
  totalOrderPrice?: number;
  balanceRemaining?: number;
  currency: string;
  paymentMethod?: string;
  date?: string;
}

export interface MeasurementSummaryParams {
  atelierName: string;
  clientName: string;
  garment: string;
  unit: string;
  measurements: Array<{ label: string; value: number }>;
}

/**
 * Normalizes phone numbers for WhatsApp international click-to-chat links.
 * Strips formatting, spaces, and leading zeroes if default country code applies.
 */
export function cleanPhoneNumber(rawPhone: string, defaultCountryCode = "234"): string {
  if (!rawPhone) return "";
  // Strip all non-digit characters except leading plus
  const cleaned = rawPhone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned.replace("+", "");
  }

  // If local phone starts with 0 (e.g., 080..., 07...), replace leading 0 with country code
  if (cleaned.startsWith("0")) {
    return defaultCountryCode + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Constructs a standard WhatsApp Click-to-Chat URL.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message.trim());
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Dispatches WhatsApp link in a new browser context.
 * Opens native WhatsApp on mobile devices or WhatsApp Web on desktop.
 */
export function openWhatsApp(phone: string, message: string) {
  const url = buildWhatsAppUrl(phone, message);
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Template: Order Production Stage Update
 */
export function generateStageUpdateMessage({
  atelierName,
  clientName,
  outfitName,
  stage,
  dueDate,
  balanceDue,
  currency = "NGN",
  notes,
}: StageUpdateParams): string {
  const stageFormatted = stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const firstName = clientName.split(" ")[0] || "Valued Client";

  const lines = [
    `Hello ${firstName}! ✨`,
    ``,
    `This is a production update from *${atelierName}* regarding your bespoke garment (*${outfitName}*).`,
    ``,
    `📍 *Current Status:* ${stageFormatted}`,
  ];

  if (dueDate) {
    lines.push(`📅 *Target Delivery:* ${dueDate}`);
  }

  if (notes) {
    lines.push(`📝 *Tailor's Note:* ${notes}`);
  }

  if (balanceDue && balanceDue > 0) {
    lines.push(``, `💳 *Balance Upon Completion:* ${currency} ${balanceDue.toLocaleString()}`);
  }

  lines.push(
    ``,
    `Please let us know if you have any questions or fitting adjustments. Thank you for choosing ${atelierName}! 🪡👗`,
  );

  return lines.join("\n");
}

/**
 * Template: Fitting Appointment Reminder
 */
export function generateFittingReminderMessage({
  atelierName,
  clientName,
  outfitName,
  date,
  time,
  location,
  notes,
}: FittingReminderParams): string {
  const firstName = clientName.split(" ")[0] || "Valued Client";

  const lines = [
    `Hello ${firstName}! 🪞`,
    ``,
    `Your upcoming fitting appointment at *${atelierName}* is scheduled:`,
    ``,
    `🗓️ *Date:* ${date}`,
  ];

  if (time) {
    lines.push(`⏰ *Time:* ${time}`);
  }

  if (outfitName) {
    lines.push(`👗 *Garment:* ${outfitName}`);
  }

  if (location) {
    lines.push(`📍 *Location:* ${location}`);
  }

  lines.push(
    ``,
    `💡 *Fitting Tip:* Please bring the shoes and undergarments you plan to wear with this outfit so we can ensure the hemline and silhouette are tailored perfectly.`,
  );

  if (notes) {
    lines.push(`📝 *Note:* ${notes}`);
  }

  lines.push(``, `Please reply to confirm or reschedule if needed. See you soon! ✨`);

  return lines.join("\n");
}

/**
 * Template: Payment Deposit & Balance Receipt
 */
export function generatePaymentReceiptMessage({
  atelierName,
  clientName,
  outfitName,
  amountPaid,
  totalOrderPrice,
  balanceRemaining,
  currency,
  paymentMethod,
  date,
}: PaymentReceiptParams): string {
  const firstName = clientName.split(" ")[0] || "Valued Client";
  const receiptDate = date || new Date().toLocaleDateString();

  const lines = [
    `Payment Receipt 🧾`,
    ``,
    `Dear ${firstName}, thank you for your payment to *${atelierName}*.`,
    ``,
    `👗 *Garment:* ${outfitName}`,
    `💰 *Amount Received:* ${currency} ${amountPaid.toLocaleString()}`,
    `📅 *Date:* ${receiptDate}`,
  ];

  if (paymentMethod) {
    lines.push(`💳 *Payment Method:* ${paymentMethod}`);
  }

  if (totalOrderPrice !== undefined && balanceRemaining !== undefined) {
    lines.push(`💵 *Order Total:* ${currency} ${totalOrderPrice.toLocaleString()}`);
    if (balanceRemaining > 0) {
      lines.push(`⏳ *Balance Remaining:* ${currency} ${balanceRemaining.toLocaleString()}`);
    } else {
      lines.push(`✅ *Status:* Paid in Full`);
    }
  }

  lines.push(
    ``,
    `Your garment is being crafted with the highest care. Warm regards, *${atelierName}*.`,
  );

  return lines.join("\n");
}

/**
 * Template: Measurement Profile Confirmation
 */
export function generateMeasurementSummaryMessage({
  atelierName,
  clientName,
  garment,
  unit,
  measurements,
}: MeasurementSummaryParams): string {
  const firstName = clientName.split(" ")[0] || "Valued Client";

  const lines = [
    `Measurement Profile 📐`,
    ``,
    `Hello ${firstName}, here is a copy of your verified measurements on file with *${atelierName}* for ${garment} (${unit}):`,
    ``,
  ];

  measurements.forEach((m) => {
    lines.push(`• *${m.label}:* ${m.value} ${unit}`);
  });

  lines.push(``, `These specifications are saved for all your future commissions. Thank you! 🪡`);

  return lines.join("\n");
}
