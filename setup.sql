-- Membuat tabel heroes
create table if not exists heroes (
  id uuid primary key default gen_random_uuid(),
  channel text unique not null,
  str integer default 0,
  agi integer default 0,
  int_ integer default 0,
  xp integer default 0,
  created_at timestamp default now()
);

-- Fungsi untuk menaikkan stat tertentu secara acak
create or replace function increment_stat(channel_name text, column_name text)
returns void
language plpgsql
as $$
begin
  execute format('update heroes set %I = %I + 1, xp = xp + 1 where channel = %L', column_name, column_name, channel_name);
end;
$$;
