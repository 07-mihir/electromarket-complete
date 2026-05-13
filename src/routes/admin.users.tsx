import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type Profile = { id: string; full_name: string | null; email: string | null; phone: string | null; active: boolean; created_at: string; roles: string[] };

function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);

  const load = useCallback(async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const roleMap = new Map<string, string[]>();
    (roles ?? []).forEach((r) => { const arr = roleMap.get(r.user_id) ?? []; arr.push(r.role); roleMap.set(r.user_id, arr); });
    setUsers((profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] })) as Profile[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("profiles").update({ active }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const active = users.filter((u) => u.active);
  const inactive = users.filter((u) => !u.active);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      <Tabs defaultValue="active">
        <TabsList><TabsTrigger value="active">Active ({active.length})</TabsTrigger><TabsTrigger value="inactive">Deactivated ({inactive.length})</TabsTrigger></TabsList>
        {(["active", "inactive"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-2">
            {(tab === "active" ? active : inactive).map((u) => (
              <Card key={u.id}><CardContent className="p-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{u.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}{u.phone ? ` · ${u.phone}` : ""}</div>
                </div>
                <div className="flex gap-1">{u.roles.map((r) => <Badge key={r} variant="outline" className="capitalize">{r.replace("_", " ")}</Badge>)}</div>
                <Button size="sm" variant={u.active ? "outline" : "default"} onClick={() => toggleActive(u.id, !u.active)}>
                  {u.active ? "Deactivate" : "Reactivate"}
                </Button>
              </CardContent></Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
