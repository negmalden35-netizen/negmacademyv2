
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','teacher');
CREATE TYPE public.license_status AS ENUM ('pending','trial','active','suspended','revoked');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- TEACHERS
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  center_name text NOT NULL DEFAULT 'سنتر نجم',
  logo_url text,
  license_status public.license_status NOT NULL DEFAULT 'pending',
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.teachers TO authenticated;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teacher self read" ON public.teachers FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "teacher self update" ON public.teachers FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "admin insert teacher" ON public.teachers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- LICENSES
CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  teacher_id uuid,
  email text,
  teacher_name text,
  status public.license_status NOT NULL DEFAULT 'pending',
  license_type text NOT NULL DEFAULT 'lifetime',
  activated_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.licenses TO authenticated;
GRANT ALL ON public.licenses TO service_role;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "license read" ON public.licenses FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- TRIALS
CREATE TABLE public.trial_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trial_sessions TO authenticated;
GRANT ALL ON public.trial_sessions TO service_role;
ALTER TABLE public.trial_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trial read" ON public.trial_sessions FOR SELECT TO authenticated
  USING (teacher_id = auth.uid() OR public.has_role(auth.uid(),'super_admin'));

-- GROUPS
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  name text NOT NULL,
  grade text,
  subject text,
  days text[] NOT NULL DEFAULT '{}',
  class_time text,
  room text,
  fee numeric NOT NULL DEFAULT 0,
  payment_day text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_code text UNIQUE,
  full_name text NOT NULL,
  photo_url text,
  gender text,
  birth_date date,
  phone text,
  guardian_phone text,
  school text,
  grade text,
  section text,
  address text,
  subject text,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  day text NOT NULL,
  start_time text,
  end_time text,
  room text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'present',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  amount_due numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  due_date date,
  paid_at timestamptz,
  status text NOT NULL DEFAULT 'unpaid',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  title text NOT NULL,
  subject text,
  grade text,
  duration_minutes int NOT NULL DEFAULT 30,
  total_score numeric NOT NULL DEFAULT 0,
  exam_date date,
  status text NOT NULL DEFAULT 'draft',
  allow_retake boolean NOT NULL DEFAULT false,
  results_published boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'mcq',
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_answer text,
  score numeric NOT NULL DEFAULT 1,
  order_index int NOT NULL DEFAULT 0
);

CREATE TABLE public.exam_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  score numeric NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'submitted'
);

CREATE TABLE public.exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  submission_id uuid NOT NULL REFERENCES public.exam_submissions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  answer text,
  is_correct boolean,
  score numeric NOT NULL DEFAULT 0
);

CREATE TABLE public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  due_date date,
  attachment_url text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.homework_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  question text NOT NULL,
  order_index int NOT NULL DEFAULT 0
);

CREATE TABLE public.homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '[]',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  grade numeric,
  feedback text,
  status text NOT NULL DEFAULT 'submitted'
);

CREATE TABLE public.student_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  answered_at timestamptz,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.settings (
  teacher_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  action text NOT NULL,
  entity text,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  size_kb numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- GRANTS + RLS for tenant tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['groups','students','schedules','attendance','payments','exams','exam_questions',
    'exam_submissions','exam_answers','homework','homework_questions','homework_submissions',
    'student_questions','notifications','settings','audit_logs','backups']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format($f$CREATE POLICY "tenant all" ON public.%I FOR ALL TO authenticated
      USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid())$f$, t);
    EXECUTE format($f$CREATE POLICY "admin read" ON public.%I FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(),'super_admin'))$f$, t);
    EXECUTE format('CREATE INDEX ON public.%I (teacher_id)', t);
  END LOOP;
END $$;

CREATE INDEX ON public.students (group_id);
CREATE INDEX ON public.attendance (date);
CREATE INDEX ON public.exam_questions (exam_id);
CREATE INDEX ON public.exam_submissions (exam_id);

-- new user handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.teachers (id, email, full_name, center_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'center_name',''), 'سنتر نجم'))
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'negm@negm.app' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'super_admin') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'teacher') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
