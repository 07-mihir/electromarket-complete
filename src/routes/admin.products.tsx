import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fmtCurrency, customerPrice, parseSpecs } from "@/lib/format";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Product = {
  id: string; name: string; brand: string | null; category: string | null; description: string | null;
  base_price: number; admin_profit_pct: number; image_url: string | null; specifications: unknown;
};

function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Product[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-1" /> New product</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
            <ProductForm initial={editing} onSaved={() => { setOpen(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {items.map((p) => (
          <Card key={p.id}><CardContent className="p-4 flex gap-3">
            <div className="h-16 w-16 rounded bg-muted flex-shrink-0 overflow-hidden">{p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}</div>
            <div className="flex-1">
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.brand} · {p.category}</div>
              <div className="text-sm mt-1">Base {fmtCurrency(Number(p.base_price))} · +{p.admin_profit_pct}% → <span className="font-semibold text-primary">{fmtCurrency(customerPrice(Number(p.base_price), Number(p.admin_profit_pct)))}</span></div>
            </div>
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="outline" onClick={() => { setEditing(p); setOpen(true); }}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </CardContent></Card>
        ))}
        {items.length === 0 && <p className="text-muted-foreground">No products yet.</p>}
      </div>
    </div>
  );
}

function ProductForm({ initial, onSaved }: { initial: Product | null; onSaved: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [basePrice, setBasePrice] = useState(Number(initial?.base_price ?? 0));
  const [profit, setProfit] = useState(Number(initial?.admin_profit_pct ?? 10));
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const initialSpecs = parseSpecs(initial?.specifications);
  const [specs, setSpecs] = useState<{ k: string; v: string }[]>(
    Object.keys(initialSpecs).length ? Object.entries(initialSpecs).map(([k, v]) => ({ k, v: String(v) })) : [{ k: "", v: "" }]
  );
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name) { toast.error("Name required"); return; }
    setBusy(true);
    const specObj: Record<string, string> = {};
    specs.forEach((s) => { if (s.k.trim()) specObj[s.k.trim()] = s.v; });
    const payload = {
      name, brand, category, description,
      base_price: basePrice, admin_profit_pct: profit, image_url: imageUrl,
      specifications: specObj,
    };
    const { error } = initial
      ? await supabase.from("products").update(payload).eq("id", initial.id)
      : await supabase.from("products").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    onSaved();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Brand</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} /></div>
        <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
        <div><Label>Image URL</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></div>
        <div><Label>Base price</Label><Input type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} /></div>
        <div><Label>Admin profit %</Label><Input type="number" step="0.1" value={profit} onChange={(e) => setProfit(Number(e.target.value))} /></div>
      </div>
      <div><Label>Description</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div>
        <div className="flex justify-between items-center mb-2"><Label>Specifications</Label><Button type="button" variant="outline" size="sm" onClick={() => setSpecs([...specs, { k: "", v: "" }])}><Plus className="h-3 w-3 mr-1" /> Row</Button></div>
        <div className="space-y-2">
          {specs.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Key (e.g. RAM)" value={s.k} onChange={(e) => { const c = [...specs]; c[i].k = e.target.value; setSpecs(c); }} />
              <Input placeholder="Value (e.g. 8 GB)" value={s.v} onChange={(e) => { const c = [...specs]; c[i].v = e.target.value; setSpecs(c); }} />
              <Button type="button" variant="ghost" size="icon" onClick={() => setSpecs(specs.filter((_, idx) => idx !== i))}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={save} disabled={busy} className="w-full">{busy ? "Saving…" : "Save product"}</Button>
    </div>
  );
}
