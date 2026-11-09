import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { demoCustomers, demoOrders, demoStyles, DEMO_IMAGES } from "@/lib/demo-data";
import { PRODUCTION_STAGES, STATUS_LABEL } from "@/lib/domain";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading } from "./Reveal";

/* ---------- The problem: scattered → organised ---------- */
const scraps = [
  { label: "Notebook p.47", text: "Adaeze — bust 92, waist 74… (or 76?)", rot: -8, x: -38, y: -30 },
  { label: "Photos · 3,412", text: "Screenshot_2026-10-02.jpg", rot: 6, x: 34, y: -36 },
  { label: "Messages", text: "“Is my dress ready for Saturday?”", rot: -3, x: -30, y: 34 },
  { label: "Spreadsheet", text: "Paid?? ₦100k — check transfer", rot: 9, x: 36, y: 30 },
];

export function Problem() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const t = useTransform(scrollYProgress, [0.2, 1], [0, 1]);
  return (
    <section className="border-y border-border bg-secondary/40 py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 md:grid-cols-2 md:px-8">
        <SectionHeading
          eyebrow="The problem"
          title={
            <>
              Notebooks. Galleries. Chats. <em>Spreadsheets.</em>
            </>
          }
          body="Measurements live in one place, inspiration in another, and payment records somewhere in between. Every order means searching — and every search costs you time and trust."
        />
        <div ref={ref} className="relative h-[380px]">
          {scraps.map((s, i) => (
            <Scrap key={s.label} s={s} i={i} t={reduce ? null : t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Scrap({
  s,
  i,
  t,
}: {
  s: (typeof scraps)[number];
  i: number;
  t: MotionValue<number> | null;
}) {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const fallback = useTransform(() => 1);
  const p = t ?? fallback;
  const x = useTransform(p, [0, 1], [`${s.x}%`, "0%"]);
  const y = useTransform(p, [0, 1], [`${s.y}%`, "0%"]);
  const rotate = useTransform(p, [0, 1], [s.rot, 0]);
  return (
    <motion.div
      style={{ x, y, rotate, left: `${col * 50 + 2}%`, top: `${row * 50 + 4}%` }}
      className="absolute w-[46%] rounded-md border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
    >
      <p className="eyebrow !text-[0.62rem]">{s.label}</p>
      <p className="mt-2 text-sm leading-snug">{s.text}</p>
    </motion.div>
  );
}

/* ---------- Bento: one workspace ---------- */
const modules = [
  {
    id: "customers",
    name: "Customers",
    line: "Every client, their history and preferences.",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    id: "measurements",
    name: "Measurements",
    line: "Dated, garment-specific, never overwritten.",
    span: "",
  },
  {
    id: "style",
    name: "Style Library",
    line: "Your private visual archive.",
    span: "md:row-span-2",
  },
  { id: "orders", name: "Orders", line: "From cutting to collection.", span: "" },
  {
    id: "payments",
    name: "Payments",
    line: "Deposits, balances, receipts.",
    span: "md:col-span-2",
  },
  { id: "calendar", name: "Calendar", line: "Fittings and deliveries, on time.", span: "" },
];

export function Bento() {
  const [active, setActive] = useState("customers");
  return (
    <section id="features" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="One workspace"
          title={
            <>
              Every detail, <em>in its place.</em>
            </>
          }
          body="Select a module to see what lives inside."
        />
        <div className="mt-12 grid auto-rows-[150px] gap-3 md:grid-cols-4">
          {modules.map((m, i) => (
            <Reveal key={m.id} delay={i * 0.05} className={m.span}>
              <button
                onClick={() => setActive(m.id)}
                aria-pressed={active === m.id}
                className={cn(
                  "group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-lg border p-5 text-left transition-all duration-300",
                  active === m.id
                    ? "border-ink bg-ink text-ink-foreground"
                    : "border-border bg-card hover:border-foreground/30",
                )}
              >
                <span className="font-display text-2xl md:text-3xl">{m.name}</span>
                <span
                  className={cn(
                    "text-sm",
                    active === m.id ? "opacity-80" : "text-muted-foreground",
                  )}
                >
                  {m.line}
                </span>
              </button>
            </Reveal>
          ))}
        </div>
        <div className="mt-4 min-h-[180px] rounded-lg border border-border bg-card p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ModulePreview id={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function ModulePreview({ id }: { id: string }) {
  if (id === "customers")
    return <Rows rows={demoCustomers.map((c) => [c.name, c.phone, `${c.orders} orders`])} />;
  if (id === "measurements")
    return (
      <Rows
        rows={demoCustomers[0].measurements[0].values.map(([k, v]) => [
          k,
          `${v} cm`,
          "02 Nov 2026",
        ])}
      />
    );
  if (id === "style")
    return (
      <div className="grid grid-cols-4 gap-2">
        {demoStyles.map((s) => (
          <img
            key={s.id}
            src={s.src}
            alt={s.title}
            loading="lazy"
            className="aspect-[3/4] w-full rounded-sm object-cover"
          />
        ))}
      </div>
    );
  if (id === "orders")
    return <Rows rows={demoOrders.map((o) => [o.outfit, o.customer, STATUS_LABEL[o.status]])} />;
  if (id === "payments")
    return <Rows rows={demoOrders.map((o) => [o.outfit, money(o.paid), `of ${money(o.price)}`])} />;
  return (
    <Rows
      rows={[
        ["Fri 13 Nov", "Fitting · Adaeze Okafor", "10:00"],
        ["Sat 14 Nov", "Delivery · Wine wrap blazer dress", "—"],
        ["Wed 18 Nov", "Delivery · Olive agbada set", "—"],
      ]}
    />
  );
}

function Rows({ rows }: { rows: string[][] }) {
  return (
    <div className="divide-y divide-border text-sm">
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-[1.4fr_1fr] gap-3 py-2.5 sm:grid-cols-[1.4fr_1fr_auto]"
        >
          <span className="truncate font-medium">{r[0]}</span>
          <span className="tabular truncate text-muted-foreground">{r[1]}</span>
          <span className="tabular hidden text-muted-foreground sm:block">{r[2]}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Customers remembered ---------- */
const steps = ["Profile", "Measurements", "Order history"] as const;
export function CustomersStory() {
  const [step, setStep] = useState(0);
  const c = demoCustomers[0];
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[1fr_1.2fr] md:items-center md:px-8">
        <div>
          <SectionHeading
            eyebrow="Customers"
            title={
              <>
                Your customers, <em>remembered.</em>
              </>
            }
            body="Open a name and everything follows: how to reach them, every measurement you’ve taken, every outfit you’ve made."
          />
          <div className="mt-8 flex flex-col">
            {steps.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={cn(
                  "flex items-center gap-4 border-t border-border py-4 text-left transition-colors last:border-b",
                  step === i ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="tabular text-xs">0{i + 1}</span>
                <span className="text-lg">{s}</span>
                {step === i && (
                  <motion.span
                    layoutId="cust-dot"
                    className="ml-auto size-2 rounded-full bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="surface min-h-[360px] p-6 shadow-[var(--shadow-float)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.3 }}
            >
              {step === 0 && (
                <div>
                  <span className="grid size-14 place-items-center rounded-full bg-wine-soft font-display text-xl text-primary">
                    AO
                  </span>
                  <h3 className="font-display mt-4 text-3xl">{c.name}</h3>
                  <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="mt-1">{c.phone}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Customer since</dt>
                      <dd className="mt-1">{c.since}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Orders</dt>
                      <dd className="mt-1">{c.orders}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Prefers</dt>
                      <dd className="mt-1">Structured shoulders</dd>
                    </div>
                  </dl>
                </div>
              )}
              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {c.measurements.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-md border p-4",
                        i === 0 ? "border-primary/40" : "border-border opacity-70",
                      )}
                    >
                      <p className="text-xs text-muted-foreground">
                        {m.garment} · {m.date}
                      </p>
                      {m.values.map(([k, v]) => (
                        <div key={k} className="mt-2 flex justify-between text-sm">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="tabular">{v} cm</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {step === 2 && (
                <div className="divide-y divide-border">
                  {demoOrders
                    .filter((o) => o.customer === c.name)
                    .concat({
                      id: "x",
                      customer: c.name,
                      outfit: "Aso-oke wedding guest set",
                      due: "Aug",
                      status: "delivered",
                      price: 210000,
                      paid: 210000,
                    })
                    .map((o) => (
                      <div key={o.id} className="flex justify-between py-3 text-sm">
                        <span>{o.outfit}</span>
                        <span className="text-muted-foreground">{STATUS_LABEL[o.status]}</span>
                      </div>
                    ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ---------- Inspiration gallery ---------- */
export function InspirationStory() {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <section className="bg-ink py-24 text-ink-foreground md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <Reveal className="max-w-2xl">
          <p className="eyebrow !text-ink-foreground/60">Style Library</p>
          <h2 className="font-display mt-4 text-4xl sm:text-5xl md:text-6xl">
            Your inspiration, <em>organised.</em>
          </h2>
          <p className="mt-5 text-lg text-ink-foreground/70">
            Upload references, group them into collections, and attach them to the customers and
            orders they belong to. Private by default.
          </p>
        </Reveal>
        <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-[1.3fr_1fr_1fr] md:grid-rows-2">
          {[DEMO_IMAGES.style2, DEMO_IMAGES.style1, DEMO_IMAGES.style4, DEMO_IMAGES.style3].map(
            (src, i) => {
              const s = demoStyles.find((x) => x.src === src)!;
              return (
                <Reveal
                  key={s.id}
                  delay={i * 0.08}
                  className={
                    i === 0
                      ? "col-span-2 md:col-span-1 md:row-span-2"
                      : i === 3
                        ? "col-span-2 md:col-span-2"
                        : ""
                  }
                >
                  <figure
                    className="group relative h-full overflow-hidden rounded-sm"
                    onMouseEnter={() => setHover(s.id)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <img
                      src={src}
                      alt={s.title}
                      loading="lazy"
                      width={768}
                      height={1024}
                      className={cn(
                        "h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.03]",
                        i === 0 ? "aspect-[3/4]" : i === 3 ? "aspect-[2/1]" : "aspect-square",
                        hover && hover !== s.id && "opacity-50",
                      )}
                    />
                    <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink/80 to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs opacity-70">{s.tag}</p>
                    </figcaption>
                  </figure>
                </Reveal>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Order to delivery ---------- */
export function WorkflowStory() {
  const [stage, setStage] = useState(2);
  const stages = [...PRODUCTION_STAGES, "delivered" as const];
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Production"
          title={
            <>
              From order <em>to delivery.</em>
            </>
          }
          body="Move each piece through your process. Know at a glance what’s on the cutting table and what’s ready to collect."
        />
        <div className="mt-12 surface p-5 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Ivory print evening gown</p>
              <p className="text-sm text-muted-foreground">Zainab Bello · due 11 Nov</p>
            </div>
            <span className="rounded-sm bg-wine-soft px-2 py-1 text-xs font-medium text-primary">
              {STATUS_LABEL[stages[stage]]}
            </span>
          </div>
          <div className="relative mt-8">
            <div className="absolute left-0 right-0 top-[7px] h-px bg-border" />
            <motion.div
              className="absolute left-0 top-[7px] h-px bg-primary"
              animate={{ width: `${(stage / (stages.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
            <ol className="relative grid grid-cols-7">
              {stages.map((s, i) => (
                <li key={s}>
                  <button
                    onClick={() => setStage(i)}
                    className="group flex w-full flex-col items-center gap-3 text-center"
                    aria-current={i === stage}
                  >
                    <span
                      className={cn(
                        "size-[15px] rounded-full border-2 transition-all",
                        i <= stage
                          ? "border-primary bg-primary"
                          : "border-border bg-card group-hover:border-foreground/40",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] leading-tight sm:text-xs",
                        i === stage ? "font-medium text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {STATUS_LABEL[s]}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Know your numbers ---------- */
export function NumbersStory() {
  const price = 320000;
  const [paid, setPaid] = useState(150000);
  const pct = paid / price;
  return (
    <section className="border-y border-border bg-secondary/40 py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-2 md:items-center md:px-8">
        <SectionHeading
          eyebrow="Payments"
          title={
            <>
              Know <em>your numbers.</em>
            </>
          }
          body="Record each deposit as it arrives. Balances are calculated from real transactions — never typed over, never guessed."
        />
        <div className="surface p-6 shadow-[var(--shadow-float)]">
          <p className="text-sm text-muted-foreground">Ivory print evening gown</p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="tabular mt-1 text-lg font-semibold">{money(price)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Received</p>
              <p className="tabular mt-1 text-lg font-semibold text-success">{money(paid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="tabular mt-1 text-lg font-semibold">{money(price - paid)}</p>
            </div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-secondary">
            <motion.div className="h-full bg-success" animate={{ width: `${pct * 100}%` }} />
          </div>
          <label className="mt-6 block text-xs text-muted-foreground" htmlFor="paid-range">
            Drag to record a payment (sample)
          </label>
          <input
            id="paid-range"
            type="range"
            min={0}
            max={price}
            step={10000}
            value={paid}
            onChange={(e) => setPaid(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-primary)]"
          />
          <p className="mt-3 text-sm font-medium">
            {paid === 0 ? "Unpaid" : paid < price ? "Part paid" : "Paid in full"}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */
const how = [
  [
    "Set up your business",
    "Add your business name, currency and preferred measurement unit. Two minutes.",
  ],
  [
    "Add your customers",
    "Create profiles and record measurements as you take them — on your phone, at the fitting.",
  ],
  [
    "Run every order",
    "Create orders, attach inspiration, track production and record payments as they arrive.",
  ],
];
export function HowItWorks() {
  const [i, setI] = useState(0);
  return (
    <section id="how" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              Three steps <em>to order.</em>
            </>
          }
          center
        />
        <div className="mt-14 grid gap-3 md:grid-cols-3">
          {how.map(([t, b], idx) => (
            <button
              key={t}
              onMouseEnter={() => setI(idx)}
              onFocus={() => setI(idx)}
              onClick={() => setI(idx)}
              className={cn(
                "relative overflow-hidden rounded-lg border p-6 text-left transition-colors",
                i === idx ? "border-foreground/30 bg-card" : "border-border bg-transparent",
              )}
            >
              <span className="font-display text-6xl text-primary/80">{idx + 1}</span>
              <p className="mt-6 text-lg font-medium">{t}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b}</p>
              {i === idx && (
                <motion.span
                  layoutId="how-bar"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
