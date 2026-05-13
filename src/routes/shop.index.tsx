import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { fmtCurrency } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/shop/")({
  component: ShopDashboard,
});

function ShopDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, pendingRepairs: 0, inventory: 0 });
  const [series, setSeries] = useState<{ date: string; revenue: number }[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).maybeSingle();
      if (!shop) return;
      const [ordersRes, repairsRes, invRes] = await Promise.all([
        supabase.from("orders").select("total,created_at,status").eq("shop_id", shop.id),
        supabase.from("repairs").select("id").eq("shop_id", shop.id).neq("status", "completed"),
        supabase.from("inventory").select("id").eq("shop_id", shop.id),
      ]);
      const orders = ordersRes.data ?? [];
      const revenue = orders.reduce((s, o) => s + Number(o.total), 0);
      setStats({
        orders: orders.length,
        revenue,
        pendingRepairs: (repairsRes.data ?? []).length,
        inventory: (invRes.data ?? []).length,
      });
      // Last 7 days revenue
      const days: { date: string; revenue: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const dayRev = orders.filter((o) => o.created_at.slice(0, 10) === key).reduce((s, o) => s + Number(o.total), 0);
        days.push({ date: d.toLocaleDateString(undefined, { weekday: "short" }), revenue: dayRev });
      }
      setSeries(days);
    })();
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Shop dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total orders", val: stats.orders },
          { label: "Total revenue", val: fmtCurrency(stats.revenue) },
          { label: "Inventory items", val: stats.inventory },
          { label: "Pending repairs", val: stats.pendingRepairs },
        ].map((c) => (
          <Card key={c.label}><CardContent className="p-5">
            <div className="text-xs text-muted-foreground uppercase">{c.label}</div>
            <div className="text-2xl font-semibold mt-1">{c.val}</div>
          </CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-5">
        <h2 className="font-medium mb-3">Revenue · last 7 days</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent></Card>
    </div>
  );
}
