import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, primaryRole, homeForRole, type Role } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Zap, ShoppingCart, Wrench, User as UserIcon, LogOut } from "lucide-react";

export function AppHeader() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const role = primaryRole(roles);

  return (
    <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </span>
          <span>ElectroMarket</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link to="/products" className="px-3 py-1.5 rounded-md hover:bg-muted" activeProps={{ className: "px-3 py-1.5 rounded-md bg-muted font-medium" }}>Products</Link>
          {role === "customer" && (
            <>
              <Link to="/cart" className="px-3 py-1.5 rounded-md hover:bg-muted" activeProps={{ className: "px-3 py-1.5 rounded-md bg-muted font-medium" }}>Cart</Link>
              <Link to="/orders" className="px-3 py-1.5 rounded-md hover:bg-muted" activeProps={{ className: "px-3 py-1.5 rounded-md bg-muted font-medium" }}>Orders</Link>
              <Link to="/repairs" className="px-3 py-1.5 rounded-md hover:bg-muted" activeProps={{ className: "px-3 py-1.5 rounded-md bg-muted font-medium" }}>Repairs</Link>
            </>
          )}
          {role === "shop_owner" && (
            <Link to="/shop" className="px-3 py-1.5 rounded-md hover:bg-muted" activeProps={{ className: "px-3 py-1.5 rounded-md bg-muted font-medium" }}>Shop Dashboard</Link>
          )}
          {role === "admin" && (
            <Link to="/admin" className="px-3 py-1.5 rounded-md hover:bg-muted" activeProps={{ className: "px-3 py-1.5 rounded-md bg-muted font-medium" }}>Admin</Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              {role === "customer" && (
                <>
                  <Button variant="ghost" size="icon" asChild><Link to="/cart"><ShoppingCart className="h-4 w-4" /></Link></Button>
                  <Button variant="ghost" size="icon" asChild><Link to="/repairs"><Wrench className="h-4 w-4" /></Link></Button>
                </>
              )}
              <Button variant="ghost" size="icon" asChild><Link to="/profile"><UserIcon className="h-4 w-4" /></Link></Button>
              <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4 mr-1" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
              <Button size="sm" asChild><Link to="/signup">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function RequireRole({ role, children }: { role: Role | Role[]; children: ReactNode }) {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();
  const allowed = Array.isArray(role) ? role : [role];
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (!allowed.some((r) => roles.includes(r))) {
      navigate({ to: homeForRole(primaryRole(roles)) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roles, loading]);
  if (loading || !user) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!allowed.some((r) => roles.includes(r))) return null;
  return <>{children}</>;
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ElectroMarket — Electronics, made local.
      </footer>
    </div>
  );
}
