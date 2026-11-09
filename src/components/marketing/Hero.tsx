import { Link } from "@tanstack/react-router";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_IMAGES, demoOrders } from "@/lib/demo-data";
import { STATUS_LABEL } from "@/lib/domain";
import { money } from "@/lib/format";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const backX = useTransform(sx, (v) => v * -10);
  const backY = useTransform(sy, (v) => v * -8);
  const frontX = useTransform(sx, (v) => v * 14);
  const frontY = useTransform(sy, (v) => v * 10);

  function onMove(e: React.MouseEvent) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  return (
    <section id="top" className="relative overflow-hidden pt-28 md:pt-36" onMouseMove={onMove}>
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="eyebrow"
        >
          For independent designers & tailors
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.08, ease }}
          className="font-display mt-5 max-w-4xl text-[2.9rem] leading-[0.98] sm:text-7xl md:text-[5.6rem]"
        >
          Your entire fashion business. <em className="text-primary">Finally,</em> in one place.
        </motion.h1>
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="max-w-xl text-lg leading-relaxed text-muted-foreground"
          >
            Manage your customers, measurements, style inspiration, orders and payments — without
            the scattered notebooks and endless searching.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button variant="hero" size="xl" asChild className="group">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get Started{" "}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button variant="quiet" size="xl" asChild>
              <a href="#product">Explore the Product</a>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Art-directed product composition */}
      <div className="relative mx-auto mt-16 max-w-7xl px-5 md:mt-20 md:px-8">
        <div className="relative h-[420px] sm:h-[520px] md:h-[600px]">
          <motion.div
            style={{ x: backX, y: backY }}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.35, ease }}
            className="absolute inset-x-0 top-0 mx-auto w-full max-w-5xl"
          >
            <HeroDashboard />
          </motion.div>
          <motion.div
            style={{ x: frontX, y: frontY }}
            initial={{ opacity: 0, y: 80, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 1.2, delay: 0.6, ease }}
            className="absolute -right-6 bottom-0 w-[58%] max-w-[360px] sm:right-4 md:right-10"
          >
            <HeroStyleCard />
          </motion.div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>
    </section>
  );
}

function HeroDashboard() {
  return (
    <div className="surface overflow-hidden shadow-[var(--shadow-float)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
        </div>
        <span className="text-xs text-muted-foreground">Dashboard · Monday, 9 Nov</span>
      </div>
      <div className="grid md:grid-cols-[180px_1fr]">
        <aside className="hidden border-r border-border bg-sidebar p-4 md:block">
          {[
            "Dashboard",
            "Customers",
            "Measurements",
            "Style Library",
            "Orders",
            "Payments",
            "Calendar",
          ].map((n, i) => (
            <div
              key={n}
              className={`mb-1 rounded px-2.5 py-1.5 text-[13px] ${i === 0 ? "bg-card font-medium shadow-sm" : "text-muted-foreground"}`}
            >
              {n}
            </div>
          ))}
        </aside>
        <div className="p-5">
          <p className="font-display text-2xl">Good morning, Ifeoma</p>
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4">
            {[
              ["Active orders", "14"],
              ["Overdue", "2"],
              ["Received", money(1215000)],
              ["Outstanding", money(395000)],
            ].map(([k, v]) => (
              <div key={k} className="bg-card p-3">
                <p className="text-[11px] text-muted-foreground">{k}</p>
                <p className="tabular mt-1 text-base font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs font-medium">Orders requiring attention</p>
          <div className="mt-2 divide-y divide-border rounded-md border border-border">
            {demoOrders.slice(0, 4).map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.outfit}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.customer}</p>
                </div>
                <span className="shrink-0 rounded-sm bg-secondary px-2 py-0.5 text-[11px]">
                  {STATUS_LABEL[o.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroStyleCard() {
  return (
    <div className="surface overflow-hidden p-2.5 shadow-[var(--shadow-float)]">
      <div className="flex items-center justify-between px-1.5 pb-2 pt-0.5">
        <span className="text-xs font-medium">Style Library</span>
        <span className="text-[11px] text-muted-foreground">Owambe · 24</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <img
          src={DEMO_IMAGES.style2}
          alt="Ivory print gown reference"
          width={768}
          height={1024}
          className="aspect-[3/4] w-full rounded-sm object-cover"
        />
        <div className="grid gap-1.5">
          <img
            src={DEMO_IMAGES.style1}
            alt="Wine blazer dress reference"
            width={768}
            height={1024}
            className="aspect-square w-full rounded-sm object-cover"
          />
          <img
            src={DEMO_IMAGES.style3}
            alt="Fabric swatches"
            width={768}
            height={1024}
            className="aspect-square w-full rounded-sm object-cover"
          />
        </div>
      </div>
    </div>
  );
}
