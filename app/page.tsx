import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CHANGE_PASSWORD_PATH, HOME_BY_ROLE } from "@/lib/roles";
import LoginForm from "./login-form";

export default async function LoginPage() {
  // Sudah login? Langsung ke panelnya, tidak perlu mengisi form lagi.
  let user = null;

  try {
    user = await getCurrentUser();
  } catch {
    // Database sedang tidak terjangkau: tetap tampilkan form masuk.
  }

  if (user) {
    const home = HOME_BY_ROLE[user.role];

    if (home) redirect(user.mustChangePassword ? CHANGE_PASSWORD_PATH : home);
  }

  return <LoginForm />;
}
