create extension if not exists pgcrypto;

create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    key text not null unique,
    name text not null,
    headline_metric_id uuid null,
    sort_order integer not null,
    is_visible boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.sub_products (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    name text not null,
    sort_order integer not null,
    is_visible boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (product_id, name)
);

create table if not exists public.metric_definitions (
    id uuid primary key default gen_random_uuid(),
    column_key text not null unique,
    label text not null,
    unit text not null check (unit in ('tỷ', 'KH', 'HĐ', 'tài khoản', '%')),
    product_id uuid not null references public.products(id) on delete restrict,
    sub_product_id uuid null references public.sub_products(id) on delete restrict,
    placement text not null check (placement in ('headline', 'normal', 'sub_product')),
    sort_order integer not null,
    is_visible boolean not null default true,
    is_percent boolean not null default false,
    is_inverse boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (
        (placement = 'sub_product' and sub_product_id is not null)
        or (placement <> 'sub_product' and sub_product_id is null)
    )
);

alter table public.products
    drop constraint if exists products_headline_metric_fk;

alter table public.products
    add constraint products_headline_metric_fk
    foreign key (headline_metric_id)
    references public.metric_definitions(id)
    on delete set null;

create index if not exists sub_products_product_order_idx
    on public.sub_products (product_id, sort_order);

create index if not exists metric_definitions_product_order_idx
    on public.metric_definitions (product_id, sort_order);

alter table public.products enable row level security;
alter table public.sub_products enable row level security;
alter table public.metric_definitions enable row level security;

grant select on public.products to anon, authenticated;
grant select on public.sub_products to anon, authenticated;
grant select on public.metric_definitions to anon, authenticated;

do $$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'products'
          and policyname = 'public_read_products'
    ) then
        create policy "public_read_products"
        on public.products
        for select
        to anon, authenticated
        using (true);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'sub_products'
          and policyname = 'public_read_sub_products'
    ) then
        create policy "public_read_sub_products"
        on public.sub_products
        for select
        to anon, authenticated
        using (true);
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'metric_definitions'
          and policyname = 'public_read_metric_definitions'
    ) then
        create policy "public_read_metric_definitions"
        on public.metric_definitions
        for select
        to anon, authenticated
        using (true);
    end if;
end $$;

insert into public.products (key, name, sort_order)
values
    ('hose', 'HOSE', 1),
    ('margin', 'Margin', 2),
    ('phaisinh', 'Phái Sinh', 3),
    ('scash', 'S-Cash', 4),
    ('sfund', 'S-Fund', 5),
    ('momoi', 'Mở mới', 6)
on conflict (key) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

with product_ids as (
    select id, key from public.products
),
sub_product_seed(product_key, name, sort_order) as (
    values
        ('margin', 'T+7', 1),
        ('margin', 'Trading Plus', 2),
        ('margin', 'M+', 3),
        ('phaisinh', 'D+', 1)
),
upserted_sub_products as (
    insert into public.sub_products (product_id, name, sort_order)
    select p.id, s.name, s.sort_order
    from sub_product_seed s
    join product_ids p on p.key = s.product_key
    on conflict (product_id, name) do update
    set sort_order = excluded.sort_order
    returning id, product_id, name
),
sub_product_ids as (
    select usp.id, usp.name, p.key as product_key
    from upserted_sub_products usp
    join product_ids p on p.id = usp.product_id
),
inserted_metrics as (
    insert into public.metric_definitions (
        column_key,
        label,
        unit,
        product_id,
        sub_product_id,
        placement,
        sort_order,
        is_percent,
        is_inverse
    )
    values
        ('thi_phan_co_so', 'Thị Phần HOSE', '%', (select id from product_ids where key = 'hose'), null, 'headline', 1, true, false),
        ('thanh_khoan_ttcs', 'Thanh khoản thị trường', 'tỷ', (select id from product_ids where key = 'hose'), null, 'normal', 2, false, false),
        ('gtgd_cs_ssi', 'GTGD SSI', 'tỷ', (select id from product_ids where key = 'hose'), null, 'normal', 3, false, false),
        ('thi_phan_cn', 'Thị Phần CN', '%', (select id from product_ids where key = 'hose'), null, 'normal', 4, true, false),
        ('thi_phan_ds', 'Thị Phần DS', '%', (select id from product_ids where key = 'hose'), null, 'normal', 5, true, false),
        ('tong_du_no_margin', 'Tổng dư nợ Margin TK6+7', 'tỷ', (select id from product_ids where key = 'margin'), null, 'headline', 1, false, false),
        ('slkh_margin', 'SLKH Margin', 'KH', (select id from product_ids where key = 'margin'), null, 'normal', 2, false, false),
        ('du_no_t7', 'Dư nợ T+7', 'tỷ', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'T+7'), 'sub_product', 3, false, false),
        ('slkh_t7', 'SLKH T+7', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'T+7'), 'sub_product', 4, false, false),
        ('du_no_trading_plus', 'Dư nợ Trading Plus', 'tỷ', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'Trading Plus'), 'sub_product', 5, false, false),
        ('slkh_trading_plus', 'SLKH Trading Plus', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'Trading Plus'), 'sub_product', 6, false, false),
        ('slkh_register_mplus', 'SLKH đăng ký M+', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 7, false, false),
        ('slkh_active_mplus', 'SLKH active M+', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 8, false, false),
        ('du_no_mplus', 'Dư nợ M+', 'tỷ', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 9, false, false),
        ('slkh_co_du_no_mplus', 'SLKH có dư nợ M+', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 10, false, false),
        ('giai_ngan_mplus', 'Giải ngân M+', 'tỷ', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 11, false, false),
        ('slkh_giai_ngan_mplus', 'SLKH giải ngân M+', 'KH', (select id from product_ids where key = 'margin'), (select id from sub_product_ids where product_key = 'margin' and name = 'M+'), 'sub_product', 12, false, false),
        ('du_no_spv', 'Dư nợ SPV', 'tỷ', (select id from product_ids where key = 'margin'), null, 'normal', 13, false, false),
        ('ty_trong_spv', 'Tỷ Trọng SPV', '%', (select id from product_ids where key = 'margin'), null, 'normal', 14, true, false),
        ('thi_phan_phai_sinh', 'Thị Phần Phái Sinh', '%', (select id from product_ids where key = 'phaisinh'), null, 'headline', 1, true, false),
        ('thanh_khoan_tt_ps', 'Thanh khoản TTPS', 'HĐ', (select id from product_ids where key = 'phaisinh'), null, 'normal', 2, false, false),
        ('slkh_ps', 'SLKH PS', 'KH', (select id from product_ids where key = 'phaisinh'), null, 'normal', 3, false, false),
        ('ty_le_slhd_dplus', 'Tỷ Lệ SLHĐ D+', '%', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 4, true, false),
        ('slkh_dplus', 'SLKH D+', 'KH', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 5, false, false),
        ('ty_le_slkh_dplus', 'Tỷ lệ KH dùng D+', '%', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 6, true, false),
        ('kh_cancel_dplus', 'KH hủy D+', 'KH', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 7, false, true),
        ('kh_register_dplus', 'KH đăng ký D+', 'KH', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 8, false, false),
        ('kh_giu_qua_dem', 'KH giữ qua đêm', 'KH', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 9, false, false),
        ('kh_sd_dplus', 'KH sử dụng D+', 'KH', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 10, false, false),
        ('slhd_giu_qua_dem', 'SLHĐ giữ qua đêm', 'HĐ', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 11, false, false),
        ('du_no_dplus_giai_ngan', 'Giải ngân D+', 'tỷ', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 12, false, false),
        ('du_no_dplus_cuoi_ngay', 'Dư nợ D+ cuối ngày', 'tỷ', (select id from product_ids where key = 'phaisinh'), (select id from sub_product_ids where product_key = 'phaisinh' and name = 'D+'), 'sub_product', 13, false, false),
        ('so_du_scash', 'Số dư S-Cash', 'tỷ', (select id from product_ids where key = 'scash'), null, 'headline', 1, false, false),
        ('slkh_scash', 'SLKH S-Cash', 'KH', (select id from product_ids where key = 'scash'), null, 'normal', 2, false, false),
        ('so_du_casa_scash', 'Tổng dư SCASH+CASA', 'tỷ', (select id from product_ids where key = 'scash'), null, 'normal', 3, false, false),
        ('ty_le_scash_casa', 'Tỷ lệ S-Cash/CASA', '%', (select id from product_ids where key = 'scash'), null, 'normal', 4, true, false),
        ('so_du_sfund', 'Số dư S-Fund', 'tỷ', (select id from product_ids where key = 'sfund'), null, 'headline', 1, false, false),
        ('slkh_sfund', 'SLKH S-Fund', 'KH', (select id from product_ids where key = 'sfund'), null, 'normal', 2, false, false),
        ('slkh_mo_moi', 'KH mở tài khoản mới', 'tài khoản', (select id from product_ids where key = 'momoi'), null, 'headline', 1, false, false)
    on conflict (column_key) do update
    set label = excluded.label,
        unit = excluded.unit,
        product_id = excluded.product_id,
        sub_product_id = excluded.sub_product_id,
        placement = excluded.placement,
        sort_order = excluded.sort_order,
        is_percent = excluded.is_percent,
        is_inverse = excluded.is_inverse
    returning id, product_id, column_key
)
update public.products p
set headline_metric_id = m.id
from public.metric_definitions m
where m.product_id = p.id
  and m.placement = 'headline';
