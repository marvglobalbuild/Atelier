/**
 * Fabric and Material Inventory Tracker & Yardage Calculator for Atelier
 */

export type FabricCategory =
  | "silk"
  | "satin"
  | "lace"
  | "ankara"
  | "velvet"
  | "crepe"
  | "organza"
  | "lining"
  | "tulle"
  | "trim"
  | "other";

export interface FabricAllocation {
  orderId: string;
  outfitName: string;
  yards: number;
  allocatedAt: string;
}

export interface FabricItem {
  id: string;
  businessId: string;
  name: string;
  category: FabricCategory;
  color: string;
  colorHex?: string;
  totalYards: number;
  availableYards: number;
  allocatedYards: number;
  unit: "yards" | "meters";
  costPerUnit: number;
  supplier?: string;
  location?: string; // e.g. "Rack A - Shelf 2"
  lowStockThreshold: number;
  notes?: string;
  allocations: FabricAllocation[];
  createdAt: string;
  updatedAt: string;
}

export const FABRIC_CATEGORIES: { id: FabricCategory; label: string }[] = [
  { id: "silk", label: "Silk & Charmeuse" },
  { id: "satin", label: "Duchess & Bridal Satin" },
  { id: "lace", label: "French & Chantilly Lace" },
  { id: "ankara", label: "Ankara Wax Print" },
  { id: "velvet", label: "Velvet & Velour" },
  { id: "crepe", label: "Wool & Silk Crepe" },
  { id: "organza", label: "Organza & Chiffon" },
  { id: "lining", label: "Habotai & Voile Lining" },
  { id: "tulle", label: "Tulle & Crinoline" },
  { id: "trim", label: "Trims, Fasteners & Buttons" },
  { id: "other", label: "Specialty / Other" },
];

export const INITIAL_FABRIC_BOLTS: Omit<
  FabricItem,
  "id" | "businessId" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Mulberry Silk Charmeuse 19mm",
    category: "silk",
    color: "Champagne Ivory",
    colorHex: "#f7f0e6",
    totalYards: 25,
    availableYards: 18.5,
    allocatedYards: 6.5,
    unit: "yards",
    costPerUnit: 35000,
    supplier: "Bespoke Silks Ltd",
    location: "Rack 1 - Upper Tier",
    lowStockThreshold: 5,
    notes: "High lustre drape, ideal for bias cut evening slip gowns and bridal linings.",
    allocations: [],
  },
  {
    name: "Heavy Duchess Bridal Satin",
    category: "satin",
    color: "Deep Wine / Burgundy",
    colorHex: "#5a1827",
    totalYards: 30,
    availableYards: 12.0,
    allocatedYards: 8.0,
    unit: "yards",
    costPerUnit: 28000,
    supplier: "Couture Textiles UK",
    location: "Rack 2 - Bolt Stand B",
    lowStockThreshold: 6,
    notes: "Structured hand feel, hold boning channels and structural folds perfectly.",
    allocations: [],
  },
  {
    name: "French Corded Chantilly Lace",
    category: "lace",
    color: "Black Noir",
    colorHex: "#1c1917",
    totalYards: 15,
    availableYards: 4.2,
    allocatedYards: 3.5,
    unit: "yards",
    costPerUnit: 48000,
    supplier: "Calais Dentelle Export",
    location: "Lace Drawer 3",
    lowStockThreshold: 5,
    notes: "Scalloped double borders, delicate floral motif for corsetry and illusion bodices.",
    allocations: [],
  },
  {
    name: "Super-Wax African Ankara Print",
    category: "ankara",
    color: "Emerald & Gold Sunburst",
    colorHex: "#065f46",
    totalYards: 24,
    availableYards: 16.0,
    allocatedYards: 6.0,
    unit: "yards",
    costPerUnit: 18500,
    supplier: "Vlisco Premium Lagos",
    location: "Rack 3 - Shelf 1",
    lowStockThreshold: 6,
    notes: "100% fine cotton, requires pattern matching along side seams.",
    allocations: [],
  },
  {
    name: "Silk Habotai Lightweight Lining",
    category: "lining",
    color: "Nude Skin Tone",
    colorHex: "#e7d5c5",
    totalYards: 40,
    availableYards: 22.0,
    allocatedYards: 10.0,
    unit: "yards",
    costPerUnit: 14000,
    supplier: "Fine Linings Co",
    location: "Under-table Roll B",
    lowStockThreshold: 8,
    notes: "Ultra-breathable next-to-skin lining for couture gowns.",
    allocations: [],
  },
];

/**
 * LocalStorage storage key helper
 */
function getStorageKey(businessId: string): string {
  return `atelier_inventory_v1_${businessId}`;
}

export function loadInventory(businessId: string): FabricItem[] {
  if (typeof window === "undefined") return [];
  const key = getStorageKey(businessId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Seed initial high-end sample inventory
      const initial = INITIAL_FABRIC_BOLTS.map((item, idx) => ({
        ...item,
        id: `fab_${Date.now()}_${idx}`,
        businessId,
        createdAt: new Date(Date.now() - (idx + 1) * 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load inventory from storage:", err);
    return [];
  }
}

export function saveInventory(businessId: string, items: FabricItem[]): void {
  if (typeof window === "undefined") return;
  const key = getStorageKey(businessId);
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to persist inventory:", err);
  }
}

/**
 * Silhouette definitions for Fabric Yardage Estimator
 */
export interface SilhouetteEstimate {
  id: string;
  name: string;
  baseYards: number;
  liningYards: number;
  interfacingYards: number;
  description: string;
}

export const SILHOUETTE_ESTIMATES: SilhouetteEstimate[] = [
  {
    id: "corset_top",
    name: "Corset / Bustier Top",
    baseYards: 1.2,
    liningYards: 1.0,
    interfacingYards: 0.8,
    description: "Includes boning channels, waist tape & underbust curve.",
  },
  {
    id: "a_line_gown",
    name: "A-Line Floor Length Evening Gown",
    baseYards: 4.0,
    liningYards: 3.5,
    interfacingYards: 0.5,
    description: "Fitted bodice, flares gently from waist to floor with seam ease.",
  },
  {
    id: "mermaid_gown",
    name: "Mermaid / Trumpet Gown",
    baseYards: 5.0,
    liningYards: 4.5,
    interfacingYards: 0.7,
    description: "Fitted through knee with full flared godets or circular skirt flare.",
  },
  {
    id: "ballgown",
    name: "Couture Ballgown with Voluminous Skirt",
    baseYards: 7.5,
    liningYards: 6.0,
    interfacingYards: 1.0,
    description: "Pleated or gathered full circle skirt with horsehair hem.",
  },
  {
    id: "two_piece_suit",
    name: "Tailored 2-Piece Trouser Suit",
    baseYards: 4.5,
    liningYards: 2.5,
    interfacingYards: 1.2,
    description: "Single/double-breasted blazer plus high-waist straight trousers.",
  },
  {
    id: "blazer",
    name: "Tailored Structured Blazer",
    baseYards: 2.5,
    liningYards: 2.0,
    interfacingYards: 1.0,
    description: "Shoulder canvas, chest welt pocket & sleeve vents.",
  },
  {
    id: "jumpsuit",
    name: "Wide-Leg Tailored Jumpsuit",
    baseYards: 3.8,
    liningYards: 2.0,
    interfacingYards: 0.5,
    description: "Fitted bodice with palazzo or straight leg pants.",
  },
  {
    id: "kaftan_agbada",
    name: "Grand Kaftan / Agbada Ensemble",
    baseYards: 5.5,
    liningYards: 1.5,
    interfacingYards: 0.5,
    description: "Flowing sleeves, neck embroidery band & inner tunic.",
  },
  {
    id: "pencil_skirt",
    name: "High-Waist Fitted Pencil Skirt",
    baseYards: 1.5,
    liningYards: 1.2,
    interfacingYards: 0.3,
    description: "Waist darts, back kick pleat & invisible zipper.",
  },
];

export interface YardageCalculationParams {
  silhouetteId: string;
  heightCategory: "petite" | "standard" | "tall";
  fabricWidth: 45 | 60; // 45" narrow bolt vs 60" standard bolt
  hasTrain: boolean;
  hasPatternMatching: boolean;
}

export function calculateYardage(params: YardageCalculationParams) {
  const s =
    SILHOUETTE_ESTIMATES.find((item) => item.id === params.silhouetteId) || SILHOUETTE_ESTIMATES[1];

  let multiplier = 1.0;

  // Height factor
  if (params.heightCategory === "petite") multiplier *= 0.92;
  if (params.heightCategory === "tall") multiplier *= 1.15;

  // Bolt width factor (45" requires ~25% more yardage than 60")
  if (params.fabricWidth === 45) multiplier *= 1.25;

  // Pattern matching factor (plaid, ankara, directional motif)
  if (params.hasPatternMatching) multiplier *= 1.15;

  let totalBase = s.baseYards * multiplier;
  if (params.hasTrain) {
    totalBase += 2.0; // Standard 1.5m train addition
  }

  return {
    silhouetteName: s.name,
    estimatedMainYardage: Math.round(totalBase * 10) / 10,
    estimatedLiningYardage:
      Math.round(s.liningYards * (params.heightCategory === "tall" ? 1.1 : 1.0) * 10) / 10,
    estimatedInterfacingYardage: s.interfacingYards,
  };
}
