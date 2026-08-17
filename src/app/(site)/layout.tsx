import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ScrollToTop from "@/components/ScrollToTop";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <Header />
      <div className="body-layout">
        <LeftSidebar />
        <main className="main-content">{children}</main>
      </div>
      <Footer />
      <MobileBottomNav />
      <ScrollToTop />
    </div>
  );
}
