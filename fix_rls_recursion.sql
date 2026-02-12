-- =========================================================
-- 🛠️ RLS 递归死锁修复脚本 (Fix Infinite Recursion)
-- =========================================================

-- 1. 创建一个安全函数来检查群组成员资格
-- 使用 SECURITY DEFINER，让这个函数以管理员权限运行，从而绕过 RLS 检查，打破死循环。
create or replace function public.is_group_member(_group_id uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = _group_id
    and user_id = auth.uid()
  );
$$;

-- 2. 修复 Group Members 表的策略
-- 先清理旧策略
drop policy if exists "Users can view members of their groups" on public.group_members;
drop policy if exists "Members can view other members in same group" on public.group_members;
drop policy if exists "Users can view own memberships" on public.group_members;
drop policy if exists "Allow read access for authenticated users" on public.group_members;

-- 应用新策略：查看自己 OR 查看所在群的其他成员
create policy "Users can view group members" on public.group_members
  for select using (
    auth.uid() = user_id -- 允许看自己的记录
    or
    public.is_group_member(group_id) -- 允许看我所在群的其他成员 (使用安全函数)
  );

-- 3. 修复 Diary Entries 表的策略
-- 先清理旧策略
drop policy if exists "Users can view entries" on public.diary_entries;
drop policy if exists "Users can create entries" on public.diary_entries;
drop policy if exists "Users can view entries in their groups" on public.diary_entries;

-- 应用新策略：查看权限
create policy "Users can view entries" on public.diary_entries
  for select using (
    (group_id is null and user_id = auth.uid()) -- 私密日记：自己看
    or 
    public.is_group_member(group_id) -- 群组日记：群成员看 (使用安全函数)
  );

-- 应用新策略：发布权限
create policy "Users can create entries" on public.diary_entries
  for insert with check (
    auth.uid() = user_id -- 必须是本人操作
    and (
      group_id is null -- 私密日记
      or public.is_group_member(group_id) -- 群组日记 (使用安全函数检查资格)
    )
  );