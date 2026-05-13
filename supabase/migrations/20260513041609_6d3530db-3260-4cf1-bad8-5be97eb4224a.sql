
-- Roles
create type public.app_role as enum ('customer','shop_owner','admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;

create or replace function public.current_user_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin')
$$;

create policy "users read own roles" on public.user_roles for select using (auth.uid()=user_id or public.current_user_is_admin());
create policy "admin manage roles" on public.user_roles for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());
create policy "self insert customer role" on public.user_roles for insert with check (auth.uid()=user_id and role in ('customer','shop_owner'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self read" on public.profiles for select using (auth.uid()=id or public.current_user_is_admin());
create policy "profiles self update" on public.profiles for update using (auth.uid()=id or public.current_user_is_admin());
create policy "profiles self insert" on public.profiles for insert with check (auth.uid()=id);
create policy "profiles admin all" on public.profiles for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

-- Trigger to auto-create profile + customer role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
    values (new.id, new.raw_user_meta_data->>'full_name', new.email)
    on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
    values (new.id, coalesce((new.raw_user_meta_data->>'role')::app_role, 'customer'))
    on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Addresses
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  line1 text not null,
  city text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.addresses enable row level security;
create policy "addr owner all" on public.addresses for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- Shops
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  address text not null,
  city text not null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.shops enable row level security;
create policy "shops public read" on public.shops for select using (true);
create policy "shops owner update" on public.shops for update using (auth.uid()=owner_id or public.current_user_is_admin());
create policy "shops admin all" on public.shops for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());
create policy "shops owner insert" on public.shops for insert with check (auth.uid()=owner_id);

-- Products (global catalog managed by admin)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text,
  description text,
  base_price numeric(10,2) not null default 0,
  admin_profit_pct numeric(5,2) not null default 10,
  image_url text,
  specifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "products public read" on public.products for select using (true);
create policy "products admin write" on public.products for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());

-- Inventory
create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 0,
  shop_price numeric(10,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique(shop_id, product_id)
);
alter table public.inventory enable row level security;
create policy "inventory public read" on public.inventory for select using (true);
create policy "inventory shop owner write" on public.inventory for all using (
  exists(select 1 from public.shops s where s.id=inventory.shop_id and s.owner_id=auth.uid())
  or public.current_user_is_admin()
) with check (
  exists(select 1 from public.shops s where s.id=inventory.shop_id and s.owner_id=auth.uid())
  or public.current_user_is_admin()
);

-- Cart
create table public.cart (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  quantity int not null default 1,
  created_at timestamptz not null default now(),
  unique(customer_id, product_id, shop_id)
);
alter table public.cart enable row level security;
create policy "cart owner all" on public.cart for all using (auth.uid()=customer_id) with check (auth.uid()=customer_id);

-- Orders
create type public.order_type as enum ('online','buy_at_shop');
create type public.order_status as enum ('pending','confirmed','preparing','shipped','delivered','collected','cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete restrict,
  type order_type not null default 'online',
  status order_status not null default 'pending',
  total numeric(10,2) not null default 0,
  address text,
  token_code text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "orders customer read" on public.orders for select using (
  auth.uid()=customer_id
  or exists(select 1 from public.shops s where s.id=orders.shop_id and s.owner_id=auth.uid())
  or public.current_user_is_admin()
);
create policy "orders customer insert" on public.orders for insert with check (auth.uid()=customer_id);
create policy "orders shop or admin update" on public.orders for update using (
  exists(select 1 from public.shops s where s.id=orders.shop_id and s.owner_id=auth.uid())
  or public.current_user_is_admin()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity int not null,
  unit_price numeric(10,2) not null
);
alter table public.order_items enable row level security;
create policy "order_items read via order" on public.order_items for select using (
  exists(select 1 from public.orders o where o.id=order_items.order_id and (
    o.customer_id=auth.uid()
    or exists(select 1 from public.shops s where s.id=o.shop_id and s.owner_id=auth.uid())
    or public.current_user_is_admin()
  ))
);
create policy "order_items customer insert" on public.order_items for insert with check (
  exists(select 1 from public.orders o where o.id=order_items.order_id and o.customer_id=auth.uid())
);

-- Repairs
create type public.repair_status as enum ('requested','offer_sent','accepted','in_progress','completed','cancelled');

create table public.repairs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid references public.shops(id) on delete set null,
  device text not null,
  issue text not null,
  status repair_status not null default 'requested',
  created_at timestamptz not null default now()
);
alter table public.repairs enable row level security;
create policy "repairs read" on public.repairs for select using (
  auth.uid()=customer_id
  or shop_id is null and exists(select 1 from public.shops s where s.owner_id=auth.uid())
  or exists(select 1 from public.shops s where s.id=repairs.shop_id and s.owner_id=auth.uid())
  or public.current_user_is_admin()
);
create policy "repairs customer insert" on public.repairs for insert with check (auth.uid()=customer_id);
create policy "repairs update" on public.repairs for update using (
  auth.uid()=customer_id
  or exists(select 1 from public.shops s where s.id=repairs.shop_id and s.owner_id=auth.uid())
  or public.current_user_is_admin()
);

create table public.repair_offers (
  id uuid primary key default gen_random_uuid(),
  repair_id uuid not null references public.repairs(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  cost numeric(10,2) not null,
  eta_days int not null,
  notes text,
  accepted boolean,
  created_at timestamptz not null default now()
);
alter table public.repair_offers enable row level security;
create policy "offers read" on public.repair_offers for select using (
  exists(select 1 from public.repairs r where r.id=repair_offers.repair_id and (
    r.customer_id=auth.uid()
    or exists(select 1 from public.shops s where s.id=repair_offers.shop_id and s.owner_id=auth.uid())
    or public.current_user_is_admin()
  ))
);
create policy "offers shop insert" on public.repair_offers for insert with check (
  exists(select 1 from public.shops s where s.id=repair_offers.shop_id and s.owner_id=auth.uid())
);
create policy "offers update" on public.repair_offers for update using (
  exists(select 1 from public.repairs r where r.id=repair_offers.repair_id and r.customer_id=auth.uid())
  or exists(select 1 from public.shops s where s.id=repair_offers.shop_id and s.owner_id=auth.uid())
);

-- Deliveries
create type public.delivery_status as enum ('pending','assigned','in_transit','delivered','failed');

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade unique,
  courier text,
  tracking_no text,
  status delivery_status not null default 'pending',
  updated_at timestamptz not null default now()
);
alter table public.deliveries enable row level security;
create policy "deliveries read via order" on public.deliveries for select using (
  exists(select 1 from public.orders o where o.id=deliveries.order_id and (
    o.customer_id=auth.uid()
    or exists(select 1 from public.shops s where s.id=o.shop_id and s.owner_id=auth.uid())
    or public.current_user_is_admin()
  ))
);
create policy "deliveries admin write" on public.deliveries for all using (public.current_user_is_admin()) with check (public.current_user_is_admin());
