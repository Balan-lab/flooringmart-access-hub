
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','it_admin','manager','viewer');
CREATE TYPE public.employee_status AS ENUM ('active','on_leave','former');
CREATE TYPE public.system_status AS ENUM ('active','needs_review','pending_cancellation','cancelled');
CREATE TYPE public.review_decision AS ENUM ('KEEP','KEEP_IF_USED','VERIFY','CONSOLIDATE','CANCEL_AFTER_CONFIRMATION');
CREATE TYPE public.access_level AS ENUM ('Viewer','Read Only','Standard','Manager','Admin','Owner');
CREATE TYPE public.access_status AS ENUM ('active','suspended','removed');
CREATE TYPE public.change_action AS ENUM ('GRANT','MODIFY','ELEVATE','SUSPEND','REMOVE');
CREATE TYPE public.workflow_type AS ENUM ('onboarding','offboarding','role_change');
CREATE TYPE public.workflow_status AS ENUM ('not_started','in_progress','completed');
CREATE TYPE public.review_type AS ENUM ('subscription','access');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.can_write(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','it_admin'))
$$;

CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- new users: profile + default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN (SELECT count(*) FROM public.user_roles) = 0 THEN 'super_admin'::public.app_role ELSE 'viewer'::public.app_role END);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- EMPLOYEES
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  department text,
  job_title text,
  manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  email text,
  start_date date,
  end_date date,
  status public.employee_status NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SYSTEMS
CREATE TABLE public.systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  vendor text,
  account_email text,
  business_owner text,
  technical_owner text,
  purpose text,
  monthly_cost numeric(12,2),
  annual_cost numeric(12,2),
  renewal_date date,
  paid_seats integer,
  active_users integer,
  status public.system_status NOT NULL DEFAULT 'active',
  decision public.review_decision NOT NULL DEFAULT 'VERIFY',
  consolidation_candidate boolean NOT NULL DEFAULT false,
  cancellation_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.systems TO authenticated;
GRANT ALL ON public.systems TO service_role;
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER systems_updated BEFORE UPDATE ON public.systems FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ACCESS RECORDS
CREATE TABLE public.access_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  system_id uuid NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE,
  access_level public.access_level NOT NULL DEFAULT 'Standard',
  username text,
  vault_reference text,
  granted_on date,
  granted_by text,
  access_owner text,
  mfa_enabled boolean NOT NULL DEFAULT false,
  last_review_date date,
  status public.access_status NOT NULL DEFAULT 'active',
  removed_on date,
  removed_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_records TO authenticated;
GRANT ALL ON public.access_records TO service_role;
ALTER TABLE public.access_records ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER access_records_updated BEFORE UPDATE ON public.access_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ACCESS CHANGE LOG
CREATE TABLE public.access_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_date date NOT NULL DEFAULT current_date,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  system_id uuid REFERENCES public.systems(id) ON DELETE SET NULL,
  action public.change_action NOT NULL,
  old_access text,
  new_access text,
  approved_by text,
  completed_by text,
  reason text,
  ticket_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
GRANT SELECT, INSERT ON public.access_change_log TO authenticated;
GRANT ALL ON public.access_change_log TO service_role;
ALTER TABLE public.access_change_log ENABLE ROW LEVEL SECURITY;

-- ROLE ACCESS TEMPLATES
CREATE TABLE public.role_access_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title text NOT NULL,
  system_id uuid NOT NULL REFERENCES public.systems(id) ON DELETE CASCADE,
  recommended_level public.access_level NOT NULL DEFAULT 'Standard',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_access_templates TO authenticated;
GRANT ALL ON public.role_access_templates TO service_role;
ALTER TABLE public.role_access_templates ENABLE ROW LEVEL SECURITY;

-- WORKFLOWS
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.workflow_type NOT NULL,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  status public.workflow_status NOT NULL DEFAULT 'not_started',
  started_on date DEFAULT current_date,
  target_date date,
  completed_on date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO authenticated;
GRANT ALL ON public.workflows TO service_role;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER workflows_updated BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.workflow_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text,
  system_id uuid REFERENCES public.systems(id) ON DELETE SET NULL,
  recommended_level public.access_level,
  completed boolean NOT NULL DEFAULT false,
  completed_on date,
  completed_by text,
  verified boolean NOT NULL DEFAULT false,
  verified_by text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_items TO authenticated;
GRANT ALL ON public.workflow_items TO service_role;
ALTER TABLE public.workflow_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER workflow_items_updated BEFORE UPDATE ON public.workflow_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REVIEWS
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  period text NOT NULL,
  type public.review_type NOT NULL,
  status public.workflow_status NOT NULL DEFAULT 'not_started',
  due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER reviews_updated BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  system_id uuid REFERENCES public.systems(id) ON DELETE SET NULL,
  access_record_id uuid REFERENCES public.access_records(id) ON DELETE SET NULL,
  label text,
  decision public.review_decision,
  reviewed_by text,
  reviewed_on date,
  completed boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_items TO authenticated;
GRANT ALL ON public.review_items TO service_role;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER review_items_updated BEFORE UPDATE ON public.review_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SHARED POLICIES: read for all signed-in, write for admins, delete for super admin
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['employees','systems','access_records','role_access_templates','workflows','workflow_items','reviews','review_items']
  LOOP
    EXECUTE format('CREATE POLICY "%1$s_select" ON public.%1$s FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "%1$s_insert" ON public.%1$s FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "%1$s_update" ON public.%1$s FOR UPDATE TO authenticated USING (public.can_write(auth.uid())) WITH CHECK (public.can_write(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "%1$s_delete" ON public.%1$s FOR DELETE TO authenticated USING (public.has_role(auth.uid(),''super_admin''))', t);
  END LOOP;
END $$;

CREATE POLICY "access_change_log_select" ON public.access_change_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "access_change_log_insert" ON public.access_change_log FOR INSERT TO authenticated WITH CHECK (public.can_write(auth.uid()));

-- SEED: SYSTEMS
INSERT INTO public.systems (name, category, vendor, account_email, business_owner, technical_owner, purpose, monthly_cost, annual_cost, renewal_date, paid_seats, active_users, status, decision, consolidation_candidate, notes) VALUES
('Namecheap','Domains & DNS','Namecheap','domains@flooringmart.com','Dana Whitfield','Marcus Reed','Domain registration and DNS for flooringmart.com and campaign domains',NULL,312.00,'2026-11-02',1,2,'active','KEEP',true,'Overlaps with GoDaddy — consolidate registrars'),
('GoDaddy','Domains & DNS','GoDaddy','domains@flooringmart.com','Dana Whitfield','Marcus Reed','Legacy domains and a few parked marketing domains',NULL,189.00,'2026-10-14',1,1,'active','CONSOLIDATE',true,'Move remaining domains to Namecheap at renewal'),
('DigitalOcean','Hosting & Infrastructure','DigitalOcean','infra@flooringmart.com','Marcus Reed','Marcus Reed','Droplets, managed database and Spaces for Magento staging',480.00,5760.00,'2026-10-01',6,4,'active','KEEP',false,'Two idle droplets flagged in last cost review'),
('GitHub','Engineering','GitHub','engineering@flooringmart.com','Marcus Reed','Priya Nair','Source control, code review and CI for storefront and integrations',84.00,1008.00,'2027-01-20',7,5,'active','VERIFY',false,'Two seats belong to contractors whose work ended'),
('Figma','Design','Figma','design@flooringmart.com','Sofia Bennett','Sofia Bennett','Storefront design system, merchandising mockups, print assets',90.00,1080.00,'2026-12-05',6,3,'active','KEEP_IF_USED',false,'Only 3 of 6 seats active in the last 60 days'),
('Claude.ai','AI Tools','Anthropic','ai@flooringmart.com','Dana Whitfield','Priya Nair','Content drafting, product description generation and support macros',150.00,1800.00,'2026-10-22',5,4,'active','KEEP',true,'Consider consolidating AI tooling to one or two vendors'),
('Cursor.ai','AI Tools','Anysphere','engineering@flooringmart.com','Marcus Reed','Marcus Reed','AI-assisted development for the engineering team',80.00,960.00,'2026-11-18',4,3,'active','KEEP_IF_USED',true,'Overlaps with GitHub Copilot trial and Claude'),
('ChatGPT','AI Tools','OpenAI','ai@flooringmart.com','Dana Whitfield','Priya Nair','Marketing copy, research and customer-service drafting',120.00,1440.00,'2026-09-30',6,5,'active','VERIFY',true,'Renewal within 30 days — confirm seat count before renewing'),
('Magento Commerce','E-Commerce','Adobe','ecommerce@flooringmart.com','Dana Whitfield','Marcus Reed','Primary flooringmart.com storefront platform',2200.00,26400.00,'2027-03-01',12,9,'active','KEEP',false,'Core system — admin access tightly controlled'),
('Floorzap','Operations','Floorzap','ops@flooringmart.com','Ray Colton','Ray Colton','Flooring job scheduling, measurement and installer management',399.00,4788.00,'2026-12-15',10,8,'active','KEEP',false,'Used daily by installation coordinators'),
('QuickBooks','Finance','Intuit','accounting@flooringmart.com','Helen Park','Helen Park','Accounting, AP/AR and payroll journal entries',200.00,2400.00,'2027-02-08',5,3,'active','KEEP',false,'Owner-level access limited to finance'),
('Apple Business','Hardware & Accounts','Apple','it@flooringmart.com','Marcus Reed','Marcus Reed','Apple IDs, device enrollment and store apps for iPads on the showroom floor',NULL,99.00,'2026-11-30',1,1,'active','KEEP',false,'Developer/business account renewal'),
('Punch Software','Design','Punch! Software','design@flooringmart.com','Sofia Bennett','Sofia Bennett','Legacy room-layout and flooring visualization software',NULL,249.00,'2026-10-09',2,0,'needs_review','CANCEL_AFTER_CONFIRMATION',false,'Needs Review — no recorded logins this year, confirm with design before cancelling'),
('Google Workspace','Email & Identity','Google','it@flooringmart.com','Marcus Reed','Marcus Reed','Company email, SSO, shared drives and calendars',216.00,2592.00,'2027-01-05',18,16,'active','KEEP',false,'Source of truth for identity — always first in offboarding'),
('1Password','Security','AgileBits','it@flooringmart.com','Marcus Reed','Marcus Reed','Credential vault for all shared system logins',96.00,1152.00,'2026-12-20',16,15,'active','KEEP',false,'All vault references in this app point here');

-- SEED: EMPLOYEES
INSERT INTO public.employees (employee_code, full_name, department, job_title, email, start_date, end_date, status, notes) VALUES
('FM-001','Dana Whitfield','Executive','Chief Operating Officer','dana.whitfield@flooringmart.com','2018-03-05',NULL,'active','Business owner for most vendor relationships'),
('FM-002','Marcus Reed','IT','IT Director','marcus.reed@flooringmart.com','2019-06-17',NULL,'active','Technical owner of infrastructure and identity'),
('FM-003','Sofia Bennett','Marketing','Design Lead','sofia.bennett@flooringmart.com','2020-02-10',NULL,'active',NULL),
('FM-004','Priya Nair','Engineering','Senior Developer','priya.nair@flooringmart.com','2021-08-02',NULL,'active',NULL),
('FM-005','Helen Park','Finance','Controller','helen.park@flooringmart.com','2017-11-13',NULL,'active','Owner-level QuickBooks access'),
('FM-006','Ray Colton','Operations','Installation Manager','ray.colton@flooringmart.com','2019-01-21',NULL,'active',NULL),
('FM-007','Jordan Ellis','Sales','Showroom Sales Associate','jordan.ellis@flooringmart.com','2023-04-03',NULL,'active',NULL),
('FM-008','Tasha Moore','Customer Service','Customer Service Lead','tasha.moore@flooringmart.com','2022-05-16',NULL,'active',NULL),
('FM-009','Ben Ortiz','Engineering','Developer (Contract)','ben.ortiz@flooringmart.com','2024-01-08','2026-06-30','former','Contract ended — GitHub and DigitalOcean access still open'),
('FM-010','Carla Dunn','Marketing','Marketing Coordinator','carla.dunn@flooringmart.com','2022-09-12','2026-08-15','former','Resigned — offboarding in progress'),
('FM-011','Alex Rivera','Operations','Installation Coordinator','alex.rivera@flooringmart.com','2026-09-14',NULL,'active','New hire — onboarding in progress'),
('FM-012','Nina Alvarez','Sales','Sales Manager','nina.alvarez@flooringmart.com','2021-03-29',NULL,'active','Promoted from Sales Associate — role change pending');

UPDATE public.employees SET manager_id = (SELECT id FROM public.employees WHERE employee_code='FM-001')
 WHERE employee_code IN ('FM-002','FM-003','FM-005','FM-006');
UPDATE public.employees SET manager_id = (SELECT id FROM public.employees WHERE employee_code='FM-002')
 WHERE employee_code IN ('FM-004','FM-009');
UPDATE public.employees SET manager_id = (SELECT id FROM public.employees WHERE employee_code='FM-003')
 WHERE employee_code = 'FM-010';
UPDATE public.employees SET manager_id = (SELECT id FROM public.employees WHERE employee_code='FM-006')
 WHERE employee_code = 'FM-011';
UPDATE public.employees SET manager_id = (SELECT id FROM public.employees WHERE employee_code='FM-001')
 WHERE employee_code IN ('FM-012');
UPDATE public.employees SET manager_id = (SELECT id FROM public.employees WHERE employee_code='FM-012')
 WHERE employee_code IN ('FM-007','FM-008');

-- SEED: ACCESS RECORDS
INSERT INTO public.access_records (employee_id, system_id, access_level, username, vault_reference, granted_on, granted_by, access_owner, mfa_enabled, last_review_date, status, removed_on, removed_by, notes)
SELECT e.id, s.id, v.lvl::public.access_level, v.username, v.vault, v.granted::date, v.granted_by, v.owner, v.mfa, v.reviewed::date, v.st::public.access_status, v.removed::date, v.removed_by, v.notes
FROM (VALUES
 ('FM-001','Google Workspace','Admin','dana.whitfield','1P/Shared-Exec/GW','2018-03-05','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-001','QuickBooks','Owner','dwhitfield','1P/Finance/QBO','2018-03-06','Helen Park','Helen Park',true,'2026-07-01','active',NULL,NULL,'Owner-level, executive sign-off'),
 ('FM-001','Magento Commerce','Admin','dwhitfield','1P/Ecom/Magento','2018-03-06','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-001','ChatGPT','Standard','dana.whitfield','1P/AI/ChatGPT','2024-02-14','Priya Nair','Dana Whitfield',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-002','Google Workspace','Owner','marcus.reed','1P/IT/GW-Super','2019-06-17','Dana Whitfield','Marcus Reed',true,'2026-07-01','active',NULL,NULL,'Super admin of identity'),
 ('FM-002','DigitalOcean','Owner','marcus.reed','1P/IT/DO','2019-07-01','Dana Whitfield','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-002','GitHub','Owner','mreed-fm','1P/Eng/GitHub','2019-07-01','Dana Whitfield','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-002','Namecheap','Owner','fm-domains','1P/IT/Namecheap','2019-07-02','Dana Whitfield','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-002','GoDaddy','Admin','fm-godaddy','1P/IT/GoDaddy','2019-07-02','Dana Whitfield','Marcus Reed',true,'2026-04-01','active',NULL,NULL,NULL),
 ('FM-002','1Password','Owner','marcus.reed','1P/IT/Vault-Admin','2019-07-05','Dana Whitfield','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-002','Apple Business','Admin','it@flooringmart.com','1P/IT/AppleBiz','2020-01-15','Dana Whitfield','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-002','Magento Commerce','Admin','mreed','1P/Ecom/Magento','2019-07-08','Dana Whitfield','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-003','Figma','Admin','sofia.bennett','1P/Design/Figma','2020-02-10','Marcus Reed','Sofia Bennett',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-003','Google Workspace','Standard','sofia.bennett','1P/Shared/GW','2020-02-10','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-003','Punch Software','Standard','sbennett','1P/Design/Punch','2020-03-04','Marcus Reed','Sofia Bennett',false,'2025-10-01','active',NULL,NULL,'No recorded use this year'),
 ('FM-003','Claude.ai','Standard','sofia.bennett','1P/AI/Claude','2024-05-20','Priya Nair','Dana Whitfield',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-004','GitHub','Admin','priya-nair','1P/Eng/GitHub','2021-08-02','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-004','DigitalOcean','Standard','priya.nair','1P/IT/DO','2021-08-05','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-004','Cursor.ai','Standard','priya.nair','1P/AI/Cursor','2024-03-11','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-004','Claude.ai','Standard','priya.nair','1P/AI/Claude','2024-05-20','Marcus Reed','Dana Whitfield',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-004','Magento Commerce','Manager','pnair','1P/Ecom/Magento','2021-09-01','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-005','QuickBooks','Admin','hpark','1P/Finance/QBO','2017-11-13','Dana Whitfield','Helen Park',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-005','Google Workspace','Standard','helen.park','1P/Shared/GW','2017-11-13','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-006','Floorzap','Admin','ray.colton','1P/Ops/Floorzap','2019-01-21','Dana Whitfield','Ray Colton',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-006','Google Workspace','Standard','ray.colton','1P/Shared/GW','2019-01-21','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-007','Magento Commerce','Read Only','jellis','1P/Ecom/Magento','2023-04-03','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-007','Google Workspace','Standard','jordan.ellis','1P/Shared/GW','2023-04-03','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-008','Floorzap','Standard','tasha.moore','1P/Ops/Floorzap','2022-05-16','Ray Colton','Ray Colton',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-008','ChatGPT','Standard','tasha.moore','1P/AI/ChatGPT','2024-02-14','Priya Nair','Dana Whitfield',false,'2026-07-01','active',NULL,NULL,'MFA not enabled — follow up'),
 ('FM-008','Google Workspace','Standard','tasha.moore','1P/Shared/GW','2022-05-16','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-009','GitHub','Standard','ben-ortiz','1P/Eng/GitHub','2024-01-08','Marcus Reed','Marcus Reed',true,'2026-04-01','active',NULL,NULL,'Former employee — access still active, remove urgently'),
 ('FM-009','DigitalOcean','Standard','ben.ortiz','1P/IT/DO','2024-01-10','Marcus Reed','Marcus Reed',false,'2026-04-01','active',NULL,NULL,'Former employee — access still active'),
 ('FM-009','Google Workspace','Standard','ben.ortiz','1P/Shared/GW','2024-01-08','Marcus Reed','Marcus Reed',true,'2026-04-01','removed','2026-07-05','Marcus Reed','Mailbox suspended and converted to archive'),
 ('FM-010','Figma','Standard','carla.dunn','1P/Design/Figma','2022-09-12','Sofia Bennett','Sofia Bennett',true,'2026-04-01','suspended',NULL,NULL,'Suspended pending offboarding completion'),
 ('FM-010','ChatGPT','Standard','carla.dunn','1P/AI/ChatGPT','2024-02-14','Priya Nair','Dana Whitfield',true,'2026-04-01','active',NULL,NULL,'Former employee — seat still billed'),
 ('FM-010','Google Workspace','Standard','carla.dunn','1P/Shared/GW','2022-09-12','Marcus Reed','Marcus Reed',true,'2026-04-01','removed','2026-08-16','Marcus Reed',NULL),
 ('FM-011','Google Workspace','Standard','alex.rivera','1P/Shared/GW','2026-09-15','Marcus Reed','Marcus Reed',true,NULL,'active',NULL,NULL,'Granted during onboarding'),
 ('FM-011','Floorzap','Standard','alex.rivera','1P/Ops/Floorzap','2026-09-15','Ray Colton','Ray Colton',true,NULL,'active',NULL,NULL,NULL),
 ('FM-012','Magento Commerce','Manager','nalvarez','1P/Ecom/Magento','2021-03-29','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,'Elevated from Read Only after promotion'),
 ('FM-012','Floorzap','Manager','nina.alvarez','1P/Ops/Floorzap','2021-04-02','Ray Colton','Ray Colton',true,'2026-07-01','active',NULL,NULL,NULL),
 ('FM-012','Google Workspace','Standard','nina.alvarez','1P/Shared/GW','2021-03-29','Marcus Reed','Marcus Reed',true,'2026-07-01','active',NULL,NULL,NULL)
) AS v(emp, sys, lvl, username, vault, granted, granted_by, owner, mfa, reviewed, st, removed, removed_by, notes)
JOIN public.employees e ON e.employee_code = v.emp
JOIN public.systems s ON s.name = v.sys;

-- SEED: CHANGE LOG
INSERT INTO public.access_change_log (change_date, employee_id, system_id, action, old_access, new_access, approved_by, completed_by, reason, ticket_reference, notes)
SELECT v.d::date, e.id, s.id, v.act::public.change_action, v.oldv, v.newv, v.appr, v.compl, v.reason, v.ticket, v.notes
FROM (VALUES
 ('2026-09-15','FM-011','Google Workspace','GRANT',NULL,'Standard','Ray Colton','Marcus Reed','New hire onboarding','ONB-1142',NULL),
 ('2026-09-15','FM-011','Floorzap','GRANT',NULL,'Standard','Ray Colton','Ray Colton','New hire onboarding','ONB-1142',NULL),
 ('2026-09-01','FM-012','Magento Commerce','ELEVATE','Read Only','Manager','Dana Whitfield','Marcus Reed','Promotion to Sales Manager','RC-0233','Privilege elevation approved by COO'),
 ('2026-08-16','FM-010','Google Workspace','REMOVE','Standard',NULL,'Marcus Reed','Marcus Reed','Resignation — offboarding','OFF-0917','Mailbox archived'),
 ('2026-08-15','FM-010','Figma','SUSPEND','Standard','Suspended','Sofia Bennett','Sofia Bennett','Resignation — offboarding','OFF-0917','Seat suspended pending final asset handover'),
 ('2026-07-05','FM-009','Google Workspace','REMOVE','Standard',NULL,'Marcus Reed','Marcus Reed','Contract ended','OFF-0902',NULL),
 ('2026-07-01','FM-008','ChatGPT','MODIFY','Standard','Standard','Dana Whitfield','Priya Nair','Quarterly access review','QR-2026-Q3','MFA follow-up recorded'),
 ('2026-05-20','FM-004','Cursor.ai','GRANT',NULL,'Standard','Marcus Reed','Marcus Reed','Engineering tooling pilot','REQ-0788',NULL),
 ('2026-03-11','FM-003','Claude.ai','GRANT',NULL,'Standard','Dana Whitfield','Priya Nair','Content production','REQ-0721',NULL),
 ('2026-02-02','FM-007','Magento Commerce','GRANT',NULL,'Read Only','Nina Alvarez','Marcus Reed','Showroom order lookups','REQ-0655',NULL)
) AS v(d, emp, sys, act, oldv, newv, appr, compl, reason, ticket, notes)
JOIN public.employees e ON e.employee_code = v.emp
JOIN public.systems s ON s.name = v.sys;

-- SEED: ROLE TEMPLATES
INSERT INTO public.role_access_templates (job_title, system_id, recommended_level, notes)
SELECT v.title, s.id, v.lvl::public.access_level, v.notes
FROM (VALUES
 ('Installation Coordinator','Google Workspace','Standard','Email, calendar, shared drives'),
 ('Installation Coordinator','Floorzap','Standard','Job scheduling'),
 ('Installation Coordinator','1Password','Standard','Credential vault'),
 ('Showroom Sales Associate','Google Workspace','Standard',NULL),
 ('Showroom Sales Associate','Magento Commerce','Read Only','Order lookups only'),
 ('Showroom Sales Associate','1Password','Standard',NULL),
 ('Senior Developer','Google Workspace','Standard',NULL),
 ('Senior Developer','GitHub','Standard','Elevate to Admin only with IT approval'),
 ('Senior Developer','DigitalOcean','Standard',NULL),
 ('Senior Developer','Cursor.ai','Standard',NULL),
 ('Senior Developer','1Password','Standard',NULL),
 ('Design Lead','Google Workspace','Standard',NULL),
 ('Design Lead','Figma','Admin',NULL),
 ('Design Lead','Claude.ai','Standard',NULL),
 ('Marketing Coordinator','Google Workspace','Standard',NULL),
 ('Marketing Coordinator','Figma','Standard',NULL),
 ('Marketing Coordinator','ChatGPT','Standard',NULL),
 ('Controller','Google Workspace','Standard',NULL),
 ('Controller','QuickBooks','Admin',NULL),
 ('Customer Service Lead','Google Workspace','Standard',NULL),
 ('Customer Service Lead','Floorzap','Standard',NULL),
 ('Customer Service Lead','ChatGPT','Standard',NULL)
) AS v(title, sys, lvl, notes)
JOIN public.systems s ON s.name = v.sys;

-- SEED: WORKFLOWS
INSERT INTO public.workflows (type, employee_id, title, status, started_on, target_date, notes)
SELECT 'onboarding', id, 'Onboarding — Alex Rivera (Installation Coordinator)', 'in_progress', '2026-09-14','2026-09-21','Role-based access suggestions applied'
FROM public.employees WHERE employee_code='FM-011';
INSERT INTO public.workflows (type, employee_id, title, status, started_on, target_date, notes)
SELECT 'offboarding', id, 'Offboarding — Carla Dunn', 'in_progress', '2026-08-15','2026-08-22','Resignation — final day 2026-08-15'
FROM public.employees WHERE employee_code='FM-010';
INSERT INTO public.workflows (type, employee_id, title, status, started_on, target_date, notes)
SELECT 'offboarding', id, 'Offboarding — Ben Ortiz (contract ended)', 'in_progress', '2026-07-01','2026-07-08','Access still open on GitHub and DigitalOcean'
FROM public.employees WHERE employee_code='FM-009';
INSERT INTO public.workflows (type, employee_id, title, status, started_on, target_date, notes)
SELECT 'role_change', id, 'Role change — Nina Alvarez to Sales Manager', 'in_progress', '2026-09-01','2026-09-10','Privilege elevation review'
FROM public.employees WHERE employee_code='FM-012';

INSERT INTO public.workflow_items (workflow_id, label, category, system_id, completed, completed_on, completed_by, verified, verified_by, sort_order)
SELECT w.id, v.label, v.cat, s.id, v.done, v.don::date, v.by, v.ver, v.verby, v.ord
FROM public.workflows w
JOIN public.employees e ON e.id = w.employee_id AND e.employee_code = 'FM-010'
CROSS JOIN (VALUES
 ('Disable email and SSO account','Email & Identity','Google Workspace',true,'2026-08-16','Marcus Reed',true,'Dana Whitfield',1),
 ('Remove Magento admin/user account','E-Commerce','Magento Commerce',true,'2026-08-16','Marcus Reed',true,'Dana Whitfield',2),
 ('Remove GitHub organization membership','Engineering','GitHub',true,'2026-08-16','Priya Nair',true,'Marcus Reed',3),
 ('Remove DigitalOcean team access','Hosting & Infrastructure','DigitalOcean',true,'2026-08-16','Marcus Reed',false,NULL,4),
 ('Remove Figma seat','Design','Figma',false,NULL,NULL,false,NULL,5),
 ('Remove ChatGPT seat','AI Tools','ChatGPT',false,NULL,NULL,false,NULL,6),
 ('Remove Claude.ai seat','AI Tools','Claude.ai',true,'2026-08-16','Priya Nair',false,NULL,7),
 ('Remove Cursor.ai seat','AI Tools','Cursor.ai',true,'2026-08-16','Marcus Reed',false,NULL,8),
 ('Remove QuickBooks user','Finance','QuickBooks',true,'2026-08-16','Helen Park',true,'Dana Whitfield',9),
 ('Remove Floorzap user','Operations','Floorzap',true,'2026-08-16','Ray Colton',true,'Dana Whitfield',10),
 ('Remove Namecheap / domain registrar access','Domains & DNS','Namecheap',true,'2026-08-16','Marcus Reed',true,'Dana Whitfield',11),
 ('Revoke password manager vault access','Security','1Password',false,NULL,NULL,false,NULL,12),
 ('Rotate any shared API keys or tokens the person could access','Security',NULL,false,NULL,NULL,false,NULL,13),
 ('Remove shared drive and folder permissions','Email & Identity','Google Workspace',false,NULL,NULL,false,NULL,14),
 ('Confirm no remaining access on any registered system','Verification',NULL,false,NULL,NULL,false,NULL,15)
) AS v(label, cat, sys, done, don, by, ver, verby, ord)
LEFT JOIN public.systems s ON s.name = v.sys
WHERE w.employee_id = e.id AND w.type='offboarding';

INSERT INTO public.workflow_items (workflow_id, label, category, system_id, completed, completed_on, completed_by, verified, verified_by, sort_order)
SELECT w.id, v.label, v.cat, s.id, v.done, v.don::date, v.by, v.ver, v.verby, v.ord
FROM public.workflows w
JOIN public.employees e ON e.id = w.employee_id AND e.employee_code = 'FM-009'
CROSS JOIN (VALUES
 ('Disable email and SSO account','Email & Identity','Google Workspace',true,'2026-07-05','Marcus Reed',true,'Dana Whitfield',1),
 ('Remove GitHub organization membership','Engineering','GitHub',false,NULL,NULL,false,NULL,2),
 ('Remove DigitalOcean team access','Hosting & Infrastructure','DigitalOcean',false,NULL,NULL,false,NULL,3),
 ('Rotate any shared API keys or tokens the person could access','Security',NULL,false,NULL,NULL,false,NULL,4),
 ('Revoke password manager vault access','Security','1Password',true,'2026-07-05','Marcus Reed',false,NULL,5),
 ('Confirm no remaining access on any registered system','Verification',NULL,false,NULL,NULL,false,NULL,6)
) AS v(label, cat, sys, done, don, by, ver, verby, ord)
LEFT JOIN public.systems s ON s.name = v.sys
WHERE w.employee_id = e.id AND w.type='offboarding';

INSERT INTO public.workflow_items (workflow_id, label, category, system_id, recommended_level, completed, completed_on, completed_by, verified, verified_by, sort_order)
SELECT w.id, v.label, v.cat, s.id, v.lvl::public.access_level, v.done, v.don::date, v.by, v.ver, v.verby, v.ord
FROM public.workflows w
JOIN public.employees e ON e.id = w.employee_id AND e.employee_code = 'FM-011'
CROSS JOIN (VALUES
 ('Create email and SSO account','Email & Identity','Google Workspace','Standard',true,'2026-09-15','Marcus Reed',true,'Ray Colton',1),
 ('Grant Floorzap access','Operations','Floorzap','Standard',true,'2026-09-15','Ray Colton',true,'Ray Colton',2),
 ('Invite to password manager vault','Security','1Password','Standard',false,NULL,NULL,false,NULL,3),
 ('Add to shared drives for Operations','Email & Identity','Google Workspace','Standard',false,NULL,NULL,false,NULL,4),
 ('Confirm MFA enrolled on all accounts','Verification',NULL,NULL,false,NULL,NULL,false,NULL,5)
) AS v(label, cat, sys, lvl, done, don, by, ver, verby, ord)
LEFT JOIN public.systems s ON s.name = v.sys
WHERE w.employee_id = e.id AND w.type='onboarding';

INSERT INTO public.workflow_items (workflow_id, label, category, system_id, recommended_level, completed, completed_on, completed_by, verified, verified_by, sort_order)
SELECT w.id, v.label, v.cat, s.id, v.lvl::public.access_level, v.done, v.don::date, v.by, v.ver, v.verby, v.ord
FROM public.workflows w
JOIN public.employees e ON e.id = w.employee_id AND e.employee_code = 'FM-012'
CROSS JOIN (VALUES
 ('Elevate Magento access to Manager','E-Commerce','Magento Commerce','Manager',true,'2026-09-01','Marcus Reed',true,'Dana Whitfield',1),
 ('Elevate Floorzap access to Manager','Operations','Floorzap','Manager',true,'2026-09-01','Ray Colton',true,'Dana Whitfield',2),
 ('Remove access no longer needed in previous role','Verification',NULL,NULL,false,NULL,NULL,false,NULL,3),
 ('Confirm manager approval recorded in change log','Verification',NULL,NULL,true,'2026-09-01','Marcus Reed',true,'Dana Whitfield',4)
) AS v(label, cat, sys, lvl, done, don, by, ver, verby, ord)
LEFT JOIN public.systems s ON s.name = v.sys
WHERE w.employee_id = e.id AND w.type='role_change';

-- SEED: REVIEWS
INSERT INTO public.reviews (title, period, type, status, due_date, notes) VALUES
('Q3 2026 Subscription Review','2026-Q3','subscription','in_progress','2026-09-30','Focus on AI tooling overlap and unused seats'),
('Q3 2026 Access Review','2026-Q3','access','in_progress','2026-09-30','Verify admin/owner access and former-employee accounts'),
('Q2 2026 Subscription Review','2026-Q2','subscription','completed','2026-06-30',NULL);

INSERT INTO public.review_items (review_id, system_id, label, decision, reviewed_by, reviewed_on, completed, notes)
SELECT r.id, s.id, s.name || ' — confirm cost, seats and renewal', s.decision, CASE WHEN s.name IN ('Namecheap','GoDaddy') THEN 'Marcus Reed' END, CASE WHEN s.name IN ('Namecheap','GoDaddy') THEN '2026-09-10'::date END, s.name IN ('Namecheap','GoDaddy'), NULL
FROM public.reviews r CROSS JOIN public.systems s
WHERE r.period='2026-Q3' AND r.type='subscription';

INSERT INTO public.review_items (review_id, access_record_id, label, reviewed_by, reviewed_on, completed, notes)
SELECT r.id, a.id, e.full_name || ' — ' || s.name || ' (' || a.access_level || ')', NULL, NULL, false, 'Elevated or former-employee access requires confirmation'
FROM public.reviews r
JOIN public.access_records a ON true
JOIN public.employees e ON e.id = a.employee_id
JOIN public.systems s ON s.id = a.system_id
WHERE r.period='2026-Q3' AND r.type='access'
  AND (a.access_level IN ('Admin','Owner') OR e.status = 'former')
  AND a.status <> 'removed';
