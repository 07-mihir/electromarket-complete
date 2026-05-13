import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { fmtCurrency } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, shops: 0, products: 0, orders: 0, revenue: 0, repairs: 0 });
  const [series, setSeries] = useState<{ date: string; orders: number }[]>([]);
  const [statusBreak, setStatusBreak] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [u, s, p, o, r] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("shops").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total,status,created_at"),
        supabase.from("repairs").select("id", { count: "exact", head: true }),
      ]);
      const orders = o.data ?? [];
      setStats({
        users: u.count ?? 0, shops: s.count ?? 0, products: p.count ?? 0,
        orders: orders.length, revenue: orders.reduce((sm, x) => sm + Number(x.total), 0),
        repairs: r.count ?? 0,
      });
      const days: { date: string; orders: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days.push({ date: d.toLocaleDateString(undefined, { weekday: "short" }), orders: orders.filter((x) => x.created_at.slice(0, 10) === key).length });
      }
      setSeries(days);
      const statusMap: Record<string, number> = {};
      orders.forEach((x) => { statusMap[x.status] = (statusMap[x.status] ?? 0) + 1; });
      setStatusBreak(Object.entries(statusMap).map(([name, value]) => ({ name, value })));
    })();
  }, []);

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Admin dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[
          { l: "Users", v: stats.users }, { l: "Shops", v: stats.shops }, { l: "Products", v: stats.products },
          { l: "Orders", v: stats.orders }, { l: "Revenue", v: fmtCurrency(stats.revenue) }, { l: "Repairs", v: stats.repairs },
        ].map((c) => (
          <Card key={c.l}><CardContent className="p-5"><div className="text-xs text-muted-foreground uppercase">{c.l}</div><div className="text-2xl font-semibold mt-1">{c.v}</div></CardContent></Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardContent className="p-5">
          <h2 className="font-medium mb-3">Orders · last 7 days</h2>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
              <Bar dataKey="orders" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <h2 className="font-medium mb-3">Order status breakdown</h2>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusBreak} dataKey="value" nameKey="name" outerRadius={80} label>
                {statusBreak.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer></div>
        </CardContent></Card>
      </div>
    </div>
  );
}
