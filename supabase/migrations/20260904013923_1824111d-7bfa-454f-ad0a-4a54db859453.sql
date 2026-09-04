CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.teachers (id, email, full_name, center_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''),
          COALESCE(NULLIF(NEW.raw_user_meta_data->>'center_name',''), 'سنتر نجم'))
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) IN ('negm@negm.app','negmalden35@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'super_admin') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'teacher') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $function$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users
WHERE lower(email) IN ('negm@negm.app','negmalden35@gmail.com')
ON CONFLICT DO NOTHING;