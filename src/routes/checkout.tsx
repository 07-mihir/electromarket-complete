import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, RequireRole } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth";
import { customerPrice, fmtCurrency, genToken } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — ElectroMarket" }] }),
  component: () => <RequireRole role="customer"><Checkout /></RequireRole>,
});

type CartRow = {
  id: string; quantity: number; product_id: string; shop_id: string;
  product: { name: string; admin_profit_pct: number; base_price: number };
  shop_price?: number;
};

function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<CartRow[]>([]);
  const [type, setType] = useState<"online" | "buy_at_shop">("online");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("cart")
        .select("id,quantity,product_id,shop_id,product:products(name,admin_profit_pct,base_price)")
        .eq("customer_id", user.id);
      const cart = (data ?? []) as unknown as CartRow[];
      if (cart.length) {
        const { data: invs } = await supabase.from("inventory")
          .select("product_id,shop_id,shop_price")
          .in("product_id", cart.map((c) => c.product_id));
        const map = new Map((invs ?? []).map((i) => [`${i.product_id}:${i.shop_id}`, Number(i.shop_price)]));
        cart.forEach((c) => { c.shop_price = map.get(`${c.product_id}:${c.shop_id}`); });
      }
      setRows(cart);
      // Get default address
      const { data: addr } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).limit(1).maybeSingle();
      if (addr) setAddress(`${addr.line1}, ${addr.city} - ${addr.pincode}`);
    })();
  }, [user]);

  const placeOrders = async () => {
    if (!user || rows.length === 0) return;
    if (type === "online" && !address.trim()) { toast.error("Delivery address required"); return; }
    setBusy(true);
    // Group by shop
    const byShop = rows.reduce<Record<string, CartRow[]>>((acc, r) => { (acc[r.shop_id] = acc[r.shop_id] || []).push(r); return acc; }, {});
    try {
      for (const [shop_id, items] of Object.entries(byShop)) {
        const total = items.reduce((s, r) => s + customerPrice(r.shop_price ?? Number(r.product.base_price), Number(r.product.admin_profit_pct)) * r.quantity, 0);
        const tokenCode = type === "buy_at_shop" ? genToken() : null;
        const { data: order, error: oerr } = await supabase.from("orders").insert({
          customer_id: user.id, shop_id, type, total,
          address: type === "online" ? address : null,
          token_code: tokenCode,
          status: "pending",
        }).select("id").single();
        if (oerr || !order) throw oerr ?? new Error("Order failed");
        const itemsPayload = items.map((r) => ({
          order_id: order.id,
          product_id: r.product_id,
          quantity: r.quantity,
          unit_price: customerPrice(r.shop_price ?? Number(r.product.base_price), Number(r.product.admin_profit_pct)),
        }));
        const { error: ierr } = await supabase.from("order_items").insert(itemsPayload);
        if (ierr) throw ierr;
        if (type === "online") {
          await supabase.from("deliveries").insert({ order_id: order.id, status: "pending" });
        }
      }
      // Clear cart
      await supabase.from("cart").delete().eq("customer_id", user.id);
      toast.success(type === "buy_at_shop" ? "Tokens generated! Find them in Orders." : "Order placed!");
      navigate({ to: "/orders" });
    } catch (e) {
      toast.error((e as Error).message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  const total = rows.reduce((s, r) => s + customerPrice(r.shop_price ?? Number(r.product.base_price), Number(r.product.admin_profit_pct)) * r.quantity, 0);

  return (
    <PageShell>
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
      {rows.length === 0 ? <p className="text-muted-foreground">Your cart is empty.</p> : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card><CardContent className="p-5">
              <Label className="mb-3 block">How would you like to receive?</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as "online" | "buy_at_shop")} className="grid grid-cols-2 gap-2">
                <label className={`border rounded-md p-4 cursor-pointer ${type === "online" ? "border-primary bg-primary/5" : ""}`}>
                  <RadioGroupItem value="online" className="sr-only" />
                  <div className="font-medium">Online delivery</div>
                  <div className="text-xs text-muted-foreground">Ship to your address</div>
                </label>
                <label className={`border rounded-md p-4 cursor-pointer ${type === "buy_at_shop" ? "border-primary bg-primary/5" : ""}`}>
                  <RadioGroupItem value="buy_at_shop" className="sr-only" />
                  <div className="font-medium">Buy at shop</div>
                  <div className="text-xs text-muted-foreground">Get a token, pick up in-store</div>
                </label>
              </RadioGroup>
            </CardContent></Card>

            {type === "online" && (
              <Card><CardContent className="p-5 space-y-2">
                <Label>Delivery address</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, pincode" />
                <p className="text-xs text-muted-foreground">Manage saved addresses in Profile.</p>
              </CardContent></Card>
            )}
          </div>
          <div>
            <Card className="sticky top-20"><CardContent className="p-5 space-y-3">
              <div className="text-sm text-muted-foreground">Items: {rows.reduce((s, r) => s + r.quantity, 0)}</div>
              <div className="flex justify-between text-lg font-semibold"><span>Total</span><span className="text-primary">{fmtCurrency(total)}</span></div>
              <Button className="w-full" onClick={placeOrders} disabled={busy}>{busy ? "Placing…" : type === "buy_at_shop" ? "Generate tokens" : "Place order"}</Button>
            </CardContent></Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}
