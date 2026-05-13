import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtCurrency } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/deliveries")({
  component: AdminDeliveries,
});

type DStatus = Database["public"]["Enums"]["delivery_status"];
const STATUSES: DStatus[] = ["pending", "assigned", "in_transit", "delivered", "failed"];

type Row = {
  id: string; status: DStatus; courier: string | null; tracking_no: string | null;
  order: { id: string; total: number; address: string | null; created_at: string; shop: { name: string }; customer: { full_name: string | null; email: string | null } | null };
};

function AdminDeliveries() {
  const [rows, setRows] = useState<Row[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from("deliveries")
      .select("id,status,courier,tracking_no,order:orders!inner(id,total,address,created_at,shop:shops(name),customer:profiles!orders_customer_id_fkey(full_name,email))")
      .order("updated_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = async (id: string, patch: Partial<{ status: DStatus; courier: string; tracking_no: string }>) => {
    await supabase.from("deliveries").update(patch).eq("id", id);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Deliveries</h1>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-muted-foreground">No deliveries yet.</p>}
        {rows.map((r) => (
          <Card key={r.id}><CardContent className="p-4 grid lg:grid-cols-[1fr_140px_140px_160px] gap-3 items-center">
            <div>
              <div className="font-medium">{r.order.shop.name} → {r.order.customer?.full_name ?? r.order.customer?.email ?? "Customer"}</div>
              <div className="text-xs text-muted-foreground">{r.order.address ?? "—"} · {fmtCurrency(Number(r.order.total))} · {new Date(r.order.created_at).toLocaleDateString()}</div>
            </div>
            <Input placeholder="Courier" defaultValue={r.courier ?? ""} onBlur={(e) => update(r.id, { courier: e.target.value })} />
            <Input placeholder="Tracking #" defaultValue={r.tracking_no ?? ""} onBlur={(e) => update(r.id, { tracking_no: e.target.value })} />
            <Select value={r.status} onValueChange={(v) => update(r.id, { status: v as DStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
