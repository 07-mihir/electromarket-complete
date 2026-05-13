import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PageShell, RequireRole } from "@/components/AppHeader";
import { LayoutDashboard, Users, Store, Package, Truck } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: () => <RequireRole role="admin"><AdminLayout /></RequireRole>,
});

function AdminLayout() {
  return (
    <PageShell>
      <div className="grid lg:grid-cols-[200px_1fr] gap-8">
        <aside className="space-y-1">
          {[
            { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
            { to: "/admin/users", icon: Users, label: "Users" },
            { to: "/admin/shops", icon: Store, label: "Shops" },
            { to: "/admin/products", icon: Package, label: "Products" },
            { to: "/admin/deliveries", icon: Truck, label: "Deliveries" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted"
              activeProps={{ className: "flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-primary/10 text-primary font-medium" }}
              activeOptions={{ exact: l.exact }}>
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
        </aside>
        <div><Outlet /></div>
      </div>
    </PageShell>
  );
}
