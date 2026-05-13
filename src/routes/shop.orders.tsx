import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtCurrency } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/shop/orders")({
  component: ShopOrders,
});

type OrderStatus = Database["public"]["Enums"]["order_status"];

const STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped", "delivered", "collected", "cancelled"];

type Order = {
  id: string; type: string; status: OrderStatus; total: number;
  address: string | null; token_code: string | null; created_at: string;
  customer: { full_name: string | null; email: string | null } | null;
  order_items: { quantity: number; unit_price: number; product: { name: string } }[];
};

function ShopOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: s } = await supabase.from("shops").select("id").eq("owner_id", user.id).maybeSingle();
    if (!s) return;
    const { data } = await supabase.from("orders")
      .select("id,type,status,total,address,token_code,created_at,customer:profiles!orders_customer_id_fkey(full_name,email),order_items(quantity,unit_price,product:products(name))")
      .eq("shop_id", s.id)
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as unknown as Order[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Orders</h1>
      {orders.length === 0 ? <p className="text-muted-foreground">No orders yet.</p> : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Card key={o.id}><CardContent className="p-5">
              <div className="flex justify-between flex-wrap gap-2">
                <div>
                  <div className="font-medium">{o.customer?.full_name ?? o.customer?.email ?? "Customer"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{o.type.replace("_", " ")}</Badge>
                  <Select value={o.status} onValueChange={(v) => setStatus(o.id, v as OrderStatus)}>
                    <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 text-sm space-y-0.5">
                {o.order_items.map((it, i) => (
                  <div key={i} className="flex justify-between"><span>{it.quantity} × {it.product.name}</span><span>{fmtCurrency(Number(it.unit_price) * it.quantity)}</span></div>
                ))}
              </div>
              <div className="mt-3 border-t pt-3 flex justify-between text-sm">
                <div>
                  {o.token_code && <span>Token: <span className="font-mono font-bold text-primary">{o.token_code}</span></span>}
                  {o.address && <span className="text-muted-foreground">Ship to: {o.address}</span>}
                </div>
                <div className="font-semibold text-primary">{fmtCurrency(Number(o.total))}</div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
