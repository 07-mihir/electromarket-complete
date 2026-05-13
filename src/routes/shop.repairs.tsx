import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/shop/repairs")({
  component: ShopRepairs,
});

type RStatus = Database["public"]["Enums"]["repair_status"];
const STATUSES: RStatus[] = ["requested", "offer_sent", "accepted", "in_progress", "completed", "cancelled"];

type Repair = {
  id: string; device: string; issue: string; status: RStatus;
  customer_id: string; shop_id: string | null; created_at: string;
  offers: { id: string; cost: number; eta_days: number; accepted: boolean | null }[];
};

function ShopRepairs() {
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [openRequests, setOpenRequests] = useState<Repair[]>([]);
  const [myRepairs, setMyRepairs] = useState<Repair[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: s } = await supabase.from("shops").select("id").eq("owner_id", user.id).maybeSingle();
    if (!s) return;
    setShopId(s.id);
    // Open requests = unassigned
    const { data: open } = await supabase.from("repairs")
      .select("id,device,issue,status,customer_id,shop_id,created_at,offers:repair_offers(id,cost,eta_days,accepted)")
      .is("shop_id", null)
      .order("created_at", { ascending: false });
    setOpenRequests((open ?? []) as unknown as Repair[]);
    const { data: mine } = await supabase.from("repairs")
      .select("id,device,issue,status,customer_id,shop_id,created_at,offers:repair_offers(id,cost,eta_days,accepted)")
      .eq("shop_id", s.id)
      .order("created_at", { ascending: false });
    setMyRepairs((mine ?? []) as unknown as Repair[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const sendOffer = async (repair_id: string, cost: number, eta_days: number, notes: string) => {
    if (!shopId) return;
    const { error } = await supabase.from("repair_offers").insert({ repair_id, shop_id: shopId, cost, eta_days, notes });
    if (error) { toast.error(error.message); return; }
    await supabase.from("repairs").update({ status: "offer_sent" }).eq("id", repair_id);
    toast.success("Offer sent");
    load();
  };

  const setStatus = async (id: string, status: RStatus) => {
    await supabase.from("repairs").update({ status }).eq("id", id); load();
  };

  if (!shopId) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Repairs</h1>
      <Tabs defaultValue="open">
        <TabsList><TabsTrigger value="open">Open requests ({openRequests.length})</TabsTrigger><TabsTrigger value="mine">My repairs ({myRepairs.length})</TabsTrigger></TabsList>
        <TabsContent value="open" className="mt-4 space-y-4">
          {openRequests.length === 0 ? <p className="text-muted-foreground">No open requests.</p> :
            openRequests.map((r) => <OpenRequestCard key={r.id} repair={r} shopId={shopId} onSend={sendOffer} />)}
        </TabsContent>
        <TabsContent value="mine" className="mt-4 space-y-4">
          {myRepairs.length === 0 ? <p className="text-muted-foreground">No assigned repairs yet.</p> : (
            myRepairs.map((r) => (
              <Card key={r.id}><CardContent className="p-5">
                <div className="flex justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-medium">{r.device}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{r.status.replace("_", " ")}</Badge>
                    <Select value={r.status} onValueChange={(v) => setStatus(r.id, v as RStatus)}>
                      <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{r.issue}</p>
                {r.offers.find((o) => o.accepted) && (
                  <div className="mt-2 text-sm">Accepted: {fmtCurrency(Number(r.offers.find((o) => o.accepted)!.cost))}</div>
                )}
              </CardContent></Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OpenRequestCard({ repair, shopId, onSend }: { repair: Repair; shopId: string; onSend: (id: string, cost: number, eta: number, notes: string) => void }) {
  const [cost, setCost] = useState(0);
  const [eta, setEta] = useState(2);
  const [notes, setNotes] = useState("");
  const alreadyOffered = repair.offers.length > 0; // offers fetched without shop_id filter; check via separate query if needed
  void shopId;
  return (
    <Card><CardContent className="p-5">
      <div className="flex justify-between gap-2 flex-wrap">
        <div>
          <div className="font-medium">{repair.device}</div>
          <p className="text-sm text-muted-foreground">{repair.issue}</p>
        </div>
        <span className="text-xs text-muted-foreground">{new Date(repair.created_at).toLocaleDateString()}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end">
        <div><Label>Cost</Label><Input type="number" min={0} step="1" value={cost} onChange={(e) => setCost(Number(e.target.value))} /></div>
        <div><Label>ETA (days)</Label><Input type="number" min={1} value={eta} onChange={(e) => setEta(Number(e.target.value))} /></div>
        <div><Label>Notes</Label><Textarea rows={1} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <Button onClick={() => onSend(repair.id, cost, eta, notes)} disabled={cost <= 0}>Send offer</Button>
      </div>
      {alreadyOffered && <div className="text-xs text-muted-foreground mt-2">{repair.offers.length} offer(s) on this request</div>}
    </CardContent></Card>
  );
}
