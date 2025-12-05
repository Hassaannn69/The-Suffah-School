-- Fee Module Enhancement Schema
-- Execute this in your Supabase SQL Editor

-- 1. Create fee_payments table for tracking all payments
create table if not exists public.fee_payments (
  id uuid primary key default uuid_generate_v4(),
  fee_id uuid references public.fees(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  amount_paid numeric not null check (amount_paid > 0),
  payment_date date not null default current_date,
  payment_method text check (payment_method in ('Cash', 'Bank', 'JazzCash', 'EasyPaisa', 'Cheque', 'Other')),
  notes text,
  created_at timestamp with time zone default now()
);

-- 2. Update fees table with new columns
alter table public.fees add column if not exists paid_amount numeric default 0;
alter table public.fees add column if not exists custom_amount numeric;
alter table public.fees add column if not exists discount_type text check (discount_type in ('percentage', 'fixed'));
alter table public.fees add column if not exists discount_value numeric default 0;
alter table public.fees add column if not exists final_amount numeric;
alter table public.fees add column if not exists generated_at timestamp with time zone default now();

-- 3. Update fee_types table with default amounts
alter table public.fee_types add column if not exists default_amount numeric default 0;
alter table public.fee_types add column if not exists allow_custom boolean default true;

-- 4. Enable RLS on fee_payments
alter table public.fee_payments enable row level security;

-- 5. Create policies for fee_payments
create policy "Admins and Accountants can manage payments"
on public.fee_payments for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'accountant') );

create policy "Teachers can read payments"
on public.fee_payments for select
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' );

-- 6. Create function to update fee status based on payments
create or replace function update_fee_status()
returns trigger as $$
begin
  -- Update the paid_amount in fees table
  update public.fees
  set paid_amount = (
    select coalesce(sum(amount_paid), 0)
    from public.fee_payments
    where fee_id = NEW.fee_id
  ),
  status = case
    when (select coalesce(sum(amount_paid), 0) from public.fee_payments where fee_id = NEW.fee_id) >= final_amount then 'paid'
    when (select coalesce(sum(amount_paid), 0) from public.fee_payments where fee_id = NEW.fee_id) > 0 then 'partial'
    else 'unpaid'
  end
  where id = NEW.fee_id;
  
  return NEW;
end;
$$ language plpgsql;

-- 7. Create trigger for automatic fee status update
drop trigger if exists update_fee_status_trigger on public.fee_payments;
create trigger update_fee_status_trigger
after insert or update or delete on public.fee_payments
for each row execute function update_fee_status();

-- 8. Create function to calculate final amount
create or replace function calculate_final_amount()
returns trigger as $$
begin
  -- Use custom_amount if set, otherwise use amount
  NEW.final_amount := coalesce(NEW.custom_amount, NEW.amount);
  
  -- Apply discount
  if NEW.discount_value > 0 then
    if NEW.discount_type = 'percentage' then
      NEW.final_amount := NEW.final_amount - (NEW.final_amount * NEW.discount_value / 100);
    elsif NEW.discount_type = 'fixed' then
      NEW.final_amount := NEW.final_amount - NEW.discount_value;
    end if;
  end if;
  
  -- Ensure final_amount is not negative
  if NEW.final_amount < 0 then
    NEW.final_amount := 0;
  end if;
  
  return NEW;
end;
$$ language plpgsql;

-- 9. Create trigger for automatic final amount calculation
drop trigger if exists calculate_final_amount_trigger on public.fees;
create trigger calculate_final_amount_trigger
before insert or update on public.fees
for each row execute function calculate_final_amount();

-- 10. Create index for better performance
create index if not exists idx_fees_student_month on public.fees(student_id, month);
create index if not exists idx_fees_status on public.fees(status);
create index if not exists idx_fee_payments_fee_id on public.fee_payments(fee_id);
create index if not exists idx_fee_payments_student_id on public.fee_payments(student_id);

-- 11. Create view for student fee summary
create or replace view student_fee_summary as
select 
  s.id as student_id,
  s.name as student_name,
  s.roll_no,
  s.class,
  count(f.id) as total_fees,
  count(case when f.status = 'paid' then 1 end) as paid_count,
  count(case when f.status = 'unpaid' then 1 end) as unpaid_count,
  count(case when f.status = 'partial' then 1 end) as partial_count,
  coalesce(sum(f.final_amount), 0) as total_amount,
  coalesce(sum(f.paid_amount), 0) as total_paid,
  coalesce(sum(f.final_amount - f.paid_amount), 0) as total_due
from public.students s
left join public.fees f on s.id = f.student_id
group by s.id, s.name, s.roll_no, s.class;

-- Grant access to the view
grant select on student_fee_summary to authenticated;
