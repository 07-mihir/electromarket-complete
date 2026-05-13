import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, Wrench, Truck, Search, Tag } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ElectroMarket — Electronics marketplace, repairs & local shops" },
      { name: "description", content: "Compare prices across local electronics shops, buy online or in-store, and book repairs from trusted vendors." },
      { property: "og:title", content: "ElectroMarket" },
      { property: "og:description", content: "Electronics marketplace with online + buy-at-shop and repair services." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageShell>
      <section className="grid lg:grid-cols-2 gap-10 items-center py-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Local-first electronics
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold leading-tight">
            One marketplace for <span className="text-primary">buying</span>, <span className="text-accent">comparing</span> and <span className="text-primary">repairing</span> electronics.
          </h1>
          <p className="mt-4 text-muted-foreground max-w-lg">
            Browse a global catalog of electronics, see live prices from shops near you, choose to buy online or pick up at the shop, and request repair quotes — all from one account.
          </p>
          <div className="mt-6 flex gap-3">
            <Button size="lg" asChild><Link to="/products">Browse products</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/signup">Create an account</Link></Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: ShoppingBag, title: "Online checkout", desc: "Order at home and track delivery" },
            { icon: Store, title: "Buy at shop", desc: "Reserve with a token, pick up locally" },
            { icon: Wrench, title: "Repair quotes", desc: "Get cost & ETA from multiple shops" },
            { icon: Truck, title: "Delivery tracking", desc: "Live updates from courier" },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border bg-card p-5">
              <c.icon className="h-5 w-5 text-primary" />
              <div className="mt-3 font-medium">{c.title}</div>
              <div className="text-sm text-muted-foreground">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border bg-card p-8">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: "Search & compare", desc: "Find a product and compare offers from every shop selling it." },
            { icon: Tag, title: "Transparent pricing", desc: "Customer price = shop price + admin margin. No surprises." },
            { icon: Wrench, title: "Repairs, sorted", desc: "Post a repair request, receive offers, accept the best." },
          ].map((c) => (
            <div key={c.title}>
              <c.icon className="h-5 w-5 text-accent" />
              <div className="mt-3 font-medium">{c.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
