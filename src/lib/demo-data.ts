// Sample records for the public product preview only. Never written to any account.
import type { OrderStatus } from "./domain";
import style1 from "@/assets/style-1.jpg";
import style2 from "@/assets/style-2.jpg";
import style3 from "@/assets/style-3.jpg";
import style4 from "@/assets/style-4.jpg";

export const DEMO_IMAGES = { style1, style2, style3, style4 };

export type DemoCustomer = {
  id: string;
  name: string;
  phone: string;
  since: string;
  orders: number;
  measurements: { garment: string; date: string; values: [string, number][] }[];
};

export const demoCustomers: DemoCustomer[] = [
  {
    id: "c1",
    name: "Adaeze Okafor",
    phone: "+234 803 000 0001",
    since: "Mar 2025",
    orders: 6,
    measurements: [
      {
        garment: "Gown",
        date: "02 Nov 2026",
        values: [
          ["Bust", 92],
          ["Waist", 74],
          ["Hip", 101],
          ["Shoulder", 38],
          ["Full length", 148],
        ],
      },
      {
        garment: "Gown",
        date: "14 Jun 2026",
        values: [
          ["Bust", 93],
          ["Waist", 76],
          ["Hip", 102],
          ["Shoulder", 38],
          ["Full length", 148],
        ],
      },
    ],
  },
  {
    id: "c2",
    name: "Kwame Mensah",
    phone: "+233 24 000 0002",
    since: "Aug 2025",
    orders: 3,
    measurements: [
      {
        garment: "Senator",
        date: "21 Oct 2026",
        values: [
          ["Chest", 104],
          ["Shoulder", 47],
          ["Sleeve", 63],
          ["Neck", 41],
          ["Top length", 82],
        ],
      },
    ],
  },
  {
    id: "c3",
    name: "Zainab Bello",
    phone: "+234 809 000 0003",
    since: "Jan 2026",
    orders: 2,
    measurements: [
      {
        garment: "Blouse",
        date: "30 Sep 2026",
        values: [
          ["Bust", 88],
          ["Waist", 70],
          ["Shoulder", 37],
          ["Sleeve", 58],
        ],
      },
    ],
  },
  {
    id: "c4",
    name: "Amara Nwosu",
    phone: "+234 802 000 0004",
    since: "May 2026",
    orders: 1,
    measurements: [
      {
        garment: "Skirt",
        date: "11 Oct 2026",
        values: [
          ["Waist", 72],
          ["Hip", 99],
          ["Length", 96],
        ],
      },
    ],
  },
];

export type DemoOrder = {
  id: string;
  customer: string;
  outfit: string;
  due: string;
  status: OrderStatus;
  price: number;
  paid: number;
};

export const demoOrders: DemoOrder[] = [
  {
    id: "o1",
    customer: "Adaeze Okafor",
    outfit: "Wine wrap blazer dress",
    due: "14 Nov",
    status: "fitting",
    price: 185000,
    paid: 100000,
  },
  {
    id: "o2",
    customer: "Kwame Mensah",
    outfit: "Olive agbada set",
    due: "18 Nov",
    status: "sewing",
    price: 240000,
    paid: 240000,
  },
  {
    id: "o3",
    customer: "Zainab Bello",
    outfit: "Ivory print evening gown",
    due: "11 Nov",
    status: "finishing",
    price: 320000,
    paid: 150000,
  },
  {
    id: "o4",
    customer: "Amara Nwosu",
    outfit: "Pleated midi skirt",
    due: "22 Nov",
    status: "cutting",
    price: 65000,
    paid: 0,
  },
  {
    id: "o5",
    customer: "Adaeze Okafor",
    outfit: "Linen two-piece",
    due: "09 Nov",
    status: "ready",
    price: 120000,
    paid: 120000,
  },
];

export const demoCollections = [
  { id: "all", name: "All references" },
  { id: "bridal", name: "Owambe & bridal" },
  { id: "tailoring", name: "Tailoring" },
  { id: "fabric", name: "Fabrics" },
];

export const demoStyles = [
  {
    id: "s1",
    src: style1,
    title: "Structured wrap blazer",
    tag: "Tailoring",
    collection: "tailoring",
  },
  { id: "s2", src: style2, title: "Ivory print ball gown", tag: "Evening", collection: "bridal" },
  { id: "s3", src: style3, title: "Autumn linen palette", tag: "Fabric", collection: "fabric" },
  {
    id: "s4",
    src: style4,
    title: "Olive agbada, modern cut",
    tag: "Menswear",
    collection: "tailoring",
  },
];
