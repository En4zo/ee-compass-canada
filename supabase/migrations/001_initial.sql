-- 在新 Supabase 项目的 SQL Editor 执行。所有业务表启用 RLS。
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 40),
 created_at timestamptz not null default now()
);
create table public.admin_roles (user_id uuid primary key references auth.users(id) on delete cascade);
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.admin_roles where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
create table public.draws (
 draw_number text primary key check(draw_number ~ '^[0-9]+[a-z]?$'),
 date date not null, round_type text not null,
 invitations integer not null check(invitations > 0), crs integer not null check(crs between 0 and 1200),
 tie_breaking text, source_url text not null
);
create table public.posts (
 id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(char_length(title) between 5 and 160), body text not null check(char_length(body) between 10 and 10000),
 topic text not null check(topic in ('CEC','PNP','French','CRS','General')),
 kind text not null check(kind in ('official','experience','discussion')), source_url text,
 hidden boolean not null default false, created_at timestamptz not null default now(),
 check(kind <> 'official' or source_url ~ '^https://([a-z0-9-]+\.)*canada\.ca(/|$)')
);
create table public.comments (
 id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade,
 author_id uuid not null references public.profiles(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 5000), hidden boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.crs_rule_versions (version text primary key, reviewed_at date not null, source_url text not null, notes text not null);
insert into public.crs_rule_versions values ('IRCC-2025-03-25-reviewed-2026-09-18','2026-09-18','https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html','Job offer points removed; scoring tables versioned in TypeScript.');
create table public.sync_runs (id bigint generated always as identity primary key, created_at timestamptz not null default now(), status text not null check(status in ('success','failed')), record_count integer not null default 0, message text);
create table public.data_status (id integer primary key check(id=1), last_checked_at timestamptz, last_success_at timestamptz, last_status text);
insert into public.data_status(id) values(1);
create index on public.draws(round_type,date desc);
create index on public.posts(created_at desc);
create index on public.comments(post_id,created_at);

alter table public.profiles enable row level security;
alter table public.admin_roles enable row level security;
alter table public.draws enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.crs_rule_versions enable row level security;
alter table public.sync_runs enable row level security;
alter table public.data_status enable row level security;
create policy profiles_read on public.profiles for select using(true);
create policy profiles_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy draws_read on public.draws for select using(true);
create policy versions_read on public.crs_rule_versions for select using(true);
create policy status_read on public.data_status for select using(true);
create policy roles_read on public.admin_roles for select to authenticated using(user_id=(select auth.uid()));
create policy sync_read on public.sync_runs for select to authenticated using(public.is_admin());
create policy posts_read on public.posts for select using(not hidden or author_id=(select auth.uid()) or public.is_admin());
create policy posts_insert on public.posts for insert to authenticated with check(author_id=(select auth.uid()) and not hidden);
create policy posts_update on public.posts for update to authenticated using(author_id=(select auth.uid()) and not hidden) with check(author_id=(select auth.uid()) and not hidden);
create policy posts_delete on public.posts for delete to authenticated using(author_id=(select auth.uid()));
create policy comments_read on public.comments for select using((not hidden or author_id=(select auth.uid()) or public.is_admin()) and exists(select 1 from public.posts p where p.id=post_id and (not p.hidden or public.is_admin())));
create policy comments_insert on public.comments for insert to authenticated with check(author_id=(select auth.uid()) and not hidden and exists(select 1 from public.posts p where p.id=post_id and not p.hidden));
create policy comments_update on public.comments for update to authenticated using(author_id=(select auth.uid()) and not hidden) with check(author_id=(select auth.uid()) and not hidden);
create policy comments_delete on public.comments for delete to authenticated using(author_id=(select auth.uid()));

-- 使用列级授权防止客户端修改 author_id、hidden、created_at。
revoke all on public.profiles,public.admin_roles,public.draws,public.posts,public.comments,public.crs_rule_versions,public.sync_runs,public.data_status from anon,authenticated;
grant select on public.profiles,public.draws,public.posts,public.comments,public.crs_rule_versions,public.data_status to anon,authenticated;
grant select on public.admin_roles,public.sync_runs to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant insert(author_id,title,body,topic,kind,source_url),update(title,body,topic,kind,source_url),delete on public.posts to authenticated;
grant insert(author_id,post_id,body),update(body),delete on public.comments to authenticated;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,'Explorer ' || left(new.id::text,8));
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 数据库级限频，避免绕过网页直接调用 Supabase API 批量发帖。
create function public.limit_community_writes() returns trigger language plpgsql security definer set search_path='' as $$
declare recent_count integer;
begin
 perform pg_advisory_xact_lock(hashtext(new.author_id::text));
 if TG_TABLE_NAME='posts' then
  select count(*) into recent_count from public.posts where author_id=new.author_id and created_at>now()-interval '1 minute';
  if recent_count>=3 then raise exception 'Too many posts. Please wait a minute.'; end if;
 else
  select count(*) into recent_count from public.comments where author_id=new.author_id and created_at>now()-interval '1 minute';
  if recent_count>=10 then raise exception 'Too many replies. Please wait a minute.'; end if;
 end if;
 return new;
end; $$;
create trigger posts_rate before insert on public.posts for each row execute function public.limit_community_writes();
create trigger comments_rate before insert on public.comments for each row execute function public.limit_community_writes();

create function public.moderate_content(content_type text, content_id uuid, hide boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Forbidden'; end if;
 if content_type='posts' then update public.posts set hidden=hide where id=content_id;
 elsif content_type='comments' then update public.comments set hidden=hide where id=content_id;
 else raise exception 'Invalid content type'; end if;
end; $$;
revoke all on function public.moderate_content(text,uuid,boolean) from public;
grant execute on function public.moderate_content(text,uuid,boolean) to authenticated;

-- 整批导入与成功日志在同一事务内，任何约束失败都会回滚。
create function public.import_draws(records jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
 perform pg_advisory_xact_lock(693444);
 if jsonb_array_length(records)=0 then raise exception 'Empty batch'; end if;
 insert into public.draws(draw_number,date,round_type,invitations,crs,tie_breaking,source_url)
 select draw_number,date,round_type,invitations,crs,tie_breaking,source_url from jsonb_to_recordset(records) as r(draw_number text,date date,round_type text,invitations integer,crs integer,tie_breaking text,source_url text)
 on conflict(draw_number) do update set date=excluded.date,round_type=excluded.round_type,invitations=excluded.invitations,crs=excluded.crs,tie_breaking=excluded.tie_breaking,source_url=excluded.source_url;
 get diagnostics affected=row_count;
 insert into public.sync_runs(status,record_count) values('success',affected);
 update public.data_status set last_checked_at=now(),last_success_at=now(),last_status='success' where id=1;
 return affected;
end; $$;
revoke all on function public.import_draws(jsonb) from public,anon,authenticated;
grant execute on function public.import_draws(jsonb) to service_role;
create function public.record_sync_failure(reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 insert into public.sync_runs(status,message) values('failed',left(reason,500));
 update public.data_status set last_checked_at=now(),last_status='failed' where id=1;
end; $$;
revoke all on function public.record_sync_failure(text) from public,anon,authenticated;
grant execute on function public.record_sync_failure(text) to service_role;
