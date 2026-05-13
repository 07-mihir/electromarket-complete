import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, RequireRole } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { fmtCurrency } from "@/lib/format";
import { Wrench, Plus, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/repairs")({
  head: () => ({ meta: [{ title: "Repairs — ElectroMarket" }] }),
  component: () => <RequireRole role="customer"><Repairs /></RequireRole>,
});

type Repair = {
  id: string; device: string; issue: string; status: string; created_at: string;
  shop_id: string | null;
  offers: { id: string; cost: number; eta_days: number; notes: string | null; accepted: boolean | null; shop: { id: string; name: string } }[];
};

function Repairs() {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState("");
  const [issue, setIssue] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("repairs")
      .select("id,device,issue,status,created_at,shop_id,offers:repair_offers(id,cost,eta_days,notes,accepted,shop:shops(id,name))")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    setRepairs((data ?? []) as unknown as Repair[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createRepair = async () => {
    if (!device.trim() || !issue.trim() || !user) return;
    const { error } = await supabase.from("repairs").insert({ customer_id: user.id, device, issue });
    if (error) { toast.error(error.message); return; }
    toast.success("Repair request posted. Shops will respond with offers.");
    setDevice(""); setIssue(""); setOpen(false);
    load();
  };

  const acceptOffer = async (repair_id: string, offer_id: string, shop_id: string) => {
    const { error } = await supabase.from("repair_offers").update({ accepted: true }).eq("id", offer_id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("repairs").update({ status: "accepted", shop_id }).eq("id", repair_id);
    toast.success("Offer accepted");
    load();
  };

  return (
    <PageShell>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Repairs</h1>
        <Button onClick={() => setOpen((s) => !s)}><Plus className="h-4 w-4 mr-1" /> New request</Button>
      </div>

      {open && (
        <Card className="mb-6">
          <CardContent className="p-5 space-y-3">
            <div><Label>Device</Label><Input value={device} onChange={(e) => setDevice(e.target.value)} placeholder="e.g. Samsung TV 55″" /></div>
            <div><Label>Issue</Label><Textarea rows={3} value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the problem…" /></div>
            <div className="flex gap-2"><Button onClick={createRepair}>Post request</Button><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button></div>
          </CardContent>
        </Card>
      )}

      {repairs.length === 0 ? (
        <p className="text-muted-foreground">No repair requests yet.</p>
      ) : (
        <div className="space-y-4">
          {repairs.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-primary" />
                    <span className="font-medium">{r.device}</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <Badge className="capitalize">{r.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{r.issue}</p>
                {r.offers.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Offers</div>
                    <div className="space-y-2">
                      {r.offers.map((o) => (
                        <div key={o.id} className="flex items-center justify-between border rounded-md p-3">
                          <div>
                            <div className="font-medium">{o.shop.name}</div>
                            <div className="text-sm text-muted-foreground">{fmtCurrency(Number(o.cost))} · {o.eta_days} day{o.eta_days === 1 ? "" : "s"}</div>
                            {o.notes && <div className="text-xs text-muted-foreground mt-1">{o.notes}</div>}
                          </div>
                          {o.accepted ? (
                            <Badge variant="outline" className="text-success"><Check className="h-3 w-3 mr-1" />Accepted</Badge>
                          ) : r.status === "accepted" ? (
                            <span className="text-xs text-muted-foreground">Closed</span>
                          ) : (
                            <Button size="sm" onClick={() => acceptOffer(r.id, o.id, o.shop.id)}>Accept</Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
