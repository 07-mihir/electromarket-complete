import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PageShell, RequireRole } from "@/components/AppHeader";
import { LayoutDashboard, Boxes, ShoppingBag, Wrench } from "lucide-react";

export const Route = createFileRoute("/shop")({
  component: () => <RequireRole role="shop_owner"><ShopLayout /></RequireRole>,
});

function ShopLayout() {
  return (
    <PageShell>
      <div className="grid lg:grid-cols-[200px_1fr] gap-8">
        <aside className="space-y-1">
          {[
            { to: "/shop", icon: LayoutDashboard, label: "Dashboard", exact: true },
            { to: "/shop/inventory", icon: Boxes, label: "Inventory" },
            { to: "/shop/orders", icon: ShoppingBag, label: "Orders" },
            { to: "/shop/repairs", icon: Wrench, label: "Repairs" },
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
