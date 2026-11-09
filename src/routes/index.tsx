import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { ProductDemo } from "@/components/marketing/ProductDemo";
import {
  Bento,
  CustomersStory,
  HowItWorks,
  InspirationStory,
  NumbersStory,
  Problem,
  WorkflowStory,
} from "@/components/marketing/Story";
import { FAQ, FinalCTA, Footer, Pricing, Testimonials } from "@/components/marketing/Closing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atelier — Your fashion business, in one place" },
      {
        name: "description",
        content:
          "Customers, measurements, style inspiration, orders and payments for independent fashion designers and tailors.",
      },
      { property: "og:title", content: "Atelier — Your fashion business, in one place" },
      {
        property: "og:description",
        content:
          "Replace scattered notebooks, galleries and spreadsheets with one organised workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <ProductDemo />
        <Problem />
        <Bento />
        <CustomersStory />
        <InspirationStory />
        <WorkflowStory />
        <NumbersStory />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
