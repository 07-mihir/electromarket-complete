import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, RequireRole } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fmtCurrency, customerPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Trash2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — ElectroMarket" }] }),
  component: () => <RequireRole role="customer"><CartPage /></RequireRole>,
});

type CartRow = {
  id: string; quantity: number; product_id: string; shop_id: string;
  product: { id: string; name: string; image_url: string | null; admin_profit_pct: number; base_price: number };
  shop: { id: string; name: string; city: string };
  shop_price?: number;
};

function CartPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("cart")
      .select("id,quantity,product_id,shop_id,product:products(id,name,image_url,admin_profit_pct,base_price),shop:shops(id,name,city)")
      .eq("customer_id", user.id);
    const cart = (data ?? []) as unknown as CartRow[];
    if (cart.length) {
      const { data: invs } = await supabase.from("inventory")
        .select("product_id,shop_id,shop_price")
        .in("product_id", cart.map((c) => c.product_id));
      const map = new Map((invs ?? []).map((i) => [`${i.product_id}:${i.shop_id}`, Number(i.shop_price)]));
      cart.forEach((c) => { c.shop_price = map.get(`${c.product_id}:${c.shop_id}`); });
    }
    setRows(cart);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const updateQty = async (id: string, q: number) => {
    if (q < 1) return;
    await supabase.from("cart").update({ quantity: q }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from("cart").delete().eq("id", id);
    toast.success("Removed");
    load();
  };

  // Group by shop for separate orders
  const byShop = rows.reduce<Record<string, CartRow[]>>((acc, r) => {
    (acc[r.shop_id] = acc[r.shop_id] || []).push(r);
    return acc;
  }, {});

  const total = rows.reduce((s, r) => s + customerPrice(r.shop_price ?? Number(r.product.base_price), Number(r.product.admin_profit_pct)) * r.quantity, 0);

  if (loading) return <PageShell><p className="text-muted-foreground">Loading…</p></PageShell>;

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold mb-6">Your cart</h1>
      {rows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Cart is empty.</p>
          <Button asChild><Link to="/products">Browse products</Link></Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(byShop).map(([shopId, items]) => (
              <Card key={shopId}>
                <CardContent className="p-4">
                  <div className="font-medium mb-3">{items[0].shop.name} <span className="text-xs text-muted-foreground">· {items[0].shop.city}</span></div>
                  <div className="divide-y">
                    {items.map((r) => {
                      const price = customerPrice(r.shop_price ?? Number(r.product.base_price), Number(r.product.admin_profit_pct));
                      return (
                        <div key={r.id} className="py-3 flex items-center gap-4">
                          <div className="h-16 w-16 rounded bg-muted overflow-hidden flex-shrink-0">
                            {r.product.image_url && <img src={r.product.image_url} alt="" className="h-full w-full object-cover" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{r.product.name}</div>
                            <div className="text-sm text-muted-foreground">{fmtCurrency(price)} each</div>
                          </div>
                          <div className="flex items-center gap-1 border rounded-md">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQty(r.id, r.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                            <span className="w-6 text-center text-sm">{r.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQty(r.id, r.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                          </div>
                          <div className="font-semibold w-24 text-right">{fmtCurrency(price * r.quantity)}</div>
                          <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Card className="sticky top-20">
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{rows.reduce((s, r) => s + r.quantity, 0)}</span></div>
                <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="text-primary">{fmtCurrency(total)}</span></div>
                <Button className="w-full" onClick={() => navigate({ to: "/checkout" })}>Checkout</Button>
                <p className="text-xs text-muted-foreground text-center">Each shop becomes a separate order.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}
