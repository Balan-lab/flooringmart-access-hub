ALTER TYPE public.change_action ADD VALUE IF NOT EXISTS 'PASSWORD_RESET';

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS employees_auth_user_id_idx ON public.employees(auth_user_id);