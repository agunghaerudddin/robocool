import LoginDemo from "./LoginPage";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log({ user });
  return <LoginDemo user={user} />;
}
