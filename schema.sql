-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- STUDENTS TABLE
create table students (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  class text,
  contact text,
  monthly_target_classes int default 0,
  fees_per_month numeric default 0,
  created_at timestamptz default now()
);

-- CLASSES TABLE
create table classes (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references students(id) on delete cascade not null,
  date date not null,
  time time, -- Time of class
  completed_count int default 1, -- Usually 1, but keeping flexibility
  created_at timestamptz default now()
);

-- PAYMENTS TABLE
create table payments (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references students(id) on delete cascade not null,
  amount numeric not null,
  date date not null,
  month text, -- e.g., 'January'
  year int,   -- e.g., 2024
  created_at timestamptz default now()
);

-- NOTES TABLE
create table notes (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references students(id) on delete cascade not null,
  note_text text not null,
  created_at timestamptz default now()
);

-- SETTINGS TABLE
create table if not exists settings (
  id uuid default uuid_generate_v4() primary key,
  key text unique not null,
  value text not null,
  updated_at timestamptz default now()
);

-- Insert default settings
insert into settings (key, value) values 
  ('app_name', 'TMS'),
  ('app_logo_text', 'TMS'),
  ('app_tagline', 'Tuition Management System')
on conflict (key) do nothing;

-- RLS POLICIES (Simple: Allow all for now since it's a single user app, but good to have structure)
alter table students enable row level security;
alter table classes enable row level security;
alter table payments enable row level security;
alter table notes enable row level security;
alter table settings enable row level security;

-- Create policies to allow all access (for development/single-user simplicity)
create policy "Allow all access for students" on students for all using (true);
create policy "Allow all access for classes" on classes for all using (true);
create policy "Allow all access for payments" on payments for all using (true);
create policy "Allow all access for notes" on notes for all using (true);
create policy "Allow all access for settings" on settings for all using (true);
