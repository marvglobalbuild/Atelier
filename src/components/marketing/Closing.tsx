import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Reveal, SectionHeading } from "./Reveal";
import { Logo } from "./Nav";

// Pricing is NOT approved yet. Edit these placeholders when final pricing is set.
const PLANS = [
  {
    name: "Starter",
    monthly: null as number | null,
    annual: null as number | null,
    blurb: "For designers just getting organised.",
    features: ["Customers & measurements", "Orders & payments", "Style Library (limited storage)"],
    featured: false,
  },
  {
    name: "Studio",
    monthly: null,
    annual: null,
    blurb: "For busy solo studios.",
    features: [
      "Everything in Starter",
      "Larger Style Library",
      "Calendar & reminders view",
      "Data export",
    ],
    featured: true,
  },
  {
    name: "Atelier",
    monthly: null,
    annual: null,
    blurb: "For established fashion houses.",
    features: ["Everything in Studio", "Highest storage", "Priority support"],
    featured: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Simple plans, <em>coming soon.</em>
            </>
          }
          body="Final pricing is being confirmed. Create your account today and start organising."
          center
        />
        <div className="mt-8 flex justify-center">
          <div
            role="radiogroup"
            aria-label="Billing period"
            className="inline-flex rounded-full border border-border bg-card p-1 text-sm"
          >
            {[
              ["Monthly", false],
              ["Annual", true],
            ].map(([l, v]) => (
              <button
                key={String(l)}
                role="radio"
                aria-checked={annual === v}
                onClick={() => setAnnual(v as boolean)}
                className={cn(
                  "rounded-full px-4 py-1.5 transition-colors",
                  annual === v ? "bg-ink text-ink-foreground" : "text-muted-foreground",
                )}
              >
                {l as string}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLANS.map((p, i) => {
            const price = annual ? p.annual : p.monthly;
            return (
              <Reveal key={p.name} delay={i * 0.06}>
                <div
                  className={cn(
                    "flex h-full flex-col rounded-lg border p-6",
                    p.featured ? "border-ink bg-ink text-ink-foreground" : "border-border bg-card",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{p.name}</p>
                    {p.featured && (
                      <span className="rounded-sm bg-primary px-2 py-0.5 text-[11px]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="font-display mt-6 text-4xl">
                    {price === null ? "Price TBC" : price}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      p.featured ? "opacity-60" : "text-muted-foreground",
                    )}
                  >
                    {annual ? "per year · placeholder" : "per month · placeholder"}
                  </p>
                  <p
                    className={cn(
                      "mt-4 text-sm",
                      p.featured ? "opacity-80" : "text-muted-foreground",
                    )}
                  >
                    {p.blurb}
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={p.featured ? "hero" : "quiet"}
                    size="xl"
                    className="mt-8"
                    asChild
                  >
                    <Link to="/auth" search={{ mode: "signup" }}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="eyebrow">From designers</p>
          <p className="font-display mx-auto mt-4 max-w-2xl text-3xl text-muted-foreground">
            Stories from our first designers will appear here.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Placeholder — awaiting genuine customer feedback.
          </p>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  [
    "What is the platform?",
    "A business workspace for fashion designers: customers, measurements, inspiration images, orders, payments and your delivery calendar, all connected.",
  ],
  [
    "Who is it designed for?",
    "Independent fashion designers, solo tailors, home-based fashion businesses and small studios.",
  ],
  [
    "Can I store customer measurements?",
    "Yes. Use garment templates or your own custom fields, in centimetres or inches. Every set is dated, so you keep a full history.",
  ],
  [
    "Can I upload style inspiration images?",
    "Yes. Upload one or many images, organise them into collections, tag them and link them to customers and orders. Your images are private to your business.",
  ],
  [
    "Can I manage multiple orders?",
    "Yes. Track every order through Pending, Cutting, Sewing, Fitting, Finishing, Ready for Collection and Delivered.",
  ],
  [
    "Can I track partial payments?",
    "Yes. Record each payment separately — balances are always calculated from your recorded transactions.",
  ],
  [
    "Can I use it on my phone?",
    "Yes. It is designed to work comfortably on phones, tablets and computers.",
  ],
  [
    "How do I get started?",
    "Create an account, set up your business in a couple of minutes, and add your first customer.",
  ],
];

export function FAQ() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[1fr_1.4fr] md:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title={
            <>
              Questions, <em>answered.</em>
            </>
          }
        />
        <Accordion type="single" collapsible className="border-t border-border">
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="py-5 text-left text-base hover:no-underline">
                {q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="px-5 pb-6 md:px-8">
      <div className="paper-grain relative mx-auto max-w-7xl overflow-hidden rounded-lg bg-primary px-6 py-20 text-center text-primary-foreground md:py-28">
        <Reveal>
          <h2 className="font-display mx-auto max-w-3xl text-5xl md:text-7xl">
            Close the notebook. <em>Open the atelier.</em>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-lg opacity-80">
            Bring every customer, measurement and order into one calm workspace.
          </p>
          <Button variant="ink" size="xl" className="mt-10" asChild>
            <Link to="/auth" search={{ mode: "signup" }}>
              Get Started
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Business management for independent fashion designers and tailors.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#product" className="hover:text-foreground">
                Preview
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-foreground">
                Features
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-foreground">
                Pricing
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#how" className="hover:text-foreground">
                How it works
              </a>
            </li>
            <li>
              <Link to="/auth" search={{ mode: "signin" }} className="hover:text-foreground">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium">Legal & contact</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Terms & Privacy — coming soon</li>
            <li>Contact details — to be added</li>
          </ul>
        </div>
      </div>
      <p className="mt-14 border-t border-border pt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Atelier.
      </p>
    </footer>
  );
}
