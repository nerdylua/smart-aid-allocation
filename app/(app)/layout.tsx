import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider } from "@/components/auth-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </AuthProvider>
  );
}
