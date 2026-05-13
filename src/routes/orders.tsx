import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, RequireRole } from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtCurrency } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Package, Store } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My orders — ElectroMarket" }] }),
  component: () => <RequireRole role="customer"><Orders /></RequireRole>,
});

type Order = {
  id: string; type: "online" | "buy_at_shop"; status: string; total: number;
  address: string | null; token_code: string | null; created_at: string;
  shop: { name: string; city: string };
  order_items: { quantity: number; unit_price: number; product: { name: string } }[];
  delivery: { status: string; courier: string | null; tracking_no: string | null } | null;
};

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("orders")
        .select("id,type,status,total,address,token_code,created_at,shop:shops(name,city),order_items(quantity,unit_price,product:products(name)),delivery:deliveries(status,courier,tracking_no)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      // Supabase returns delivery as array because of one-to-many relationship; flatten
      const list = (data ?? []).map((o: { delivery: unknown[] | unknown } & Record<string, unknown>) => ({ ...o, delivery: Array.isArray(o.delivery) ? o.delivery[0] ?? null : o.delivery })) as unknown as Order[];
      setOrders(list);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <PageShell><p className="text-muted-foreground">Loading…</p></PageShell>;

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold mb-6">My orders</h1>
      {orders.length === 0 ? <p className="text-muted-foreground">No orders yet.</p> : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {o.type === "online" ? <Package className="h-4 w-4 text-primary" /> : <Store className="h-4 w-4 text-accent" />}
                    <span className="font-medium">{o.shop.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{o.type.replace("_", " ")}</Badge>
                    <Badge className="capitalize">{o.status}</Badge>
                  </div>
                </div>
                <div className="mt-3 text-sm space-y-0.5">
                  {o.order_items.map((it, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{it.quantity} × {it.product.name}</span>
                      <span>{fmtCurrency(Number(it.unit_price) * it.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <div>
                    {o.type === "buy_at_shop" && o.token_code && (
                      <div className="text-sm">Pickup token: <span className="font-mono font-bold text-primary">{o.token_code}</span></div>
                    )}
                    {o.type === "online" && o.delivery && (
                      <div className="text-xs text-muted-foreground">
                        Delivery: <span className="capitalize font-medium text-foreground">{o.delivery.status.replace("_", " ")}</span>
                        {o.delivery.tracking_no && ` · ${o.delivery.courier ?? ""} #${o.delivery.tracking_no}`}
                      </div>
                    )}
                  </div>
                  <div className="font-semibold text-primary">{fmtCurrency(Number(o.total))}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
