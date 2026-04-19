import { redirect } from "next/navigation";
import { VoiceLauncher } from "@/components/voice/voice-launcher";
import { AppSidebar } from "@/components/global/app-sidebar";
import { AuthProvider } from "@/components/auth-provider";
import { createAuthClient } from "@/lib/supabase/auth-server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Breadcrumbs />
          <main className="flex-1 container mx-auto py-6 px-4">
            {children}
          </main>
          <VoiceLauncher />
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
