import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/components/auth-provider";
import { createAuthClient } from "@/lib/supabase/auth-server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </AuthProvider>
  );
}
