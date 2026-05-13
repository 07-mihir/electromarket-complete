import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, primaryRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

// Hidden admin gateway. Secret keys per requirement:
const KEY_LOGIN = "13log";
const KEY_REGISTER = "13code";
const KEY_DELETE = "13del";
const KEY_MAKE_ADMIN = "13m";

export const Route = createFileRoute("/13Admin")({
  head: () => ({ meta: [{ title: "Admin Gateway" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminGateway,
});

function AdminGateway() {
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && primaryRole(roles) === "admin") navigate({ to: "/admin" });
  }, [user, roles, loading, navigate]);

  return (
    <PageShell>
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Admin Gateway</h1>
        </div>
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="delete">Delete</TabsTrigger>
          </TabsList>
          <TabsContent value="login"><LoginForm /></TabsContent>
          <TabsContent value="register"><RegisterForm /></TabsContent>
          <TabsContent value="delete"><DeleteForm /></TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (secret !== KEY_LOGIN) { toast.error("Invalid admin login key"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setBusy(false); toast.error(error?.message ?? "Login failed"); return; }
    const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
    setBusy(false);
    if (!isAdmin) { await supabase.auth.signOut(); toast.error("Account is not an admin."); return; }
    toast.success("Welcome, admin");
    navigate({ to: "/admin" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div><Label>Admin login key</Label><Input value={secret} onChange={(e) => setSecret(e.target.value)} required /></div>
      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in as Admin"}</Button>
    </form>
  );
}

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [registerKey, setRegisterKey] = useState("");
  const [makeAdminKey, setMakeAdminKey] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerKey !== KEY_REGISTER) { toast.error("Invalid admin register key"); return; }
    if (makeAdminKey !== KEY_MAKE_ADMIN) { toast.error("Invalid make-admin key"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: name, role: "admin" } },
    });
    if (error || !data.user) { setBusy(false); toast.error(error?.message ?? "Failed"); return; }
    // The trigger creates a 'customer' default if role meta is missing; we passed role=admin and it will insert admin.
    setBusy(false);
    toast.success("Admin account created. Sign in via Login tab.");
    navigate({ to: "/13Admin" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div><Label>Admin register key</Label><Input value={registerKey} onChange={(e) => setRegisterKey(e.target.value)} required /></div>
      <div><Label>Make-admin key</Label><Input value={makeAdminKey} onChange={(e) => setMakeAdminKey(e.target.value)} required /></div>
      <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <div><Label>Password</Label><Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create Admin"}</Button>
    </form>
  );
}

function DeleteForm() {
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, roles } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (secret !== KEY_DELETE) { toast.error("Invalid delete key"); return; }
    if (!user || !roles.includes("admin")) { toast.error("Sign in as admin first."); return; }
    setBusy(true);
    // Remove admin role for current user (cannot delete auth user from client without service key)
    const { error } = await supabase.from("user_roles").delete().eq("user_id", user.id).eq("role", "admin");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await supabase.auth.signOut();
    toast.success("Admin role removed for current account.");
    navigate({ to: "/" });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <p className="text-sm text-muted-foreground">Removes admin role from the currently signed-in admin account.</p>
      <div><Label>Delete key</Label><Input value={secret} onChange={(e) => setSecret(e.target.value)} required /></div>
      <Button type="submit" variant="destructive" className="w-full" disabled={busy}>{busy ? "Removing…" : "Revoke admin role"}</Button>
    </form>
  );
}
