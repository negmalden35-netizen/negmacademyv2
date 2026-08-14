import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAccessState } from "@/lib/negm.functions";
import { STUDENT_TOKEN_KEY } from "@/lib/negm";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function useAccess() {
  const fetchAccess = useServerFn(getAccessState);
  return useQuery({
    queryKey: ["access"],
    queryFn: () => fetchAccess(),
    refetchInterval: 30_000,
  });
}

export function useStudentCode() {
  const [code, setCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setCode(localStorage.getItem(STUDENT_TOKEN_KEY));
    setReady(true);
  }, []);
  return { code, ready };
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("negm-theme", isDark ? "dark" : "light");
}
