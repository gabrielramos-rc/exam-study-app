import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="md:pl-64">
        <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
