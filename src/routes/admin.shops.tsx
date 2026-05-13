import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/shops")({
  component: AdminShops,
});

type Shop = { id: string; name: string; city: string; address: string; phone: string | null; active: boolean; owner_id: string | null };

function AdminShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from("shops").select("*").order("created_at", { ascending: false });
    setShops((data ?? []) as Shop[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("shops").update({ active }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this shop?")) return;
    const { error } = await supabase.from("shops").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Shops</h1>
      <div className="space-y-3">
        {shops.map((s) => (
          <Card key={s.id}><CardContent className="p-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="font-medium">{s.name} {!s.active && <Badge variant="outline" className="ml-2">Inactive</Badge>}</div>
              <div className="text-xs text-muted-foreground">{s.address}, {s.city}{s.phone ? ` · ${s.phone}` : ""}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => toggle(s.id, !s.active)}>{s.active ? "Deactivate" : "Activate"}</Button>
            <Button size="sm" variant="destructive" onClick={() => remove(s.id)}>Delete</Button>
          </CardContent></Card>
        ))}
        {shops.length === 0 && <p className="text-muted-foreground">No shops registered.</p>}
      </div>
    </div>
  );
}
