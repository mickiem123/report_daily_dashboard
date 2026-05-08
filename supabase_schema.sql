-- SSI Dashboard - Supabase schema
-- Run this file in the Supabase SQL Editor.

drop table if exists public.daily_metrics cascade;
drop table if exists public.weekly_metrics cascade;
drop table if exists public.monthly_metrics cascade;

create table public.daily_metrics (
    id serial primary key,
    ngay date not null unique,
    thi_phan_co_so numeric,
    thi_phan_cn numeric,
    thi_phan_ds numeric,
    gtgd_cs_ssi numeric,
    thanh_khoan_ttcs numeric,
    tong_du_no_margin numeric,
    slkh_margin numeric,
    du_no_t7 numeric,
    slkh_t7 numeric,
    du_no_trading_plus numeric,
    slkh_trading_plus numeric,
    slkh_register_mplus numeric,
    slkh_active_mplus numeric,
    du_no_mplus numeric,
    slkh_co_du_no_mplus numeric,
    giai_ngan_mplus numeric,
    slkh_giai_ngan_mplus numeric,
    du_no_ssi_deprecated numeric,
    du_no_spv numeric,
    ty_trong_spv numeric,
    thi_phan_phai_sinh numeric,
    thanh_khoan_tt_ps numeric,
    slhd_ps_deprecated numeric,
    slkh_ps numeric,
    slhd_dplus_deprecated numeric,
    ty_le_slhd_dplus numeric,
    slkh_dplus numeric,
    ty_le_slkh_dplus numeric,
    kh_cancel_dplus numeric,
    kh_register_dplus numeric,
    kh_giu_qua_dem numeric,
    kh_sd_dplus numeric,
    slhd_giu_qua_dem numeric,
    du_no_dplus_giai_ngan numeric,
    du_no_dplus_cuoi_ngay numeric,
    so_du_scash numeric,
    so_du_casa_scash numeric,
    ty_le_scash_casa numeric,
    slkh_scash numeric,
    so_du_sfund numeric,
    slkh_sfund numeric,
    slkh_mo_moi numeric,
    pushed_at timestamptz not null default now()
);

create table public.weekly_metrics (
    id serial primary key,
    ngay date not null unique,
    thi_phan_co_so numeric,
    thi_phan_cn numeric,
    thi_phan_ds numeric,
    gtgd_cs_ssi numeric,
    thanh_khoan_ttcs numeric,
    tong_du_no_margin numeric,
    slkh_margin numeric,
    du_no_t7 numeric,
    slkh_t7 numeric,
    du_no_trading_plus numeric,
    slkh_trading_plus numeric,
    slkh_register_mplus numeric,
    slkh_active_mplus numeric,
    du_no_mplus numeric,
    slkh_co_du_no_mplus numeric,
    giai_ngan_mplus numeric,
    slkh_giai_ngan_mplus numeric,
    du_no_ssi_deprecated numeric,
    du_no_spv numeric,
    ty_trong_spv numeric,
    thi_phan_phai_sinh numeric,
    thanh_khoan_tt_ps numeric,
    slhd_ps_deprecated numeric,
    slkh_ps numeric,
    slhd_dplus_deprecated numeric,
    ty_le_slhd_dplus numeric,
    slkh_dplus numeric,
    ty_le_slkh_dplus numeric,
    kh_cancel_dplus numeric,
    kh_register_dplus numeric,
    kh_giu_qua_dem numeric,
    kh_sd_dplus numeric,
    slhd_giu_qua_dem numeric,
    du_no_dplus_giai_ngan numeric,
    du_no_dplus_cuoi_ngay numeric,
    so_du_scash numeric,
    so_du_casa_scash numeric,
    ty_le_scash_casa numeric,
    slkh_scash numeric,
    so_du_sfund numeric,
    slkh_sfund numeric,
    slkh_mo_moi numeric,
    pushed_at timestamptz not null default now()
);

create table public.monthly_metrics (
    id serial primary key,
    ngay date not null unique,
    thi_phan_co_so numeric,
    thi_phan_cn numeric,
    thi_phan_ds numeric,
    gtgd_cs_ssi numeric,
    thanh_khoan_ttcs numeric,
    tong_du_no_margin numeric,
    slkh_margin numeric,
    du_no_t7 numeric,
    slkh_t7 numeric,
    du_no_trading_plus numeric,
    slkh_trading_plus numeric,
    slkh_register_mplus numeric,
    slkh_active_mplus numeric,
    du_no_mplus numeric,
    slkh_co_du_no_mplus numeric,
    giai_ngan_mplus numeric,
    slkh_giai_ngan_mplus numeric,
    du_no_ssi_deprecated numeric,
    du_no_spv numeric,
    ty_trong_spv numeric,
    thi_phan_phai_sinh numeric,
    thanh_khoan_tt_ps numeric,
    slhd_ps_deprecated numeric,
    slkh_ps numeric,
    slhd_dplus_deprecated numeric,
    ty_le_slhd_dplus numeric,
    slkh_dplus numeric,
    ty_le_slkh_dplus numeric,
    kh_cancel_dplus numeric,
    kh_register_dplus numeric,
    kh_giu_qua_dem numeric,
    kh_sd_dplus numeric,
    slhd_giu_qua_dem numeric,
    du_no_dplus_giai_ngan numeric,
    du_no_dplus_cuoi_ngay numeric,
    so_du_scash numeric,
    so_du_casa_scash numeric,
    ty_le_scash_casa numeric,
    slkh_scash numeric,
    so_du_sfund numeric,
    slkh_sfund numeric,
    slkh_mo_moi numeric,
    pushed_at timestamptz not null default now()
);

alter table public.daily_metrics enable row level security;
alter table public.weekly_metrics enable row level security;
alter table public.monthly_metrics enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.daily_metrics to anon, authenticated;
grant select, insert, update, delete on public.weekly_metrics to anon, authenticated;
grant select, insert, update, delete on public.monthly_metrics to anon, authenticated;
grant usage, select on sequence public.daily_metrics_id_seq to anon, authenticated;
grant usage, select on sequence public.weekly_metrics_id_seq to anon, authenticated;
grant usage, select on sequence public.monthly_metrics_id_seq to anon, authenticated;

create policy "public_read_daily"
on public.daily_metrics
for select
to anon, authenticated
using (true);

create policy "public_read_weekly"
on public.weekly_metrics
for select
to anon, authenticated
using (true);

create policy "public_read_monthly"
on public.monthly_metrics
for select
to anon, authenticated
using (true);

create policy "public_insert_daily"
on public.daily_metrics
for insert
to anon, authenticated
with check (true);

create policy "public_insert_weekly"
on public.weekly_metrics
for insert
to anon, authenticated
with check (true);

create policy "public_insert_monthly"
on public.monthly_metrics
for insert
to anon, authenticated
with check (true);

create policy "public_update_daily"
on public.daily_metrics
for update
to anon, authenticated
using (true)
with check (true);

create policy "public_update_weekly"
on public.weekly_metrics
for update
to anon, authenticated
using (true)
with check (true);

create policy "public_update_monthly"
on public.monthly_metrics
for update
to anon, authenticated
using (true)
with check (true);

create policy "public_delete_daily"
on public.daily_metrics
for delete
to anon, authenticated
using (true);

create policy "public_delete_weekly"
on public.weekly_metrics
for delete
to anon, authenticated
using (true);

create policy "public_delete_monthly"
on public.monthly_metrics
for delete
to anon, authenticated
using (true);
