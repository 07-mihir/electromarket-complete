import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtCurrency } from "@/lib/format";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/inventory")({
  component: ShopInventory,
});

type Product = { id: string; name: string; brand: string | null };
type InvRow = { id: string; quantity: number; shop_price: number; product: Product };

function ShopInventory() {
  const { user } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [items, setItems] = useState<InvRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pid, setPid] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: s } = await supabase.from("shops").select("id").eq("owner_id", user.id).maybeSingle();
    if (!s) return;
    setShopId(s.id);
    const [{ data: inv }, { data: pr }] = await Promise.all([
      supabase.from("inventory").select("id,quantity,shop_price,product:products(id,name,brand)").eq("shop_id", s.id),
      supabase.from("products").select("id,name,brand").order("name"),
    ]);
    setItems((inv ?? []) as unknown as InvRow[]);
    setProducts((pr ?? []) as Product[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!shopId || !pid) { toast.error("Pick a product"); return; }
    const { error } = await supabase.from("inventory").upsert(
      { shop_id: shopId, product_id: pid, quantity: qty, shop_price: price },
      { onConflict: "shop_id,product_id" }
    );
    if (error) { toast.error(error.message); return; }
    setPid(""); setQty(1); setPrice(0);
    load();
  };

  const updateRow = async (id: string, patch: { quantity?: number; shop_price?: number }) => {
    await supabase.from("inventory").update(patch).eq("id", id);
    load();
  };
  const removeRow = async (id: string) => {
    await supabase.from("inventory").delete().eq("id", id); load();
  };

  if (!shopId) return <p className="text-muted-foreground">Setting up your shop…</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Inventory</h1>

      <Card className="mb-6"><CardContent className="p-5 grid md:grid-cols-[1fr_120px_140px_auto] gap-3 items-end">
        <div>
          <Label>Product</Label>
          <Select value={pid} onValueChange={setPid}>
            <SelectTrigger><SelectValue placeholder="Pick from catalog" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.brand} · {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Quantity</Label><Input type="number" min={0} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></div>
        <div><Label>Shop price</Label><Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div>
        <Button onClick={addItem}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </CardContent></Card>

      <Card><CardContent className="p-5">
        {items.length === 0 ? <p className="text-muted-foreground">No inventory yet.</p> : (
          <div className="divide-y">
            {items.map((r) => (
              <div key={r.id} className="py-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{r.product.name}</div>
                  <div className="text-xs text-muted-foreground">{r.product.brand}</div>
                </div>
                <div>
                  <Label className="text-xs">Qty</Label>
                  <Input className="w-20" type="number" min={0} defaultValue={r.quantity} onBlur={(e) => updateRow(r.id, { quantity: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-xs">Price</Label>
                  <Input className="w-28" type="number" min={0} step="0.01" defaultValue={Number(r.shop_price)} onBlur={(e) => updateRow(r.id, { shop_price: Number(e.target.value) })} />
                </div>
                <div className="text-sm text-muted-foreground">{fmtCurrency(Number(r.shop_price) * r.quantity)}</div>
                <Button variant="ghost" size="icon" onClick={() => removeRow(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
