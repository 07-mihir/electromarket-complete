import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole, homeForRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/AppHeader";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — ElectroMarket" }] }),
  component: Signup,
});

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "shop_owner">("customer");
  const [shopName, setShopName] = useState("");
  const [shopCity, setShopCity] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: homeForRole(primaryRole(roles)) });
  }, [user, roles, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role },
      },
    });
    if (error) { setBusy(false); toast.error(error.message); return; }
    if (role === "shop_owner" && data.user) {
      // Create shop record (owner_id = signed-in user)
      // Wait briefly for session
      await new Promise((r) => setTimeout(r, 400));
      const { error: shopErr } = await supabase.from("shops").insert({
        owner_id: data.user.id, name: shopName, city: shopCity, address: shopAddress,
      });
      if (shopErr) toast.error("Account created but shop setup failed: " + shopErr.message);
    }
    setBusy(false);
    toast.success("Account created");
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-sm">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div><Label>Full name</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div>
            <Label>I am a</Label>
            <RadioGroup value={role} onValueChange={(v) => setRole(v as "customer" | "shop_owner")} className="mt-2 grid grid-cols-2 gap-2">
              <label className={`border rounded-md p-3 cursor-pointer ${role === "customer" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="customer" className="sr-only" /> Customer
              </label>
              <label className={`border rounded-md p-3 cursor-pointer ${role === "shop_owner" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="shop_owner" className="sr-only" /> Shop owner
              </label>
            </RadioGroup>
          </div>
          {role === "shop_owner" && (
            <div className="space-y-3 rounded-md border p-3 bg-muted/30">
              <div><Label>Shop name</Label><Input required value={shopName} onChange={(e) => setShopName(e.target.value)} /></div>
              <div><Label>City</Label><Input required value={shopCity} onChange={(e) => setShopCity(e.target.value)} /></div>
              <div><Label>Address</Label><Input required value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} /></div>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
        </form>
        <p className="text-sm text-muted-foreground mt-4">Have an account? <Link to="/login" className="text-primary underline">Sign in</Link></p>
      </div>
    </PageShell>
  );
}
