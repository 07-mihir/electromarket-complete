import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { fmtCurrency, customerPrice } from "@/lib/format";
import { Search } from "lucide-react";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Browse products — ElectroMarket" }, { name: "description", content: "Search electronics from local shops near you." }] }),
  component: Products,
});

type Product = {
  id: string; name: string; brand: string | null; category: string | null;
  base_price: number; admin_profit_pct: number; image_url: string | null;
};

function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("id,name,brand,category,base_price,admin_profit_pct,image_url").order("created_at", { ascending: false });
      setItems((data ?? []) as Product[]);
      setLoading(false);
    })();
  }, []);

  const filtered = items.filter((p) =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.brand?.toLowerCase().includes(q.toLowerCase()) || p.category?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <PageShell>
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">Browse the catalog and compare prices across shops.</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search products, brands…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No products yet. An admin needs to add some.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <Link key={p.id} to="/products/$id" params={{ id: p.id }}>
              <Card className="overflow-hidden hover:border-primary/60 transition-colors h-full">
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <span className="text-xs text-muted-foreground">No image</span>}
                </div>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">{p.brand}</div>
                  <div className="font-medium line-clamp-2">{p.name}</div>
                  <div className="mt-2 font-semibold text-primary">{fmtCurrency(customerPrice(Number(p.base_price), Number(p.admin_profit_pct)))}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
