import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, RequireRole } from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — ElectroMarket" }] }),
  component: () => <RequireRole role={["customer", "shop_owner", "admin"]}><Profile /></RequireRole>,
});

type Address = { id: string; label: string; line1: string; city: string; pincode: string; is_default: boolean };

function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddr, setNewAddr] = useState({ label: "Home", line1: "", city: "", pincode: "", is_default: true });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("full_name,phone").eq("id", user.id).maybeSingle();
    setName(prof?.full_name ?? ""); setPhone(prof?.phone ?? "");
    const { data: addrs } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false });
    setAddresses((addrs ?? []) as Address[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: name, phone, email: user.email });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Profile saved");
  };

  const addAddress = async () => {
    if (!user) return;
    if (!newAddr.line1 || !newAddr.city || !newAddr.pincode) { toast.error("Fill all address fields"); return; }
    if (newAddr.is_default) await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    const { error } = await supabase.from("addresses").insert({ user_id: user.id, ...newAddr });
    if (error) { toast.error(error.message); return; }
    setNewAddr({ label: "Home", line1: "", city: "", pincode: "", is_default: false });
    load();
  };

  const removeAddr = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id); load();
  };

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardContent className="p-5 space-y-3">
          <h2 className="font-medium">Account</h2>
          <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <Button onClick={saveProfile} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </CardContent></Card>

        <Card><CardContent className="p-5 space-y-4">
          <h2 className="font-medium">Saved addresses</h2>
          <div className="space-y-2">
            {addresses.length === 0 && <p className="text-sm text-muted-foreground">No addresses saved.</p>}
            {addresses.map((a) => (
              <div key={a.id} className="border rounded-md p-3 flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm">{a.label} {a.is_default && <span className="ml-2 text-xs text-primary">(default)</span>}</div>
                  <div className="text-sm text-muted-foreground">{a.line1}, {a.city} - {a.pincode}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeAddr(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Label</Label><Input value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} /></div>
              <div><Label>Pincode</Label><Input value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} /></div>
            </div>
            <div><Label>Address line</Label><Input value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} /></div>
            <div><Label>City</Label><Input value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={newAddr.is_default} onCheckedChange={(c) => setNewAddr({ ...newAddr, is_default: !!c })} /> Set as default
            </label>
            <Button onClick={addAddress} variant="outline"><Plus className="h-4 w-4 mr-1" /> Add address</Button>
          </div>
        </CardContent></Card>
      </div>
    </PageShell>
  );
}
