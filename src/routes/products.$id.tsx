import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fmtCurrency, customerPrice, parseSpecs } from "@/lib/format";
import { useAuth, primaryRole } from "@/lib/auth";
import { toast } from "sonner";
import { Store, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetail,
});

type Product = {
  id: string; name: string; brand: string | null; category: string | null; description: string | null;
  base_price: number; admin_profit_pct: number; image_url: string | null; specifications: unknown;
};

type Offer = {
  id: string; quantity: number; shop_price: number;
  shop: { id: string; name: string; city: string; address: string };
};

function ProductDetail() {
  const { id } = Route.useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, roles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: invs }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("inventory")
          .select("id,quantity,shop_price,shop:shops!inner(id,name,city,address)")
          .eq("product_id", id)
          .gt("quantity", 0),
      ]);
      setProduct(p as Product | null);
      setOffers((invs ?? []) as unknown as Offer[]);
      setLoading(false);
    })();
  }, [id]);

  const addToCart = async (shop_id: string) => {
    if (!user) { navigate({ to: "/login" }); return; }
    if (primaryRole(roles) !== "customer") { toast.error("Only customers can add to cart."); return; }
    const { error } = await supabase.from("cart").upsert(
      { customer_id: user.id, product_id: id, shop_id, quantity: 1 },
      { onConflict: "customer_id,product_id,shop_id" }
    );
    if (error) toast.error(error.message);
    else toast.success("Added to cart");
  };

  if (loading) return <PageShell><p className="text-muted-foreground">Loading…</p></PageShell>;
  if (!product) return <PageShell><p>Not found.</p></PageShell>;

  const specs = parseSpecs(product.specifications);
  const cheapestOffer = offers.length ? Math.min(...offers.map((o) => Number(o.shop_price))) : null;
  const baseForDisplay = cheapestOffer ?? Number(product.base_price);

  return (
    <PageShell>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-xl overflow-hidden flex items-center justify-center">
          {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <span className="text-muted-foreground">No image</span>}
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{product.brand} · {product.category}</div>
          <h1 className="text-3xl font-semibold mt-1">{product.name}</h1>
          <div className="text-2xl font-bold text-primary mt-3">{fmtCurrency(customerPrice(baseForDisplay, Number(product.admin_profit_pct)))}</div>
          <p className="text-muted-foreground mt-3">{product.description}</p>

          {Object.keys(specs).length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold mb-2">Specifications</h2>
              <div className="grid grid-cols-2 gap-y-1 text-sm border rounded-md divide-y">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k} className="contents">
                    <div className="px-3 py-2 bg-muted/40 text-muted-foreground capitalize">{k}</div>
                    <div className="px-3 py-2">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Available at {offers.length} shop{offers.length === 1 ? "" : "s"}</h2>
        {offers.length === 0 ? (
          <p className="text-muted-foreground">No shop currently stocks this product.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {offers.sort((a, b) => Number(a.shop_price) - Number(b.shop_price)).map((o) => {
              const cust = customerPrice(Number(o.shop_price), Number(product.admin_profit_pct));
              return (
                <Card key={o.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="font-medium">{o.shop.name}</div>
                      <div className="text-xs text-muted-foreground">{o.shop.city} · {o.shop.address}</div>
                      <div className="text-xs text-muted-foreground mt-1">In stock: {o.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{fmtCurrency(cust)}</div>
                      <Button size="sm" className="mt-2" onClick={() => addToCart(o.shop.id)}>
                        <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
